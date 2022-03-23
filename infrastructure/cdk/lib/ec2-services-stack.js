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
const serviceCfgMap = {
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
};
class VgServicesStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        var _a, _b, _c, _d;
        super(scope, id, props);
        const serviceNamespace = "volatility-services";
        const account = props.platformAccount;
        const cfg = serviceCfgMap[account];
        const vpcCfg = cfg.vpcConfig;
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
        const cluster = new aws_ecs_1.Cluster(this, "Cluster", {
            clusterName: "vg-services-cluster",
            containerInsights: true,
            vpc
        });
        const vgServicesSecurityGroup = new aws_ec2_1.SecurityGroup(this, "VgServicesSecurityGroup", {
            vpc,
            allowAllOutbound: true
        });
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
        wsContainer.addPortMappings({
            containerPort: 3000
        });
        // Create a load-balanced Fargate service and make it public
        const wsService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, "WSService", {
            cluster,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWMyLXNlcnZpY2VzLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZWMyLXNlcnZpY2VzLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZDQUF3RTtBQUN4RSw2Q0FBNkM7QUFDN0MsMkNBQTBDO0FBQzFDLGlEQUF3RDtBQUN4RCxpREFBZ0Q7QUFDaEQsaURBQWtIO0FBQ2xILDREQUEyRDtBQUMzRCx1RkFBaUU7QUFDakUsaURBQXFEO0FBQ3JELG1EQUE4RDtBQUM5RCxxRUFBb0U7QUFvQnBFLE1BQU0sYUFBYSxHQUFvRDtJQUNyRSxXQUFXLEVBQUU7UUFDWCxTQUFTLEVBQUU7WUFDVCxJQUFJLEVBQUUsYUFBYTtZQUNuQixXQUFXLEVBQUUsQ0FBQztZQUNkLE1BQU0sRUFBRSxDQUFDO1NBQ1Y7UUFDRCxPQUFPLEVBQUUsQ0FBQztLQUNYO0lBQ0QsYUFBYSxFQUFFO1FBQ2IsU0FBUyxFQUFFO1lBQ1QsSUFBSSxFQUFFLGFBQWE7WUFDbkIsV0FBVyxFQUFFLENBQUM7WUFDZCxNQUFNLEVBQUUsQ0FBQztTQUNWO1FBQ0QsT0FBTyxFQUFFLENBQUM7S0FDWDtJQUNELFlBQVksRUFBRTtRQUNaLFNBQVMsRUFBRTtZQUNULElBQUksRUFBRSxhQUFhO1lBQ25CLFdBQVcsRUFBRSxDQUFDO1lBQ2QsTUFBTSxFQUFFLENBQUM7U0FDVjtRQUNELE9BQU8sRUFBRSxDQUFDO0tBQ1g7Q0FDRixDQUFBO0FBRUQsTUFBYSxlQUFnQixTQUFRLG1CQUFLO0lBR3hDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBMkI7O1FBQ25FLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBRXZCLE1BQU0sZ0JBQWdCLEdBQUcscUJBQXFCLENBQUE7UUFDOUMsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQTtRQUNyQyxNQUFNLEdBQUcsR0FBRyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUE7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RztRQUV2RyxrREFBa0Q7UUFDbEQsNkNBQTZDO1FBQzdDLE1BQU07UUFFTixpREFBaUQ7UUFFakQsMERBQTBEO0lBQzVELENBQUM7Q0FDRjtBQWxwQkQsMENBa3BCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IER1cmF0aW9uLCBSZW1vdmFsUG9saWN5LCBTdGFjaywgU3RhY2tQcm9wcyB9IGZyb20gXCJhd3MtY2RrLWxpYlwiXG4vLyBpbXBvcnQgKiBhcyBlY3MgZnJvbSBcImF3cy1jZGstbGliL2F3cy1lY3NcIlxuaW1wb3J0ICogYXMgZWMyIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtZWMyXCJcbmltcG9ydCB7IFNlY3VyaXR5R3JvdXAsIFZwYyB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtZWMyXCJcbmltcG9ydCB7IFJlcG9zaXRvcnkgfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWVjclwiXG5pbXBvcnQgeyBBd3NMb2dEcml2ZXIsIENsdXN0ZXIsIENvbnRhaW5lckltYWdlLCBGYXJnYXRlU2VydmljZSwgRmFyZ2F0ZVRhc2tEZWZpbml0aW9uIH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1lY3NcIlxuaW1wb3J0ICogYXMgZWNzUGF0dGVybnMgZnJvbSBcImF3cy1jZGstbGliL2F3cy1lY3MtcGF0dGVybnNcIlxuaW1wb3J0IHsgUHJvdG9jb2wgfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWVsYXN0aWNsb2FkYmFsYW5jaW5ndjJcIlxuaW1wb3J0IHsgUG9saWN5U3RhdGVtZW50IH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1pYW1cIlxuaW1wb3J0IHsgTG9nR3JvdXAsIFJldGVudGlvbkRheXMgfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWxvZ3NcIlxuaW1wb3J0ICogYXMgc2VydmljZWRpc2NvdmVyeSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLXNlcnZpY2VkaXNjb3ZlcnlcIlxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIlxuaW1wb3J0IHsgSUVudiwgUGxhdGZvcm1BY2NvdW50LCBSZHNTdXBwb3J0UGxhdGZvcm1zIH0gZnJvbSBcIi4vdHlwZXNcIlxuXG5leHBvcnQgaW50ZXJmYWNlIFZnU2VydmljZXNTdGFja1Byb3BzIGV4dGVuZHMgU3RhY2tQcm9wcyB7XG4gIGVudjogSUVudlxuICBwbGF0Zm9ybUFjY291bnQ6IFBsYXRmb3JtQWNjb3VudFxufVxuXG5pbnRlcmZhY2UgVnBjQ29uZmlnIHtcbiAgY2lkcjogc3RyaW5nXG4gIG5hdEdhdGV3YXlzOiBudW1iZXJcbiAgbWF4QXpzOiBudW1iZXJcbn1cblxuaW50ZXJmYWNlIFNlcnZpY2VTdGFja0NvbmZpZyB7XG4gIHZwY0NvbmZpZzogVnBjQ29uZmlnXG4gIGxiQ291bnQ6IG51bWJlclxufVxuXG5jb25zdCBzZXJ2aWNlQ2ZnTWFwOiBSZWNvcmQ8UmRzU3VwcG9ydFBsYXRmb3JtcywgU2VydmljZVN0YWNrQ29uZmlnPiA9IHtcbiAgZGV2cGxhdGZvcm06IHtcbiAgICB2cGNDb25maWc6IHtcbiAgICAgIGNpZHI6IFwiMTAuMC4wLjAvMTZcIixcbiAgICAgIG5hdEdhdGV3YXlzOiAxLFxuICAgICAgbWF4QXpzOiAxXG4gICAgfSxcbiAgICBsYkNvdW50OiAxXG4gIH0sXG4gIHN0YWdlcGxhdGZvcm06IHtcbiAgICB2cGNDb25maWc6IHtcbiAgICAgIGNpZHI6IFwiMTAuMC4wLjAvMTZcIixcbiAgICAgIG5hdEdhdGV3YXlzOiAyLFxuICAgICAgbWF4QXpzOiAyXG4gICAgfSxcbiAgICBsYkNvdW50OiAyXG4gIH0sXG4gIHByb2RwbGF0Zm9ybToge1xuICAgIHZwY0NvbmZpZzoge1xuICAgICAgY2lkcjogXCIxMC4wLjAuMC8xNlwiLFxuICAgICAgbmF0R2F0ZXdheXM6IDMsXG4gICAgICBtYXhBenM6IDNcbiAgICB9LFxuICAgIGxiQ291bnQ6IDNcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgVmdTZXJ2aWNlc1N0YWNrIGV4dGVuZHMgU3RhY2sge1xuICByZWFkb25seSB2cGM6IFZwY1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBWZ1NlcnZpY2VzU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpXG5cbiAgICBjb25zdCBzZXJ2aWNlTmFtZXNwYWNlID0gXCJ2b2xhdGlsaXR5LXNlcnZpY2VzXCJcbiAgICBjb25zdCBhY2NvdW50ID0gcHJvcHMucGxhdGZvcm1BY2NvdW50XG4gICAgY29uc3QgY2ZnID0gc2VydmljZUNmZ01hcFthY2NvdW50XVxuICAgIGNvbnN0IHZwY0NmZyA9IGNmZy52cGNDb25maWdcbiAgICBjb25zdCB2cGMgPSBuZXcgVnBjKHRoaXMsIFwiVnBjXCIsIHtcbiAgICAgIC4uLnZwY0NmZyxcbiAgICAgIHN1Ym5ldENvbmZpZ3VyYXRpb246IFtcbiAgICAgICAge1xuICAgICAgICAgIGNpZHJNYXNrOiAxOSxcbiAgICAgICAgICBuYW1lOiBcInB1YmxpY1wiLFxuICAgICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBVQkxJQ1xuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgY2lkck1hc2s6IDIwLFxuICAgICAgICAgIG5hbWU6IFwiYXBwbGljYXRpb25cIixcbiAgICAgICAgICBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QUklWQVRFX1dJVEhfTkFUXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBjaWRyTWFzazogMjEsXG4gICAgICAgICAgbmFtZTogXCJkYXRhXCIsXG4gICAgICAgICAgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFJJVkFURV9JU09MQVRFRFxuICAgICAgICB9XG4gICAgICBdXG4gICAgfSlcblxuICAgIGNvbnN0IGNsdXN0ZXIgPSBuZXcgQ2x1c3Rlcih0aGlzLCBcIkNsdXN0ZXJcIiwge1xuICAgICAgY2x1c3Rlck5hbWU6IFwidmctc2VydmljZXMtY2x1c3RlclwiLFxuICAgICAgY29udGFpbmVySW5zaWdodHM6IHRydWUsXG4gICAgICB2cGNcbiAgICB9KVxuXG4gICAgY29uc3QgdmdTZXJ2aWNlc1NlY3VyaXR5R3JvdXAgPSBuZXcgU2VjdXJpdHlHcm91cCh0aGlzLCBcIlZnU2VydmljZXNTZWN1cml0eUdyb3VwXCIsIHtcbiAgICAgIHZwYyxcbiAgICAgIGFsbG93QWxsT3V0Ym91bmQ6IHRydWVcbiAgICB9KVxuXG4gICAgY29uc3Qgc2VydmljZUxvZ0dyb3VwID0gbmV3IExvZ0dyb3VwKHRoaXMsIFwiVm9sYXRpbGl0eVNlcnZpY2VMb2dHcm91cFwiLCB7XG4gICAgICByZW1vdmFsUG9saWN5OiBSZW1vdmFsUG9saWN5LlJFVEFJTixcbiAgICAgIHJldGVudGlvbjogUmV0ZW50aW9uRGF5cy5PTkVfTU9OVEhcbiAgICB9KVxuXG4gICAgLyogRmFyZ2F0ZSBvbmx5IHN1cHBvcnQgYXdzbG9nIGRyaXZlciAqL1xuICAgIGNvbnN0IHdzTG9nRHJpdmVyID0gbmV3IEF3c0xvZ0RyaXZlcih7XG4gICAgICBsb2dHcm91cDogc2VydmljZUxvZ0dyb3VwLFxuICAgICAgc3RyZWFtUHJlZml4OiBcIldTU2VydmljZVwiXG4gICAgfSlcblxuICAgIGNvbnN0IGluc3RydW1lbnRJbmZvTG9nRHJpdmVyID0gbmV3IEF3c0xvZ0RyaXZlcih7XG4gICAgICBsb2dHcm91cDogc2VydmljZUxvZ0dyb3VwLFxuICAgICAgc3RyZWFtUHJlZml4OiBcIkluc3RydW1lbnRJbmZvU2VydmljZVwiXG4gICAgfSlcblxuICAgIGNvbnN0IGluZ2VzdExvZ0RyaXZlciA9IG5ldyBBd3NMb2dEcml2ZXIoe1xuICAgICAgbG9nR3JvdXA6IHNlcnZpY2VMb2dHcm91cCxcbiAgICAgIHN0cmVhbVByZWZpeDogXCJJbmdlc3RTZXJ2aWNlXCJcbiAgICB9KVxuXG4gICAgY29uc3QgaW5kZXhMb2dEcml2ZXIgPSBuZXcgQXdzTG9nRHJpdmVyKHtcbiAgICAgIGxvZ0dyb3VwOiBzZXJ2aWNlTG9nR3JvdXAsXG4gICAgICBzdHJlYW1QcmVmaXg6IFwiSW5kZXhTZXJ2aWNlXCJcbiAgICB9KVxuXG4gICAgY29uc3QgcmF0ZUxvZ0RyaXZlciA9IG5ldyBBd3NMb2dEcml2ZXIoe1xuICAgICAgbG9nR3JvdXA6IHNlcnZpY2VMb2dHcm91cCxcbiAgICAgIHN0cmVhbVByZWZpeDogXCJSYXRlU2VydmljZVwiXG4gICAgfSlcblxuICAgIGNvbnN0IGNyb25Mb2dEcml2ZXIgPSBuZXcgQXdzTG9nRHJpdmVyKHtcbiAgICAgIGxvZ0dyb3VwOiBzZXJ2aWNlTG9nR3JvdXAsXG4gICAgICBzdHJlYW1QcmVmaXg6IFwiQ3JvblNlcnZpY2VcIlxuICAgIH0pXG5cbiAgICBjb25zdCBkYXRhUGlwZWxpbmVMb2dEcml2ZXIgPSBuZXcgQXdzTG9nRHJpdmVyKHtcbiAgICAgIGxvZ0dyb3VwOiBzZXJ2aWNlTG9nR3JvdXAsXG4gICAgICBzdHJlYW1QcmVmaXg6IFwiRGF0YVBpcGVsaW5lU2VydmljZVwiXG4gICAgfSlcblxuICAgIGNvbnN0IHNlY3JldHNNYW5hZ2VyUG9saWN5ID0gbmV3IFBvbGljeVN0YXRlbWVudCh7XG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgIFwic2VjcmV0c21hbmFnZXI6R2V0UmVzb3VyY2VQb2xpY3lcIixcbiAgICAgICAgXCJzZWNyZXRzbWFuYWdlcjpHZXRTZWNyZXRWYWx1ZVwiLFxuICAgICAgICBcInNlY3JldHNtYW5hZ2VyOkRlc2NyaWJlU2VjcmV0XCIsXG4gICAgICAgIFwic2VjcmV0c21hbmFnZXI6TGlzdFNlY3JldFZlcnNpb25JZHNcIlxuICAgICAgXSxcbiAgICAgIHJlc291cmNlczogW2Bhcm46YXdzOnNlY3JldHNtYW5hZ2VyOiR7cHJvcHM/LmVudj8ucmVnaW9uID8/IFwibm9uZVwifToke3Byb3BzPy5lbnY/LmFjY291bnQgPz8gXCJub25lXCJ9OnNlY3JldDoqYF1cbiAgICB9KVxuXG4gICAgY29uc3QgbmFtZXNwYWNlID0gbmV3IHNlcnZpY2VkaXNjb3ZlcnkuUHJpdmF0ZURuc05hbWVzcGFjZSh0aGlzLCBcIk5hbWVzcGFjZVwiLCB7XG4gICAgICBkZXNjcmlwdGlvbjogXCJQcml2YXRlIERuc05hbWVzcGFjZSBmb3Igdm9sYXRpbGl0eS1zZXJ2aWNlc1wiLFxuICAgICAgbmFtZTogXCJ2b2xhdGlsaXR5LmxvY2FsXCIsXG4gICAgICB2cGNcbiAgICB9KVxuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuICAgIGNvbnN0IHdzVGFza2RlZiA9IG5ldyBGYXJnYXRlVGFza0RlZmluaXRpb24odGhpcywgXCJXU1Rhc2tEZWZcIiwge1xuICAgICAgbWVtb3J5TGltaXRNaUI6IDIwNDgsIC8vIERlZmF1bHQgaXMgNTEyXG4gICAgICBjcHU6IDUxMiAvLyBEZWZhdWx0IGlzIDI1NlxuICAgICAgLy8gdGFza1JvbGVcbiAgICB9KVxuXG4gICAgLy8gOTk0MjI0ODI3NDM3LmRrci5lY3IudXMtZWFzdC0yLmFtYXpvbmF3cy5jb20vY29tcG9zZS1waXBlbGluZS12b2xhdGlsaXR5LXNlcnZpY2VzOmxhdGVzdFxuICAgIGNvbnN0IGVjclJlcG9zaXRvcnkgPSBSZXBvc2l0b3J5LmZyb21SZXBvc2l0b3J5TmFtZSh0aGlzLCBcIkVjclJlcG9zaXRvcnlcIiwgXCJjb21wb3NlLXBpcGVsaW5lLXZvbGF0aWxpdHktc2VydmljZXNcIilcbiAgICBjb25zdCBpbWFnZSA9IENvbnRhaW5lckltYWdlLmZyb21FY3JSZXBvc2l0b3J5KGVjclJlcG9zaXRvcnksIFwibGF0ZXN0XCIpXG5cbiAgICBjb25zdCB3c0NvbnRhaW5lciA9IHdzVGFza2RlZi5hZGRDb250YWluZXIoXCJXU0NvbnRhaW5lclwiLCB7XG4gICAgICBpbWFnZSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRSQU5TUE9SVEVSOiBcIm5hdHM6Ly9uYXRzLnZvbGF0aWxpdHkubG9jYWw6NDIyMlwiLFxuICAgICAgICBTRVJWSUNFRElSOiBcImRpc3Qvc2VydmljZXNcIixcbiAgICAgICAgU0VSVklDRVM6IFwid3Muc2VydmljZS5qc1wiLFxuICAgICAgICBOQU1FU1BBQ0U6IHNlcnZpY2VOYW1lc3BhY2UsXG4gICAgICAgIE5FV19SRUxJQ19MSUNFTlNFX0tFWTogXCJiYTJlNzJmZDEwNWZkMTVjNGYxNWZhMTljOGM4NjM3MEZGRkZOUkFMXCIsXG4gICAgICAgIE5FV19SRUxJQ19ESVNUUklCVVRFRF9UUkFDSU5HX0VOQUJMRUQ6IFwidHJ1ZVwiLFxuICAgICAgICBORVdfUkVMSUNfQVBQX05BTUU6IFwidm9sYXRpbGl0eS1zZXJ2aWNlc1wiLFxuICAgICAgICBORVdfUkVMSUNfTE9HX0xFVkVMOiBcImluZm9cIlxuICAgICAgfSxcbiAgICAgIGxvZ2dpbmc6IHdzTG9nRHJpdmVyXG4gICAgfSlcblxuICAgIHdzQ29udGFpbmVyLmFkZFBvcnRNYXBwaW5ncyh7XG4gICAgICBjb250YWluZXJQb3J0OiAzMDAwXG4gICAgfSlcblxuICAgIC8vIENyZWF0ZSBhIGxvYWQtYmFsYW5jZWQgRmFyZ2F0ZSBzZXJ2aWNlIGFuZCBtYWtlIGl0IHB1YmxpY1xuICAgIGNvbnN0IHdzU2VydmljZSA9IG5ldyBlY3NQYXR0ZXJucy5BcHBsaWNhdGlvbkxvYWRCYWxhbmNlZEZhcmdhdGVTZXJ2aWNlKHRoaXMsIFwiV1NTZXJ2aWNlXCIsIHtcbiAgICAgIGNsdXN0ZXIsIC8vIFJlcXVpcmVkXG4gICAgICBjaXJjdWl0QnJlYWtlcjoge1xuICAgICAgICByb2xsYmFjazogdHJ1ZVxuICAgICAgfSxcbiAgICAgIGRlc2lyZWRDb3VudDogcHJvcHMubGJDb3VudCxcbiAgICAgIGRvbWFpblpvbmU6IHN1YlpvbmUsXG4gICAgICBkb21haW5OYW1lOiBcIndzLmRldi52b2xhdGlsaXR5LmNvbVwiLFxuICAgICAgY2VydGlmaWNhdGUsXG4gICAgICByZWRpcmVjdEhUVFA6IHRydWUsXG4gICAgICAvL3Byb3RvY29sOiBBcHBsaWNhdGlvblByb3RvY29sLkhUVFBTLFxuICAgICAgLy8gdGFyZ2V0UHJvdG9jb2w6IEFwcGxpY2F0aW9uUHJvdG9jb2wuSFRUUFMsXG4gICAgICAvLyByZWNvcmRUeXBlOiBcImRldi52b2xhdGlsaXR5LmNvbVwiLFxuICAgICAgLy8gc3NsUG9saWN5OiBTc2xQb2xpY3kuUkVDT01NRU5ERUQsXG4gICAgICAvLyBzZWN1cml0eUdyb3VwczogW2xiU2VjdXJpdHlHcm91cF0sXG4gICAgICBwdWJsaWNMb2FkQmFsYW5jZXI6IHRydWUsIC8vIERlZmF1bHQgaXMgZmFsc2VcbiAgICAgIHNlcnZpY2VOYW1lOiBcIndzXCIsXG4gICAgICB0YXNrRGVmaW5pdGlvbjogd3NUYXNrZGVmLFxuICAgICAgY2xvdWRNYXBPcHRpb25zOiB7IG5hbWU6IFwid3NcIiwgY2xvdWRNYXBOYW1lc3BhY2U6IG5hbWVzcGFjZSB9XG4gICAgfSlcblxuICAgIHdzU2VydmljZS5sb2FkQmFsYW5jZXIuY29ubmVjdGlvbnMuYWxsb3dGcm9tKGVjMi5QZWVyLmFueUlwdjQoKSwgZWMyLlBvcnQudGNwKDgwKSwgXCJBbGxvdyBodHRwIHRyYWZmaWNcIilcbiAgICB3c1NlcnZpY2UubG9hZEJhbGFuY2VyLmNvbm5lY3Rpb25zLmFsbG93RnJvbShlYzIuUGVlci5hbnlJcHY0KCksIGVjMi5Qb3J0LnRjcCg0NDMpLCBcIkFsbG93IGh0dHBzIHRyYWZmaWNcIilcbiAgICB3c1NlcnZpY2UubG9hZEJhbGFuY2VyLmNvbm5lY3Rpb25zLmFsbG93RnJvbShlYzIuUGVlci5hbnlJcHY2KCksIGVjMi5Qb3J0LnRjcCg4MCksIFwiQWxsb3cgaHR0cCB0cmFmZmljXCIpXG4gICAgd3NTZXJ2aWNlLmxvYWRCYWxhbmNlci5jb25uZWN0aW9ucy5hbGxvd0Zyb20oZWMyLlBlZXIuYW55SXB2NigpLCBlYzIuUG9ydC50Y3AoNDQzKSwgXCJBbGxvdyBodHRwcyB0cmFmZmljXCIpXG4gICAgd3NTZXJ2aWNlLnNlcnZpY2UuY29ubmVjdGlvbnMuYWRkU2VjdXJpdHlHcm91cCh2Z1NlcnZpY2VzU2VjdXJpdHlHcm91cClcbiAgICAvLyB3c1NlcnZpY2Uuc2VydmljZS5jb25uZWN0aW9ucy5hbGxvd0Zyb20od3NTZXJ2aWNlLmxvYWRCYWxhbmNlciwgZWMyLlBvcnQudGNwKDgwKSwgXCJMQiB0byBXU1wiKVxuXG4gICAgLy8gd3NTZXJ2aWNlLnNlcnZpY2UuY29ubmVjdGlvbnMuYWxsb3dGcm9tKFxuICAgIC8vICAgd3NTZXJ2aWNlLmxvYWRCYWxhbmNlcixcbiAgICAvLyAgIGVjMi5Qb3J0LnRjcCg4MjIyKSxcbiAgICAvLyAgIFwiTkFUUyB0cmFuc3BvcnQgbWFuYWdlbWVudCBwb3J0IGFzc2lnbm1lbnRcIlxuICAgIC8vIClcblxuICAgIC8vIG5ldyBlY3MuRmFyZ2F0ZVNlcnZpY2UodGhpcywgYCR7c2VydmljZU5hbWV9U2VydmljZWAsIHtcbiAgICAvLyAgIGNsdXN0ZXI6IGNsdXN0ZXIsXG4gICAgLy8gICB0YXNrRGVmaW5pdGlvbjogc2VydmljZVRhc2tEZWZpbml0aW9uLFxuICAgIC8vICAgLy8gTXVzdCBiZSBgdHJ1ZWAgd2hlbiB1c2luZyBwdWJsaWMgaW1hZ2VzXG4gICAgLy8gICBhc3NpZ25QdWJsaWNJcDogdHJ1ZSxcbiAgICAvLyAgIC8vIElmIHlvdSBzZXQgaXQgdG8gMCwgdGhlIGRlcGxveW1lbnQgd2lsbCBmaW5pc2ggc3VjY2VzZnVsbHkgYW55d2F5XG4gICAgLy8gICBkZXNpcmVkQ291bnQ6IDEsXG4gICAgLy8gICBzZWN1cml0eUdyb3VwOiBzZXJ2aWNlU2VjR3JwLFxuICAgIC8vICAgY2xvdWRNYXBPcHRpb25zOiB7XG4gICAgLy8gICAgIC8vIFRoaXMgd2lsbCBiZSB5b3VyIHNlcnZpY2VfbmFtZS5uYW1lc3BhY2VcbiAgICAvLyAgICAgbmFtZTogc2VydmljZU5hbWUsXG4gICAgLy8gICAgIGNsb3VkTWFwTmFtZXNwYWNlOiBkbnNOYW1lc3BhY2UsXG4gICAgLy8gICAgIGRuc1JlY29yZFR5cGU6IERuc1JlY29yZFR5cGUuQSxcbiAgICAvLyAgIH0sXG4gICAgLy8gfSk7XG5cbiAgICB3c1NlcnZpY2UudGFyZ2V0R3JvdXAuY29uZmlndXJlSGVhbHRoQ2hlY2soe1xuICAgICAgcGF0aDogXCIvd3MvaGVhbHRoXCIsXG4gICAgICBpbnRlcnZhbDogRHVyYXRpb24uc2Vjb25kcygxMjApLFxuICAgICAgdW5oZWFsdGh5VGhyZXNob2xkQ291bnQ6IDIsXG4gICAgICBwcm90b2NvbDogUHJvdG9jb2wuSFRUUFxuICAgIH0pXG5cbiAgICAvLyBjb25zdCB0YXJnZXRHcm91cEh0dHAgPSBuZXcgQXBwbGljYXRpb25UYXJnZXRHcm91cCh0aGlzLCBcIkFMQlRhcmdldEdyb3VwXCIsIHtcbiAgICAvLyAgIHBvcnQ6IDMwMDAsXG4gICAgLy8gICB2cGMsXG4gICAgLy8gICBwcm90b2NvbDogQXBwbGljYXRpb25Qcm90b2NvbC5IVFRQLFxuICAgIC8vICAgdGFyZ2V0VHlwZTogVGFyZ2V0VHlwZS5JUFxuICAgIC8vIH0pXG5cbiAgICAvLyB0YXJnZXRHcm91cEh0dHAuY29uZmlndXJlSGVhbHRoQ2hlY2soe1xuICAgIC8vICAgcGF0aDogXCIvaGVhbHRoXCIsXG4gICAgLy8gICBwcm90b2NvbDogUHJvdG9jb2wuSFRUUFxuICAgIC8vIH0pXG5cbiAgICAvLyB3c1NlcnZpY2UudGFyZ2V0R3JvdXAubG9hZEJhbGFuY2VyQXR0YWNoZWQuXG5cbiAgICAvLyB1c2UgYSBzZWN1cml0eSBncm91cCB0byBwcm92aWRlIGEgc2VjdXJlIGNvbm5lY3Rpb24gYmV0d2VlbiB0aGUgQUxCIGFuZCB0aGUgY29udGFpbmVyc1xuICAgIC8vIGNvbnN0IGxiU2VjdXJpdHlHcm91cCA9IG5ldyBlYzIuU2VjdXJpdHlHcm91cCh0aGlzLCBcIkxCU2VjdXJpdHlHcm91cFwiLCB7XG4gICAgLy8gICB2cGMsXG4gICAgLy8gICBhbGxvd0FsbE91dGJvdW5kOiB0cnVlXG4gICAgLy8gfSlcbiAgICAvLyBsYlNlY3VyaXR5R3JvdXAuYWRkSW5ncmVzc1J1bGUoZWMyLlBlZXIuYW55SXB2NCgpLCBlYzIuUG9ydC50Y3AoNDQzKSwgXCJBbGxvdyBodHRwcyB0cmFmZmljXCIpXG4gICAgLy8gd3NTZXJ2aWNlLmxvYWRCYWxhbmNlci5hZGRTZWN1cml0eUdyb3VwKGxiU2VjdXJpdHlHcm91cClcblxuICAgIC8vIGVjc1NlY3VyaXR5R3JvdXAuY29ubmVjdGlvbnMuYWxsb3dGcm9tKGxiU2VjdXJpdHlHcm91cCwgZWMyLlBvcnQuYWxsVGNwKCksIFwiQXBwbGljYXRpb24gbG9hZCBiYWxhbmNlclwiKVxuXG4gICAgLy8gd3NTZXJ2aWNlLmxvYWRCYWxhbmNlci5jb25uZWN0aW9ucy5hbGxvd0Zyb20obmF0c1NlcnZpY2UsIGVjMi5Qb3J0LnRjcCg0MjIyKSwgXCJOQVRTIHRyYW5zcG9ydCBwb3J0IGFzc2lnbm1lbnRcIilcbiAgICAvLyB3c1NlcnZpY2UuY29ubmVjdGlvbnMuYWxsb3dGcm9tKG5hdHNTZXJ2aWNlLCBlYzIuUG9ydC50Y3AoNDIyMiksIFwiTkFUUyB0cmFuc3BvcnQgcG9ydCBhc3NpZ25tZW50XCIpXG4gICAgLy8gd3NTZXJ2aWNlLnNlcnZpY2UuY29ubmVjdGlvbnMuYWxsb3dGcm9tKHdzU2VydmljZS5sb2FkQmFsYW5jZXIsIGVjMi5Qb3J0LnRjcCg4MCkpXG4gICAgLy8gY29uc3Qgc3NsTGlzdGVuZXIgPSB3c3NlcnZpY2UubG9hZEJhbGFuY2VyLmFkZExpc3RlbmVyKFwiU1NMXCIsIHtcbiAgICAvLyAgIHBvcnQ6IDQ0MyxcbiAgICAvLyAgIGNlcnRpZmljYXRlczogW3RoaXMucHJvcHMuY2VydGlmaWNhdGVIYXJ2ZXN0U3ViZG9tYWluLCB0aGlzLnByb3BzLmNlcnRpZmljYXRlUm9vdFN1YmRvbWFpbl0sXG4gICAgLy8gICBwcm90b2NvbDogQXBwbGljYXRpb25Qcm90b2NvbC5IVFRQU1xuICAgIC8vIH0pXG5cbiAgICAvLyBjb25zdCBjbmFtZVJlY29yZCA9IG5ldyBDbmFtZVJlY29yZCh0aGlzLCBcIkNsdXN0ZXJDbmFtZVwiLCB7XG4gICAgLy8gICB6b25lOiBzdWJab25lLFxuICAgIC8vICAgcmVjb3JkTmFtZTogXCJ3c1wiXG4gICAgLy8gfSlcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgICBjb25zdCBpbnN0cnVtZW50SW5mb1Rhc2tkZWYgPSBuZXcgRmFyZ2F0ZVRhc2tEZWZpbml0aW9uKHRoaXMsIFwiSW5zdHJ1bWVudEluZm9UYXNrRGVmXCIsIHtcbiAgICAgIG1lbW9yeUxpbWl0TWlCOiAyMDQ4LCAvLyBEZWZhdWx0IGlzIDUxMlxuICAgICAgY3B1OiA1MTIgLy8gRGVmYXVsdCBpcyAyNTZcbiAgICB9KVxuXG4gICAgaW5zdHJ1bWVudEluZm9UYXNrZGVmLmFkZFRvVGFza1JvbGVQb2xpY3koc2VjcmV0c01hbmFnZXJQb2xpY3kpXG5cbiAgICBjb25zdCBpbnN0cnVtZW50SW5mb0NvbnRhaW5lciA9IGluc3RydW1lbnRJbmZvVGFza2RlZi5hZGRDb250YWluZXIoXCJJbnN0cnVtZW50SW5mb0NvbnRhaW5lclwiLCB7XG4gICAgICBpbWFnZSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFNFQVJDSF9ET01BSU46IG5hbWVzcGFjZS5uYW1lc3BhY2VOYW1lLFxuICAgICAgICBTRVJWSUNFX05BTUVTUEFDRTogc2VydmljZU5hbWVzcGFjZSxcbiAgICAgICAgVFJBTlNQT1JURVI6IFwibmF0czovL25hdHMudm9sYXRpbGl0eS5sb2NhbDo0MjIyXCIsXG4gICAgICAgIFNFUlZJQ0VESVI6IFwiZGlzdC9zZXJ2aWNlc1wiLFxuICAgICAgICBTRVJWSUNFUzogXCJpbnN0cnVtZW50X2luZm8uc2VydmljZS5qc1wiLFxuICAgICAgICBOQU1FU1BBQ0U6IHNlcnZpY2VOYW1lc3BhY2VcbiAgICAgICAgLy8gUkVESVNfSE9TVDogcmVkaXNDbHVzdGVyLmF0dHJSZWRpc0VuZHBvaW50QWRkcmVzcyxcbiAgICAgICAgLy8gUkVESVNfUE9SVDogcmVkaXNDbHVzdGVyLmF0dHJSZWRpc0VuZHBvaW50UG9ydFxuICAgICAgfSxcbiAgICAgIGxvZ2dpbmc6IGluc3RydW1lbnRJbmZvTG9nRHJpdmVyXG4gICAgfSlcblxuICAgIC8vIC8vIENyZWF0ZSBhIHN0YW5kYXJkIEZhcmdhdGUgc2VydmljZVxuICAgIGNvbnN0IGluc3RydW1lbnRJbmZvU2VydmljZSA9IG5ldyBGYXJnYXRlU2VydmljZSh0aGlzLCBcIkluc3RydW1lbnRJbmZvU2VydmljZVwiLCB7XG4gICAgICBjbHVzdGVyLCAvLyBSZXF1aXJlZFxuICAgICAgZGVzaXJlZENvdW50OiAwLCAvLyBEZWZhdWx0IGlzIDFcbiAgICAgIHNlcnZpY2VOYW1lOiBcImluc3RydW1lbnRJbmZvXCIsXG4gICAgICB0YXNrRGVmaW5pdGlvbjogaW5zdHJ1bWVudEluZm9UYXNrZGVmLFxuICAgICAgc2VjdXJpdHlHcm91cHM6IFt2Z1NlcnZpY2VzU2VjdXJpdHlHcm91cF0sXG4gICAgICBjbG91ZE1hcE9wdGlvbnM6IHsgbmFtZTogXCJpbnN0cnVtZW50SW5mb1wiLCBjbG91ZE1hcE5hbWVzcGFjZTogbmFtZXNwYWNlIH1cbiAgICB9KVxuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gICAgY29uc3QgcmF0ZVRhc2tkZWYgPSBuZXcgRmFyZ2F0ZVRhc2tEZWZpbml0aW9uKHRoaXMsIFwiUmF0ZVRhc2tEZWZcIiwge1xuICAgICAgbWVtb3J5TGltaXRNaUI6IDEwMjQsIC8vIERlZmF1bHQgaXMgNTEyXG4gICAgICBjcHU6IDUxMiAvLyBEZWZhdWx0IGlzIDI1NlxuICAgIH0pXG5cbiAgICByYXRlVGFza2RlZi5hZGRUb1Rhc2tSb2xlUG9saWN5KHNlY3JldHNNYW5hZ2VyUG9saWN5KVxuXG4gICAgY29uc3QgcmF0ZUNvbnRhaW5lciA9IHJhdGVUYXNrZGVmLmFkZENvbnRhaW5lcihcIlJhdGVDb250YWluZXJcIiwge1xuICAgICAgaW1hZ2UsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBTRUFSQ0hfRE9NQUlOOiBuYW1lc3BhY2UubmFtZXNwYWNlTmFtZSxcbiAgICAgICAgU0VSVklDRV9OQU1FU1BBQ0U6IHNlcnZpY2VOYW1lc3BhY2UsXG4gICAgICAgIFRSQU5TUE9SVEVSOiBcIm5hdHM6Ly9uYXRzLnZvbGF0aWxpdHkubG9jYWw6NDIyMlwiLFxuICAgICAgICBTRVJWSUNFRElSOiBcImRpc3Qvc2VydmljZXNcIixcbiAgICAgICAgU0VSVklDRVM6IFwicmF0ZS5zZXJ2aWNlLmpzXCIsXG4gICAgICAgIE5BTUVTUEFDRTogc2VydmljZU5hbWVzcGFjZSxcbiAgICAgICAgUkFURV9SSVNLTEVTU19SQVRFX0NST05USU1FOiBcIiovMSAqICogKiAqXCIsXG4gICAgICAgIFJBVEVfUklTS0xFU1NfUkFURV9TT1VSQ0U6IFwiYWF2ZVwiLFxuICAgICAgICBSQVRFX1NLSVBfUEVSU0lTVDogXCJ0cnVlXCJcbiAgICAgIH0sXG4gICAgICBsb2dnaW5nOiByYXRlTG9nRHJpdmVyXG4gICAgfSlcblxuICAgIC8vIC8vIENyZWF0ZSBhIHN0YW5kYXJkIEZhcmdhdGUgc2VydmljZVxuICAgIGNvbnN0IHJhdGVTZXJ2aWNlID0gbmV3IEZhcmdhdGVTZXJ2aWNlKHRoaXMsIFwiUmF0ZVNlcnZpY2VcIiwge1xuICAgICAgY2x1c3RlciwgLy8gUmVxdWlyZWRcbiAgICAgIGRlc2lyZWRDb3VudDogMCwgLy8gRGVmYXVsdCBpcyAxXG4gICAgICBzZXJ2aWNlTmFtZTogXCJyYXRlXCIsXG4gICAgICB0YXNrRGVmaW5pdGlvbjogcmF0ZVRhc2tkZWYsXG4gICAgICBzZWN1cml0eUdyb3VwczogW3ZnU2VydmljZXNTZWN1cml0eUdyb3VwXSxcbiAgICAgIGNsb3VkTWFwT3B0aW9uczogeyBuYW1lOiBcInJhdGVcIiwgY2xvdWRNYXBOYW1lc3BhY2U6IG5hbWVzcGFjZSB9XG4gICAgfSlcblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICAgIGNvbnN0IGluZ2VzdFRhc2tkZWYgPSBuZXcgRmFyZ2F0ZVRhc2tEZWZpbml0aW9uKHRoaXMsIFwiSW5nZXN0VGFza0RlZlwiLCB7XG4gICAgICBtZW1vcnlMaW1pdE1pQjogMjA0OCwgLy8gRGVmYXVsdCBpcyA1MTJcbiAgICAgIGNwdTogNTEyIC8vIERlZmF1bHQgaXMgMjU2XG4gICAgfSlcblxuICAgIGluZ2VzdFRhc2tkZWYuYWRkVG9UYXNrUm9sZVBvbGljeShzZWNyZXRzTWFuYWdlclBvbGljeSlcblxuICAgIGNvbnN0IGluZ2VzdENvbnRhaW5lciA9IGluZ2VzdFRhc2tkZWYuYWRkQ29udGFpbmVyKFwiSW5nZXN0Q29udGFpbmVyXCIsIHtcbiAgICAgIGltYWdlLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgU0VBUkNIX0RPTUFJTjogbmFtZXNwYWNlLm5hbWVzcGFjZU5hbWUsXG4gICAgICAgIFNFUlZJQ0VfTkFNRVNQQUNFOiBzZXJ2aWNlTmFtZXNwYWNlLFxuICAgICAgICBUUkFOU1BPUlRFUjogXCJuYXRzOi8vbmF0cy52b2xhdGlsaXR5LmxvY2FsOjQyMjJcIixcbiAgICAgICAgU0VSVklDRURJUjogXCJkaXN0L3NlcnZpY2VzXCIsXG4gICAgICAgIFNFUlZJQ0VTOiBcImluZ2VzdC5zZXJ2aWNlLmpzXCIsXG4gICAgICAgIE5BTUVTUEFDRTogc2VydmljZU5hbWVzcGFjZSxcbiAgICAgICAgLy8gUkVESVNfSE9TVDogcmVkaXNDbHVzdGVyLmF0dHJSZWRpc0VuZHBvaW50QWRkcmVzcyxcbiAgICAgICAgLy8gUkVESVNfUE9SVDogcmVkaXNDbHVzdGVyLmF0dHJSZWRpc0VuZHBvaW50UG9ydCxcbiAgICAgICAgSU5HRVNUX0lOVEVSVkFMOiBcIjE0ZFwiLFxuICAgICAgICBJTkdFU1RfRVhQSVJZX1RZUEU6IFwiRnJpZGF5VDA4OjAwOjAwWlwiXG4gICAgICB9LFxuICAgICAgLy8gc2VjcmV0czoge30sXG4gICAgICBsb2dnaW5nOiBpbmdlc3RMb2dEcml2ZXJcbiAgICB9KVxuXG4gICAgLy8gLy8gQ3JlYXRlIGEgc3RhbmRhcmQgRmFyZ2F0ZSBzZXJ2aWNlXG4gICAgY29uc3QgaW5nZXN0U2VydmljZSA9IG5ldyBGYXJnYXRlU2VydmljZSh0aGlzLCBcIkluZ2VzdFNlcnZpY2VcIiwge1xuICAgICAgY2x1c3RlciwgLy8gUmVxdWlyZWRcbiAgICAgIGRlc2lyZWRDb3VudDogMCwgLy8gRGVmYXVsdCBpcyAxXG4gICAgICBzZXJ2aWNlTmFtZTogXCJpbmdlc3RcIixcbiAgICAgIHRhc2tEZWZpbml0aW9uOiBpbmdlc3RUYXNrZGVmLFxuICAgICAgc2VjdXJpdHlHcm91cHM6IFt2Z1NlcnZpY2VzU2VjdXJpdHlHcm91cF0sXG4gICAgICBjbG91ZE1hcE9wdGlvbnM6IHsgbmFtZTogXCJpbmdlc3RcIiwgY2xvdWRNYXBOYW1lc3BhY2U6IG5hbWVzcGFjZSB9XG4gICAgfSlcblxuICAgIGluZ2VzdFNlcnZpY2Uubm9kZS5hZGREZXBlbmRlbmN5KGluc3RydW1lbnRJbmZvU2VydmljZSlcblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gICAgY29uc3QgaW5kZXhUYXNrZGVmID0gbmV3IEZhcmdhdGVUYXNrRGVmaW5pdGlvbih0aGlzLCBcIkluZGV4VGFza0RlZlwiLCB7XG4gICAgICBtZW1vcnlMaW1pdE1pQjogMjA0OCwgLy8gRGVmYXVsdCBpcyA1MTJcbiAgICAgIGNwdTogNTEyIC8vIERlZmF1bHQgaXMgMjU2XG4gICAgfSlcblxuICAgIGNvbnN0IGluZGV4Q29udGFpbmVyID0gaW5kZXhUYXNrZGVmLmFkZENvbnRhaW5lcihcIkluZGV4Q29udGFpbmVyXCIsIHtcbiAgICAgIGltYWdlLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgU0VBUkNIX0RPTUFJTjogbmFtZXNwYWNlLm5hbWVzcGFjZU5hbWUsXG4gICAgICAgIFNFUlZJQ0VfTkFNRVNQQUNFOiBzZXJ2aWNlTmFtZXNwYWNlLFxuICAgICAgICBUUkFOU1BPUlRFUjogXCJuYXRzOi8vbmF0cy52b2xhdGlsaXR5LmxvY2FsOjQyMjJcIixcbiAgICAgICAgU0VSVklDRURJUjogXCJkaXN0L3NlcnZpY2VzXCIsXG4gICAgICAgIFNFUlZJQ0VTOiBcImluZGV4LnNlcnZpY2UuanNcIixcbiAgICAgICAgTkFNRVNQQUNFOiBzZXJ2aWNlTmFtZXNwYWNlLFxuICAgICAgICBJTkRFWF9TS0lQX1BFUlNJU1Q6IFwidHJ1ZVwiXG4gICAgICAgIC8vIFJFRElTX0hPU1Q6IHJlZGlzQ2x1c3Rlci5hdHRyUmVkaXNFbmRwb2ludEFkZHJlc3MsXG4gICAgICAgIC8vIFJFRElTX1BPUlQ6IHJlZGlzQ2x1c3Rlci5hdHRyUmVkaXNFbmRwb2ludFBvcnRcbiAgICAgIH0sXG4gICAgICBsb2dnaW5nOiBpbmRleExvZ0RyaXZlclxuICAgIH0pXG5cbiAgICAvLyAvLyBDcmVhdGUgYSBzdGFuZGFyZCBGYXJnYXRlIHNlcnZpY2VcbiAgICBjb25zdCBpbmRleFNlcnZpY2UgPSBuZXcgRmFyZ2F0ZVNlcnZpY2UodGhpcywgXCJJbmRleFNlcnZpY2VcIiwge1xuICAgICAgY2x1c3RlciwgLy8gUmVxdWlyZWRcbiAgICAgIGRlc2lyZWRDb3VudDogMCwgLy8gRGVmYXVsdCBpcyAxXG4gICAgICBzZXJ2aWNlTmFtZTogXCJpbmRleFwiLFxuICAgICAgdGFza0RlZmluaXRpb246IGluZGV4VGFza2RlZixcbiAgICAgIHNlY3VyaXR5R3JvdXBzOiBbdmdTZXJ2aWNlc1NlY3VyaXR5R3JvdXBdLFxuICAgICAgY2xvdWRNYXBPcHRpb25zOiB7IG5hbWU6IFwiaW5kZXhcIiwgY2xvdWRNYXBOYW1lc3BhY2U6IG5hbWVzcGFjZSB9XG4gICAgfSlcblxuICAgIGluZGV4U2VydmljZS5ub2RlLmFkZERlcGVuZGVuY3koaW5nZXN0U2VydmljZSlcbiAgICBpbmRleFNlcnZpY2Uubm9kZS5hZGREZXBlbmRlbmN5KHJhdGVTZXJ2aWNlKVxuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gICAgY29uc3QgZGF0YVBpcGVsaW5lVGFza2RlZiA9IG5ldyBGYXJnYXRlVGFza0RlZmluaXRpb24odGhpcywgXCJEYXRhUGlwZWxpbmVUYXNrRGVmXCIsIHtcbiAgICAgIG1lbW9yeUxpbWl0TWlCOiAxNjM4NCwgLy8gRGVmYXVsdCBpcyA1MTJcbiAgICAgIGNwdTogNDA5NiAvLyBEZWZhdWx0IGlzIDI1NlxuICAgIH0pXG5cbiAgICBjb25zdCBkYXRhUGlwZWxpbmVDb250YWluZXIgPSBkYXRhUGlwZWxpbmVUYXNrZGVmLmFkZENvbnRhaW5lcihcIkRhdGFQaXBlbGluZUNvbnRhaW5lclwiLCB7XG4gICAgICBpbWFnZSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFNFUlZJQ0VfTkFNRVNQQUNFOiBzZXJ2aWNlTmFtZXNwYWNlLFxuICAgICAgICBUUkFOU1BPUlRFUjogXCJuYXRzOi8vbmF0cy52b2xhdGlsaXR5LmxvY2FsOjQyMjJcIixcbiAgICAgICAgU0VSVklDRURJUjogXCJkaXN0L3NlcnZpY2VzXCIsXG4gICAgICAgIFNFUlZJQ0VTOiBcInJhdGUuc2VydmljZS5qcyxpbmRleC5zZXJ2aWNlLmpzLGluZ2VzdC5zZXJ2aWNlLmpzLGluc3RydW1lbnRfaW5mby5zZXJ2aWNlLmpzXCIsXG4gICAgICAgIFJBVEVfUklTS0xFU1NfUkFURV9DUk9OVElNRTogXCIqLzEgKiAqICogKlwiLFxuICAgICAgICBSQVRFX1JJU0tMRVNTX1JBVEVfU09VUkNFOiBcImFhdmVcIixcbiAgICAgICAgUkFURV9TS0lQX1BFUlNJU1Q6IFwidHJ1ZVwiLFxuICAgICAgICBJTkRFWF9TS0lQX1BFUlNJU1Q6IFwidHJ1ZVwiLFxuICAgICAgICBJTkdFU1RfSU5URVJWQUw6IFwiMTRkXCIsXG4gICAgICAgIElOR0VTVF9FWFBJUllfVFlQRTogXCJGcmlkYXlUMDg6MDA6MDBaXCIsXG4gICAgICAgIE5BTUVTUEFDRTogc2VydmljZU5hbWVzcGFjZSxcbiAgICAgICAgTkVXX1JFTElDX0xJQ0VOU0VfS0VZOiBcImJhMmU3MmZkMTA1ZmQxNWM0ZjE1ZmExOWM4Yzg2MzcwRkZGRk5SQUxcIixcbiAgICAgICAgTkVXX1JFTElDX0RJU1RSSUJVVEVEX1RSQUNJTkdfRU5BQkxFRDogXCJ0cnVlXCIsXG4gICAgICAgIE5FV19SRUxJQ19BUFBfTkFNRTogXCJ2b2xhdGlsaXR5LXNlcnZpY2VzXCIsXG4gICAgICAgIE5FV19SRUxJQ19MT0dfTEVWRUw6IFwiaW5mb1wiXG4gICAgICB9LFxuICAgICAgbG9nZ2luZzogZGF0YVBpcGVsaW5lTG9nRHJpdmVyXG4gICAgfSlcblxuICAgIC8vIC8vIENyZWF0ZSBhIHN0YW5kYXJkIEZhcmdhdGUgc2VydmljZVxuICAgIGNvbnN0IGRhdGFQaXBlbGluZVNlcnZpY2UgPSBuZXcgRmFyZ2F0ZVNlcnZpY2UodGhpcywgXCJEYXRhUGlwZWxpbmVTZXJ2aWNlXCIsIHtcbiAgICAgIGNsdXN0ZXIsIC8vIFJlcXVpcmVkXG4gICAgICBkZXNpcmVkQ291bnQ6IDEsIC8vIERlZmF1bHQgaXMgMVxuICAgICAgc2VydmljZU5hbWU6IFwiZGF0YXBpcGVsaW5lXCIsXG4gICAgICB0YXNrRGVmaW5pdGlvbjogZGF0YVBpcGVsaW5lVGFza2RlZixcbiAgICAgIHNlY3VyaXR5R3JvdXBzOiBbdmdTZXJ2aWNlc1NlY3VyaXR5R3JvdXBdLFxuICAgICAgY2xvdWRNYXBPcHRpb25zOiB7IG5hbWU6IFwiZGF0YXBpcGVsaW5lXCIsIGNsb3VkTWFwTmFtZXNwYWNlOiBuYW1lc3BhY2UgfVxuICAgIH0pXG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgICBjb25zdCBjcm9uVGFza2RlZiA9IG5ldyBGYXJnYXRlVGFza0RlZmluaXRpb24odGhpcywgXCJDcm9uVGFza0RlZlwiLCB7XG4gICAgICBtZW1vcnlMaW1pdE1pQjogMTAyNCwgLy8gRGVmYXVsdCBpcyA1MTJcbiAgICAgIGNwdTogNTEyIC8vIERlZmF1bHQgaXMgMjU2XG4gICAgfSlcblxuICAgIGNvbnN0IGNyb25Db250YWluZXIgPSBjcm9uVGFza2RlZi5hZGRDb250YWluZXIoXCJDcm9uQ29udGFpbmVyXCIsIHtcbiAgICAgIGltYWdlLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgU0VBUkNIX0RPTUFJTjogbmFtZXNwYWNlLm5hbWVzcGFjZU5hbWUsXG4gICAgICAgIFNFUlZJQ0VfTkFNRVNQQUNFOiBzZXJ2aWNlTmFtZXNwYWNlLFxuICAgICAgICBUUkFOU1BPUlRFUjogXCJuYXRzOi8vbmF0cy52b2xhdGlsaXR5LmxvY2FsOjQyMjJcIixcbiAgICAgICAgU0VSVklDRURJUjogXCJkaXN0L3NlcnZpY2VzXCIsXG4gICAgICAgIFNFUlZJQ0VTOiBcImNyb24uc2VydmljZS5qc1wiLFxuICAgICAgICBOQU1FU1BBQ0U6IHNlcnZpY2VOYW1lc3BhY2UsXG4gICAgICAgIENST05fTUZJVl9VUERBVEVfQ1JPTlRJTUU6IFwiKi8xICogKiAqICpcIlxuICAgICAgfSxcbiAgICAgIGxvZ2dpbmc6IGNyb25Mb2dEcml2ZXJcbiAgICB9KVxuXG4gICAgLy8gLy8gQ3JlYXRlIGEgc3RhbmRhcmQgRmFyZ2F0ZSBzZXJ2aWNlXG4gICAgY29uc3QgY3JvblNlcnZpY2UgPSBuZXcgRmFyZ2F0ZVNlcnZpY2UodGhpcywgXCJDcm9uU2VydmljZVwiLCB7XG4gICAgICBjbHVzdGVyLCAvLyBSZXF1aXJlZFxuICAgICAgZGVzaXJlZENvdW50OiAxLCAvLyBEZWZhdWx0IGlzIDFcbiAgICAgIHNlcnZpY2VOYW1lOiBcImNyb25cIixcbiAgICAgIHRhc2tEZWZpbml0aW9uOiBjcm9uVGFza2RlZixcbiAgICAgIHNlY3VyaXR5R3JvdXBzOiBbdmdTZXJ2aWNlc1NlY3VyaXR5R3JvdXBdLFxuICAgICAgY2xvdWRNYXBPcHRpb25zOiB7IG5hbWU6IFwiY3JvblwiLCBjbG91ZE1hcE5hbWVzcGFjZTogbmFtZXNwYWNlIH1cbiAgICB9KVxuXG4gICAgY3JvblNlcnZpY2Uubm9kZS5hZGREZXBlbmRlbmN5KGluZGV4U2VydmljZSlcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgICAvLyBjb25zdCBkYnRhc2tkZWYgPSBuZXcgRmFyZ2F0ZVRhc2tEZWZpbml0aW9uKHRoaXMsIGNvbXBvbmVudE5hbWUoXCJkYi10YXNrZGVmXCIpLCB7XG4gICAgLy8gICBtZW1vcnlMaW1pdE1pQjogMjA0OCwgLy8gRGVmYXVsdCBpcyA1MTJcbiAgICAvLyAgIGNwdTogNTEyIC8vIERlZmF1bHQgaXMgMjU2XG4gICAgLy8gfSlcblxuICAgIC8vIGNvbnN0IGRiY29udGFpbmVyID0gZGJ0YXNrZGVmLmFkZENvbnRhaW5lcihcImRiLWNvbnRhaW5lclwiLCB7XG4gICAgLy8gICBpbWFnZTogQ29udGFpbmVySW1hZ2UuZnJvbVJlZ2lzdHJ5KFwicG9zdGdyZXM6MTIuMTBcIilcbiAgICAvLyB9KVxuXG4gICAgLy8gLy8gQ3JlYXRlIGEgc3RhbmRhcmQgRmFyZ2F0ZSBzZXJ2aWNlXG4gICAgLy8gY29uc3QgZGJzZXJ2aWNlID0gbmV3IEZhcmdhdGVTZXJ2aWNlKHRoaXMsIGNvbXBvbmVudE5hbWUoXCJkYi1zZXJ2aWNlXCIpLCB7XG4gICAgLy8gICBjbHVzdGVyLCAvLyBSZXF1aXJlZFxuICAgIC8vICAgc2VydmljZU5hbWU6IFwiZGJcIixcbiAgICAvLyAgIHRhc2tEZWZpbml0aW9uOiBkYnRhc2tkZWYsXG4gICAgLy8gICBjbG91ZE1hcE9wdGlvbnM6IHsgbmFtZTogXCJkYlwiLCBjbG91ZE1hcE5hbWVzcGFjZTogbmFtZXNwYWNlIH1cbiAgICAvLyB9KVxuXG4gICAgLy8gZGJzZXJ2aWNlLmNvbm5lY3Rpb25zLmFsbG93RnJvbShhcHBzZXJ2ZXJzZXJ2aWNlLCBlYzIuUG9ydC50Y3AoNTQzMikpXG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG4gICAgLy8gY29uc3QgZmlsZVN5c3RlbSA9IG5ldyBGaWxlU3lzdGVtKHRoaXMsIFwiRWZzXCIsIHtcbiAgICAvLyAgIHZwYyxcbiAgICAvLyAgIHBlcmZvcm1hbmNlTW9kZTogUGVyZm9ybWFuY2VNb2RlLkdFTkVSQUxfUFVSUE9TRSxcbiAgICAvLyAgIHZwY1N1Ym5ldHM6IHtcbiAgICAvLyAgICAgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFVCTElDLFxuICAgIC8vICAgICBvbmVQZXJBejogdHJ1ZSxcbiAgICAvLyAgICAgYXZhaWxhYmlsaXR5Wm9uZXM6IFt2cGMuYXZhaWxhYmlsaXR5Wm9uZXNbMF1dXG4gICAgLy8gICB9XG4gICAgLy8gfSlcblxuICAgIC8vIGNvbnN0IGFjY2Vzc1BvaW50ID0gbmV3IEFjY2Vzc1BvaW50KHRoaXMsIFwiQWNjZXNzUG9pbnRcIiwge1xuICAgIC8vICAgZmlsZVN5c3RlbVxuICAgIC8vIH0pXG5cbiAgICAvLyBjb25zdCByZWRpc3NlcnZlcnRhc2tkZWYgPSBuZXcgRmFyZ2F0ZVRhc2tEZWZpbml0aW9uKHRoaXMsIGNvbXBvbmVudE5hbWUoXCJyZWRpcy1zZXJ2ZXItdGFza2RlZlwiKSwge1xuICAgIC8vICAgbWVtb3J5TGltaXRNaUI6IDIwNDgsIC8vIERlZmF1bHQgaXMgNTEyXG4gICAgLy8gICBjcHU6IDUxMiAvLyBEZWZhdWx0IGlzIDI1NlxuICAgIC8vIH0pXG5cbiAgICAvLyBjb25zdCB2b2x1bWVOYW1lID0gXCJlZnMtcmVkaXMtZGF0YVwiXG5cbiAgICAvLyByZWRpc3NlcnZlcnRhc2tkZWYuYWRkVm9sdW1lKHtcbiAgICAvLyAgIG5hbWU6IHZvbHVtZU5hbWUsXG4gICAgLy8gICBlZnNWb2x1bWVDb25maWd1cmF0aW9uOiB7XG4gICAgLy8gICAgIGZpbGVTeXN0ZW1JZDogZmlsZVN5c3RlbS5maWxlU3lzdGVtSWQsXG4gICAgLy8gICAgIHRyYW5zaXRFbmNyeXB0aW9uOiBcIkVOQUJMRURcIixcbiAgICAvLyAgICAgYXV0aG9yaXphdGlvbkNvbmZpZzoge1xuICAgIC8vICAgICAgIGFjY2Vzc1BvaW50SWQ6IGFjY2Vzc1BvaW50LmFjY2Vzc1BvaW50SWQsXG4gICAgLy8gICAgICAgaWFtOiBcIkVOQUJMRURcIlxuICAgIC8vICAgICB9XG4gICAgLy8gICB9XG4gICAgLy8gfSlcblxuICAgIC8vIGNvbnN0IHJlZGlzc2VydmVyY29udGFpbmVyID0gcmVkaXNzZXJ2ZXJ0YXNrZGVmLmFkZENvbnRhaW5lcihcInJlZGlzLXNlcnZlclwiLCB7XG4gICAgLy8gICBpbWFnZTogQ29udGFpbmVySW1hZ2UuZnJvbVJlZ2lzdHJ5KFwicmVkaXM6Ni4yLjZcIilcbiAgICAvLyB9KVxuXG4gICAgLy8gcmVkaXNzZXJ2ZXJjb250YWluZXIuYWRkTW91bnRQb2ludHMoe1xuICAgIC8vICAgY29udGFpbmVyUGF0aDogXCIvbW91bnQvZGF0YVwiLFxuICAgIC8vICAgc291cmNlVm9sdW1lOiB2b2x1bWVOYW1lLFxuICAgIC8vICAgcmVhZE9ubHk6IGZhbHNlXG4gICAgLy8gfSlcblxuICAgIC8vIC8vIENyZWF0ZSBhIHN0YW5kYXJkIEZhcmdhdGUgc2VydmljZVxuICAgIC8vIGNvbnN0IHJlZGlzc2VydmVyc2VydmljZSA9IG5ldyBGYXJnYXRlU2VydmljZSh0aGlzLCBjb21wb25lbnROYW1lKFwicmVkaXMtc2VydmVyLXNlcnZpY2VcIiksIHtcbiAgICAvLyAgIGNsdXN0ZXIsIC8vIFJlcXVpcmVkXG4gICAgLy8gICBzZXJ2aWNlTmFtZTogXCJyZWRpcy1zZXJ2ZXJcIixcbiAgICAvLyAgIHRhc2tEZWZpbml0aW9uOiByZWRpc3NlcnZlcnRhc2tkZWYsXG4gICAgLy8gICBjbG91ZE1hcE9wdGlvbnM6IHsgbmFtZTogXCJyZWRpcy1zZXJ2ZXJcIiwgY2xvdWRNYXBOYW1lc3BhY2U6IG5hbWVzcGFjZSB9XG4gICAgLy8gfSlcblxuICAgIC8vIHJlZGlzc2VydmVydGFza2RlZi5hZGRUb1Rhc2tSb2xlUG9saWN5KFxuICAgIC8vICAgbmV3IFBvbGljeVN0YXRlbWVudCh7XG4gICAgLy8gICAgIGFjdGlvbnM6IFtcbiAgICAvLyAgICAgICBcImVsYXN0aWNmaWxlc3lzdGVtOkNsaWVudFJvb3RBY2Nlc3NcIixcbiAgICAvLyAgICAgICBcImVsYXN0aWNmaWxlc3lzdGVtOkNsaWVudFdyaXRlXCIsXG4gICAgLy8gICAgICAgXCJlbGFzdGljZmlsZXN5c3RlbTpDbGllbnRNb3VudFwiLFxuICAgIC8vICAgICAgIFwiZWxhc3RpY2ZpbGVzeXN0ZW06RGVzY3JpYmVNb3VudFRhcmdldHNcIlxuICAgIC8vICAgICBdLFxuICAgIC8vICAgICByZXNvdXJjZXM6IFtcbiAgICAvLyAgICAgICBgYXJuOmF3czplbGFzdGljZmlsZXN5c3RlbToke3Byb3BzPy5lbnY/LnJlZ2lvbiA/PyBcInVzLWVhc3QtMlwifToke3Byb3BzPy5lbnY/LmFjY291bnQgPz8gXCJcIn06ZmlsZS1zeXN0ZW0vJHtcbiAgICAvLyAgICAgICAgIGZpbGVTeXN0ZW0uZmlsZVN5c3RlbUlkXG4gICAgLy8gICAgICAgfWBcbiAgICAvLyAgICAgXVxuICAgIC8vICAgfSlcbiAgICAvLyApXG5cbiAgICAvLyByZWRpc3NlcnZlcnRhc2tkZWYuYWRkVG9UYXNrUm9sZVBvbGljeShcbiAgICAvLyAgIG5ldyBQb2xpY3lTdGF0ZW1lbnQoe1xuICAgIC8vICAgICBhY3Rpb25zOiBbXCJlYzI6RGVzY3JpYmVBdmFpbGFiaWxpdHlab25lc1wiXSxcbiAgICAvLyAgICAgcmVzb3VyY2VzOiBbXCIqXCJdXG4gICAgLy8gICB9KVxuICAgIC8vIClcblxuICAgIC8vIHJlZGlzc2VydmVyc2VydmljZS5jb25uZWN0aW9ucy5hbGxvd0Zyb20oYXBwc2VydmVyc2VydmljZSwgZWMyLlBvcnQudGNwKDYzNzkpKVxuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gICAgLy8gY29uc3QgaW5nZXN0VGFza2RlZiA9IG5ldyBGYXJnYXRlVGFza0RlZmluaXRpb24odGhpcywgXCJJbmdlc3RUYXNrZGVmXCIsIHtcbiAgICAvLyAgIG1lbW9yeUxpbWl0TWlCOiAxMDI0LCAvLyBEZWZhdWx0IGlzIDUxMlxuICAgIC8vICAgY3B1OiA1MTIgLy8gRGVmYXVsdCBpcyAyNTZcbiAgICAvLyB9KVxuXG4gICAgLy8gY29uc3QgaW5nZXN0TG9nR3JvdXAgPSBuZXcgTG9nR3JvdXAodGhpcywgXCJJbmdlc3RTZXJ2aWNlTG9nR3JvdXBcIiwge1xuICAgIC8vICAgbG9nR3JvdXBOYW1lOiBcIi9lY3MvTkFUU1NlcnZpY2VcIixcbiAgICAvLyAgIHJlbW92YWxQb2xpY3k6IFJlbW92YWxQb2xpY3kuUkVUQUlOLFxuICAgIC8vICAgcmV0ZW50aW9uOiBSZXRlbnRpb25EYXlzLk9ORV9XRUVLXG4gICAgLy8gfSlcblxuICAgIC8vIGNvbnN0IGluZ2VzdExvZ0RyaXZlciA9IG5ldyBBd3NMb2dEcml2ZXIoe1xuICAgIC8vICAgbG9nR3JvdXA6IHNlcnZpY2VMb2dHcm91cCxcbiAgICAvLyAgIHN0cmVhbVByZWZpeDogXCJJbmdlc3RTZXJ2aWNlXCJcbiAgICAvLyB9KVxuXG4gICAgLy8gY29uc3QgaW5nZXN0Q29udGFpbmVyID0gaW5nZXN0VGFza2RlZi5hZGRDb250YWluZXIoXCJJbmdlc3RDb250YWluZXJcIiwge1xuICAgIC8vICAgaW1hZ2U6IENvbnRhaW5lckltYWdlLmZyb21SZWdpc3RyeShcIm5hdHM6Mi43LjJcIiksXG4gICAgLy8gICBjb21tYW5kOiBbXCItbVwiLCBcIjgyMjJcIiwgXCItLWRlYnVnXCJdLFxuICAgIC8vICAgbG9nZ2luZzogbmF0c0xvZ0RyaXZlclxuICAgIC8vIH0pXG5cbiAgICAvLyAvLyBDcmVhdGUgYSBzdGFuZGFyZCBGYXJnYXRlIHNlcnZpY2VcbiAgICAvLyBjb25zdCBuYXRzU2VydmljZSA9IG5ldyBGYXJnYXRlU2VydmljZSh0aGlzLCBcIk5hdHNTZXJ2aWNlXCIsIHtcbiAgICAvLyAgIGNsdXN0ZXIsIC8vIFJlcXVpcmVkXG4gICAgLy8gICBzZXJ2aWNlTmFtZTogXCJuYXRzXCIsXG4gICAgLy8gICB0YXNrRGVmaW5pdGlvbjogbmF0c1Rhc2tkZWYsXG4gICAgLy8gICBjbG91ZE1hcE9wdGlvbnM6IHsgbmFtZTogXCJuYXRzXCIsIGNsb3VkTWFwTmFtZXNwYWNlOiBuYW1lc3BhY2UgfVxuICAgIC8vIH0pXG5cbiAgICAvLyBuYXRzU2VydmljZS5jb25uZWN0aW9ucy5hbGxvd0Zyb20od3NTZXJ2aWNlLnNlcnZpY2UsIGVjMi5Qb3J0LnRjcCg0MjIyKSwgXCJOQVRTIHRyYW5zcG9ydCBwb3J0IGFzc2lnbm1lbnRcIilcbiAgICAvLyBuYXRzU2VydmljZS5jb25uZWN0aW9ucy5hbGxvd0Zyb20oXG4gICAgLy8gICB3c1NlcnZpY2Uuc2VydmljZSxcbiAgICAvLyAgIGVjMi5Qb3J0LnRjcCg4MjIyKSxcbiAgICAvLyAgIFwiTkFUUyB0cmFuc3BvcnQgbWFuYWdlbWVudCBwb3J0IGFzc2lnbm1lbnRcIlxuICAgIC8vIClcblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICAgIGNvbnN0IG5hdHNUYXNrZGVmID0gbmV3IEZhcmdhdGVUYXNrRGVmaW5pdGlvbih0aGlzLCBcIk5hdHNUYXNrZGVmXCIsIHtcbiAgICAgIG1lbW9yeUxpbWl0TWlCOiAxMDI0LCAvLyBEZWZhdWx0IGlzIDUxMlxuICAgICAgY3B1OiA1MTIgLy8gRGVmYXVsdCBpcyAyNTZcbiAgICB9KVxuXG4gICAgY29uc3QgbmF0c0xvZ0dyb3VwID0gbmV3IExvZ0dyb3VwKHRoaXMsIFwiTkFUU1NlcnZpY2VMb2dHcm91cFwiLCB7XG4gICAgICByZW1vdmFsUG9saWN5OiBSZW1vdmFsUG9saWN5LlJFVEFJTixcbiAgICAgIHJldGVudGlvbjogUmV0ZW50aW9uRGF5cy5PTkVfV0VFS1xuICAgIH0pXG5cbiAgICAvKiBGYXJnYXRlIG9ubHkgc3VwcG9ydCBhd3Nsb2cgZHJpdmVyICovXG4gICAgY29uc3QgbmF0c0xvZ0RyaXZlciA9IG5ldyBBd3NMb2dEcml2ZXIoe1xuICAgICAgbG9nR3JvdXA6IHNlcnZpY2VMb2dHcm91cCxcbiAgICAgIHN0cmVhbVByZWZpeDogXCJOQVRTU2VydmljZVwiXG4gICAgfSlcblxuICAgIGNvbnN0IG5hdHNDb250YWluZXIgPSBuYXRzVGFza2RlZi5hZGRDb250YWluZXIoXCJOYXRzQ29udGFpbmVyXCIsIHtcbiAgICAgIGltYWdlOiBDb250YWluZXJJbWFnZS5mcm9tUmVnaXN0cnkoXCJuYXRzOjIuNy4yXCIpLFxuICAgICAgY29tbWFuZDogW1wiLW1cIiwgXCI4MjIyXCIsIFwiLS1kZWJ1Z1wiXSxcbiAgICAgIGxvZ2dpbmc6IG5hdHNMb2dEcml2ZXJcbiAgICB9KVxuXG4gICAgLy8gQ3JlYXRlIGEgc3RhbmRhcmQgRmFyZ2F0ZSBzZXJ2aWNlXG4gICAgY29uc3QgbmF0c1NlcnZpY2UgPSBuZXcgRmFyZ2F0ZVNlcnZpY2UodGhpcywgXCJOYXRzU2VydmljZVwiLCB7XG4gICAgICBjbHVzdGVyLCAvLyBSZXF1aXJlZFxuICAgICAgc2VydmljZU5hbWU6IFwibmF0c1wiLFxuICAgICAgdGFza0RlZmluaXRpb246IG5hdHNUYXNrZGVmLFxuICAgICAgY2xvdWRNYXBPcHRpb25zOiB7IG5hbWU6IFwibmF0c1wiLCBjbG91ZE1hcE5hbWVzcGFjZTogbmFtZXNwYWNlIH1cbiAgICB9KVxuXG4gICAgbmF0c1NlcnZpY2UuY29ubmVjdGlvbnMuYWxsb3dGcm9tKGRhdGFQaXBlbGluZVNlcnZpY2UsIGVjMi5Qb3J0LnRjcCg0MjIyKSwgXCJOQVRTIHRyYW5zcG9ydCBwb3J0IGFzc2lnbm1lbnRcIilcbiAgICBuYXRzU2VydmljZS5jb25uZWN0aW9ucy5hbGxvd0Zyb20oY3JvblNlcnZpY2UsIGVjMi5Qb3J0LnRjcCg0MjIyKSwgXCJOQVRTIHRyYW5zcG9ydCBwb3J0IGFzc2lnbm1lbnRcIilcbiAgICBuYXRzU2VydmljZS5jb25uZWN0aW9ucy5hbGxvd0Zyb20ocmF0ZVNlcnZpY2UsIGVjMi5Qb3J0LnRjcCg0MjIyKSwgXCJOQVRTIHRyYW5zcG9ydCBwb3J0IGFzc2lnbm1lbnRcIilcbiAgICBuYXRzU2VydmljZS5jb25uZWN0aW9ucy5hbGxvd0Zyb20oaW5zdHJ1bWVudEluZm9TZXJ2aWNlLCBlYzIuUG9ydC50Y3AoNDIyMiksIFwiTkFUUyB0cmFuc3BvcnQgcG9ydCBhc3NpZ25tZW50XCIpXG4gICAgbmF0c1NlcnZpY2UuY29ubmVjdGlvbnMuYWxsb3dGcm9tKGluZ2VzdFNlcnZpY2UsIGVjMi5Qb3J0LnRjcCg0MjIyKSwgXCJOQVRTIHRyYW5zcG9ydCBwb3J0IGFzc2lnbm1lbnRcIilcbiAgICBuYXRzU2VydmljZS5jb25uZWN0aW9ucy5hbGxvd0Zyb20oaW5kZXhTZXJ2aWNlLCBlYzIuUG9ydC50Y3AoNDIyMiksIFwiTkFUUyB0cmFuc3BvcnQgcG9ydCBhc3NpZ25tZW50XCIpXG4gICAgbmF0c1NlcnZpY2UuY29ubmVjdGlvbnMuYWxsb3dGcm9tKHdzU2VydmljZS5zZXJ2aWNlLCBlYzIuUG9ydC50Y3AoNDIyMiksIFwiTkFUUyB0cmFuc3BvcnQgcG9ydCBhc3NpZ25tZW50XCIpXG4gICAgbmF0c1NlcnZpY2UuY29ubmVjdGlvbnMuYWxsb3dGcm9tKFxuICAgICAgdmdTZXJ2aWNlc1NlY3VyaXR5R3JvdXAsXG4gICAgICBlYzIuUG9ydC50Y3AoODIyMiksXG4gICAgICBcIk5BVFMgdHJhbnNwb3J0IG1hbmFnZW1lbnQgcG9ydCBhc3NpZ25tZW50XCJcbiAgICApXG5cbiAgICAvLyB5ZWxiYXBwc2VydmVyc2VydmljZS5jb25uZWN0aW9ucy5hbGxvd0Zyb20oeWVsYnVpc2VydmljZS5zZXJ2aWNlLCBlYzIuUG9ydC50Y3AoNDU2NykpXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gICAgLy8gY29uc3QgcXVldWUgPSBuZXcgc3FzLlF1ZXVlKHRoaXMsICdDZGtRdWV1ZScsIHtcbiAgICAvLyAgIHZpc2liaWxpdHlUaW1lb3V0OiBEdXJhdGlvbi5zZWNvbmRzKDMwMClcbiAgICAvLyB9KTtcblxuICAgIC8vIGNvbnN0IHRvcGljID0gbmV3IHNucy5Ub3BpYyh0aGlzLCAnQ2RrVG9waWMnKTtcblxuICAgIC8vIHRvcGljLmFkZFN1YnNjcmlwdGlvbihuZXcgc3Vicy5TcXNTdWJzY3JpcHRpb24ocXVldWUpKTtcbiAgfVxufVxuIl19