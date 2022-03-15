import { Stack, StackProps } from "aws-cdk-lib"
import { Certificate, CertificateValidation } from "aws-cdk-lib/aws-certificatemanager"
// import * as ecs from "aws-cdk-lib/aws-ecs"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import { Vpc } from "aws-cdk-lib/aws-ec2"
import { Cluster, ContainerImage, FargateService, FargateTaskDefinition, LogDrivers } from "aws-cdk-lib/aws-ecs"
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns"
import { Role } from "aws-cdk-lib/aws-iam"
import { RetentionDays } from "aws-cdk-lib/aws-logs"
import { CrossAccountZoneDelegationRecord, PublicHostedZone } from "aws-cdk-lib/aws-route53"
import * as servicediscovery from "aws-cdk-lib/aws-servicediscovery"
import { Construct } from "constructs"
import { VgFargateRdsNestedStack } from "./fargate-rds-stack"
import { VgFargateRedisCacheNestedStack } from "./fargate-redis-cache-stack"

const stackPrefix = (namespace: string, environment: string, stage: string) => {
  return (componentName: string) => `${namespace}-${environment}-${stage}-${componentName}`
}

const componentName = stackPrefix("vg", "ue2", "devplatform")

export class VgServicesStack extends Stack {
  readonly vpc: Vpc

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const serviceNamespace = "volatility-services"
    const stage = "dev"

    // const domainZone = HostedZone.fromLookup(this, "Zone", { domainName: "volatility.com" })
    // const certificate = Certificate.fromCertificateArn(this, "Cert", "arn:aws:acm:us-east-1:123456:certificate/abcdefg")
    const subZone = new PublicHostedZone(this, "DevHostedZone", {
      zoneName: "dev.volatility.com"
      // crossAccountZoneDelegationPrincipal: new AccountPrincipal(props?.env?.account)
    })

    new CrossAccountZoneDelegationRecord(this, "ZoneDelegation", {
      delegatedZone: subZone,
      parentHostedZoneId: "Z00960273HOHML2G4GOJT",
      delegationRole: Role.fromRoleArn(
        this,
        "delegate",
        "arn:aws:iam::468825517946:role/CdkDnsVolatilityComStack-DevCrossAccoundZoneDelega-5G0K3R8I5X7P"
      )
    })

    const certificate = new Certificate(this, "SSLCertificate", {
      domainName: "dev.volatility.com",
      subjectAlternativeNames: ["api.dev.volatility.com"],
      validation: CertificateValidation.fromDns()
    })

    const vpc = new Vpc(this, "Vpc", {
      cidr: "10.0.0.0/16",
      natGateways: 1,
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 20,
          name: "public",
          subnetType: ec2.SubnetType.PUBLIC
        },
        {
          cidrMask: 19,
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

    const { rdsCluster, databaseCredentialsSecret } = new VgFargateRdsNestedStack(this, "RdsNestedStack", {
      vpc,
      stage
    })

    const { redisCluster } = new VgFargateRedisCacheNestedStack(this, "RedisCacheNestedStack", {
      securityGroups: [],
      subnets: vpc.isolatedSubnets
    })

    // EFS Security Group
    // const filesystemSecurityGroup = new ec2.SecurityGroup(this, "EfsSecurity", {
    //   vpc,
    //   allowAllOutbound: true
    // })

    const cluster = new Cluster(this, "Cluster", {
      clusterName: "vg-services-cluster",
      containerInsights: true,
      vpc
    })

    const namespace = new servicediscovery.PrivateDnsNamespace(this, "Namespace", {
      name: "volatility.local",
      vpc
    })

    // ------------------------------------------------------------------------------------------------- //
    const wsTaskdef = new FargateTaskDefinition(this, "WSTaskdef", {
      memoryLimitMiB: 2048, // Default is 512
      cpu: 512 // Default is 256
    })

    const wsContainer = wsTaskdef.addContainer("WSContainer", {
      // image: ContainerImage.fromRegistry("compose-pipeline-volatility-services:latest"),
      image: ContainerImage.fromAsset("../.."),
      environment: {
        SEARCH_DOMAIN: namespace.namespaceName,
        SERVICE_NAMESPACE: serviceNamespace,
        TRANSPORTER: "nats://nats:4222"
      },
      logging: LogDrivers.awsLogs({ streamPrefix: id, logRetention: RetentionDays.ONE_MONTH })
    })

    // logging: LogDriver.awsLogs({
    //   logGroup: applicationLogGroup,
    //   streamPrefix: new Date().toLocaleDateString('en-ZA')
    // }),

    wsContainer.addPortMappings({
      containerPort: 80
    })

    // Create a load-balanced Fargate service and make it public
    const wsService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, "WSService", {
      cluster, // Required
      circuitBreaker: {
        rollback: true
      },
      desiredCount: 1,
      domainZone: subZone,
      domainName: "api.dev.volatility.com",
      certificate,
      redirectHTTP: true,
      // targetProtocol: ApplicationProtocol.HTTPS,
      // recordType: "dev.volatility.com",
      // sslPolicy: SslPolicy.RECOMMENDED,
      // domainName: "api.dev.volatility.com",
      publicLoadBalancer: true, // Default is false
      taskDefinition: wsTaskdef,
      cloudMapOptions: { name: "ws", cloudMapNamespace: namespace }
    })

    // const sslListener = wsservice.loadBalancer.addListener("SSL", {
    //   port: 443,
    //   certificates: [this.props.certificateHarvestSubdomain, this.props.certificateRootSubdomain],
    //   protocol: ApplicationProtocol.HTTPS
    // })

    // const aRecord = new ARecord(this, "Alias", {
    //   zone: subZone,
    //   target: RecordTarget.fromAlias(new LoadBalancerTarget(wsservice)),
    //   recordName: "ws"
    // })

    // ------------------------------------------------------------------------------------------------- //

    // ------------------------------------------------------------------------------------------------- //

    const ingestTaskdef = new FargateTaskDefinition(this, "IngestTaskDef", {
      memoryLimitMiB: 2048, // Default is 512
      cpu: 512 // Default is 256
    })

    const ingestContainer = ingestTaskdef.addContainer("IngestContainer", {
      image: ContainerImage.fromRegistry("volatility-group/volatility-services:0.2.2"),
      environment: {
        SEARCH_DOMAIN: namespace.namespaceName,
        SERVICE_NAMESPACE: serviceNamespace,
        TRANSPORTER: "nats://nats:4222",
        REDIS_HOST: redisCluster.attrRedisEndpointAddress,
        REDIS_PORT: redisCluster.attrRedisEndpointPort,
        INGEST_INTERVAL: "14d",
        INGEST_EXPIRY_TYPE: "FridayT08:00:00Z"
      },
      secrets: {},
      logging: LogDrivers.awsLogs({ streamPrefix: id, logRetention: RetentionDays.ONE_MONTH })
    })

    // Create a standard Fargate service
    const ingestService = new FargateService(this, "IngestService", {
      cluster, // Required
      desiredCount: 1, // Default is 1
      serviceName: "ingest",
      taskDefinition: ingestTaskdef,
      cloudMapOptions: { name: "ingest", cloudMapNamespace: namespace }
    })

    // ------------------------------------------------------------------------------------------------- //

    // ------------------------------------------------------------------------------------------------- //

    const instrumentInfoTaskdef = new FargateTaskDefinition(this, "InstrumentInfoTaskDef", {
      memoryLimitMiB: 2048, // Default is 512
      cpu: 512 // Default is 256
    })

    const instrumentInfoContainer = instrumentInfoTaskdef.addContainer("InstrumentInfoContainer", {
      image: ContainerImage.fromRegistry("volatility-group/volatility-services:0.2.2"),
      environment: {
        SEARCH_DOMAIN: namespace.namespaceName,
        SERVICE_NAMESPACE: serviceNamespace,
        TRANSPORTER: "nats://nats:4222",
        REDIS_HOST: redisCluster.attrRedisEndpointAddress,
        REDIS_PORT: redisCluster.attrRedisEndpointPort
      },
      logging: LogDrivers.awsLogs({ streamPrefix: id, logRetention: RetentionDays.ONE_MONTH })
    })

    // Create a standard Fargate service
    const instrumentInfoService = new FargateService(this, "InstrumentInfoService", {
      cluster, // Required
      desiredCount: 1, // Default is 1
      serviceName: "instrumentInfo",
      taskDefinition: instrumentInfoTaskdef,
      cloudMapOptions: { name: "instrumentInfo", cloudMapNamespace: namespace }
    })

    // ingestService.connections.allowFrom(wsservice.service, ec2.Port.tcp(4567))

    // ------------------------------------------------------------------------------------------------- //

    // -------------------------  ------------------------------------------------------------------------ //

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

    const natsTaskdef = new FargateTaskDefinition(this, "NatsTaskdef", {
      memoryLimitMiB: 1024, // Default is 512
      cpu: 512 // Default is 256
    })

    const natsContainer = natsTaskdef.addContainer("NatsContainer", {
      image: ContainerImage.fromRegistry("nats:2.7.2")
    })

    // Create a standard Fargate service
    const natsService = new FargateService(this, "NatsService", {
      cluster, // Required
      serviceName: "nats",
      taskDefinition: natsTaskdef,
      cloudMapOptions: { name: "nats", cloudMapNamespace: namespace }
    })

    natsService.connections.allowFrom(natsService, ec2.Port.tcp(4222), "NATS transport port assignment")

    // ------------------------------------------------------------------------------------------------- //

    // const queue = new sqs.Queue(this, 'CdkQueue', {
    //   visibilityTimeout: Duration.seconds(300)
    // });

    // const topic = new sns.Topic(this, 'CdkTopic');

    // topic.addSubscription(new subs.SqsSubscription(queue));
  }
}
