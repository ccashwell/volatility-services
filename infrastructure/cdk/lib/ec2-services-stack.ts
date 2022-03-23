import { Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib"
// import * as ecs from "aws-cdk-lib/aws-ecs"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import { SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2"
import { Repository } from "aws-cdk-lib/aws-ecr"
import { AwsLogDriver, Cluster, ContainerImage, FargateService, FargateTaskDefinition } from "aws-cdk-lib/aws-ecs"
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns"
import { Protocol } from "aws-cdk-lib/aws-elasticloadbalancingv2"
import { PolicyStatement } from "aws-cdk-lib/aws-iam"
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs"
import * as servicediscovery from "aws-cdk-lib/aws-servicediscovery"
import { Construct } from "constructs"
import { IEnv, PlatformAccount, RdsSupportPlatforms } from "./types"

export interface VgServicesStackProps extends StackProps {
  env: IEnv
  platformAccount: PlatformAccount
}

interface VpcConfig {
  cidr: string
  natGateways: number
  maxAzs: number
}

interface ServiceStackConfig {
  vpcConfig: VpcConfig
  lbCount: number
}

const serviceCfgMap: Record<RdsSupportPlatforms, ServiceStackConfig> = {
  devplatform: {
    vpcConfig: {
      cidr: "10.0.0.0/16",
      natGateways: 1,
      maxAzs: 1
    },
    lbCount: 1
  },
  stageplatform: {
    vpcConfig: {
      cidr: "10.0.0.0/16",
      natGateways: 2,
      maxAzs: 2
    },
    lbCount: 2
  },
  prodplatform: {
    vpcConfig: {
      cidr: "10.0.0.0/16",
      natGateways: 3,
      maxAzs: 3
    },
    lbCount: 3
  }
}

export class VgServicesStack extends Stack {
  readonly vpc: Vpc

  constructor(scope: Construct, id: string, props: VgServicesStackProps) {
    super(scope, id, props)

    const serviceNamespace = "volatility-services"
    const account = props.platformAccount
    const cfg = serviceCfgMap[account]
    const vpcCfg = cfg.vpcConfig
    const vpc = new Vpc(this, "Vpc", {
      ...vpcCfg,
      subnetConfiguration: [
        {
          cidrMask: 19,
          name: "public",
          subnetType: ec2.SubnetType.PUBLIC
        },
        {
          cidrMask: 20,
          name: "application",
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT
        },
        {
          cidrMask: 21,
          name: "data",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        }
      ]
    })

    const cluster = new Cluster(this, "Cluster", {
      clusterName: "vg-services-cluster",
      containerInsights: true,
      vpc
    })

    const vgServicesSecurityGroup = new SecurityGroup(this, "VgServicesSecurityGroup", {
      vpc,
      allowAllOutbound: true
    })

    const serviceLogGroup = new LogGroup(this, "VolatilityServiceLogGroup", {
      removalPolicy: RemovalPolicy.RETAIN,
      retention: RetentionDays.ONE_MONTH
    })

    /* Fargate only support awslog driver */
    const wsLogDriver = new AwsLogDriver({
      logGroup: serviceLogGroup,
      streamPrefix: "WSService"
    })

    const instrumentInfoLogDriver = new AwsLogDriver({
      logGroup: serviceLogGroup,
      streamPrefix: "InstrumentInfoService"
    })

    const ingestLogDriver = new AwsLogDriver({
      logGroup: serviceLogGroup,
      streamPrefix: "IngestService"
    })

    const indexLogDriver = new AwsLogDriver({
      logGroup: serviceLogGroup,
      streamPrefix: "IndexService"
    })

    const rateLogDriver = new AwsLogDriver({
      logGroup: serviceLogGroup,
      streamPrefix: "RateService"
    })

    const cronLogDriver = new AwsLogDriver({
      logGroup: serviceLogGroup,
      streamPrefix: "CronService"
    })

    const dataPipelineLogDriver = new AwsLogDriver({
      logGroup: serviceLogGroup,
      streamPrefix: "DataPipelineService"
    })

    const secretsManagerPolicy = new PolicyStatement({
      actions: [
        "secretsmanager:GetResourcePolicy",
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret",
        "secretsmanager:ListSecretVersionIds"
      ],
      resources: [`arn:aws:secretsmanager:${props?.env?.region ?? "none"}:${props?.env?.account ?? "none"}:secret:*`]
    })

    const namespace = new servicediscovery.PrivateDnsNamespace(this, "Namespace", {
      description: "Private DnsNamespace for volatility-services",
      name: "volatility.local",
      vpc
    })

    // ------------------------------------------------------------------------------------------------- //
    const wsTaskdef = new FargateTaskDefinition(this, "WSTaskDef", {
      memoryLimitMiB: 2048, // Default is 512
      cpu: 512 // Default is 256
      // taskRole
    })

    // 994224827437.dkr.ecr.us-east-2.amazonaws.com/compose-pipeline-volatility-services:latest
    const ecrRepository = Repository.fromRepositoryName(this, "EcrRepository", "compose-pipeline-volatility-services")
    const image = ContainerImage.fromEcrRepository(ecrRepository, "latest")

    const wsContainer = wsTaskdef.addContainer("WSContainer", {
      image,
      environment: {
        TRANSPORTER: "nats://nats.volatility.local:4222",
        SERVICEDIR: "dist/services",
        SERVICES: "ws.service.js",
        NAMESPACE: serviceNamespace,
        NEW_RELIC_LICENSE_KEY: "ba2e72fd105fd15c4f15fa19c8c86370FFFFNRAL",
        NEW_RELIC_DISTRIBUTED_TRACING_ENABLED: "true",
        NEW_RELIC_APP_NAME: "volatility-services",
        NEW_RELIC_LOG_LEVEL: "info"
      },
      logging: wsLogDriver
    })

    wsContainer.addPortMappings({
      containerPort: 3000
    })

    // Create a load-balanced Fargate service and make it public
    const wsService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, "WSService", {
      cluster, // Required
      circuitBreaker: {
        rollback: true
      },
      desiredCount: props.lbCount,
      domainZone: subZone,
      domainName: "ws.dev.volatility.com",
      certificate,
      redirectHTTP: true,
      //protocol: ApplicationProtocol.HTTPS,
      // targetProtocol: ApplicationProtocol.HTTPS,
      // recordType: "dev.volatility.com",
      // sslPolicy: SslPolicy.RECOMMENDED,
      // securityGroups: [lbSecurityGroup],
      publicLoadBalancer: true, // Default is false
      serviceName: "ws",
      taskDefinition: wsTaskdef,
      cloudMapOptions: { name: "ws", cloudMapNamespace: namespace }
    })

    wsService.loadBalancer.connections.allowFrom(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), "Allow http traffic")
    wsService.loadBalancer.connections.allowFrom(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), "Allow https traffic")
    wsService.loadBalancer.connections.allowFrom(ec2.Peer.anyIpv6(), ec2.Port.tcp(80), "Allow http traffic")
    wsService.loadBalancer.connections.allowFrom(ec2.Peer.anyIpv6(), ec2.Port.tcp(443), "Allow https traffic")
    wsService.service.connections.addSecurityGroup(vgServicesSecurityGroup)
    // wsService.service.connections.allowFrom(wsService.loadBalancer, ec2.Port.tcp(80), "LB to WS")

    // wsService.service.connections.allowFrom(
    //   wsService.loadBalancer,
    //   ec2.Port.tcp(8222),
    //   "NATS transport management port assignment"
    // )

    // new ecs.FargateService(this, `${serviceName}Service`, {
    //   cluster: cluster,
    //   taskDefinition: serviceTaskDefinition,
    //   // Must be `true` when using public images
    //   assignPublicIp: true,
    //   // If you set it to 0, the deployment will finish succesfully anyway
    //   desiredCount: 1,
    //   securityGroup: serviceSecGrp,
    //   cloudMapOptions: {
    //     // This will be your service_name.namespace
    //     name: serviceName,
    //     cloudMapNamespace: dnsNamespace,
    //     dnsRecordType: DnsRecordType.A,
    //   },
    // });

    wsService.targetGroup.configureHealthCheck({
      path: "/ws/health",
      interval: Duration.seconds(120),
      unhealthyThresholdCount: 2,
      protocol: Protocol.HTTP
    })

    // const targetGroupHttp = new ApplicationTargetGroup(this, "ALBTargetGroup", {
    //   port: 3000,
    //   vpc,
    //   protocol: ApplicationProtocol.HTTP,
    //   targetType: TargetType.IP
    // })

    // targetGroupHttp.configureHealthCheck({
    //   path: "/health",
    //   protocol: Protocol.HTTP
    // })

    // wsService.targetGroup.loadBalancerAttached.

    // use a security group to provide a secure connection between the ALB and the containers
    // const lbSecurityGroup = new ec2.SecurityGroup(this, "LBSecurityGroup", {
    //   vpc,
    //   allowAllOutbound: true
    // })
    // lbSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), "Allow https traffic")
    // wsService.loadBalancer.addSecurityGroup(lbSecurityGroup)

    // ecsSecurityGroup.connections.allowFrom(lbSecurityGroup, ec2.Port.allTcp(), "Application load balancer")

    // wsService.loadBalancer.connections.allowFrom(natsService, ec2.Port.tcp(4222), "NATS transport port assignment")
    // wsService.connections.allowFrom(natsService, ec2.Port.tcp(4222), "NATS transport port assignment")
    // wsService.service.connections.allowFrom(wsService.loadBalancer, ec2.Port.tcp(80))
    // const sslListener = wsservice.loadBalancer.addListener("SSL", {
    //   port: 443,
    //   certificates: [this.props.certificateHarvestSubdomain, this.props.certificateRootSubdomain],
    //   protocol: ApplicationProtocol.HTTPS
    // })

    // const cnameRecord = new CnameRecord(this, "ClusterCname", {
    //   zone: subZone,
    //   recordName: "ws"
    // })
    // ------------------------------------------------------------------------------------------------- //

    // ------------------------------------------------------------------------------------------------- //

    const instrumentInfoTaskdef = new FargateTaskDefinition(this, "InstrumentInfoTaskDef", {
      memoryLimitMiB: 2048, // Default is 512
      cpu: 512 // Default is 256
    })

    instrumentInfoTaskdef.addToTaskRolePolicy(secretsManagerPolicy)

    const instrumentInfoContainer = instrumentInfoTaskdef.addContainer("InstrumentInfoContainer", {
      image,
      environment: {
        SEARCH_DOMAIN: namespace.namespaceName,
        SERVICE_NAMESPACE: serviceNamespace,
        TRANSPORTER: "nats://nats.volatility.local:4222",
        SERVICEDIR: "dist/services",
        SERVICES: "instrument_info.service.js",
        NAMESPACE: serviceNamespace
        // REDIS_HOST: redisCluster.attrRedisEndpointAddress,
        // REDIS_PORT: redisCluster.attrRedisEndpointPort
      },
      logging: instrumentInfoLogDriver
    })

    // // Create a standard Fargate service
    const instrumentInfoService = new FargateService(this, "InstrumentInfoService", {
      cluster, // Required
      desiredCount: 0, // Default is 1
      serviceName: "instrumentInfo",
      taskDefinition: instrumentInfoTaskdef,
      securityGroups: [vgServicesSecurityGroup],
      cloudMapOptions: { name: "instrumentInfo", cloudMapNamespace: namespace }
    })

    // ------------------------------------------------------------------------------------------------- //

    // ------------------------------------------------------------------------------------------------- //

    // ------------------------------------------------------------------------------------------------- //

    const rateTaskdef = new FargateTaskDefinition(this, "RateTaskDef", {
      memoryLimitMiB: 1024, // Default is 512
      cpu: 512 // Default is 256
    })

    rateTaskdef.addToTaskRolePolicy(secretsManagerPolicy)

    const rateContainer = rateTaskdef.addContainer("RateContainer", {
      image,
      environment: {
        SEARCH_DOMAIN: namespace.namespaceName,
        SERVICE_NAMESPACE: serviceNamespace,
        TRANSPORTER: "nats://nats.volatility.local:4222",
        SERVICEDIR: "dist/services",
        SERVICES: "rate.service.js",
        NAMESPACE: serviceNamespace,
        RATE_RISKLESS_RATE_CRONTIME: "*/1 * * * *",
        RATE_RISKLESS_RATE_SOURCE: "AAVE",
        RATE_SKIP_PERSIST: "true"
      },
      logging: rateLogDriver
    })

    // // Create a standard Fargate service
    const rateService = new FargateService(this, "RateService", {
      cluster, // Required
      desiredCount: 0, // Default is 1
      serviceName: "rate",
      taskDefinition: rateTaskdef,
      securityGroups: [vgServicesSecurityGroup],
      cloudMapOptions: { name: "rate", cloudMapNamespace: namespace }
    })

    // ------------------------------------------------------------------------------------------------- //

    // ------------------------------------------------------------------------------------------------- //

    // ------------------------------------------------------------------------------------------------- //

    const ingestTaskdef = new FargateTaskDefinition(this, "IngestTaskDef", {
      memoryLimitMiB: 2048, // Default is 512
      cpu: 512 // Default is 256
    })

    ingestTaskdef.addToTaskRolePolicy(secretsManagerPolicy)

    const ingestContainer = ingestTaskdef.addContainer("IngestContainer", {
      image,
      environment: {
        SEARCH_DOMAIN: namespace.namespaceName,
        SERVICE_NAMESPACE: serviceNamespace,
        TRANSPORTER: "nats://nats.volatility.local:4222",
        SERVICEDIR: "dist/services",
        SERVICES: "ingest.service.js",
        NAMESPACE: serviceNamespace,
        // REDIS_HOST: redisCluster.attrRedisEndpointAddress,
        // REDIS_PORT: redisCluster.attrRedisEndpointPort,
        INGEST_INTERVAL: "14d",
        INGEST_EXPIRY_TYPE: "FridayT08:00:00Z"
      },
      // secrets: {},
      logging: ingestLogDriver
    })

    // // Create a standard Fargate service
    const ingestService = new FargateService(this, "IngestService", {
      cluster, // Required
      desiredCount: 0, // Default is 1
      serviceName: "ingest",
      taskDefinition: ingestTaskdef,
      securityGroups: [vgServicesSecurityGroup],
      cloudMapOptions: { name: "ingest", cloudMapNamespace: namespace }
    })

    ingestService.node.addDependency(instrumentInfoService)

    // -------------------------  ------------------------------------------------------------------------ //

    const indexTaskdef = new FargateTaskDefinition(this, "IndexTaskDef", {
      memoryLimitMiB: 2048, // Default is 512
      cpu: 512 // Default is 256
    })

    const indexContainer = indexTaskdef.addContainer("IndexContainer", {
      image,
      environment: {
        SEARCH_DOMAIN: namespace.namespaceName,
        SERVICE_NAMESPACE: serviceNamespace,
        TRANSPORTER: "nats://nats.volatility.local:4222",
        SERVICEDIR: "dist/services",
        SERVICES: "index.service.js",
        NAMESPACE: serviceNamespace,
        INDEX_SKIP_PERSIST: "true"
        // REDIS_HOST: redisCluster.attrRedisEndpointAddress,
        // REDIS_PORT: redisCluster.attrRedisEndpointPort
      },
      logging: indexLogDriver
    })

    // // Create a standard Fargate service
    const indexService = new FargateService(this, "IndexService", {
      cluster, // Required
      desiredCount: 0, // Default is 1
      serviceName: "index",
      taskDefinition: indexTaskdef,
      securityGroups: [vgServicesSecurityGroup],
      cloudMapOptions: { name: "index", cloudMapNamespace: namespace }
    })

    indexService.node.addDependency(ingestService)
    indexService.node.addDependency(rateService)

    // ------------------------------------------------------------------------------------------------- //

    // ------------------------------------------------------------------------------------------------- //

    // ------------------------------------------------------------------------------------------------- //

    const dataPipelineTaskdef = new FargateTaskDefinition(this, "DataPipelineTaskDef", {
      memoryLimitMiB: 16384, // Default is 512
      cpu: 4096 // Default is 256
    })

    const dataPipelineContainer = dataPipelineTaskdef.addContainer("DataPipelineContainer", {
      image,
      environment: {
        SERVICE_NAMESPACE: serviceNamespace,
        TRANSPORTER: "nats://nats.volatility.local:4222",
        SERVICEDIR: "dist/services",
        SERVICES: "rate.service.js,index.service.js,ingest.service.js,instrument_info.service.js",
        RATE_RISKLESS_RATE_CRONTIME: "*/1 * * * *",
        RATE_RISKLESS_RATE_SOURCE: "AAVE",
        RATE_SKIP_PERSIST: "true",
        INDEX_SKIP_PERSIST: "true",
        INGEST_INTERVAL: "14d",
        INGEST_EXPIRY_TYPE: "FridayT08:00:00Z",
        NAMESPACE: serviceNamespace,
        NEW_RELIC_LICENSE_KEY: "ba2e72fd105fd15c4f15fa19c8c86370FFFFNRAL",
        NEW_RELIC_DISTRIBUTED_TRACING_ENABLED: "true",
        NEW_RELIC_APP_NAME: "volatility-services",
        NEW_RELIC_LOG_LEVEL: "info"
      },
      logging: dataPipelineLogDriver
    })

    // // Create a standard Fargate service
    const dataPipelineService = new FargateService(this, "DataPipelineService", {
      cluster, // Required
      desiredCount: 1, // Default is 1
      serviceName: "datapipeline",
      taskDefinition: dataPipelineTaskdef,
      securityGroups: [vgServicesSecurityGroup],
      cloudMapOptions: { name: "datapipeline", cloudMapNamespace: namespace }
    })

    // ------------------------------------------------------------------------------------------------- //

    // ------------------------------------------------------------------------------------------------- //

    // ------------------------------------------------------------------------------------------------- //

    const cronTaskdef = new FargateTaskDefinition(this, "CronTaskDef", {
      memoryLimitMiB: 1024, // Default is 512
      cpu: 512 // Default is 256
    })

    const cronContainer = cronTaskdef.addContainer("CronContainer", {
      image,
      environment: {
        SEARCH_DOMAIN: namespace.namespaceName,
        SERVICE_NAMESPACE: serviceNamespace,
        TRANSPORTER: "nats://nats.volatility.local:4222",
        SERVICEDIR: "dist/services",
        SERVICES: "cron.service.js",
        NAMESPACE: serviceNamespace,
        CRON_MFIV_UPDATE_CRONTIME: "*/15 * * * * *"
      },
      logging: cronLogDriver
    })

    // // Create a standard Fargate service
    const cronService = new FargateService(this, "CronService", {
      cluster, // Required
      desiredCount: 1, // Default is 1
      serviceName: "cron",
      taskDefinition: cronTaskdef,
      securityGroups: [vgServicesSecurityGroup],
      cloudMapOptions: { name: "cron", cloudMapNamespace: namespace }
    })

    cronService.node.addDependency(indexService)
    // ------------------------------------------------------------------------------------------------- //

    // const dbtaskdef = new FargateTaskDefinition(this, componentName("db-taskdef"), {
    //   memoryLimitMiB: 2048, // Default is 512
    //   cpu: 512 // Default is 256
    // })

    // const dbcontainer = dbtaskdef.addContainer("db-container", {
    //   image: ContainerImage.fromRegistry("postgres:12.10")
    // })

    // // Create a standard Fargate service
    // const dbservice = new FargateService(this, componentName("db-service"), {
    //   cluster, // Required
    //   serviceName: "db",
    //   taskDefinition: dbtaskdef,
    //   cloudMapOptions: { name: "db", cloudMapNamespace: namespace }
    // })

    // dbservice.connections.allowFrom(appserverservice, ec2.Port.tcp(5432))

    // ------------------------------------------------------------------------------------------------- //

    // ------------------------------------------------------------------------------------------------- //
    // const fileSystem = new FileSystem(this, "Efs", {
    //   vpc,
    //   performanceMode: PerformanceMode.GENERAL_PURPOSE,
    //   vpcSubnets: {
    //     subnetType: ec2.SubnetType.PUBLIC,
    //     onePerAz: true,
    //     availabilityZones: [vpc.availabilityZones[0]]
    //   }
    // })

    // const accessPoint = new AccessPoint(this, "AccessPoint", {
    //   fileSystem
    // })

    // const redisservertaskdef = new FargateTaskDefinition(this, componentName("redis-server-taskdef"), {
    //   memoryLimitMiB: 2048, // Default is 512
    //   cpu: 512 // Default is 256
    // })

    // const volumeName = "efs-redis-data"

    // redisservertaskdef.addVolume({
    //   name: volumeName,
    //   efsVolumeConfiguration: {
    //     fileSystemId: fileSystem.fileSystemId,
    //     transitEncryption: "ENABLED",
    //     authorizationConfig: {
    //       accessPointId: accessPoint.accessPointId,
    //       iam: "ENABLED"
    //     }
    //   }
    // })

    // const redisservercontainer = redisservertaskdef.addContainer("redis-server", {
    //   image: ContainerImage.fromRegistry("redis:6.2.6")
    // })

    // redisservercontainer.addMountPoints({
    //   containerPath: "/mount/data",
    //   sourceVolume: volumeName,
    //   readOnly: false
    // })

    // // Create a standard Fargate service
    // const redisserverservice = new FargateService(this, componentName("redis-server-service"), {
    //   cluster, // Required
    //   serviceName: "redis-server",
    //   taskDefinition: redisservertaskdef,
    //   cloudMapOptions: { name: "redis-server", cloudMapNamespace: namespace }
    // })

    // redisservertaskdef.addToTaskRolePolicy(
    //   new PolicyStatement({
    //     actions: [
    //       "elasticfilesystem:ClientRootAccess",
    //       "elasticfilesystem:ClientWrite",
    //       "elasticfilesystem:ClientMount",
    //       "elasticfilesystem:DescribeMountTargets"
    //     ],
    //     resources: [
    //       `arn:aws:elasticfilesystem:${props?.env?.region ?? "us-east-2"}:${props?.env?.account ?? ""}:file-system/${
    //         fileSystem.fileSystemId
    //       }`
    //     ]
    //   })
    // )

    // redisservertaskdef.addToTaskRolePolicy(
    //   new PolicyStatement({
    //     actions: ["ec2:DescribeAvailabilityZones"],
    //     resources: ["*"]
    //   })
    // )

    // redisserverservice.connections.allowFrom(appserverservice, ec2.Port.tcp(6379))

    // ------------------------------------------------------------------------------------------------- //

    // ------------------------------------------------------------------------------------------------- //

    // const ingestTaskdef = new FargateTaskDefinition(this, "IngestTaskdef", {
    //   memoryLimitMiB: 1024, // Default is 512
    //   cpu: 512 // Default is 256
    // })

    // const ingestLogGroup = new LogGroup(this, "IngestServiceLogGroup", {
    //   logGroupName: "/ecs/NATSService",
    //   removalPolicy: RemovalPolicy.RETAIN,
    //   retention: RetentionDays.ONE_WEEK
    // })

    // const ingestLogDriver = new AwsLogDriver({
    //   logGroup: serviceLogGroup,
    //   streamPrefix: "IngestService"
    // })

    // const ingestContainer = ingestTaskdef.addContainer("IngestContainer", {
    //   image: ContainerImage.fromRegistry("nats:2.7.2"),
    //   command: ["-m", "8222", "--debug"],
    //   logging: natsLogDriver
    // })

    // // Create a standard Fargate service
    // const natsService = new FargateService(this, "NatsService", {
    //   cluster, // Required
    //   serviceName: "nats",
    //   taskDefinition: natsTaskdef,
    //   cloudMapOptions: { name: "nats", cloudMapNamespace: namespace }
    // })

    // natsService.connections.allowFrom(wsService.service, ec2.Port.tcp(4222), "NATS transport port assignment")
    // natsService.connections.allowFrom(
    //   wsService.service,
    //   ec2.Port.tcp(8222),
    //   "NATS transport management port assignment"
    // )

    // ------------------------------------------------------------------------------------------------- //

    // ------------------------------------------------------------------------------------------------- //

    // ------------------------------------------------------------------------------------------------- //

    const natsTaskdef = new FargateTaskDefinition(this, "NatsTaskdef", {
      memoryLimitMiB: 1024, // Default is 512
      cpu: 512 // Default is 256
    })

    const natsLogGroup = new LogGroup(this, "NATSServiceLogGroup", {
      removalPolicy: RemovalPolicy.RETAIN,
      retention: RetentionDays.ONE_WEEK
    })

    /* Fargate only support awslog driver */
    const natsLogDriver = new AwsLogDriver({
      logGroup: serviceLogGroup,
      streamPrefix: "NATSService"
    })

    const natsContainer = natsTaskdef.addContainer("NatsContainer", {
      image: ContainerImage.fromRegistry("nats:2.7.2"),
      command: ["-m", "8222", "--debug"],
      logging: natsLogDriver
    })

    // Create a standard Fargate service
    const natsService = new FargateService(this, "NatsService", {
      cluster, // Required
      serviceName: "nats",
      taskDefinition: natsTaskdef,
      cloudMapOptions: { name: "nats", cloudMapNamespace: namespace }
    })

    natsService.connections.allowFrom(dataPipelineService, ec2.Port.tcp(4222), "NATS transport port assignment")
    natsService.connections.allowFrom(cronService, ec2.Port.tcp(4222), "NATS transport port assignment")
    natsService.connections.allowFrom(rateService, ec2.Port.tcp(4222), "NATS transport port assignment")
    natsService.connections.allowFrom(instrumentInfoService, ec2.Port.tcp(4222), "NATS transport port assignment")
    natsService.connections.allowFrom(ingestService, ec2.Port.tcp(4222), "NATS transport port assignment")
    natsService.connections.allowFrom(indexService, ec2.Port.tcp(4222), "NATS transport port assignment")
    natsService.connections.allowFrom(wsService.service, ec2.Port.tcp(4222), "NATS transport port assignment")
    natsService.connections.allowFrom(
      vgServicesSecurityGroup,
      ec2.Port.tcp(8222),
      "NATS transport management port assignment"
    )

    // yelbappserverservice.connections.allowFrom(yelbuiservice.service, ec2.Port.tcp(4567))
    // ------------------------------------------------------------------------------------------------- //

    // const queue = new sqs.Queue(this, 'CdkQueue', {
    //   visibilityTimeout: Duration.seconds(300)
    // });

    // const topic = new sns.Topic(this, 'CdkTopic');

    // topic.addSubscription(new subs.SqsSubscription(queue));
  }
}
