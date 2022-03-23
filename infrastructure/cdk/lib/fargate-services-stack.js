"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VgServicesStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
// import * as ecs from "aws-cdk-lib/aws-ecs"
const ec2 = require("aws-cdk-lib/aws-ec2");
const aws_ec2_1 = require("aws-cdk-lib/aws-ec2");
const aws_ecr_1 = require("aws-cdk-lib/aws-ecr");
const aws_ecs_1 = require("aws-cdk-lib/aws-ecs");
const ecsPatterns = require("aws-cdk-lib/aws-ecs-patterns");
const aws_elasticloadbalancingv2_1 = require("aws-cdk-lib/aws-elasticloadbalancingv2");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const aws_logs_1 = require("aws-cdk-lib/aws-logs");
const servicediscovery = require("aws-cdk-lib/aws-servicediscovery");
const vpcCfgMap = {
    devplatform: {
        cidr: "10.0.0.0/16",
        natGateways: 1,
        maxAzs: 1
    },
    stageplatform: {
        cidr: "10.0.0.0/16",
        natGateways: 2,
        maxAzs: 2
    },
    prodplatform: {
        cidr: "10.0.0.0/16",
        natGateways: 3,
        maxAzs: 3
    }
};
class VgServicesStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        var _a, _b, _c, _d;
        super(scope, id, props);
        const serviceNamespace = "volatility-services";
        // const domainZone = HostedZone.fromLookup(this, "Zone", { domainName: "volatility.com" })
        // const certificate = Certificate.fromCertificateArn(this, "Cert", "arn:aws:acm:us-east-1:123456:certificate/abcdefg")
        // const subZone = new PublicHostedZone(this, "DevHostedZone", {
        //   zoneName: "dev.volatility.com"
        //   // crossAccountZoneDelegationPrincipal: new AccountPrincipal(props?.env?.account)
        // })
        // new CrossAccountZoneDelegationRecord(this, "ZoneDelegation", {
        //   delegatedZone: subZone,
        //   parentHostedZoneId: "Z00960273HOHML2G4GOJT",
        //   delegationRole: Role.fromRoleArn(
        //     this,
        //     "delegate",
        //     "arn:aws:iam::468825517946:role/CdkDnsVolatilityComStack-DevCrossAccoundZoneDelega-5G0K3R8I5X7P"
        //   )
        // })
        // const certificate = Certificate.fromCertificateArn(
        //   this,
        //   "DevSSLCertificate",
        //   "arn:aws:acm:us-east-2:994224827437:certificate/b2bb00b9-b772-49d8-9634-9b0af14f7cd9"
        // )
        // const certificate = new Certificate(this, "SSLCertificate", {
        //   domainName: "dev.volatility.com",
        //   subjectAlternativeNames: ["ws.dev.volatility.com"],
        //   validation: CertificateValidation.fromDns()
        // })
        //const vpc = new Vpc(this, "Vpc", {})
        const vpcCfg = vpcCfgMap[props.platformAccount];
        const vpc = new aws_ec2_1.Vpc(this, "Vpc", {
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
        });
        // const { rdsCluster, databaseCredentialsSecret } = new VgFargateRdsNestedStack(this, "RdsNestedStack", {
        //   vpc,
        //   stage
        // })
        // const { redisCluster } = new VgFargateRedisCacheNestedStack(this, "RedisCacheNestedStack", {
        //   securityGroups: [],
        //   subnets: vpc.isolatedSubnets
        // })
        // EFS Security Group
        // const filesystemSecurityGroup = new ec2.SecurityGroup(this, "EfsSecurity", {
        //   vpc,
        //   allowAllOutbound: true
        // })
        const cluster = new aws_ecs_1.Cluster(this, "Cluster", {
            clusterName: "vg-services-cluster",
            containerInsights: true,
            vpc
        });
        const vgServicesSecurityGroup = new aws_ec2_1.SecurityGroup(this, "VgServicesSecurityGroup", {
            vpc,
            allowAllOutbound: true
        });
        // vgServicesSecurityGroup.addIngressRule(peer, connection)
        // const lbSecurityGroup = new SecurityGroup(this, "LBSecurityGroup", {
        //   vpc,
        //   allowAllOutbound: true
        // })
        // lbSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), "Allow https traffic")
        // lbSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), "Allow http traffic")
        // lbSecurityGroup.addIngressRule(ec2.Peer.anyIpv6(), ec2.Port.tcp(443), "Allow https traffic")
        // lbSecurityGroup.addIngressRule(ec2.Peer.anyIpv6(), ec2.Port.tcp(80), "Allow http traffic")
        // const ecsSecurityGroup = new SecurityGroup(this, "ECSSecurityGroup", {
        //   vpc,
        //   allowAllOutbound: true
        // })
        // ecsSecurityGroup.addIngressRule(lbSecurityGroup, ec2.Port.tcp(3000), "Allow http traffic")
        // ecsSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.icmpPing(), "Allow ping traffic")
        // ecsSecurityGroup.addIngressRule(ec2.Peer.anyIpv6(), ec2.Port.icmpPing(), "Allow ping traffic")
        const serviceLogGroup = new aws_logs_1.LogGroup(this, "VolatilityServiceLogGroup", {
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.RETAIN,
            retention: aws_logs_1.RetentionDays.ONE_MONTH
        });
        /* Fargate only support awslog driver */
        const wsLogDriver = new aws_ecs_1.AwsLogDriver({
            logGroup: serviceLogGroup,
            streamPrefix: "WSService"
        });
        const instrumentInfoLogDriver = new aws_ecs_1.AwsLogDriver({
            logGroup: serviceLogGroup,
            streamPrefix: "InstrumentInfoService"
        });
        const ingestLogDriver = new aws_ecs_1.AwsLogDriver({
            logGroup: serviceLogGroup,
            streamPrefix: "IngestService"
        });
        const indexLogDriver = new aws_ecs_1.AwsLogDriver({
            logGroup: serviceLogGroup,
            streamPrefix: "IndexService"
        });
        const rateLogDriver = new aws_ecs_1.AwsLogDriver({
            logGroup: serviceLogGroup,
            streamPrefix: "RateService"
        });
        const cronLogDriver = new aws_ecs_1.AwsLogDriver({
            logGroup: serviceLogGroup,
            streamPrefix: "CronService"
        });
        const dataPipelineLogDriver = new aws_ecs_1.AwsLogDriver({
            logGroup: serviceLogGroup,
            streamPrefix: "DataPipelineService"
        });
        const secretsManagerPolicy = new aws_iam_1.PolicyStatement({
            actions: [
                "secretsmanager:GetResourcePolicy",
                "secretsmanager:GetSecretValue",
                "secretsmanager:DescribeSecret",
                "secretsmanager:ListSecretVersionIds"
            ],
            resources: [`arn:aws:secretsmanager:${(_b = (_a = props === null || props === void 0 ? void 0 : props.env) === null || _a === void 0 ? void 0 : _a.region) !== null && _b !== void 0 ? _b : "none"}:${(_d = (_c = props === null || props === void 0 ? void 0 : props.env) === null || _c === void 0 ? void 0 : _c.account) !== null && _d !== void 0 ? _d : "none"}:secret:*`]
        });
        const namespace = new servicediscovery.PrivateDnsNamespace(this, "Namespace", {
            description: "Private DnsNamespace for volatility-services",
            name: "volatility.local",
            vpc
        });
        // const taskRole = new Role(this, "ecsTaskExecutionRole", {
        //   assumedBy: new ServicePrincipal("ecs-tasks.amazonaws.com")
        // })
        // taskRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("service-role/AmazonECSTaskExecutionRolePolicy"))
        // ------------------------------------------------------------------------------------------------- //
        const wsTaskdef = new aws_ecs_1.FargateTaskDefinition(this, "WSTaskDef", {
            memoryLimitMiB: 2048,
            cpu: 512 // Default is 256
            // taskRole
        });
        // 994224827437.dkr.ecr.us-east-2.amazonaws.com/compose-pipeline-volatility-services:latest
        const ecrRepository = aws_ecr_1.Repository.fromRepositoryName(this, "EcrRepository", "compose-pipeline-volatility-services");
        const image = aws_ecs_1.ContainerImage.fromEcrRepository(ecrRepository, "latest");
        const wsContainer = wsTaskdef.addContainer("WSContainer", {
            image,
            environment: {
                SEARCH_DOMAIN: namespace.namespaceName,
                SERVICE_NAMESPACE: serviceNamespace,
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
        });
        // logging: LogDriver.awsLogs({
        //   logGroup: applicationLogGroup,
        //   streamPrefix: new Date().toLocaleDateString('en-ZA')
        // }),
        wsContainer.addPortMappings({
            containerPort: 3000
        });
        // Create a load-balanced Fargate service and make it public
        const wsService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, "WSService", {
            cluster,
            // circuitBreaker: {
            //   rollback: true
            // },
            desiredCount: 2,
            domainZone: subZone,
            domainName: "ws.dev.volatility.com",
            certificate,
            redirectHTTP: true,
            //protocol: ApplicationProtocol.HTTPS,
            // targetProtocol: ApplicationProtocol.HTTPS,
            // recordType: "dev.volatility.com",
            // sslPolicy: SslPolicy.RECOMMENDED,
            // securityGroups: [lbSecurityGroup],
            publicLoadBalancer: true,
            serviceName: "ws",
            taskDefinition: wsTaskdef,
            cloudMapOptions: { name: "ws", cloudMapNamespace: namespace }
        });
        wsService.loadBalancer.connections.allowFrom(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), "Allow http traffic");
        wsService.loadBalancer.connections.allowFrom(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), "Allow https traffic");
        wsService.loadBalancer.connections.allowFrom(ec2.Peer.anyIpv6(), ec2.Port.tcp(80), "Allow http traffic");
        wsService.loadBalancer.connections.allowFrom(ec2.Peer.anyIpv6(), ec2.Port.tcp(443), "Allow https traffic");
        wsService.service.connections.addSecurityGroup(vgServicesSecurityGroup);
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
            interval: aws_cdk_lib_1.Duration.seconds(120),
            unhealthyThresholdCount: 2,
            protocol: aws_elasticloadbalancingv2_1.Protocol.HTTP
        });
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
        const instrumentInfoTaskdef = new aws_ecs_1.FargateTaskDefinition(this, "InstrumentInfoTaskDef", {
            memoryLimitMiB: 2048,
            cpu: 512 // Default is 256
        });
        instrumentInfoTaskdef.addToTaskRolePolicy(secretsManagerPolicy);
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
        });
        // // Create a standard Fargate service
        const instrumentInfoService = new aws_ecs_1.FargateService(this, "InstrumentInfoService", {
            cluster,
            desiredCount: 0,
            serviceName: "instrumentInfo",
            taskDefinition: instrumentInfoTaskdef,
            securityGroups: [vgServicesSecurityGroup],
            cloudMapOptions: { name: "instrumentInfo", cloudMapNamespace: namespace }
        });
        // ------------------------------------------------------------------------------------------------- //
        // ------------------------------------------------------------------------------------------------- //
        // ------------------------------------------------------------------------------------------------- //
        const rateTaskdef = new aws_ecs_1.FargateTaskDefinition(this, "RateTaskDef", {
            memoryLimitMiB: 1024,
            cpu: 512 // Default is 256
        });
        rateTaskdef.addToTaskRolePolicy(secretsManagerPolicy);
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
                RATE_RISKLESS_RATE_SOURCE: "aave",
                RATE_SKIP_PERSIST: "true"
            },
            logging: rateLogDriver
        });
        // // Create a standard Fargate service
        const rateService = new aws_ecs_1.FargateService(this, "RateService", {
            cluster,
            desiredCount: 0,
            serviceName: "rate",
            taskDefinition: rateTaskdef,
            securityGroups: [vgServicesSecurityGroup],
            cloudMapOptions: { name: "rate", cloudMapNamespace: namespace }
        });
        // ------------------------------------------------------------------------------------------------- //
        // ------------------------------------------------------------------------------------------------- //
        // ------------------------------------------------------------------------------------------------- //
        const ingestTaskdef = new aws_ecs_1.FargateTaskDefinition(this, "IngestTaskDef", {
            memoryLimitMiB: 2048,
            cpu: 512 // Default is 256
        });
        ingestTaskdef.addToTaskRolePolicy(secretsManagerPolicy);
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
        });
        // // Create a standard Fargate service
        const ingestService = new aws_ecs_1.FargateService(this, "IngestService", {
            cluster,
            desiredCount: 0,
            serviceName: "ingest",
            taskDefinition: ingestTaskdef,
            securityGroups: [vgServicesSecurityGroup],
            cloudMapOptions: { name: "ingest", cloudMapNamespace: namespace }
        });
        ingestService.node.addDependency(instrumentInfoService);
        // -------------------------  ------------------------------------------------------------------------ //
        const indexTaskdef = new aws_ecs_1.FargateTaskDefinition(this, "IndexTaskDef", {
            memoryLimitMiB: 2048,
            cpu: 512 // Default is 256
        });
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
        });
        // // Create a standard Fargate service
        const indexService = new aws_ecs_1.FargateService(this, "IndexService", {
            cluster,
            desiredCount: 0,
            serviceName: "index",
            taskDefinition: indexTaskdef,
            securityGroups: [vgServicesSecurityGroup],
            cloudMapOptions: { name: "index", cloudMapNamespace: namespace }
        });
        indexService.node.addDependency(ingestService);
        indexService.node.addDependency(rateService);
        // ------------------------------------------------------------------------------------------------- //
        // ------------------------------------------------------------------------------------------------- //
        // ------------------------------------------------------------------------------------------------- //
        const dataPipelineTaskdef = new aws_ecs_1.FargateTaskDefinition(this, "DataPipelineTaskDef", {
            memoryLimitMiB: 16384,
            cpu: 4096 // Default is 256
        });
        const dataPipelineContainer = dataPipelineTaskdef.addContainer("DataPipelineContainer", {
            image,
            environment: {
                SERVICE_NAMESPACE: serviceNamespace,
                TRANSPORTER: "nats://nats.volatility.local:4222",
                SERVICEDIR: "dist/services",
                SERVICES: "rate.service.js,index.service.js,ingest.service.js,instrument_info.service.js",
                RATE_RISKLESS_RATE_CRONTIME: "*/1 * * * *",
                RATE_RISKLESS_RATE_SOURCE: "aave",
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
        });
        // // Create a standard Fargate service
        const dataPipelineService = new aws_ecs_1.FargateService(this, "DataPipelineService", {
            cluster,
            desiredCount: 1,
            serviceName: "datapipeline",
            taskDefinition: dataPipelineTaskdef,
            securityGroups: [vgServicesSecurityGroup],
            cloudMapOptions: { name: "datapipeline", cloudMapNamespace: namespace }
        });
        // ------------------------------------------------------------------------------------------------- //
        // ------------------------------------------------------------------------------------------------- //
        // ------------------------------------------------------------------------------------------------- //
        const cronTaskdef = new aws_ecs_1.FargateTaskDefinition(this, "CronTaskDef", {
            memoryLimitMiB: 1024,
            cpu: 512 // Default is 256
        });
        const cronContainer = cronTaskdef.addContainer("CronContainer", {
            image,
            environment: {
                SEARCH_DOMAIN: namespace.namespaceName,
                SERVICE_NAMESPACE: serviceNamespace,
                TRANSPORTER: "nats://nats.volatility.local:4222",
                SERVICEDIR: "dist/services",
                SERVICES: "cron.service.js",
                NAMESPACE: serviceNamespace,
                CRON_MFIV_UPDATE_CRONTIME: "*/1 * * * *"
            },
            logging: cronLogDriver
        });
        // // Create a standard Fargate service
        const cronService = new aws_ecs_1.FargateService(this, "CronService", {
            cluster,
            desiredCount: 1,
            serviceName: "cron",
            taskDefinition: cronTaskdef,
            securityGroups: [vgServicesSecurityGroup],
            cloudMapOptions: { name: "cron", cloudMapNamespace: namespace }
        });
        cronService.node.addDependency(indexService);
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
        const natsTaskdef = new aws_ecs_1.FargateTaskDefinition(this, "NatsTaskdef", {
            memoryLimitMiB: 1024,
            cpu: 512 // Default is 256
        });
        const natsLogGroup = new aws_logs_1.LogGroup(this, "NATSServiceLogGroup", {
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.RETAIN,
            retention: aws_logs_1.RetentionDays.ONE_WEEK
        });
        /* Fargate only support awslog driver */
        const natsLogDriver = new aws_ecs_1.AwsLogDriver({
            logGroup: serviceLogGroup,
            streamPrefix: "NATSService"
        });
        const natsContainer = natsTaskdef.addContainer("NatsContainer", {
            image: aws_ecs_1.ContainerImage.fromRegistry("nats:2.7.2"),
            command: ["-m", "8222", "--debug"],
            logging: natsLogDriver
        });
        // Create a standard Fargate service
        const natsService = new aws_ecs_1.FargateService(this, "NatsService", {
            cluster,
            serviceName: "nats",
            taskDefinition: natsTaskdef,
            cloudMapOptions: { name: "nats", cloudMapNamespace: namespace }
        });
        natsService.connections.allowFrom(dataPipelineService, ec2.Port.tcp(4222), "NATS transport port assignment");
        natsService.connections.allowFrom(cronService, ec2.Port.tcp(4222), "NATS transport port assignment");
        natsService.connections.allowFrom(rateService, ec2.Port.tcp(4222), "NATS transport port assignment");
        natsService.connections.allowFrom(instrumentInfoService, ec2.Port.tcp(4222), "NATS transport port assignment");
        natsService.connections.allowFrom(ingestService, ec2.Port.tcp(4222), "NATS transport port assignment");
        natsService.connections.allowFrom(indexService, ec2.Port.tcp(4222), "NATS transport port assignment");
        natsService.connections.allowFrom(wsService.service, ec2.Port.tcp(4222), "NATS transport port assignment");
        natsService.connections.allowFrom(vgServicesSecurityGroup, ec2.Port.tcp(8222), "NATS transport management port assignment");
        // yelbappserverservice.connections.allowFrom(yelbuiservice.service, ec2.Port.tcp(4567))
        // ------------------------------------------------------------------------------------------------- //
        // const queue = new sqs.Queue(this, 'CdkQueue', {
        //   visibilityTimeout: Duration.seconds(300)
        // });
        // const topic = new sns.Topic(this, 'CdkTopic');
        // topic.addSubscription(new subs.SqsSubscription(queue));
    }
}
exports.VgServicesStack = VgServicesStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmFyZ2F0ZS1zZXJ2aWNlcy1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImZhcmdhdGUtc2VydmljZXMtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNkNBQXdFO0FBQ3hFLDZDQUE2QztBQUM3QywyQ0FBMEM7QUFDMUMsaURBQXdEO0FBQ3hELGlEQUFnRDtBQUNoRCxpREFBa0g7QUFDbEgsNERBQTJEO0FBQzNELHVGQUFpRTtBQUNqRSxpREFBcUQ7QUFDckQsbURBQThEO0FBQzlELHFFQUFvRTtBQWVwRSxNQUFNLFNBQVMsR0FBMkM7SUFDeEQsV0FBVyxFQUFFO1FBQ1gsSUFBSSxFQUFFLGFBQWE7UUFDbkIsV0FBVyxFQUFFLENBQUM7UUFDZCxNQUFNLEVBQUUsQ0FBQztLQUNWO0lBQ0QsYUFBYSxFQUFFO1FBQ2IsSUFBSSxFQUFFLGFBQWE7UUFDbkIsV0FBVyxFQUFFLENBQUM7UUFDZCxNQUFNLEVBQUUsQ0FBQztLQUNWO0lBQ0QsWUFBWSxFQUFFO1FBQ1osSUFBSSxFQUFFLGFBQWE7UUFDbkIsV0FBVyxFQUFFLENBQUM7UUFDZCxNQUFNLEVBQUUsQ0FBQztLQUNWO0NBQ0YsQ0FBQTtBQUVELE1BQWEsZUFBZ0IsU0FBUSxtQkFBSztJQUd4QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQTJCOztRQUNuRSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUV2QixNQUFNLGdCQUFnQixHQUFHLHFCQUFxQixDQUFBO1FBRTlDLDJGQUEyRjtRQUMzRix1SEFBdUg7UUFDdkgsZ0VBQWdFO1FBQ2hFLG1DQUFtQztRQUNuQyxzRkFBc0Y7UUFDdEYsS0FBSztRQUVMLGlFQUFpRTtRQUNqRSw0QkFBNEI7UUFDNUIsaURBQWlEO1FBQ2pELHNDQUFzQztRQUN0QyxZQUFZO1FBQ1osa0JBQWtCO1FBQ2xCLHVHQUF1RztRQUN2RyxNQUFNO1FBQ04sS0FBSztRQUVMLHNEQUFzRDtRQUN0RCxVQUFVO1FBQ1YseUJBQXlCO1FBQ3pCLDBGQUEwRjtRQUMxRixJQUFJO1FBQ0osZ0VBQWdFO1FBQ2hFLHNDQUFzQztRQUN0Qyx3REFBd0Q7UUFDeEQsZ0RBQWdEO1FBQ2hELEtBQUs7UUFFTCxzQ0FBc0M7UUFDdEMsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQTtRQUUvQyxNQUFNLEdBQUcsR0FBRyxJQUFJLGFBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFO1lBQy9CLEdBQUcsTUFBTTtZQUNULG1CQUFtQixFQUFFO2dCQUNuQjtvQkFDRSxRQUFRLEVBQUUsRUFBRTtvQkFDWixJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxNQUFNO2lCQUNsQztnQkFDRDtvQkFDRSxRQUFRLEVBQUUsRUFBRTtvQkFDWixJQUFJLEVBQUUsYUFBYTtvQkFDbkIsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCO2lCQUM1QztnQkFDRDtvQkFDRSxRQUFRLEVBQUUsRUFBRTtvQkFDWixJQUFJLEVBQUUsTUFBTTtvQkFDWixVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0I7aUJBQzVDO2FBQ0Y7U0FDRixDQUFDLENBQUE7UUFFRiwwR0FBMEc7UUFDMUcsU0FBUztRQUNULFVBQVU7UUFDVixLQUFLO1FBRUwsK0ZBQStGO1FBQy9GLHdCQUF3QjtRQUN4QixpQ0FBaUM7UUFDakMsS0FBSztRQUVMLHFCQUFxQjtRQUNyQiwrRUFBK0U7UUFDL0UsU0FBUztRQUNULDJCQUEyQjtRQUMzQixLQUFLO1FBRUwsTUFBTSxPQUFPLEdBQUcsSUFBSSxpQkFBTyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUU7WUFDM0MsV0FBVyxFQUFFLHFCQUFxQjtZQUNsQyxpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLEdBQUc7U0FDSixDQUFDLENBQUE7UUFFRixNQUFNLHVCQUF1QixHQUFHLElBQUksdUJBQWEsQ0FBQyxJQUFJLEVBQUUseUJBQXlCLEVBQUU7WUFDakYsR0FBRztZQUNILGdCQUFnQixFQUFFLElBQUk7U0FDdkIsQ0FBQyxDQUFBO1FBRUYsMkRBQTJEO1FBQzNELHVFQUF1RTtRQUN2RSxTQUFTO1FBQ1QsMkJBQTJCO1FBQzNCLEtBQUs7UUFFTCwrRkFBK0Y7UUFDL0YsNkZBQTZGO1FBQzdGLCtGQUErRjtRQUMvRiw2RkFBNkY7UUFFN0YseUVBQXlFO1FBQ3pFLFNBQVM7UUFDVCwyQkFBMkI7UUFDM0IsS0FBSztRQUNMLDZGQUE2RjtRQUM3RixpR0FBaUc7UUFDakcsaUdBQWlHO1FBRWpHLE1BQU0sZUFBZSxHQUFHLElBQUksbUJBQVEsQ0FBQyxJQUFJLEVBQUUsMkJBQTJCLEVBQUU7WUFDdEUsYUFBYSxFQUFFLDJCQUFhLENBQUMsTUFBTTtZQUNuQyxTQUFTLEVBQUUsd0JBQWEsQ0FBQyxTQUFTO1NBQ25DLENBQUMsQ0FBQTtRQUVGLHdDQUF3QztRQUN4QyxNQUFNLFdBQVcsR0FBRyxJQUFJLHNCQUFZLENBQUM7WUFDbkMsUUFBUSxFQUFFLGVBQWU7WUFDekIsWUFBWSxFQUFFLFdBQVc7U0FDMUIsQ0FBQyxDQUFBO1FBRUYsTUFBTSx1QkFBdUIsR0FBRyxJQUFJLHNCQUFZLENBQUM7WUFDL0MsUUFBUSxFQUFFLGVBQWU7WUFDekIsWUFBWSxFQUFFLHVCQUF1QjtTQUN0QyxDQUFDLENBQUE7UUFFRixNQUFNLGVBQWUsR0FBRyxJQUFJLHNCQUFZLENBQUM7WUFDdkMsUUFBUSxFQUFFLGVBQWU7WUFDekIsWUFBWSxFQUFFLGVBQWU7U0FDOUIsQ0FBQyxDQUFBO1FBRUYsTUFBTSxjQUFjLEdBQUcsSUFBSSxzQkFBWSxDQUFDO1lBQ3RDLFFBQVEsRUFBRSxlQUFlO1lBQ3pCLFlBQVksRUFBRSxjQUFjO1NBQzdCLENBQUMsQ0FBQTtRQUVGLE1BQU0sYUFBYSxHQUFHLElBQUksc0JBQVksQ0FBQztZQUNyQyxRQUFRLEVBQUUsZUFBZTtZQUN6QixZQUFZLEVBQUUsYUFBYTtTQUM1QixDQUFDLENBQUE7UUFFRixNQUFNLGFBQWEsR0FBRyxJQUFJLHNCQUFZLENBQUM7WUFDckMsUUFBUSxFQUFFLGVBQWU7WUFDekIsWUFBWSxFQUFFLGFBQWE7U0FDNUIsQ0FBQyxDQUFBO1FBRUYsTUFBTSxxQkFBcUIsR0FBRyxJQUFJLHNCQUFZLENBQUM7WUFDN0MsUUFBUSxFQUFFLGVBQWU7WUFDekIsWUFBWSxFQUFFLHFCQUFxQjtTQUNwQyxDQUFDLENBQUE7UUFFRixNQUFNLG9CQUFvQixHQUFHLElBQUkseUJBQWUsQ0FBQztZQUMvQyxPQUFPLEVBQUU7Z0JBQ1Asa0NBQWtDO2dCQUNsQywrQkFBK0I7Z0JBQy9CLCtCQUErQjtnQkFDL0IscUNBQXFDO2FBQ3RDO1lBQ0QsU0FBUyxFQUFFLENBQUMsMEJBQTBCLFlBQUEsS0FBSyxhQUFMLEtBQUssdUJBQUwsS0FBSyxDQUFFLEdBQUcsMENBQUUsTUFBTSxtQ0FBSSxNQUFNLElBQUksWUFBQSxLQUFLLGFBQUwsS0FBSyx1QkFBTCxLQUFLLENBQUUsR0FBRywwQ0FBRSxPQUFPLG1DQUFJLE1BQU0sV0FBVyxDQUFDO1NBQ2hILENBQUMsQ0FBQTtRQUVGLE1BQU0sU0FBUyxHQUFHLElBQUksZ0JBQWdCLENBQUMsbUJBQW1CLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRTtZQUM1RSxXQUFXLEVBQUUsOENBQThDO1lBQzNELElBQUksRUFBRSxrQkFBa0I7WUFDeEIsR0FBRztTQUNKLENBQUMsQ0FBQTtRQUVGLDREQUE0RDtRQUM1RCwrREFBK0Q7UUFDL0QsS0FBSztRQUVMLHFIQUFxSDtRQUVySCx1R0FBdUc7UUFDdkcsTUFBTSxTQUFTLEdBQUcsSUFBSSwrQkFBcUIsQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFO1lBQzdELGNBQWMsRUFBRSxJQUFJO1lBQ3BCLEdBQUcsRUFBRSxHQUFHLENBQUMsaUJBQWlCO1lBQzFCLFdBQVc7U0FDWixDQUFDLENBQUE7UUFFRiwyRkFBMkY7UUFDM0YsTUFBTSxhQUFhLEdBQUcsb0JBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFLHNDQUFzQyxDQUFDLENBQUE7UUFDbEgsTUFBTSxLQUFLLEdBQUcsd0JBQWMsQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUE7UUFDdkUsTUFBTSxXQUFXLEdBQUcsU0FBUyxDQUFDLFlBQVksQ0FBQyxhQUFhLEVBQUU7WUFDeEQsS0FBSztZQUNMLFdBQVcsRUFBRTtnQkFDWCxhQUFhLEVBQUUsU0FBUyxDQUFDLGFBQWE7Z0JBQ3RDLGlCQUFpQixFQUFFLGdCQUFnQjtnQkFDbkMsV0FBVyxFQUFFLG1DQUFtQztnQkFDaEQsVUFBVSxFQUFFLGVBQWU7Z0JBQzNCLFFBQVEsRUFBRSxlQUFlO2dCQUN6QixTQUFTLEVBQUUsZ0JBQWdCO2dCQUMzQixxQkFBcUIsRUFBRSwwQ0FBMEM7Z0JBQ2pFLHFDQUFxQyxFQUFFLE1BQU07Z0JBQzdDLGtCQUFrQixFQUFFLHFCQUFxQjtnQkFDekMsbUJBQW1CLEVBQUUsTUFBTTthQUM1QjtZQUNELE9BQU8sRUFBRSxXQUFXO1NBQ3JCLENBQUMsQ0FBQTtRQUVGLCtCQUErQjtRQUMvQixtQ0FBbUM7UUFDbkMseURBQXlEO1FBQ3pELE1BQU07UUFFTixXQUFXLENBQUMsZUFBZSxDQUFDO1lBQzFCLGFBQWEsRUFBRSxJQUFJO1NBQ3BCLENBQUMsQ0FBQTtRQUVGLDREQUE0RDtRQUM1RCxNQUFNLFNBQVMsR0FBRyxJQUFJLFdBQVcsQ0FBQyxxQ0FBcUMsQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFO1lBQ3pGLE9BQU87WUFDUCxvQkFBb0I7WUFDcEIsbUJBQW1CO1lBQ25CLEtBQUs7WUFDTCxZQUFZLEVBQUUsQ0FBQztZQUNmLFVBQVUsRUFBRSxPQUFPO1lBQ25CLFVBQVUsRUFBRSx1QkFBdUI7WUFDbkMsV0FBVztZQUNYLFlBQVksRUFBRSxJQUFJO1lBQ2xCLHNDQUFzQztZQUN0Qyw2Q0FBNkM7WUFDN0Msb0NBQW9DO1lBQ3BDLG9DQUFvQztZQUNwQyxxQ0FBcUM7WUFDckMsa0JBQWtCLEVBQUUsSUFBSTtZQUN4QixXQUFXLEVBQUUsSUFBSTtZQUNqQixjQUFjLEVBQUUsU0FBUztZQUN6QixlQUFlLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLGlCQUFpQixFQUFFLFNBQVMsRUFBRTtTQUM5RCxDQUFDLENBQUE7UUFFRixTQUFTLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFBO1FBQ3hHLFNBQVMsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLHFCQUFxQixDQUFDLENBQUE7UUFDMUcsU0FBUyxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsb0JBQW9CLENBQUMsQ0FBQTtRQUN4RyxTQUFTLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxxQkFBcUIsQ0FBQyxDQUFBO1FBQzFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLHVCQUF1QixDQUFDLENBQUE7UUFDdkUsZ0dBQWdHO1FBRWhHLDJDQUEyQztRQUMzQyw0QkFBNEI7UUFDNUIsd0JBQXdCO1FBQ3hCLGdEQUFnRDtRQUNoRCxJQUFJO1FBRUosMERBQTBEO1FBQzFELHNCQUFzQjtRQUN0QiwyQ0FBMkM7UUFDM0MsK0NBQStDO1FBQy9DLDBCQUEwQjtRQUMxQix5RUFBeUU7UUFDekUscUJBQXFCO1FBQ3JCLGtDQUFrQztRQUNsQyx1QkFBdUI7UUFDdkIsa0RBQWtEO1FBQ2xELHlCQUF5QjtRQUN6Qix1Q0FBdUM7UUFDdkMsc0NBQXNDO1FBQ3RDLE9BQU87UUFDUCxNQUFNO1FBRU4sU0FBUyxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQztZQUN6QyxJQUFJLEVBQUUsWUFBWTtZQUNsQixRQUFRLEVBQUUsc0JBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDO1lBQy9CLHVCQUF1QixFQUFFLENBQUM7WUFDMUIsUUFBUSxFQUFFLHFDQUFRLENBQUMsSUFBSTtTQUN4QixDQUFDLENBQUE7UUFFRiwrRUFBK0U7UUFDL0UsZ0JBQWdCO1FBQ2hCLFNBQVM7UUFDVCx3Q0FBd0M7UUFDeEMsOEJBQThCO1FBQzlCLEtBQUs7UUFFTCx5Q0FBeUM7UUFDekMscUJBQXFCO1FBQ3JCLDRCQUE0QjtRQUM1QixLQUFLO1FBRUwsOENBQThDO1FBRTlDLHlGQUF5RjtRQUN6RiwyRUFBMkU7UUFDM0UsU0FBUztRQUNULDJCQUEyQjtRQUMzQixLQUFLO1FBQ0wsK0ZBQStGO1FBQy9GLDJEQUEyRDtRQUUzRCwwR0FBMEc7UUFFMUcsa0hBQWtIO1FBQ2xILHFHQUFxRztRQUNyRyxvRkFBb0Y7UUFDcEYsa0VBQWtFO1FBQ2xFLGVBQWU7UUFDZixpR0FBaUc7UUFDakcsd0NBQXdDO1FBQ3hDLEtBQUs7UUFFTCw4REFBOEQ7UUFDOUQsbUJBQW1CO1FBQ25CLHFCQUFxQjtRQUNyQixLQUFLO1FBQ0wsdUdBQXVHO1FBRXZHLHVHQUF1RztRQUV2RyxNQUFNLHFCQUFxQixHQUFHLElBQUksK0JBQXFCLENBQUMsSUFBSSxFQUFFLHVCQUF1QixFQUFFO1lBQ3JGLGNBQWMsRUFBRSxJQUFJO1lBQ3BCLEdBQUcsRUFBRSxHQUFHLENBQUMsaUJBQWlCO1NBQzNCLENBQUMsQ0FBQTtRQUVGLHFCQUFxQixDQUFDLG1CQUFtQixDQUFDLG9CQUFvQixDQUFDLENBQUE7UUFFL0QsTUFBTSx1QkFBdUIsR0FBRyxxQkFBcUIsQ0FBQyxZQUFZLENBQUMseUJBQXlCLEVBQUU7WUFDNUYsS0FBSztZQUNMLFdBQVcsRUFBRTtnQkFDWCxhQUFhLEVBQUUsU0FBUyxDQUFDLGFBQWE7Z0JBQ3RDLGlCQUFpQixFQUFFLGdCQUFnQjtnQkFDbkMsV0FBVyxFQUFFLG1DQUFtQztnQkFDaEQsVUFBVSxFQUFFLGVBQWU7Z0JBQzNCLFFBQVEsRUFBRSw0QkFBNEI7Z0JBQ3RDLFNBQVMsRUFBRSxnQkFBZ0I7Z0JBQzNCLHFEQUFxRDtnQkFDckQsaURBQWlEO2FBQ2xEO1lBQ0QsT0FBTyxFQUFFLHVCQUF1QjtTQUNqQyxDQUFDLENBQUE7UUFFRix1Q0FBdUM7UUFDdkMsTUFBTSxxQkFBcUIsR0FBRyxJQUFJLHdCQUFjLENBQUMsSUFBSSxFQUFFLHVCQUF1QixFQUFFO1lBQzlFLE9BQU87WUFDUCxZQUFZLEVBQUUsQ0FBQztZQUNmLFdBQVcsRUFBRSxnQkFBZ0I7WUFDN0IsY0FBYyxFQUFFLHFCQUFxQjtZQUNyQyxjQUFjLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQztZQUN6QyxlQUFlLEVBQUUsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsaUJBQWlCLEVBQUUsU0FBUyxFQUFFO1NBQzFFLENBQUMsQ0FBQTtRQUVGLHVHQUF1RztRQUV2Ryx1R0FBdUc7UUFFdkcsdUdBQXVHO1FBRXZHLE1BQU0sV0FBVyxHQUFHLElBQUksK0JBQXFCLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRTtZQUNqRSxjQUFjLEVBQUUsSUFBSTtZQUNwQixHQUFHLEVBQUUsR0FBRyxDQUFDLGlCQUFpQjtTQUMzQixDQUFDLENBQUE7UUFFRixXQUFXLENBQUMsbUJBQW1CLENBQUMsb0JBQW9CLENBQUMsQ0FBQTtRQUVyRCxNQUFNLGFBQWEsR0FBRyxXQUFXLENBQUMsWUFBWSxDQUFDLGVBQWUsRUFBRTtZQUM5RCxLQUFLO1lBQ0wsV0FBVyxFQUFFO2dCQUNYLGFBQWEsRUFBRSxTQUFTLENBQUMsYUFBYTtnQkFDdEMsaUJBQWlCLEVBQUUsZ0JBQWdCO2dCQUNuQyxXQUFXLEVBQUUsbUNBQW1DO2dCQUNoRCxVQUFVLEVBQUUsZUFBZTtnQkFDM0IsUUFBUSxFQUFFLGlCQUFpQjtnQkFDM0IsU0FBUyxFQUFFLGdCQUFnQjtnQkFDM0IsMkJBQTJCLEVBQUUsYUFBYTtnQkFDMUMseUJBQXlCLEVBQUUsTUFBTTtnQkFDakMsaUJBQWlCLEVBQUUsTUFBTTthQUMxQjtZQUNELE9BQU8sRUFBRSxhQUFhO1NBQ3ZCLENBQUMsQ0FBQTtRQUVGLHVDQUF1QztRQUN2QyxNQUFNLFdBQVcsR0FBRyxJQUFJLHdCQUFjLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRTtZQUMxRCxPQUFPO1lBQ1AsWUFBWSxFQUFFLENBQUM7WUFDZixXQUFXLEVBQUUsTUFBTTtZQUNuQixjQUFjLEVBQUUsV0FBVztZQUMzQixjQUFjLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQztZQUN6QyxlQUFlLEVBQUUsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLGlCQUFpQixFQUFFLFNBQVMsRUFBRTtTQUNoRSxDQUFDLENBQUE7UUFFRix1R0FBdUc7UUFFdkcsdUdBQXVHO1FBRXZHLHVHQUF1RztRQUV2RyxNQUFNLGFBQWEsR0FBRyxJQUFJLCtCQUFxQixDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDckUsY0FBYyxFQUFFLElBQUk7WUFDcEIsR0FBRyxFQUFFLEdBQUcsQ0FBQyxpQkFBaUI7U0FDM0IsQ0FBQyxDQUFBO1FBRUYsYUFBYSxDQUFDLG1CQUFtQixDQUFDLG9CQUFvQixDQUFDLENBQUE7UUFFdkQsTUFBTSxlQUFlLEdBQUcsYUFBYSxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsRUFBRTtZQUNwRSxLQUFLO1lBQ0wsV0FBVyxFQUFFO2dCQUNYLGFBQWEsRUFBRSxTQUFTLENBQUMsYUFBYTtnQkFDdEMsaUJBQWlCLEVBQUUsZ0JBQWdCO2dCQUNuQyxXQUFXLEVBQUUsbUNBQW1DO2dCQUNoRCxVQUFVLEVBQUUsZUFBZTtnQkFDM0IsUUFBUSxFQUFFLG1CQUFtQjtnQkFDN0IsU0FBUyxFQUFFLGdCQUFnQjtnQkFDM0IscURBQXFEO2dCQUNyRCxrREFBa0Q7Z0JBQ2xELGVBQWUsRUFBRSxLQUFLO2dCQUN0QixrQkFBa0IsRUFBRSxrQkFBa0I7YUFDdkM7WUFDRCxlQUFlO1lBQ2YsT0FBTyxFQUFFLGVBQWU7U0FDekIsQ0FBQyxDQUFBO1FBRUYsdUNBQXVDO1FBQ3ZDLE1BQU0sYUFBYSxHQUFHLElBQUksd0JBQWMsQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQzlELE9BQU87WUFDUCxZQUFZLEVBQUUsQ0FBQztZQUNmLFdBQVcsRUFBRSxRQUFRO1lBQ3JCLGNBQWMsRUFBRSxhQUFhO1lBQzdCLGNBQWMsRUFBRSxDQUFDLHVCQUF1QixDQUFDO1lBQ3pDLGVBQWUsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsaUJBQWlCLEVBQUUsU0FBUyxFQUFFO1NBQ2xFLENBQUMsQ0FBQTtRQUVGLGFBQWEsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLHFCQUFxQixDQUFDLENBQUE7UUFFdkQseUdBQXlHO1FBRXpHLE1BQU0sWUFBWSxHQUFHLElBQUksK0JBQXFCLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUNuRSxjQUFjLEVBQUUsSUFBSTtZQUNwQixHQUFHLEVBQUUsR0FBRyxDQUFDLGlCQUFpQjtTQUMzQixDQUFDLENBQUE7UUFFRixNQUFNLGNBQWMsR0FBRyxZQUFZLENBQUMsWUFBWSxDQUFDLGdCQUFnQixFQUFFO1lBQ2pFLEtBQUs7WUFDTCxXQUFXLEVBQUU7Z0JBQ1gsYUFBYSxFQUFFLFNBQVMsQ0FBQyxhQUFhO2dCQUN0QyxpQkFBaUIsRUFBRSxnQkFBZ0I7Z0JBQ25DLFdBQVcsRUFBRSxtQ0FBbUM7Z0JBQ2hELFVBQVUsRUFBRSxlQUFlO2dCQUMzQixRQUFRLEVBQUUsa0JBQWtCO2dCQUM1QixTQUFTLEVBQUUsZ0JBQWdCO2dCQUMzQixrQkFBa0IsRUFBRSxNQUFNO2dCQUMxQixxREFBcUQ7Z0JBQ3JELGlEQUFpRDthQUNsRDtZQUNELE9BQU8sRUFBRSxjQUFjO1NBQ3hCLENBQUMsQ0FBQTtRQUVGLHVDQUF1QztRQUN2QyxNQUFNLFlBQVksR0FBRyxJQUFJLHdCQUFjLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUM1RCxPQUFPO1lBQ1AsWUFBWSxFQUFFLENBQUM7WUFDZixXQUFXLEVBQUUsT0FBTztZQUNwQixjQUFjLEVBQUUsWUFBWTtZQUM1QixjQUFjLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQztZQUN6QyxlQUFlLEVBQUUsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLGlCQUFpQixFQUFFLFNBQVMsRUFBRTtTQUNqRSxDQUFDLENBQUE7UUFFRixZQUFZLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsQ0FBQTtRQUM5QyxZQUFZLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQTtRQUU1Qyx1R0FBdUc7UUFFdkcsdUdBQXVHO1FBRXZHLHVHQUF1RztRQUV2RyxNQUFNLG1CQUFtQixHQUFHLElBQUksK0JBQXFCLENBQUMsSUFBSSxFQUFFLHFCQUFxQixFQUFFO1lBQ2pGLGNBQWMsRUFBRSxLQUFLO1lBQ3JCLEdBQUcsRUFBRSxJQUFJLENBQUMsaUJBQWlCO1NBQzVCLENBQUMsQ0FBQTtRQUVGLE1BQU0scUJBQXFCLEdBQUcsbUJBQW1CLENBQUMsWUFBWSxDQUFDLHVCQUF1QixFQUFFO1lBQ3RGLEtBQUs7WUFDTCxXQUFXLEVBQUU7Z0JBQ1gsaUJBQWlCLEVBQUUsZ0JBQWdCO2dCQUNuQyxXQUFXLEVBQUUsbUNBQW1DO2dCQUNoRCxVQUFVLEVBQUUsZUFBZTtnQkFDM0IsUUFBUSxFQUFFLCtFQUErRTtnQkFDekYsMkJBQTJCLEVBQUUsYUFBYTtnQkFDMUMseUJBQXlCLEVBQUUsTUFBTTtnQkFDakMsaUJBQWlCLEVBQUUsTUFBTTtnQkFDekIsa0JBQWtCLEVBQUUsTUFBTTtnQkFDMUIsZUFBZSxFQUFFLEtBQUs7Z0JBQ3RCLGtCQUFrQixFQUFFLGtCQUFrQjtnQkFDdEMsU0FBUyxFQUFFLGdCQUFnQjtnQkFDM0IscUJBQXFCLEVBQUUsMENBQTBDO2dCQUNqRSxxQ0FBcUMsRUFBRSxNQUFNO2dCQUM3QyxrQkFBa0IsRUFBRSxxQkFBcUI7Z0JBQ3pDLG1CQUFtQixFQUFFLE1BQU07YUFDNUI7WUFDRCxPQUFPLEVBQUUscUJBQXFCO1NBQy9CLENBQUMsQ0FBQTtRQUVGLHVDQUF1QztRQUN2QyxNQUFNLG1CQUFtQixHQUFHLElBQUksd0JBQWMsQ0FBQyxJQUFJLEVBQUUscUJBQXFCLEVBQUU7WUFDMUUsT0FBTztZQUNQLFlBQVksRUFBRSxDQUFDO1lBQ2YsV0FBVyxFQUFFLGNBQWM7WUFDM0IsY0FBYyxFQUFFLG1CQUFtQjtZQUNuQyxjQUFjLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQztZQUN6QyxlQUFlLEVBQUUsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLGlCQUFpQixFQUFFLFNBQVMsRUFBRTtTQUN4RSxDQUFDLENBQUE7UUFFRix1R0FBdUc7UUFFdkcsdUdBQXVHO1FBRXZHLHVHQUF1RztRQUV2RyxNQUFNLFdBQVcsR0FBRyxJQUFJLCtCQUFxQixDQUFDLElBQUksRUFBRSxhQUFhLEVBQUU7WUFDakUsY0FBYyxFQUFFLElBQUk7WUFDcEIsR0FBRyxFQUFFLEdBQUcsQ0FBQyxpQkFBaUI7U0FDM0IsQ0FBQyxDQUFBO1FBRUYsTUFBTSxhQUFhLEdBQUcsV0FBVyxDQUFDLFlBQVksQ0FBQyxlQUFlLEVBQUU7WUFDOUQsS0FBSztZQUNMLFdBQVcsRUFBRTtnQkFDWCxhQUFhLEVBQUUsU0FBUyxDQUFDLGFBQWE7Z0JBQ3RDLGlCQUFpQixFQUFFLGdCQUFnQjtnQkFDbkMsV0FBVyxFQUFFLG1DQUFtQztnQkFDaEQsVUFBVSxFQUFFLGVBQWU7Z0JBQzNCLFFBQVEsRUFBRSxpQkFBaUI7Z0JBQzNCLFNBQVMsRUFBRSxnQkFBZ0I7Z0JBQzNCLHlCQUF5QixFQUFFLGFBQWE7YUFDekM7WUFDRCxPQUFPLEVBQUUsYUFBYTtTQUN2QixDQUFDLENBQUE7UUFFRix1Q0FBdUM7UUFDdkMsTUFBTSxXQUFXLEdBQUcsSUFBSSx3QkFBYyxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUU7WUFDMUQsT0FBTztZQUNQLFlBQVksRUFBRSxDQUFDO1lBQ2YsV0FBVyxFQUFFLE1BQU07WUFDbkIsY0FBYyxFQUFFLFdBQVc7WUFDM0IsY0FBYyxFQUFFLENBQUMsdUJBQXVCLENBQUM7WUFDekMsZUFBZSxFQUFFLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxTQUFTLEVBQUU7U0FDaEUsQ0FBQyxDQUFBO1FBRUYsV0FBVyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUE7UUFDNUMsdUdBQXVHO1FBRXZHLG1GQUFtRjtRQUNuRiw0Q0FBNEM7UUFDNUMsK0JBQStCO1FBQy9CLEtBQUs7UUFFTCwrREFBK0Q7UUFDL0QseURBQXlEO1FBQ3pELEtBQUs7UUFFTCx1Q0FBdUM7UUFDdkMsNEVBQTRFO1FBQzVFLHlCQUF5QjtRQUN6Qix1QkFBdUI7UUFDdkIsK0JBQStCO1FBQy9CLGtFQUFrRTtRQUNsRSxLQUFLO1FBRUwsd0VBQXdFO1FBRXhFLHVHQUF1RztRQUV2Ryx1R0FBdUc7UUFDdkcsbURBQW1EO1FBQ25ELFNBQVM7UUFDVCxzREFBc0Q7UUFDdEQsa0JBQWtCO1FBQ2xCLHlDQUF5QztRQUN6QyxzQkFBc0I7UUFDdEIsb0RBQW9EO1FBQ3BELE1BQU07UUFDTixLQUFLO1FBRUwsNkRBQTZEO1FBQzdELGVBQWU7UUFDZixLQUFLO1FBRUwsc0dBQXNHO1FBQ3RHLDRDQUE0QztRQUM1QywrQkFBK0I7UUFDL0IsS0FBSztRQUVMLHNDQUFzQztRQUV0QyxpQ0FBaUM7UUFDakMsc0JBQXNCO1FBQ3RCLDhCQUE4QjtRQUM5Qiw2Q0FBNkM7UUFDN0Msb0NBQW9DO1FBQ3BDLDZCQUE2QjtRQUM3QixrREFBa0Q7UUFDbEQsdUJBQXVCO1FBQ3ZCLFFBQVE7UUFDUixNQUFNO1FBQ04sS0FBSztRQUVMLGlGQUFpRjtRQUNqRixzREFBc0Q7UUFDdEQsS0FBSztRQUVMLHdDQUF3QztRQUN4QyxrQ0FBa0M7UUFDbEMsOEJBQThCO1FBQzlCLG9CQUFvQjtRQUNwQixLQUFLO1FBRUwsdUNBQXVDO1FBQ3ZDLCtGQUErRjtRQUMvRix5QkFBeUI7UUFDekIsaUNBQWlDO1FBQ2pDLHdDQUF3QztRQUN4Qyw0RUFBNEU7UUFDNUUsS0FBSztRQUVMLDBDQUEwQztRQUMxQywwQkFBMEI7UUFDMUIsaUJBQWlCO1FBQ2pCLDhDQUE4QztRQUM5Qyx5Q0FBeUM7UUFDekMseUNBQXlDO1FBQ3pDLGlEQUFpRDtRQUNqRCxTQUFTO1FBQ1QsbUJBQW1CO1FBQ25CLG9IQUFvSDtRQUNwSCxrQ0FBa0M7UUFDbEMsV0FBVztRQUNYLFFBQVE7UUFDUixPQUFPO1FBQ1AsSUFBSTtRQUVKLDBDQUEwQztRQUMxQywwQkFBMEI7UUFDMUIsa0RBQWtEO1FBQ2xELHVCQUF1QjtRQUN2QixPQUFPO1FBQ1AsSUFBSTtRQUVKLGlGQUFpRjtRQUVqRix1R0FBdUc7UUFFdkcsdUdBQXVHO1FBRXZHLDJFQUEyRTtRQUMzRSw0Q0FBNEM7UUFDNUMsK0JBQStCO1FBQy9CLEtBQUs7UUFFTCx1RUFBdUU7UUFDdkUsc0NBQXNDO1FBQ3RDLHlDQUF5QztRQUN6QyxzQ0FBc0M7UUFDdEMsS0FBSztRQUVMLDZDQUE2QztRQUM3QywrQkFBK0I7UUFDL0Isa0NBQWtDO1FBQ2xDLEtBQUs7UUFFTCwwRUFBMEU7UUFDMUUsc0RBQXNEO1FBQ3RELHdDQUF3QztRQUN4QywyQkFBMkI7UUFDM0IsS0FBSztRQUVMLHVDQUF1QztRQUN2QyxnRUFBZ0U7UUFDaEUseUJBQXlCO1FBQ3pCLHlCQUF5QjtRQUN6QixpQ0FBaUM7UUFDakMsb0VBQW9FO1FBQ3BFLEtBQUs7UUFFTCw2R0FBNkc7UUFDN0cscUNBQXFDO1FBQ3JDLHVCQUF1QjtRQUN2Qix3QkFBd0I7UUFDeEIsZ0RBQWdEO1FBQ2hELElBQUk7UUFFSix1R0FBdUc7UUFFdkcsdUdBQXVHO1FBRXZHLHVHQUF1RztRQUV2RyxNQUFNLFdBQVcsR0FBRyxJQUFJLCtCQUFxQixDQUFDLElBQUksRUFBRSxhQUFhLEVBQUU7WUFDakUsY0FBYyxFQUFFLElBQUk7WUFDcEIsR0FBRyxFQUFFLEdBQUcsQ0FBQyxpQkFBaUI7U0FDM0IsQ0FBQyxDQUFBO1FBRUYsTUFBTSxZQUFZLEdBQUcsSUFBSSxtQkFBUSxDQUFDLElBQUksRUFBRSxxQkFBcUIsRUFBRTtZQUM3RCxhQUFhLEVBQUUsMkJBQWEsQ0FBQyxNQUFNO1lBQ25DLFNBQVMsRUFBRSx3QkFBYSxDQUFDLFFBQVE7U0FDbEMsQ0FBQyxDQUFBO1FBRUYsd0NBQXdDO1FBQ3hDLE1BQU0sYUFBYSxHQUFHLElBQUksc0JBQVksQ0FBQztZQUNyQyxRQUFRLEVBQUUsZUFBZTtZQUN6QixZQUFZLEVBQUUsYUFBYTtTQUM1QixDQUFDLENBQUE7UUFFRixNQUFNLGFBQWEsR0FBRyxXQUFXLENBQUMsWUFBWSxDQUFDLGVBQWUsRUFBRTtZQUM5RCxLQUFLLEVBQUUsd0JBQWMsQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDO1lBQ2hELE9BQU8sRUFBRSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDO1lBQ2xDLE9BQU8sRUFBRSxhQUFhO1NBQ3ZCLENBQUMsQ0FBQTtRQUVGLG9DQUFvQztRQUNwQyxNQUFNLFdBQVcsR0FBRyxJQUFJLHdCQUFjLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRTtZQUMxRCxPQUFPO1lBQ1AsV0FBVyxFQUFFLE1BQU07WUFDbkIsY0FBYyxFQUFFLFdBQVc7WUFDM0IsZUFBZSxFQUFFLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxTQUFTLEVBQUU7U0FDaEUsQ0FBQyxDQUFBO1FBRUYsV0FBVyxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQTtRQUM1RyxXQUFXLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQTtRQUNwRyxXQUFXLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQTtRQUNwRyxXQUFXLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxxQkFBcUIsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxnQ0FBZ0MsQ0FBQyxDQUFBO1FBQzlHLFdBQVcsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxnQ0FBZ0MsQ0FBQyxDQUFBO1FBQ3RHLFdBQVcsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLFlBQVksRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxnQ0FBZ0MsQ0FBQyxDQUFBO1FBQ3JHLFdBQVcsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQTtRQUMxRyxXQUFXLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FDL0IsdUJBQXVCLEVBQ3ZCLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUNsQiwyQ0FBMkMsQ0FDNUMsQ0FBQTtRQUVELHdGQUF3RjtRQUN4Rix1R0FBdUc7UUFFdkcsa0RBQWtEO1FBQ2xELDZDQUE2QztRQUM3QyxNQUFNO1FBRU4saURBQWlEO1FBRWpELDBEQUEwRDtJQUM1RCxDQUFDO0NBQ0Y7QUE5dEJELDBDQTh0QkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEdXJhdGlvbiwgUmVtb3ZhbFBvbGljeSwgU3RhY2ssIFN0YWNrUHJvcHMgfSBmcm9tIFwiYXdzLWNkay1saWJcIlxuLy8gaW1wb3J0ICogYXMgZWNzIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtZWNzXCJcbmltcG9ydCAqIGFzIGVjMiBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWVjMlwiXG5pbXBvcnQgeyBTZWN1cml0eUdyb3VwLCBWcGMgfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWVjMlwiXG5pbXBvcnQgeyBSZXBvc2l0b3J5IH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1lY3JcIlxuaW1wb3J0IHsgQXdzTG9nRHJpdmVyLCBDbHVzdGVyLCBDb250YWluZXJJbWFnZSwgRmFyZ2F0ZVNlcnZpY2UsIEZhcmdhdGVUYXNrRGVmaW5pdGlvbiB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtZWNzXCJcbmltcG9ydCAqIGFzIGVjc1BhdHRlcm5zIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtZWNzLXBhdHRlcm5zXCJcbmltcG9ydCB7IFByb3RvY29sIH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1lbGFzdGljbG9hZGJhbGFuY2luZ3YyXCJcbmltcG9ydCB7IFBvbGljeVN0YXRlbWVudCB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtaWFtXCJcbmltcG9ydCB7IExvZ0dyb3VwLCBSZXRlbnRpb25EYXlzIH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1sb2dzXCJcbmltcG9ydCAqIGFzIHNlcnZpY2VkaXNjb3ZlcnkgZnJvbSBcImF3cy1jZGstbGliL2F3cy1zZXJ2aWNlZGlzY292ZXJ5XCJcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gXCJjb25zdHJ1Y3RzXCJcbmltcG9ydCB7IElFbnYsIFBsYXRmb3JtQWNjb3VudCwgUmRzU3VwcG9ydFBsYXRmb3JtcyB9IGZyb20gXCIuL3R5cGVzXCJcblxuZXhwb3J0IGludGVyZmFjZSBWZ1NlcnZpY2VzU3RhY2tQcm9wcyBleHRlbmRzIFN0YWNrUHJvcHMge1xuICBlbnY6IElFbnZcbiAgcGxhdGZvcm1BY2NvdW50OiBQbGF0Zm9ybUFjY291bnRcbn1cblxuaW50ZXJmYWNlIFZwY0NvbmZpZyB7XG4gIGNpZHI6IHN0cmluZ1xuICBuYXRHYXRld2F5czogbnVtYmVyXG4gIG1heEF6czogbnVtYmVyXG59XG5cbmNvbnN0IHZwY0NmZ01hcDogUmVjb3JkPFJkc1N1cHBvcnRQbGF0Zm9ybXMsIFZwY0NvbmZpZz4gPSB7XG4gIGRldnBsYXRmb3JtOiB7XG4gICAgY2lkcjogXCIxMC4wLjAuMC8xNlwiLFxuICAgIG5hdEdhdGV3YXlzOiAxLFxuICAgIG1heEF6czogMVxuICB9LFxuICBzdGFnZXBsYXRmb3JtOiB7XG4gICAgY2lkcjogXCIxMC4wLjAuMC8xNlwiLFxuICAgIG5hdEdhdGV3YXlzOiAyLFxuICAgIG1heEF6czogMlxuICB9LFxuICBwcm9kcGxhdGZvcm06IHtcbiAgICBjaWRyOiBcIjEwLjAuMC4wLzE2XCIsXG4gICAgbmF0R2F0ZXdheXM6IDMsXG4gICAgbWF4QXpzOiAzXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFZnU2VydmljZXNTdGFjayBleHRlbmRzIFN0YWNrIHtcbiAgcmVhZG9ubHkgdnBjOiBWcGNcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogVmdTZXJ2aWNlc1N0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKVxuXG4gICAgY29uc3Qgc2VydmljZU5hbWVzcGFjZSA9IFwidm9sYXRpbGl0eS1zZXJ2aWNlc1wiXG5cbiAgICAvLyBjb25zdCBkb21haW5ab25lID0gSG9zdGVkWm9uZS5mcm9tTG9va3VwKHRoaXMsIFwiWm9uZVwiLCB7IGRvbWFpbk5hbWU6IFwidm9sYXRpbGl0eS5jb21cIiB9KVxuICAgIC8vIGNvbnN0IGNlcnRpZmljYXRlID0gQ2VydGlmaWNhdGUuZnJvbUNlcnRpZmljYXRlQXJuKHRoaXMsIFwiQ2VydFwiLCBcImFybjphd3M6YWNtOnVzLWVhc3QtMToxMjM0NTY6Y2VydGlmaWNhdGUvYWJjZGVmZ1wiKVxuICAgIC8vIGNvbnN0IHN1YlpvbmUgPSBuZXcgUHVibGljSG9zdGVkWm9uZSh0aGlzLCBcIkRldkhvc3RlZFpvbmVcIiwge1xuICAgIC8vICAgem9uZU5hbWU6IFwiZGV2LnZvbGF0aWxpdHkuY29tXCJcbiAgICAvLyAgIC8vIGNyb3NzQWNjb3VudFpvbmVEZWxlZ2F0aW9uUHJpbmNpcGFsOiBuZXcgQWNjb3VudFByaW5jaXBhbChwcm9wcz8uZW52Py5hY2NvdW50KVxuICAgIC8vIH0pXG5cbiAgICAvLyBuZXcgQ3Jvc3NBY2NvdW50Wm9uZURlbGVnYXRpb25SZWNvcmQodGhpcywgXCJab25lRGVsZWdhdGlvblwiLCB7XG4gICAgLy8gICBkZWxlZ2F0ZWRab25lOiBzdWJab25lLFxuICAgIC8vICAgcGFyZW50SG9zdGVkWm9uZUlkOiBcIlowMDk2MDI3M0hPSE1MMkc0R09KVFwiLFxuICAgIC8vICAgZGVsZWdhdGlvblJvbGU6IFJvbGUuZnJvbVJvbGVBcm4oXG4gICAgLy8gICAgIHRoaXMsXG4gICAgLy8gICAgIFwiZGVsZWdhdGVcIixcbiAgICAvLyAgICAgXCJhcm46YXdzOmlhbTo6NDY4ODI1NTE3OTQ2OnJvbGUvQ2RrRG5zVm9sYXRpbGl0eUNvbVN0YWNrLURldkNyb3NzQWNjb3VuZFpvbmVEZWxlZ2EtNUcwSzNSOEk1WDdQXCJcbiAgICAvLyAgIClcbiAgICAvLyB9KVxuXG4gICAgLy8gY29uc3QgY2VydGlmaWNhdGUgPSBDZXJ0aWZpY2F0ZS5mcm9tQ2VydGlmaWNhdGVBcm4oXG4gICAgLy8gICB0aGlzLFxuICAgIC8vICAgXCJEZXZTU0xDZXJ0aWZpY2F0ZVwiLFxuICAgIC8vICAgXCJhcm46YXdzOmFjbTp1cy1lYXN0LTI6OTk0MjI0ODI3NDM3OmNlcnRpZmljYXRlL2IyYmIwMGI5LWI3NzItNDlkOC05NjM0LTliMGFmMTRmN2NkOVwiXG4gICAgLy8gKVxuICAgIC8vIGNvbnN0IGNlcnRpZmljYXRlID0gbmV3IENlcnRpZmljYXRlKHRoaXMsIFwiU1NMQ2VydGlmaWNhdGVcIiwge1xuICAgIC8vICAgZG9tYWluTmFtZTogXCJkZXYudm9sYXRpbGl0eS5jb21cIixcbiAgICAvLyAgIHN1YmplY3RBbHRlcm5hdGl2ZU5hbWVzOiBbXCJ3cy5kZXYudm9sYXRpbGl0eS5jb21cIl0sXG4gICAgLy8gICB2YWxpZGF0aW9uOiBDZXJ0aWZpY2F0ZVZhbGlkYXRpb24uZnJvbURucygpXG4gICAgLy8gfSlcblxuICAgIC8vY29uc3QgdnBjID0gbmV3IFZwYyh0aGlzLCBcIlZwY1wiLCB7fSlcbiAgICBjb25zdCB2cGNDZmcgPSB2cGNDZmdNYXBbcHJvcHMucGxhdGZvcm1BY2NvdW50XVxuXG4gICAgY29uc3QgdnBjID0gbmV3IFZwYyh0aGlzLCBcIlZwY1wiLCB7XG4gICAgICAuLi52cGNDZmcsXG4gICAgICBzdWJuZXRDb25maWd1cmF0aW9uOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBjaWRyTWFzazogMTksXG4gICAgICAgICAgbmFtZTogXCJwdWJsaWNcIixcbiAgICAgICAgICBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QVUJMSUNcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGNpZHJNYXNrOiAyMCxcbiAgICAgICAgICBuYW1lOiBcImFwcGxpY2F0aW9uXCIsXG4gICAgICAgICAgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFJJVkFURV9XSVRIX05BVFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgY2lkck1hc2s6IDIxLFxuICAgICAgICAgIG5hbWU6IFwiZGF0YVwiLFxuICAgICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBSSVZBVEVfSVNPTEFURURcbiAgICAgICAgfVxuICAgICAgXVxuICAgIH0pXG5cbiAgICAvLyBjb25zdCB7IHJkc0NsdXN0ZXIsIGRhdGFiYXNlQ3JlZGVudGlhbHNTZWNyZXQgfSA9IG5ldyBWZ0ZhcmdhdGVSZHNOZXN0ZWRTdGFjayh0aGlzLCBcIlJkc05lc3RlZFN0YWNrXCIsIHtcbiAgICAvLyAgIHZwYyxcbiAgICAvLyAgIHN0YWdlXG4gICAgLy8gfSlcblxuICAgIC8vIGNvbnN0IHsgcmVkaXNDbHVzdGVyIH0gPSBuZXcgVmdGYXJnYXRlUmVkaXNDYWNoZU5lc3RlZFN0YWNrKHRoaXMsIFwiUmVkaXNDYWNoZU5lc3RlZFN0YWNrXCIsIHtcbiAgICAvLyAgIHNlY3VyaXR5R3JvdXBzOiBbXSxcbiAgICAvLyAgIHN1Ym5ldHM6IHZwYy5pc29sYXRlZFN1Ym5ldHNcbiAgICAvLyB9KVxuXG4gICAgLy8gRUZTIFNlY3VyaXR5IEdyb3VwXG4gICAgLy8gY29uc3QgZmlsZXN5c3RlbVNlY3VyaXR5R3JvdXAgPSBuZXcgZWMyLlNlY3VyaXR5R3JvdXAodGhpcywgXCJFZnNTZWN1cml0eVwiLCB7XG4gICAgLy8gICB2cGMsXG4gICAgLy8gICBhbGxvd0FsbE91dGJvdW5kOiB0cnVlXG4gICAgLy8gfSlcblxuICAgIGNvbnN0IGNsdXN0ZXIgPSBuZXcgQ2x1c3Rlcih0aGlzLCBcIkNsdXN0ZXJcIiwge1xuICAgICAgY2x1c3Rlck5hbWU6IFwidmctc2VydmljZXMtY2x1c3RlclwiLFxuICAgICAgY29udGFpbmVySW5zaWdodHM6IHRydWUsXG4gICAgICB2cGNcbiAgICB9KVxuXG4gICAgY29uc3QgdmdTZXJ2aWNlc1NlY3VyaXR5R3JvdXAgPSBuZXcgU2VjdXJpdHlHcm91cCh0aGlzLCBcIlZnU2VydmljZXNTZWN1cml0eUdyb3VwXCIsIHtcbiAgICAgIHZwYyxcbiAgICAgIGFsbG93QWxsT3V0Ym91bmQ6IHRydWVcbiAgICB9KVxuXG4gICAgLy8gdmdTZXJ2aWNlc1NlY3VyaXR5R3JvdXAuYWRkSW5ncmVzc1J1bGUocGVlciwgY29ubmVjdGlvbilcbiAgICAvLyBjb25zdCBsYlNlY3VyaXR5R3JvdXAgPSBuZXcgU2VjdXJpdHlHcm91cCh0aGlzLCBcIkxCU2VjdXJpdHlHcm91cFwiLCB7XG4gICAgLy8gICB2cGMsXG4gICAgLy8gICBhbGxvd0FsbE91dGJvdW5kOiB0cnVlXG4gICAgLy8gfSlcblxuICAgIC8vIGxiU2VjdXJpdHlHcm91cC5hZGRJbmdyZXNzUnVsZShlYzIuUGVlci5hbnlJcHY0KCksIGVjMi5Qb3J0LnRjcCg0NDMpLCBcIkFsbG93IGh0dHBzIHRyYWZmaWNcIilcbiAgICAvLyBsYlNlY3VyaXR5R3JvdXAuYWRkSW5ncmVzc1J1bGUoZWMyLlBlZXIuYW55SXB2NCgpLCBlYzIuUG9ydC50Y3AoODApLCBcIkFsbG93IGh0dHAgdHJhZmZpY1wiKVxuICAgIC8vIGxiU2VjdXJpdHlHcm91cC5hZGRJbmdyZXNzUnVsZShlYzIuUGVlci5hbnlJcHY2KCksIGVjMi5Qb3J0LnRjcCg0NDMpLCBcIkFsbG93IGh0dHBzIHRyYWZmaWNcIilcbiAgICAvLyBsYlNlY3VyaXR5R3JvdXAuYWRkSW5ncmVzc1J1bGUoZWMyLlBlZXIuYW55SXB2NigpLCBlYzIuUG9ydC50Y3AoODApLCBcIkFsbG93IGh0dHAgdHJhZmZpY1wiKVxuXG4gICAgLy8gY29uc3QgZWNzU2VjdXJpdHlHcm91cCA9IG5ldyBTZWN1cml0eUdyb3VwKHRoaXMsIFwiRUNTU2VjdXJpdHlHcm91cFwiLCB7XG4gICAgLy8gICB2cGMsXG4gICAgLy8gICBhbGxvd0FsbE91dGJvdW5kOiB0cnVlXG4gICAgLy8gfSlcbiAgICAvLyBlY3NTZWN1cml0eUdyb3VwLmFkZEluZ3Jlc3NSdWxlKGxiU2VjdXJpdHlHcm91cCwgZWMyLlBvcnQudGNwKDMwMDApLCBcIkFsbG93IGh0dHAgdHJhZmZpY1wiKVxuICAgIC8vIGVjc1NlY3VyaXR5R3JvdXAuYWRkSW5ncmVzc1J1bGUoZWMyLlBlZXIuYW55SXB2NCgpLCBlYzIuUG9ydC5pY21wUGluZygpLCBcIkFsbG93IHBpbmcgdHJhZmZpY1wiKVxuICAgIC8vIGVjc1NlY3VyaXR5R3JvdXAuYWRkSW5ncmVzc1J1bGUoZWMyLlBlZXIuYW55SXB2NigpLCBlYzIuUG9ydC5pY21wUGluZygpLCBcIkFsbG93IHBpbmcgdHJhZmZpY1wiKVxuXG4gICAgY29uc3Qgc2VydmljZUxvZ0dyb3VwID0gbmV3IExvZ0dyb3VwKHRoaXMsIFwiVm9sYXRpbGl0eVNlcnZpY2VMb2dHcm91cFwiLCB7XG4gICAgICByZW1vdmFsUG9saWN5OiBSZW1vdmFsUG9saWN5LlJFVEFJTixcbiAgICAgIHJldGVudGlvbjogUmV0ZW50aW9uRGF5cy5PTkVfTU9OVEhcbiAgICB9KVxuXG4gICAgLyogRmFyZ2F0ZSBvbmx5IHN1cHBvcnQgYXdzbG9nIGRyaXZlciAqL1xuICAgIGNvbnN0IHdzTG9nRHJpdmVyID0gbmV3IEF3c0xvZ0RyaXZlcih7XG4gICAgICBsb2dHcm91cDogc2VydmljZUxvZ0dyb3VwLFxuICAgICAgc3RyZWFtUHJlZml4OiBcIldTU2VydmljZVwiXG4gICAgfSlcblxuICAgIGNvbnN0IGluc3RydW1lbnRJbmZvTG9nRHJpdmVyID0gbmV3IEF3c0xvZ0RyaXZlcih7XG4gICAgICBsb2dHcm91cDogc2VydmljZUxvZ0dyb3VwLFxuICAgICAgc3RyZWFtUHJlZml4OiBcIkluc3RydW1lbnRJbmZvU2VydmljZVwiXG4gICAgfSlcblxuICAgIGNvbnN0IGluZ2VzdExvZ0RyaXZlciA9IG5ldyBBd3NMb2dEcml2ZXIoe1xuICAgICAgbG9nR3JvdXA6IHNlcnZpY2VMb2dHcm91cCxcbiAgICAgIHN0cmVhbVByZWZpeDogXCJJbmdlc3RTZXJ2aWNlXCJcbiAgICB9KVxuXG4gICAgY29uc3QgaW5kZXhMb2dEcml2ZXIgPSBuZXcgQXdzTG9nRHJpdmVyKHtcbiAgICAgIGxvZ0dyb3VwOiBzZXJ2aWNlTG9nR3JvdXAsXG4gICAgICBzdHJlYW1QcmVmaXg6IFwiSW5kZXhTZXJ2aWNlXCJcbiAgICB9KVxuXG4gICAgY29uc3QgcmF0ZUxvZ0RyaXZlciA9IG5ldyBBd3NMb2dEcml2ZXIoe1xuICAgICAgbG9nR3JvdXA6IHNlcnZpY2VMb2dHcm91cCxcbiAgICAgIHN0cmVhbVByZWZpeDogXCJSYXRlU2VydmljZVwiXG4gICAgfSlcblxuICAgIGNvbnN0IGNyb25Mb2dEcml2ZXIgPSBuZXcgQXdzTG9nRHJpdmVyKHtcbiAgICAgIGxvZ0dyb3VwOiBzZXJ2aWNlTG9nR3JvdXAsXG4gICAgICBzdHJlYW1QcmVmaXg6IFwiQ3JvblNlcnZpY2VcIlxuICAgIH0pXG5cbiAgICBjb25zdCBkYXRhUGlwZWxpbmVMb2dEcml2ZXIgPSBuZXcgQXdzTG9nRHJpdmVyKHtcbiAgICAgIGxvZ0dyb3VwOiBzZXJ2aWNlTG9nR3JvdXAsXG4gICAgICBzdHJlYW1QcmVmaXg6IFwiRGF0YVBpcGVsaW5lU2VydmljZVwiXG4gICAgfSlcblxuICAgIGNvbnN0IHNlY3JldHNNYW5hZ2VyUG9saWN5ID0gbmV3IFBvbGljeVN0YXRlbWVudCh7XG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgIFwic2VjcmV0c21hbmFnZXI6R2V0UmVzb3VyY2VQb2xpY3lcIixcbiAgICAgICAgXCJzZWNyZXRzbWFuYWdlcjpHZXRTZWNyZXRWYWx1ZVwiLFxuICAgICAgICBcInNlY3JldHNtYW5hZ2VyOkRlc2NyaWJlU2VjcmV0XCIsXG4gICAgICAgIFwic2VjcmV0c21hbmFnZXI6TGlzdFNlY3JldFZlcnNpb25JZHNcIlxuICAgICAgXSxcbiAgICAgIHJlc291cmNlczogW2Bhcm46YXdzOnNlY3JldHNtYW5hZ2VyOiR7cHJvcHM/LmVudj8ucmVnaW9uID8/IFwibm9uZVwifToke3Byb3BzPy5lbnY/LmFjY291bnQgPz8gXCJub25lXCJ9OnNlY3JldDoqYF1cbiAgICB9KVxuXG4gICAgY29uc3QgbmFtZXNwYWNlID0gbmV3IHNlcnZpY2VkaXNjb3ZlcnkuUHJpdmF0ZURuc05hbWVzcGFjZSh0aGlzLCBcIk5hbWVzcGFjZVwiLCB7XG4gICAgICBkZXNjcmlwdGlvbjogXCJQcml2YXRlIERuc05hbWVzcGFjZSBmb3Igdm9sYXRpbGl0eS1zZXJ2aWNlc1wiLFxuICAgICAgbmFtZTogXCJ2b2xhdGlsaXR5LmxvY2FsXCIsXG4gICAgICB2cGNcbiAgICB9KVxuXG4gICAgLy8gY29uc3QgdGFza1JvbGUgPSBuZXcgUm9sZSh0aGlzLCBcImVjc1Rhc2tFeGVjdXRpb25Sb2xlXCIsIHtcbiAgICAvLyAgIGFzc3VtZWRCeTogbmV3IFNlcnZpY2VQcmluY2lwYWwoXCJlY3MtdGFza3MuYW1hem9uYXdzLmNvbVwiKVxuICAgIC8vIH0pXG5cbiAgICAvLyB0YXNrUm9sZS5hZGRNYW5hZ2VkUG9saWN5KE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKFwic2VydmljZS1yb2xlL0FtYXpvbkVDU1Rhc2tFeGVjdXRpb25Sb2xlUG9saWN5XCIpKVxuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuICAgIGNvbnN0IHdzVGFza2RlZiA9IG5ldyBGYXJnYXRlVGFza0RlZmluaXRpb24odGhpcywgXCJXU1Rhc2tEZWZcIiwge1xuICAgICAgbWVtb3J5TGltaXRNaUI6IDIwNDgsIC8vIERlZmF1bHQgaXMgNTEyXG4gICAgICBjcHU6IDUxMiAvLyBEZWZhdWx0IGlzIDI1NlxuICAgICAgLy8gdGFza1JvbGVcbiAgICB9KVxuXG4gICAgLy8gOTk0MjI0ODI3NDM3LmRrci5lY3IudXMtZWFzdC0yLmFtYXpvbmF3cy5jb20vY29tcG9zZS1waXBlbGluZS12b2xhdGlsaXR5LXNlcnZpY2VzOmxhdGVzdFxuICAgIGNvbnN0IGVjclJlcG9zaXRvcnkgPSBSZXBvc2l0b3J5LmZyb21SZXBvc2l0b3J5TmFtZSh0aGlzLCBcIkVjclJlcG9zaXRvcnlcIiwgXCJjb21wb3NlLXBpcGVsaW5lLXZvbGF0aWxpdHktc2VydmljZXNcIilcbiAgICBjb25zdCBpbWFnZSA9IENvbnRhaW5lckltYWdlLmZyb21FY3JSZXBvc2l0b3J5KGVjclJlcG9zaXRvcnksIFwibGF0ZXN0XCIpXG4gICAgY29uc3Qgd3NDb250YWluZXIgPSB3c1Rhc2tkZWYuYWRkQ29udGFpbmVyKFwiV1NDb250YWluZXJcIiwge1xuICAgICAgaW1hZ2UsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBTRUFSQ0hfRE9NQUlOOiBuYW1lc3BhY2UubmFtZXNwYWNlTmFtZSxcbiAgICAgICAgU0VSVklDRV9OQU1FU1BBQ0U6IHNlcnZpY2VOYW1lc3BhY2UsXG4gICAgICAgIFRSQU5TUE9SVEVSOiBcIm5hdHM6Ly9uYXRzLnZvbGF0aWxpdHkubG9jYWw6NDIyMlwiLFxuICAgICAgICBTRVJWSUNFRElSOiBcImRpc3Qvc2VydmljZXNcIixcbiAgICAgICAgU0VSVklDRVM6IFwid3Muc2VydmljZS5qc1wiLFxuICAgICAgICBOQU1FU1BBQ0U6IHNlcnZpY2VOYW1lc3BhY2UsXG4gICAgICAgIE5FV19SRUxJQ19MSUNFTlNFX0tFWTogXCJiYTJlNzJmZDEwNWZkMTVjNGYxNWZhMTljOGM4NjM3MEZGRkZOUkFMXCIsXG4gICAgICAgIE5FV19SRUxJQ19ESVNUUklCVVRFRF9UUkFDSU5HX0VOQUJMRUQ6IFwidHJ1ZVwiLFxuICAgICAgICBORVdfUkVMSUNfQVBQX05BTUU6IFwidm9sYXRpbGl0eS1zZXJ2aWNlc1wiLFxuICAgICAgICBORVdfUkVMSUNfTE9HX0xFVkVMOiBcImluZm9cIlxuICAgICAgfSxcbiAgICAgIGxvZ2dpbmc6IHdzTG9nRHJpdmVyXG4gICAgfSlcblxuICAgIC8vIGxvZ2dpbmc6IExvZ0RyaXZlci5hd3NMb2dzKHtcbiAgICAvLyAgIGxvZ0dyb3VwOiBhcHBsaWNhdGlvbkxvZ0dyb3VwLFxuICAgIC8vICAgc3RyZWFtUHJlZml4OiBuZXcgRGF0ZSgpLnRvTG9jYWxlRGF0ZVN0cmluZygnZW4tWkEnKVxuICAgIC8vIH0pLFxuXG4gICAgd3NDb250YWluZXIuYWRkUG9ydE1hcHBpbmdzKHtcbiAgICAgIGNvbnRhaW5lclBvcnQ6IDMwMDBcbiAgICB9KVxuXG4gICAgLy8gQ3JlYXRlIGEgbG9hZC1iYWxhbmNlZCBGYXJnYXRlIHNlcnZpY2UgYW5kIG1ha2UgaXQgcHVibGljXG4gICAgY29uc3Qgd3NTZXJ2aWNlID0gbmV3IGVjc1BhdHRlcm5zLkFwcGxpY2F0aW9uTG9hZEJhbGFuY2VkRmFyZ2F0ZVNlcnZpY2UodGhpcywgXCJXU1NlcnZpY2VcIiwge1xuICAgICAgY2x1c3RlciwgLy8gUmVxdWlyZWRcbiAgICAgIC8vIGNpcmN1aXRCcmVha2VyOiB7XG4gICAgICAvLyAgIHJvbGxiYWNrOiB0cnVlXG4gICAgICAvLyB9LFxuICAgICAgZGVzaXJlZENvdW50OiAyLFxuICAgICAgZG9tYWluWm9uZTogc3ViWm9uZSxcbiAgICAgIGRvbWFpbk5hbWU6IFwid3MuZGV2LnZvbGF0aWxpdHkuY29tXCIsXG4gICAgICBjZXJ0aWZpY2F0ZSxcbiAgICAgIHJlZGlyZWN0SFRUUDogdHJ1ZSxcbiAgICAgIC8vcHJvdG9jb2w6IEFwcGxpY2F0aW9uUHJvdG9jb2wuSFRUUFMsXG4gICAgICAvLyB0YXJnZXRQcm90b2NvbDogQXBwbGljYXRpb25Qcm90b2NvbC5IVFRQUyxcbiAgICAgIC8vIHJlY29yZFR5cGU6IFwiZGV2LnZvbGF0aWxpdHkuY29tXCIsXG4gICAgICAvLyBzc2xQb2xpY3k6IFNzbFBvbGljeS5SRUNPTU1FTkRFRCxcbiAgICAgIC8vIHNlY3VyaXR5R3JvdXBzOiBbbGJTZWN1cml0eUdyb3VwXSxcbiAgICAgIHB1YmxpY0xvYWRCYWxhbmNlcjogdHJ1ZSwgLy8gRGVmYXVsdCBpcyBmYWxzZVxuICAgICAgc2VydmljZU5hbWU6IFwid3NcIixcbiAgICAgIHRhc2tEZWZpbml0aW9uOiB3c1Rhc2tkZWYsXG4gICAgICBjbG91ZE1hcE9wdGlvbnM6IHsgbmFtZTogXCJ3c1wiLCBjbG91ZE1hcE5hbWVzcGFjZTogbmFtZXNwYWNlIH1cbiAgICB9KVxuXG4gICAgd3NTZXJ2aWNlLmxvYWRCYWxhbmNlci5jb25uZWN0aW9ucy5hbGxvd0Zyb20oZWMyLlBlZXIuYW55SXB2NCgpLCBlYzIuUG9ydC50Y3AoODApLCBcIkFsbG93IGh0dHAgdHJhZmZpY1wiKVxuICAgIHdzU2VydmljZS5sb2FkQmFsYW5jZXIuY29ubmVjdGlvbnMuYWxsb3dGcm9tKGVjMi5QZWVyLmFueUlwdjQoKSwgZWMyLlBvcnQudGNwKDQ0MyksIFwiQWxsb3cgaHR0cHMgdHJhZmZpY1wiKVxuICAgIHdzU2VydmljZS5sb2FkQmFsYW5jZXIuY29ubmVjdGlvbnMuYWxsb3dGcm9tKGVjMi5QZWVyLmFueUlwdjYoKSwgZWMyLlBvcnQudGNwKDgwKSwgXCJBbGxvdyBodHRwIHRyYWZmaWNcIilcbiAgICB3c1NlcnZpY2UubG9hZEJhbGFuY2VyLmNvbm5lY3Rpb25zLmFsbG93RnJvbShlYzIuUGVlci5hbnlJcHY2KCksIGVjMi5Qb3J0LnRjcCg0NDMpLCBcIkFsbG93IGh0dHBzIHRyYWZmaWNcIilcbiAgICB3c1NlcnZpY2Uuc2VydmljZS5jb25uZWN0aW9ucy5hZGRTZWN1cml0eUdyb3VwKHZnU2VydmljZXNTZWN1cml0eUdyb3VwKVxuICAgIC8vIHdzU2VydmljZS5zZXJ2aWNlLmNvbm5lY3Rpb25zLmFsbG93RnJvbSh3c1NlcnZpY2UubG9hZEJhbGFuY2VyLCBlYzIuUG9ydC50Y3AoODApLCBcIkxCIHRvIFdTXCIpXG5cbiAgICAvLyB3c1NlcnZpY2Uuc2VydmljZS5jb25uZWN0aW9ucy5hbGxvd0Zyb20oXG4gICAgLy8gICB3c1NlcnZpY2UubG9hZEJhbGFuY2VyLFxuICAgIC8vICAgZWMyLlBvcnQudGNwKDgyMjIpLFxuICAgIC8vICAgXCJOQVRTIHRyYW5zcG9ydCBtYW5hZ2VtZW50IHBvcnQgYXNzaWdubWVudFwiXG4gICAgLy8gKVxuXG4gICAgLy8gbmV3IGVjcy5GYXJnYXRlU2VydmljZSh0aGlzLCBgJHtzZXJ2aWNlTmFtZX1TZXJ2aWNlYCwge1xuICAgIC8vICAgY2x1c3RlcjogY2x1c3RlcixcbiAgICAvLyAgIHRhc2tEZWZpbml0aW9uOiBzZXJ2aWNlVGFza0RlZmluaXRpb24sXG4gICAgLy8gICAvLyBNdXN0IGJlIGB0cnVlYCB3aGVuIHVzaW5nIHB1YmxpYyBpbWFnZXNcbiAgICAvLyAgIGFzc2lnblB1YmxpY0lwOiB0cnVlLFxuICAgIC8vICAgLy8gSWYgeW91IHNldCBpdCB0byAwLCB0aGUgZGVwbG95bWVudCB3aWxsIGZpbmlzaCBzdWNjZXNmdWxseSBhbnl3YXlcbiAgICAvLyAgIGRlc2lyZWRDb3VudDogMSxcbiAgICAvLyAgIHNlY3VyaXR5R3JvdXA6IHNlcnZpY2VTZWNHcnAsXG4gICAgLy8gICBjbG91ZE1hcE9wdGlvbnM6IHtcbiAgICAvLyAgICAgLy8gVGhpcyB3aWxsIGJlIHlvdXIgc2VydmljZV9uYW1lLm5hbWVzcGFjZVxuICAgIC8vICAgICBuYW1lOiBzZXJ2aWNlTmFtZSxcbiAgICAvLyAgICAgY2xvdWRNYXBOYW1lc3BhY2U6IGRuc05hbWVzcGFjZSxcbiAgICAvLyAgICAgZG5zUmVjb3JkVHlwZTogRG5zUmVjb3JkVHlwZS5BLFxuICAgIC8vICAgfSxcbiAgICAvLyB9KTtcblxuICAgIHdzU2VydmljZS50YXJnZXRHcm91cC5jb25maWd1cmVIZWFsdGhDaGVjayh7XG4gICAgICBwYXRoOiBcIi93cy9oZWFsdGhcIixcbiAgICAgIGludGVydmFsOiBEdXJhdGlvbi5zZWNvbmRzKDEyMCksXG4gICAgICB1bmhlYWx0aHlUaHJlc2hvbGRDb3VudDogMixcbiAgICAgIHByb3RvY29sOiBQcm90b2NvbC5IVFRQXG4gICAgfSlcblxuICAgIC8vIGNvbnN0IHRhcmdldEdyb3VwSHR0cCA9IG5ldyBBcHBsaWNhdGlvblRhcmdldEdyb3VwKHRoaXMsIFwiQUxCVGFyZ2V0R3JvdXBcIiwge1xuICAgIC8vICAgcG9ydDogMzAwMCxcbiAgICAvLyAgIHZwYyxcbiAgICAvLyAgIHByb3RvY29sOiBBcHBsaWNhdGlvblByb3RvY29sLkhUVFAsXG4gICAgLy8gICB0YXJnZXRUeXBlOiBUYXJnZXRUeXBlLklQXG4gICAgLy8gfSlcblxuICAgIC8vIHRhcmdldEdyb3VwSHR0cC5jb25maWd1cmVIZWFsdGhDaGVjayh7XG4gICAgLy8gICBwYXRoOiBcIi9oZWFsdGhcIixcbiAgICAvLyAgIHByb3RvY29sOiBQcm90b2NvbC5IVFRQXG4gICAgLy8gfSlcblxuICAgIC8vIHdzU2VydmljZS50YXJnZXRHcm91cC5sb2FkQmFsYW5jZXJBdHRhY2hlZC5cblxuICAgIC8vIHVzZSBhIHNlY3VyaXR5IGdyb3VwIHRvIHByb3ZpZGUgYSBzZWN1cmUgY29ubmVjdGlvbiBiZXR3ZWVuIHRoZSBBTEIgYW5kIHRoZSBjb250YWluZXJzXG4gICAgLy8gY29uc3QgbGJTZWN1cml0eUdyb3VwID0gbmV3IGVjMi5TZWN1cml0eUdyb3VwKHRoaXMsIFwiTEJTZWN1cml0eUdyb3VwXCIsIHtcbiAgICAvLyAgIHZwYyxcbiAgICAvLyAgIGFsbG93QWxsT3V0Ym91bmQ6IHRydWVcbiAgICAvLyB9KVxuICAgIC8vIGxiU2VjdXJpdHlHcm91cC5hZGRJbmdyZXNzUnVsZShlYzIuUGVlci5hbnlJcHY0KCksIGVjMi5Qb3J0LnRjcCg0NDMpLCBcIkFsbG93IGh0dHBzIHRyYWZmaWNcIilcbiAgICAvLyB3c1NlcnZpY2UubG9hZEJhbGFuY2VyLmFkZFNlY3VyaXR5R3JvdXAobGJTZWN1cml0eUdyb3VwKVxuXG4gICAgLy8gZWNzU2VjdXJpdHlHcm91cC5jb25uZWN0aW9ucy5hbGxvd0Zyb20obGJTZWN1cml0eUdyb3VwLCBlYzIuUG9ydC5hbGxUY3AoKSwgXCJBcHBsaWNhdGlvbiBsb2FkIGJhbGFuY2VyXCIpXG5cbiAgICAvLyB3c1NlcnZpY2UubG9hZEJhbGFuY2VyLmNvbm5lY3Rpb25zLmFsbG93RnJvbShuYXRzU2VydmljZSwgZWMyLlBvcnQudGNwKDQyMjIpLCBcIk5BVFMgdHJhbnNwb3J0IHBvcnQgYXNzaWdubWVudFwiKVxuICAgIC8vIHdzU2VydmljZS5jb25uZWN0aW9ucy5hbGxvd0Zyb20obmF0c1NlcnZpY2UsIGVjMi5Qb3J0LnRjcCg0MjIyKSwgXCJOQVRTIHRyYW5zcG9ydCBwb3J0IGFzc2lnbm1lbnRcIilcbiAgICAvLyB3c1NlcnZpY2Uuc2VydmljZS5jb25uZWN0aW9ucy5hbGxvd0Zyb20od3NTZXJ2aWNlLmxvYWRCYWxhbmNlciwgZWMyLlBvcnQudGNwKDgwKSlcbiAgICAvLyBjb25zdCBzc2xMaXN0ZW5lciA9IHdzc2VydmljZS5sb2FkQmFsYW5jZXIuYWRkTGlzdGVuZXIoXCJTU0xcIiwge1xuICAgIC8vICAgcG9ydDogNDQzLFxuICAgIC8vICAgY2VydGlmaWNhdGVzOiBbdGhpcy5wcm9wcy5jZXJ0aWZpY2F0ZUhhcnZlc3RTdWJkb21haW4sIHRoaXMucHJvcHMuY2VydGlmaWNhdGVSb290U3ViZG9tYWluXSxcbiAgICAvLyAgIHByb3RvY29sOiBBcHBsaWNhdGlvblByb3RvY29sLkhUVFBTXG4gICAgLy8gfSlcblxuICAgIC8vIGNvbnN0IGNuYW1lUmVjb3JkID0gbmV3IENuYW1lUmVjb3JkKHRoaXMsIFwiQ2x1c3RlckNuYW1lXCIsIHtcbiAgICAvLyAgIHpvbmU6IHN1YlpvbmUsXG4gICAgLy8gICByZWNvcmROYW1lOiBcIndzXCJcbiAgICAvLyB9KVxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICAgIGNvbnN0IGluc3RydW1lbnRJbmZvVGFza2RlZiA9IG5ldyBGYXJnYXRlVGFza0RlZmluaXRpb24odGhpcywgXCJJbnN0cnVtZW50SW5mb1Rhc2tEZWZcIiwge1xuICAgICAgbWVtb3J5TGltaXRNaUI6IDIwNDgsIC8vIERlZmF1bHQgaXMgNTEyXG4gICAgICBjcHU6IDUxMiAvLyBEZWZhdWx0IGlzIDI1NlxuICAgIH0pXG5cbiAgICBpbnN0cnVtZW50SW5mb1Rhc2tkZWYuYWRkVG9UYXNrUm9sZVBvbGljeShzZWNyZXRzTWFuYWdlclBvbGljeSlcblxuICAgIGNvbnN0IGluc3RydW1lbnRJbmZvQ29udGFpbmVyID0gaW5zdHJ1bWVudEluZm9UYXNrZGVmLmFkZENvbnRhaW5lcihcIkluc3RydW1lbnRJbmZvQ29udGFpbmVyXCIsIHtcbiAgICAgIGltYWdlLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgU0VBUkNIX0RPTUFJTjogbmFtZXNwYWNlLm5hbWVzcGFjZU5hbWUsXG4gICAgICAgIFNFUlZJQ0VfTkFNRVNQQUNFOiBzZXJ2aWNlTmFtZXNwYWNlLFxuICAgICAgICBUUkFOU1BPUlRFUjogXCJuYXRzOi8vbmF0cy52b2xhdGlsaXR5LmxvY2FsOjQyMjJcIixcbiAgICAgICAgU0VSVklDRURJUjogXCJkaXN0L3NlcnZpY2VzXCIsXG4gICAgICAgIFNFUlZJQ0VTOiBcImluc3RydW1lbnRfaW5mby5zZXJ2aWNlLmpzXCIsXG4gICAgICAgIE5BTUVTUEFDRTogc2VydmljZU5hbWVzcGFjZVxuICAgICAgICAvLyBSRURJU19IT1NUOiByZWRpc0NsdXN0ZXIuYXR0clJlZGlzRW5kcG9pbnRBZGRyZXNzLFxuICAgICAgICAvLyBSRURJU19QT1JUOiByZWRpc0NsdXN0ZXIuYXR0clJlZGlzRW5kcG9pbnRQb3J0XG4gICAgICB9LFxuICAgICAgbG9nZ2luZzogaW5zdHJ1bWVudEluZm9Mb2dEcml2ZXJcbiAgICB9KVxuXG4gICAgLy8gLy8gQ3JlYXRlIGEgc3RhbmRhcmQgRmFyZ2F0ZSBzZXJ2aWNlXG4gICAgY29uc3QgaW5zdHJ1bWVudEluZm9TZXJ2aWNlID0gbmV3IEZhcmdhdGVTZXJ2aWNlKHRoaXMsIFwiSW5zdHJ1bWVudEluZm9TZXJ2aWNlXCIsIHtcbiAgICAgIGNsdXN0ZXIsIC8vIFJlcXVpcmVkXG4gICAgICBkZXNpcmVkQ291bnQ6IDAsIC8vIERlZmF1bHQgaXMgMVxuICAgICAgc2VydmljZU5hbWU6IFwiaW5zdHJ1bWVudEluZm9cIixcbiAgICAgIHRhc2tEZWZpbml0aW9uOiBpbnN0cnVtZW50SW5mb1Rhc2tkZWYsXG4gICAgICBzZWN1cml0eUdyb3VwczogW3ZnU2VydmljZXNTZWN1cml0eUdyb3VwXSxcbiAgICAgIGNsb3VkTWFwT3B0aW9uczogeyBuYW1lOiBcImluc3RydW1lbnRJbmZvXCIsIGNsb3VkTWFwTmFtZXNwYWNlOiBuYW1lc3BhY2UgfVxuICAgIH0pXG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgICBjb25zdCByYXRlVGFza2RlZiA9IG5ldyBGYXJnYXRlVGFza0RlZmluaXRpb24odGhpcywgXCJSYXRlVGFza0RlZlwiLCB7XG4gICAgICBtZW1vcnlMaW1pdE1pQjogMTAyNCwgLy8gRGVmYXVsdCBpcyA1MTJcbiAgICAgIGNwdTogNTEyIC8vIERlZmF1bHQgaXMgMjU2XG4gICAgfSlcblxuICAgIHJhdGVUYXNrZGVmLmFkZFRvVGFza1JvbGVQb2xpY3koc2VjcmV0c01hbmFnZXJQb2xpY3kpXG5cbiAgICBjb25zdCByYXRlQ29udGFpbmVyID0gcmF0ZVRhc2tkZWYuYWRkQ29udGFpbmVyKFwiUmF0ZUNvbnRhaW5lclwiLCB7XG4gICAgICBpbWFnZSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFNFQVJDSF9ET01BSU46IG5hbWVzcGFjZS5uYW1lc3BhY2VOYW1lLFxuICAgICAgICBTRVJWSUNFX05BTUVTUEFDRTogc2VydmljZU5hbWVzcGFjZSxcbiAgICAgICAgVFJBTlNQT1JURVI6IFwibmF0czovL25hdHMudm9sYXRpbGl0eS5sb2NhbDo0MjIyXCIsXG4gICAgICAgIFNFUlZJQ0VESVI6IFwiZGlzdC9zZXJ2aWNlc1wiLFxuICAgICAgICBTRVJWSUNFUzogXCJyYXRlLnNlcnZpY2UuanNcIixcbiAgICAgICAgTkFNRVNQQUNFOiBzZXJ2aWNlTmFtZXNwYWNlLFxuICAgICAgICBSQVRFX1JJU0tMRVNTX1JBVEVfQ1JPTlRJTUU6IFwiKi8xICogKiAqICpcIixcbiAgICAgICAgUkFURV9SSVNLTEVTU19SQVRFX1NPVVJDRTogXCJhYXZlXCIsXG4gICAgICAgIFJBVEVfU0tJUF9QRVJTSVNUOiBcInRydWVcIlxuICAgICAgfSxcbiAgICAgIGxvZ2dpbmc6IHJhdGVMb2dEcml2ZXJcbiAgICB9KVxuXG4gICAgLy8gLy8gQ3JlYXRlIGEgc3RhbmRhcmQgRmFyZ2F0ZSBzZXJ2aWNlXG4gICAgY29uc3QgcmF0ZVNlcnZpY2UgPSBuZXcgRmFyZ2F0ZVNlcnZpY2UodGhpcywgXCJSYXRlU2VydmljZVwiLCB7XG4gICAgICBjbHVzdGVyLCAvLyBSZXF1aXJlZFxuICAgICAgZGVzaXJlZENvdW50OiAwLCAvLyBEZWZhdWx0IGlzIDFcbiAgICAgIHNlcnZpY2VOYW1lOiBcInJhdGVcIixcbiAgICAgIHRhc2tEZWZpbml0aW9uOiByYXRlVGFza2RlZixcbiAgICAgIHNlY3VyaXR5R3JvdXBzOiBbdmdTZXJ2aWNlc1NlY3VyaXR5R3JvdXBdLFxuICAgICAgY2xvdWRNYXBPcHRpb25zOiB7IG5hbWU6IFwicmF0ZVwiLCBjbG91ZE1hcE5hbWVzcGFjZTogbmFtZXNwYWNlIH1cbiAgICB9KVxuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gICAgY29uc3QgaW5nZXN0VGFza2RlZiA9IG5ldyBGYXJnYXRlVGFza0RlZmluaXRpb24odGhpcywgXCJJbmdlc3RUYXNrRGVmXCIsIHtcbiAgICAgIG1lbW9yeUxpbWl0TWlCOiAyMDQ4LCAvLyBEZWZhdWx0IGlzIDUxMlxuICAgICAgY3B1OiA1MTIgLy8gRGVmYXVsdCBpcyAyNTZcbiAgICB9KVxuXG4gICAgaW5nZXN0VGFza2RlZi5hZGRUb1Rhc2tSb2xlUG9saWN5KHNlY3JldHNNYW5hZ2VyUG9saWN5KVxuXG4gICAgY29uc3QgaW5nZXN0Q29udGFpbmVyID0gaW5nZXN0VGFza2RlZi5hZGRDb250YWluZXIoXCJJbmdlc3RDb250YWluZXJcIiwge1xuICAgICAgaW1hZ2UsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBTRUFSQ0hfRE9NQUlOOiBuYW1lc3BhY2UubmFtZXNwYWNlTmFtZSxcbiAgICAgICAgU0VSVklDRV9OQU1FU1BBQ0U6IHNlcnZpY2VOYW1lc3BhY2UsXG4gICAgICAgIFRSQU5TUE9SVEVSOiBcIm5hdHM6Ly9uYXRzLnZvbGF0aWxpdHkubG9jYWw6NDIyMlwiLFxuICAgICAgICBTRVJWSUNFRElSOiBcImRpc3Qvc2VydmljZXNcIixcbiAgICAgICAgU0VSVklDRVM6IFwiaW5nZXN0LnNlcnZpY2UuanNcIixcbiAgICAgICAgTkFNRVNQQUNFOiBzZXJ2aWNlTmFtZXNwYWNlLFxuICAgICAgICAvLyBSRURJU19IT1NUOiByZWRpc0NsdXN0ZXIuYXR0clJlZGlzRW5kcG9pbnRBZGRyZXNzLFxuICAgICAgICAvLyBSRURJU19QT1JUOiByZWRpc0NsdXN0ZXIuYXR0clJlZGlzRW5kcG9pbnRQb3J0LFxuICAgICAgICBJTkdFU1RfSU5URVJWQUw6IFwiMTRkXCIsXG4gICAgICAgIElOR0VTVF9FWFBJUllfVFlQRTogXCJGcmlkYXlUMDg6MDA6MDBaXCJcbiAgICAgIH0sXG4gICAgICAvLyBzZWNyZXRzOiB7fSxcbiAgICAgIGxvZ2dpbmc6IGluZ2VzdExvZ0RyaXZlclxuICAgIH0pXG5cbiAgICAvLyAvLyBDcmVhdGUgYSBzdGFuZGFyZCBGYXJnYXRlIHNlcnZpY2VcbiAgICBjb25zdCBpbmdlc3RTZXJ2aWNlID0gbmV3IEZhcmdhdGVTZXJ2aWNlKHRoaXMsIFwiSW5nZXN0U2VydmljZVwiLCB7XG4gICAgICBjbHVzdGVyLCAvLyBSZXF1aXJlZFxuICAgICAgZGVzaXJlZENvdW50OiAwLCAvLyBEZWZhdWx0IGlzIDFcbiAgICAgIHNlcnZpY2VOYW1lOiBcImluZ2VzdFwiLFxuICAgICAgdGFza0RlZmluaXRpb246IGluZ2VzdFRhc2tkZWYsXG4gICAgICBzZWN1cml0eUdyb3VwczogW3ZnU2VydmljZXNTZWN1cml0eUdyb3VwXSxcbiAgICAgIGNsb3VkTWFwT3B0aW9uczogeyBuYW1lOiBcImluZ2VzdFwiLCBjbG91ZE1hcE5hbWVzcGFjZTogbmFtZXNwYWNlIH1cbiAgICB9KVxuXG4gICAgaW5nZXN0U2VydmljZS5ub2RlLmFkZERlcGVuZGVuY3koaW5zdHJ1bWVudEluZm9TZXJ2aWNlKVxuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgICBjb25zdCBpbmRleFRhc2tkZWYgPSBuZXcgRmFyZ2F0ZVRhc2tEZWZpbml0aW9uKHRoaXMsIFwiSW5kZXhUYXNrRGVmXCIsIHtcbiAgICAgIG1lbW9yeUxpbWl0TWlCOiAyMDQ4LCAvLyBEZWZhdWx0IGlzIDUxMlxuICAgICAgY3B1OiA1MTIgLy8gRGVmYXVsdCBpcyAyNTZcbiAgICB9KVxuXG4gICAgY29uc3QgaW5kZXhDb250YWluZXIgPSBpbmRleFRhc2tkZWYuYWRkQ29udGFpbmVyKFwiSW5kZXhDb250YWluZXJcIiwge1xuICAgICAgaW1hZ2UsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBTRUFSQ0hfRE9NQUlOOiBuYW1lc3BhY2UubmFtZXNwYWNlTmFtZSxcbiAgICAgICAgU0VSVklDRV9OQU1FU1BBQ0U6IHNlcnZpY2VOYW1lc3BhY2UsXG4gICAgICAgIFRSQU5TUE9SVEVSOiBcIm5hdHM6Ly9uYXRzLnZvbGF0aWxpdHkubG9jYWw6NDIyMlwiLFxuICAgICAgICBTRVJWSUNFRElSOiBcImRpc3Qvc2VydmljZXNcIixcbiAgICAgICAgU0VSVklDRVM6IFwiaW5kZXguc2VydmljZS5qc1wiLFxuICAgICAgICBOQU1FU1BBQ0U6IHNlcnZpY2VOYW1lc3BhY2UsXG4gICAgICAgIElOREVYX1NLSVBfUEVSU0lTVDogXCJ0cnVlXCJcbiAgICAgICAgLy8gUkVESVNfSE9TVDogcmVkaXNDbHVzdGVyLmF0dHJSZWRpc0VuZHBvaW50QWRkcmVzcyxcbiAgICAgICAgLy8gUkVESVNfUE9SVDogcmVkaXNDbHVzdGVyLmF0dHJSZWRpc0VuZHBvaW50UG9ydFxuICAgICAgfSxcbiAgICAgIGxvZ2dpbmc6IGluZGV4TG9nRHJpdmVyXG4gICAgfSlcblxuICAgIC8vIC8vIENyZWF0ZSBhIHN0YW5kYXJkIEZhcmdhdGUgc2VydmljZVxuICAgIGNvbnN0IGluZGV4U2VydmljZSA9IG5ldyBGYXJnYXRlU2VydmljZSh0aGlzLCBcIkluZGV4U2VydmljZVwiLCB7XG4gICAgICBjbHVzdGVyLCAvLyBSZXF1aXJlZFxuICAgICAgZGVzaXJlZENvdW50OiAwLCAvLyBEZWZhdWx0IGlzIDFcbiAgICAgIHNlcnZpY2VOYW1lOiBcImluZGV4XCIsXG4gICAgICB0YXNrRGVmaW5pdGlvbjogaW5kZXhUYXNrZGVmLFxuICAgICAgc2VjdXJpdHlHcm91cHM6IFt2Z1NlcnZpY2VzU2VjdXJpdHlHcm91cF0sXG4gICAgICBjbG91ZE1hcE9wdGlvbnM6IHsgbmFtZTogXCJpbmRleFwiLCBjbG91ZE1hcE5hbWVzcGFjZTogbmFtZXNwYWNlIH1cbiAgICB9KVxuXG4gICAgaW5kZXhTZXJ2aWNlLm5vZGUuYWRkRGVwZW5kZW5jeShpbmdlc3RTZXJ2aWNlKVxuICAgIGluZGV4U2VydmljZS5ub2RlLmFkZERlcGVuZGVuY3kocmF0ZVNlcnZpY2UpXG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgICBjb25zdCBkYXRhUGlwZWxpbmVUYXNrZGVmID0gbmV3IEZhcmdhdGVUYXNrRGVmaW5pdGlvbih0aGlzLCBcIkRhdGFQaXBlbGluZVRhc2tEZWZcIiwge1xuICAgICAgbWVtb3J5TGltaXRNaUI6IDE2Mzg0LCAvLyBEZWZhdWx0IGlzIDUxMlxuICAgICAgY3B1OiA0MDk2IC8vIERlZmF1bHQgaXMgMjU2XG4gICAgfSlcblxuICAgIGNvbnN0IGRhdGFQaXBlbGluZUNvbnRhaW5lciA9IGRhdGFQaXBlbGluZVRhc2tkZWYuYWRkQ29udGFpbmVyKFwiRGF0YVBpcGVsaW5lQ29udGFpbmVyXCIsIHtcbiAgICAgIGltYWdlLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgU0VSVklDRV9OQU1FU1BBQ0U6IHNlcnZpY2VOYW1lc3BhY2UsXG4gICAgICAgIFRSQU5TUE9SVEVSOiBcIm5hdHM6Ly9uYXRzLnZvbGF0aWxpdHkubG9jYWw6NDIyMlwiLFxuICAgICAgICBTRVJWSUNFRElSOiBcImRpc3Qvc2VydmljZXNcIixcbiAgICAgICAgU0VSVklDRVM6IFwicmF0ZS5zZXJ2aWNlLmpzLGluZGV4LnNlcnZpY2UuanMsaW5nZXN0LnNlcnZpY2UuanMsaW5zdHJ1bWVudF9pbmZvLnNlcnZpY2UuanNcIixcbiAgICAgICAgUkFURV9SSVNLTEVTU19SQVRFX0NST05USU1FOiBcIiovMSAqICogKiAqXCIsXG4gICAgICAgIFJBVEVfUklTS0xFU1NfUkFURV9TT1VSQ0U6IFwiYWF2ZVwiLFxuICAgICAgICBSQVRFX1NLSVBfUEVSU0lTVDogXCJ0cnVlXCIsXG4gICAgICAgIElOREVYX1NLSVBfUEVSU0lTVDogXCJ0cnVlXCIsXG4gICAgICAgIElOR0VTVF9JTlRFUlZBTDogXCIxNGRcIixcbiAgICAgICAgSU5HRVNUX0VYUElSWV9UWVBFOiBcIkZyaWRheVQwODowMDowMFpcIixcbiAgICAgICAgTkFNRVNQQUNFOiBzZXJ2aWNlTmFtZXNwYWNlLFxuICAgICAgICBORVdfUkVMSUNfTElDRU5TRV9LRVk6IFwiYmEyZTcyZmQxMDVmZDE1YzRmMTVmYTE5YzhjODYzNzBGRkZGTlJBTFwiLFxuICAgICAgICBORVdfUkVMSUNfRElTVFJJQlVURURfVFJBQ0lOR19FTkFCTEVEOiBcInRydWVcIixcbiAgICAgICAgTkVXX1JFTElDX0FQUF9OQU1FOiBcInZvbGF0aWxpdHktc2VydmljZXNcIixcbiAgICAgICAgTkVXX1JFTElDX0xPR19MRVZFTDogXCJpbmZvXCJcbiAgICAgIH0sXG4gICAgICBsb2dnaW5nOiBkYXRhUGlwZWxpbmVMb2dEcml2ZXJcbiAgICB9KVxuXG4gICAgLy8gLy8gQ3JlYXRlIGEgc3RhbmRhcmQgRmFyZ2F0ZSBzZXJ2aWNlXG4gICAgY29uc3QgZGF0YVBpcGVsaW5lU2VydmljZSA9IG5ldyBGYXJnYXRlU2VydmljZSh0aGlzLCBcIkRhdGFQaXBlbGluZVNlcnZpY2VcIiwge1xuICAgICAgY2x1c3RlciwgLy8gUmVxdWlyZWRcbiAgICAgIGRlc2lyZWRDb3VudDogMSwgLy8gRGVmYXVsdCBpcyAxXG4gICAgICBzZXJ2aWNlTmFtZTogXCJkYXRhcGlwZWxpbmVcIixcbiAgICAgIHRhc2tEZWZpbml0aW9uOiBkYXRhUGlwZWxpbmVUYXNrZGVmLFxuICAgICAgc2VjdXJpdHlHcm91cHM6IFt2Z1NlcnZpY2VzU2VjdXJpdHlHcm91cF0sXG4gICAgICBjbG91ZE1hcE9wdGlvbnM6IHsgbmFtZTogXCJkYXRhcGlwZWxpbmVcIiwgY2xvdWRNYXBOYW1lc3BhY2U6IG5hbWVzcGFjZSB9XG4gICAgfSlcblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICAgIGNvbnN0IGNyb25UYXNrZGVmID0gbmV3IEZhcmdhdGVUYXNrRGVmaW5pdGlvbih0aGlzLCBcIkNyb25UYXNrRGVmXCIsIHtcbiAgICAgIG1lbW9yeUxpbWl0TWlCOiAxMDI0LCAvLyBEZWZhdWx0IGlzIDUxMlxuICAgICAgY3B1OiA1MTIgLy8gRGVmYXVsdCBpcyAyNTZcbiAgICB9KVxuXG4gICAgY29uc3QgY3JvbkNvbnRhaW5lciA9IGNyb25UYXNrZGVmLmFkZENvbnRhaW5lcihcIkNyb25Db250YWluZXJcIiwge1xuICAgICAgaW1hZ2UsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBTRUFSQ0hfRE9NQUlOOiBuYW1lc3BhY2UubmFtZXNwYWNlTmFtZSxcbiAgICAgICAgU0VSVklDRV9OQU1FU1BBQ0U6IHNlcnZpY2VOYW1lc3BhY2UsXG4gICAgICAgIFRSQU5TUE9SVEVSOiBcIm5hdHM6Ly9uYXRzLnZvbGF0aWxpdHkubG9jYWw6NDIyMlwiLFxuICAgICAgICBTRVJWSUNFRElSOiBcImRpc3Qvc2VydmljZXNcIixcbiAgICAgICAgU0VSVklDRVM6IFwiY3Jvbi5zZXJ2aWNlLmpzXCIsXG4gICAgICAgIE5BTUVTUEFDRTogc2VydmljZU5hbWVzcGFjZSxcbiAgICAgICAgQ1JPTl9NRklWX1VQREFURV9DUk9OVElNRTogXCIqLzEgKiAqICogKlwiXG4gICAgICB9LFxuICAgICAgbG9nZ2luZzogY3JvbkxvZ0RyaXZlclxuICAgIH0pXG5cbiAgICAvLyAvLyBDcmVhdGUgYSBzdGFuZGFyZCBGYXJnYXRlIHNlcnZpY2VcbiAgICBjb25zdCBjcm9uU2VydmljZSA9IG5ldyBGYXJnYXRlU2VydmljZSh0aGlzLCBcIkNyb25TZXJ2aWNlXCIsIHtcbiAgICAgIGNsdXN0ZXIsIC8vIFJlcXVpcmVkXG4gICAgICBkZXNpcmVkQ291bnQ6IDEsIC8vIERlZmF1bHQgaXMgMVxuICAgICAgc2VydmljZU5hbWU6IFwiY3JvblwiLFxuICAgICAgdGFza0RlZmluaXRpb246IGNyb25UYXNrZGVmLFxuICAgICAgc2VjdXJpdHlHcm91cHM6IFt2Z1NlcnZpY2VzU2VjdXJpdHlHcm91cF0sXG4gICAgICBjbG91ZE1hcE9wdGlvbnM6IHsgbmFtZTogXCJjcm9uXCIsIGNsb3VkTWFwTmFtZXNwYWNlOiBuYW1lc3BhY2UgfVxuICAgIH0pXG5cbiAgICBjcm9uU2VydmljZS5ub2RlLmFkZERlcGVuZGVuY3koaW5kZXhTZXJ2aWNlKVxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICAgIC8vIGNvbnN0IGRidGFza2RlZiA9IG5ldyBGYXJnYXRlVGFza0RlZmluaXRpb24odGhpcywgY29tcG9uZW50TmFtZShcImRiLXRhc2tkZWZcIiksIHtcbiAgICAvLyAgIG1lbW9yeUxpbWl0TWlCOiAyMDQ4LCAvLyBEZWZhdWx0IGlzIDUxMlxuICAgIC8vICAgY3B1OiA1MTIgLy8gRGVmYXVsdCBpcyAyNTZcbiAgICAvLyB9KVxuXG4gICAgLy8gY29uc3QgZGJjb250YWluZXIgPSBkYnRhc2tkZWYuYWRkQ29udGFpbmVyKFwiZGItY29udGFpbmVyXCIsIHtcbiAgICAvLyAgIGltYWdlOiBDb250YWluZXJJbWFnZS5mcm9tUmVnaXN0cnkoXCJwb3N0Z3JlczoxMi4xMFwiKVxuICAgIC8vIH0pXG5cbiAgICAvLyAvLyBDcmVhdGUgYSBzdGFuZGFyZCBGYXJnYXRlIHNlcnZpY2VcbiAgICAvLyBjb25zdCBkYnNlcnZpY2UgPSBuZXcgRmFyZ2F0ZVNlcnZpY2UodGhpcywgY29tcG9uZW50TmFtZShcImRiLXNlcnZpY2VcIiksIHtcbiAgICAvLyAgIGNsdXN0ZXIsIC8vIFJlcXVpcmVkXG4gICAgLy8gICBzZXJ2aWNlTmFtZTogXCJkYlwiLFxuICAgIC8vICAgdGFza0RlZmluaXRpb246IGRidGFza2RlZixcbiAgICAvLyAgIGNsb3VkTWFwT3B0aW9uczogeyBuYW1lOiBcImRiXCIsIGNsb3VkTWFwTmFtZXNwYWNlOiBuYW1lc3BhY2UgfVxuICAgIC8vIH0pXG5cbiAgICAvLyBkYnNlcnZpY2UuY29ubmVjdGlvbnMuYWxsb3dGcm9tKGFwcHNlcnZlcnNlcnZpY2UsIGVjMi5Qb3J0LnRjcCg1NDMyKSlcblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cbiAgICAvLyBjb25zdCBmaWxlU3lzdGVtID0gbmV3IEZpbGVTeXN0ZW0odGhpcywgXCJFZnNcIiwge1xuICAgIC8vICAgdnBjLFxuICAgIC8vICAgcGVyZm9ybWFuY2VNb2RlOiBQZXJmb3JtYW5jZU1vZGUuR0VORVJBTF9QVVJQT1NFLFxuICAgIC8vICAgdnBjU3VibmV0czoge1xuICAgIC8vICAgICBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QVUJMSUMsXG4gICAgLy8gICAgIG9uZVBlckF6OiB0cnVlLFxuICAgIC8vICAgICBhdmFpbGFiaWxpdHlab25lczogW3ZwYy5hdmFpbGFiaWxpdHlab25lc1swXV1cbiAgICAvLyAgIH1cbiAgICAvLyB9KVxuXG4gICAgLy8gY29uc3QgYWNjZXNzUG9pbnQgPSBuZXcgQWNjZXNzUG9pbnQodGhpcywgXCJBY2Nlc3NQb2ludFwiLCB7XG4gICAgLy8gICBmaWxlU3lzdGVtXG4gICAgLy8gfSlcblxuICAgIC8vIGNvbnN0IHJlZGlzc2VydmVydGFza2RlZiA9IG5ldyBGYXJnYXRlVGFza0RlZmluaXRpb24odGhpcywgY29tcG9uZW50TmFtZShcInJlZGlzLXNlcnZlci10YXNrZGVmXCIpLCB7XG4gICAgLy8gICBtZW1vcnlMaW1pdE1pQjogMjA0OCwgLy8gRGVmYXVsdCBpcyA1MTJcbiAgICAvLyAgIGNwdTogNTEyIC8vIERlZmF1bHQgaXMgMjU2XG4gICAgLy8gfSlcblxuICAgIC8vIGNvbnN0IHZvbHVtZU5hbWUgPSBcImVmcy1yZWRpcy1kYXRhXCJcblxuICAgIC8vIHJlZGlzc2VydmVydGFza2RlZi5hZGRWb2x1bWUoe1xuICAgIC8vICAgbmFtZTogdm9sdW1lTmFtZSxcbiAgICAvLyAgIGVmc1ZvbHVtZUNvbmZpZ3VyYXRpb246IHtcbiAgICAvLyAgICAgZmlsZVN5c3RlbUlkOiBmaWxlU3lzdGVtLmZpbGVTeXN0ZW1JZCxcbiAgICAvLyAgICAgdHJhbnNpdEVuY3J5cHRpb246IFwiRU5BQkxFRFwiLFxuICAgIC8vICAgICBhdXRob3JpemF0aW9uQ29uZmlnOiB7XG4gICAgLy8gICAgICAgYWNjZXNzUG9pbnRJZDogYWNjZXNzUG9pbnQuYWNjZXNzUG9pbnRJZCxcbiAgICAvLyAgICAgICBpYW06IFwiRU5BQkxFRFwiXG4gICAgLy8gICAgIH1cbiAgICAvLyAgIH1cbiAgICAvLyB9KVxuXG4gICAgLy8gY29uc3QgcmVkaXNzZXJ2ZXJjb250YWluZXIgPSByZWRpc3NlcnZlcnRhc2tkZWYuYWRkQ29udGFpbmVyKFwicmVkaXMtc2VydmVyXCIsIHtcbiAgICAvLyAgIGltYWdlOiBDb250YWluZXJJbWFnZS5mcm9tUmVnaXN0cnkoXCJyZWRpczo2LjIuNlwiKVxuICAgIC8vIH0pXG5cbiAgICAvLyByZWRpc3NlcnZlcmNvbnRhaW5lci5hZGRNb3VudFBvaW50cyh7XG4gICAgLy8gICBjb250YWluZXJQYXRoOiBcIi9tb3VudC9kYXRhXCIsXG4gICAgLy8gICBzb3VyY2VWb2x1bWU6IHZvbHVtZU5hbWUsXG4gICAgLy8gICByZWFkT25seTogZmFsc2VcbiAgICAvLyB9KVxuXG4gICAgLy8gLy8gQ3JlYXRlIGEgc3RhbmRhcmQgRmFyZ2F0ZSBzZXJ2aWNlXG4gICAgLy8gY29uc3QgcmVkaXNzZXJ2ZXJzZXJ2aWNlID0gbmV3IEZhcmdhdGVTZXJ2aWNlKHRoaXMsIGNvbXBvbmVudE5hbWUoXCJyZWRpcy1zZXJ2ZXItc2VydmljZVwiKSwge1xuICAgIC8vICAgY2x1c3RlciwgLy8gUmVxdWlyZWRcbiAgICAvLyAgIHNlcnZpY2VOYW1lOiBcInJlZGlzLXNlcnZlclwiLFxuICAgIC8vICAgdGFza0RlZmluaXRpb246IHJlZGlzc2VydmVydGFza2RlZixcbiAgICAvLyAgIGNsb3VkTWFwT3B0aW9uczogeyBuYW1lOiBcInJlZGlzLXNlcnZlclwiLCBjbG91ZE1hcE5hbWVzcGFjZTogbmFtZXNwYWNlIH1cbiAgICAvLyB9KVxuXG4gICAgLy8gcmVkaXNzZXJ2ZXJ0YXNrZGVmLmFkZFRvVGFza1JvbGVQb2xpY3koXG4gICAgLy8gICBuZXcgUG9saWN5U3RhdGVtZW50KHtcbiAgICAvLyAgICAgYWN0aW9uczogW1xuICAgIC8vICAgICAgIFwiZWxhc3RpY2ZpbGVzeXN0ZW06Q2xpZW50Um9vdEFjY2Vzc1wiLFxuICAgIC8vICAgICAgIFwiZWxhc3RpY2ZpbGVzeXN0ZW06Q2xpZW50V3JpdGVcIixcbiAgICAvLyAgICAgICBcImVsYXN0aWNmaWxlc3lzdGVtOkNsaWVudE1vdW50XCIsXG4gICAgLy8gICAgICAgXCJlbGFzdGljZmlsZXN5c3RlbTpEZXNjcmliZU1vdW50VGFyZ2V0c1wiXG4gICAgLy8gICAgIF0sXG4gICAgLy8gICAgIHJlc291cmNlczogW1xuICAgIC8vICAgICAgIGBhcm46YXdzOmVsYXN0aWNmaWxlc3lzdGVtOiR7cHJvcHM/LmVudj8ucmVnaW9uID8/IFwidXMtZWFzdC0yXCJ9OiR7cHJvcHM/LmVudj8uYWNjb3VudCA/PyBcIlwifTpmaWxlLXN5c3RlbS8ke1xuICAgIC8vICAgICAgICAgZmlsZVN5c3RlbS5maWxlU3lzdGVtSWRcbiAgICAvLyAgICAgICB9YFxuICAgIC8vICAgICBdXG4gICAgLy8gICB9KVxuICAgIC8vIClcblxuICAgIC8vIHJlZGlzc2VydmVydGFza2RlZi5hZGRUb1Rhc2tSb2xlUG9saWN5KFxuICAgIC8vICAgbmV3IFBvbGljeVN0YXRlbWVudCh7XG4gICAgLy8gICAgIGFjdGlvbnM6IFtcImVjMjpEZXNjcmliZUF2YWlsYWJpbGl0eVpvbmVzXCJdLFxuICAgIC8vICAgICByZXNvdXJjZXM6IFtcIipcIl1cbiAgICAvLyAgIH0pXG4gICAgLy8gKVxuXG4gICAgLy8gcmVkaXNzZXJ2ZXJzZXJ2aWNlLmNvbm5lY3Rpb25zLmFsbG93RnJvbShhcHBzZXJ2ZXJzZXJ2aWNlLCBlYzIuUG9ydC50Y3AoNjM3OSkpXG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgICAvLyBjb25zdCBpbmdlc3RUYXNrZGVmID0gbmV3IEZhcmdhdGVUYXNrRGVmaW5pdGlvbih0aGlzLCBcIkluZ2VzdFRhc2tkZWZcIiwge1xuICAgIC8vICAgbWVtb3J5TGltaXRNaUI6IDEwMjQsIC8vIERlZmF1bHQgaXMgNTEyXG4gICAgLy8gICBjcHU6IDUxMiAvLyBEZWZhdWx0IGlzIDI1NlxuICAgIC8vIH0pXG5cbiAgICAvLyBjb25zdCBpbmdlc3RMb2dHcm91cCA9IG5ldyBMb2dHcm91cCh0aGlzLCBcIkluZ2VzdFNlcnZpY2VMb2dHcm91cFwiLCB7XG4gICAgLy8gICBsb2dHcm91cE5hbWU6IFwiL2Vjcy9OQVRTU2VydmljZVwiLFxuICAgIC8vICAgcmVtb3ZhbFBvbGljeTogUmVtb3ZhbFBvbGljeS5SRVRBSU4sXG4gICAgLy8gICByZXRlbnRpb246IFJldGVudGlvbkRheXMuT05FX1dFRUtcbiAgICAvLyB9KVxuXG4gICAgLy8gY29uc3QgaW5nZXN0TG9nRHJpdmVyID0gbmV3IEF3c0xvZ0RyaXZlcih7XG4gICAgLy8gICBsb2dHcm91cDogc2VydmljZUxvZ0dyb3VwLFxuICAgIC8vICAgc3RyZWFtUHJlZml4OiBcIkluZ2VzdFNlcnZpY2VcIlxuICAgIC8vIH0pXG5cbiAgICAvLyBjb25zdCBpbmdlc3RDb250YWluZXIgPSBpbmdlc3RUYXNrZGVmLmFkZENvbnRhaW5lcihcIkluZ2VzdENvbnRhaW5lclwiLCB7XG4gICAgLy8gICBpbWFnZTogQ29udGFpbmVySW1hZ2UuZnJvbVJlZ2lzdHJ5KFwibmF0czoyLjcuMlwiKSxcbiAgICAvLyAgIGNvbW1hbmQ6IFtcIi1tXCIsIFwiODIyMlwiLCBcIi0tZGVidWdcIl0sXG4gICAgLy8gICBsb2dnaW5nOiBuYXRzTG9nRHJpdmVyXG4gICAgLy8gfSlcblxuICAgIC8vIC8vIENyZWF0ZSBhIHN0YW5kYXJkIEZhcmdhdGUgc2VydmljZVxuICAgIC8vIGNvbnN0IG5hdHNTZXJ2aWNlID0gbmV3IEZhcmdhdGVTZXJ2aWNlKHRoaXMsIFwiTmF0c1NlcnZpY2VcIiwge1xuICAgIC8vICAgY2x1c3RlciwgLy8gUmVxdWlyZWRcbiAgICAvLyAgIHNlcnZpY2VOYW1lOiBcIm5hdHNcIixcbiAgICAvLyAgIHRhc2tEZWZpbml0aW9uOiBuYXRzVGFza2RlZixcbiAgICAvLyAgIGNsb3VkTWFwT3B0aW9uczogeyBuYW1lOiBcIm5hdHNcIiwgY2xvdWRNYXBOYW1lc3BhY2U6IG5hbWVzcGFjZSB9XG4gICAgLy8gfSlcblxuICAgIC8vIG5hdHNTZXJ2aWNlLmNvbm5lY3Rpb25zLmFsbG93RnJvbSh3c1NlcnZpY2Uuc2VydmljZSwgZWMyLlBvcnQudGNwKDQyMjIpLCBcIk5BVFMgdHJhbnNwb3J0IHBvcnQgYXNzaWdubWVudFwiKVxuICAgIC8vIG5hdHNTZXJ2aWNlLmNvbm5lY3Rpb25zLmFsbG93RnJvbShcbiAgICAvLyAgIHdzU2VydmljZS5zZXJ2aWNlLFxuICAgIC8vICAgZWMyLlBvcnQudGNwKDgyMjIpLFxuICAgIC8vICAgXCJOQVRTIHRyYW5zcG9ydCBtYW5hZ2VtZW50IHBvcnQgYXNzaWdubWVudFwiXG4gICAgLy8gKVxuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gICAgY29uc3QgbmF0c1Rhc2tkZWYgPSBuZXcgRmFyZ2F0ZVRhc2tEZWZpbml0aW9uKHRoaXMsIFwiTmF0c1Rhc2tkZWZcIiwge1xuICAgICAgbWVtb3J5TGltaXRNaUI6IDEwMjQsIC8vIERlZmF1bHQgaXMgNTEyXG4gICAgICBjcHU6IDUxMiAvLyBEZWZhdWx0IGlzIDI1NlxuICAgIH0pXG5cbiAgICBjb25zdCBuYXRzTG9nR3JvdXAgPSBuZXcgTG9nR3JvdXAodGhpcywgXCJOQVRTU2VydmljZUxvZ0dyb3VwXCIsIHtcbiAgICAgIHJlbW92YWxQb2xpY3k6IFJlbW92YWxQb2xpY3kuUkVUQUlOLFxuICAgICAgcmV0ZW50aW9uOiBSZXRlbnRpb25EYXlzLk9ORV9XRUVLXG4gICAgfSlcblxuICAgIC8qIEZhcmdhdGUgb25seSBzdXBwb3J0IGF3c2xvZyBkcml2ZXIgKi9cbiAgICBjb25zdCBuYXRzTG9nRHJpdmVyID0gbmV3IEF3c0xvZ0RyaXZlcih7XG4gICAgICBsb2dHcm91cDogc2VydmljZUxvZ0dyb3VwLFxuICAgICAgc3RyZWFtUHJlZml4OiBcIk5BVFNTZXJ2aWNlXCJcbiAgICB9KVxuXG4gICAgY29uc3QgbmF0c0NvbnRhaW5lciA9IG5hdHNUYXNrZGVmLmFkZENvbnRhaW5lcihcIk5hdHNDb250YWluZXJcIiwge1xuICAgICAgaW1hZ2U6IENvbnRhaW5lckltYWdlLmZyb21SZWdpc3RyeShcIm5hdHM6Mi43LjJcIiksXG4gICAgICBjb21tYW5kOiBbXCItbVwiLCBcIjgyMjJcIiwgXCItLWRlYnVnXCJdLFxuICAgICAgbG9nZ2luZzogbmF0c0xvZ0RyaXZlclxuICAgIH0pXG5cbiAgICAvLyBDcmVhdGUgYSBzdGFuZGFyZCBGYXJnYXRlIHNlcnZpY2VcbiAgICBjb25zdCBuYXRzU2VydmljZSA9IG5ldyBGYXJnYXRlU2VydmljZSh0aGlzLCBcIk5hdHNTZXJ2aWNlXCIsIHtcbiAgICAgIGNsdXN0ZXIsIC8vIFJlcXVpcmVkXG4gICAgICBzZXJ2aWNlTmFtZTogXCJuYXRzXCIsXG4gICAgICB0YXNrRGVmaW5pdGlvbjogbmF0c1Rhc2tkZWYsXG4gICAgICBjbG91ZE1hcE9wdGlvbnM6IHsgbmFtZTogXCJuYXRzXCIsIGNsb3VkTWFwTmFtZXNwYWNlOiBuYW1lc3BhY2UgfVxuICAgIH0pXG5cbiAgICBuYXRzU2VydmljZS5jb25uZWN0aW9ucy5hbGxvd0Zyb20oZGF0YVBpcGVsaW5lU2VydmljZSwgZWMyLlBvcnQudGNwKDQyMjIpLCBcIk5BVFMgdHJhbnNwb3J0IHBvcnQgYXNzaWdubWVudFwiKVxuICAgIG5hdHNTZXJ2aWNlLmNvbm5lY3Rpb25zLmFsbG93RnJvbShjcm9uU2VydmljZSwgZWMyLlBvcnQudGNwKDQyMjIpLCBcIk5BVFMgdHJhbnNwb3J0IHBvcnQgYXNzaWdubWVudFwiKVxuICAgIG5hdHNTZXJ2aWNlLmNvbm5lY3Rpb25zLmFsbG93RnJvbShyYXRlU2VydmljZSwgZWMyLlBvcnQudGNwKDQyMjIpLCBcIk5BVFMgdHJhbnNwb3J0IHBvcnQgYXNzaWdubWVudFwiKVxuICAgIG5hdHNTZXJ2aWNlLmNvbm5lY3Rpb25zLmFsbG93RnJvbShpbnN0cnVtZW50SW5mb1NlcnZpY2UsIGVjMi5Qb3J0LnRjcCg0MjIyKSwgXCJOQVRTIHRyYW5zcG9ydCBwb3J0IGFzc2lnbm1lbnRcIilcbiAgICBuYXRzU2VydmljZS5jb25uZWN0aW9ucy5hbGxvd0Zyb20oaW5nZXN0U2VydmljZSwgZWMyLlBvcnQudGNwKDQyMjIpLCBcIk5BVFMgdHJhbnNwb3J0IHBvcnQgYXNzaWdubWVudFwiKVxuICAgIG5hdHNTZXJ2aWNlLmNvbm5lY3Rpb25zLmFsbG93RnJvbShpbmRleFNlcnZpY2UsIGVjMi5Qb3J0LnRjcCg0MjIyKSwgXCJOQVRTIHRyYW5zcG9ydCBwb3J0IGFzc2lnbm1lbnRcIilcbiAgICBuYXRzU2VydmljZS5jb25uZWN0aW9ucy5hbGxvd0Zyb20od3NTZXJ2aWNlLnNlcnZpY2UsIGVjMi5Qb3J0LnRjcCg0MjIyKSwgXCJOQVRTIHRyYW5zcG9ydCBwb3J0IGFzc2lnbm1lbnRcIilcbiAgICBuYXRzU2VydmljZS5jb25uZWN0aW9ucy5hbGxvd0Zyb20oXG4gICAgICB2Z1NlcnZpY2VzU2VjdXJpdHlHcm91cCxcbiAgICAgIGVjMi5Qb3J0LnRjcCg4MjIyKSxcbiAgICAgIFwiTkFUUyB0cmFuc3BvcnQgbWFuYWdlbWVudCBwb3J0IGFzc2lnbm1lbnRcIlxuICAgIClcblxuICAgIC8vIHllbGJhcHBzZXJ2ZXJzZXJ2aWNlLmNvbm5lY3Rpb25zLmFsbG93RnJvbSh5ZWxidWlzZXJ2aWNlLnNlcnZpY2UsIGVjMi5Qb3J0LnRjcCg0NTY3KSlcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgICAvLyBjb25zdCBxdWV1ZSA9IG5ldyBzcXMuUXVldWUodGhpcywgJ0Nka1F1ZXVlJywge1xuICAgIC8vICAgdmlzaWJpbGl0eVRpbWVvdXQ6IER1cmF0aW9uLnNlY29uZHMoMzAwKVxuICAgIC8vIH0pO1xuXG4gICAgLy8gY29uc3QgdG9waWMgPSBuZXcgc25zLlRvcGljKHRoaXMsICdDZGtUb3BpYycpO1xuXG4gICAgLy8gdG9waWMuYWRkU3Vic2NyaXB0aW9uKG5ldyBzdWJzLlNxc1N1YnNjcmlwdGlvbihxdWV1ZSkpO1xuICB9XG59XG4iXX0=