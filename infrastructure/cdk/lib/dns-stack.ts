import { Stack, StackProps } from "aws-cdk-lib"
// import * as ecs from "aws-cdk-lib/aws-ecs"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import { Cluster, ContainerImage, FargateService, FargateTaskDefinition, LogDrivers } from "aws-cdk-lib/aws-ecs"
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns"
import { AccountPrincipal } from "aws-cdk-lib/aws-iam"
import { PublicHostedZone } from "aws-cdk-lib/aws-route53"
import * as servicediscovery from "aws-cdk-lib/aws-servicediscovery"
import { Construct } from "constructs"
import { stackPrefix } from "../functions/stack_prefix"
import { getEnv } from "../functions/utils"

export class VgDnsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const dnsEnv = getEnv(scope, "dns")
    const devEnv = getEnv(scope, "dev")
    const prodEnv = getEnv(scope, "prod")
    const stageEnv = getEnv(scope, "stage")
    const componentName = stackPrefix("vg", dnsEnv.environment, dnsEnv.stage)

    new PublicHostedZone(this, componentName("DevHostedZone"), {
      zoneName: devEnv.domain as string,
      crossAccountZoneDelegationPrincipal: new AccountPrincipal(devEnv.account)
    })

    new PublicHostedZone(this, componentName("ProdHostedZone"), {
      zoneName: prodEnv.domain as string,
      crossAccountZoneDelegationPrincipal: new AccountPrincipal(prodEnv.account)
    })

    new PublicHostedZone(this, componentName("HostedZone"), {
      zoneName: stageEnv.domain as string,
      crossAccountZoneDelegationPrincipal: new AccountPrincipal(stageEnv.account)
    })

    // const env = getEnv(scope, "devplatform")
    // const componentName = stackPrefix("vg", env.environment, env.stage)

    // if (env.stage === "dns") {
    //   const devEnv = getEnv(scope, "devplatform")
    //   const parentZone = new PublicHostedZone(this, componentName("HostedZone"), {
    //     zoneName: devEnv.domain as string,
    //     crossAccountZoneDelegationPrincipal: new AccountPrincipal(devEnv.account)
    //   })

    //   return
    // }

    // const subZone = new PublicHostedZone(this, componentName("SubZone"), {
    //   zoneName: env.domain as string
    // })

    // // import the delegation role by constructing the roleArn
    // const delegationRoleArn = Stack.of(this).formatArn({
    //   region: "", // IAM is global in each partition
    //   service: "iam",
    //   account: dnsEnv.account,
    //   resource: "role",
    //   resourceName: "MyDelegationRole"
    // })

    // const delegationRole = Role.fromRoleArn(this, "DelegationRole", delegationRoleArn)

    // // create the record
    // new CrossAccountZoneDelegationRecord(this, "delegate", {
    //   delegatedZone: subZone,
    //   parentHostedZoneName: dnsEnv.domain, // or you can use parentHostedZoneId
    //   delegationRole
    // })

    // const domainZone = HostedZone.fromLookup(this, "Zone", { domainName: "volatility.com" })
    // const certificate = Certificate.fromCertificateArn(this, "Cert", "arn:aws:acm:us-east-1:123456:certificate/abcdefg")

    const vpc = new ec2.Vpc(this, componentName("vpc"), {})

    const cluster = new Cluster(this, componentName("cluster"), {
      clusterName: "vg-services-cluster",
      vpc
    })

    const namespace = new servicediscovery.PrivateDnsNamespace(this, "Namespace", {
      name: "volatility.local",
      vpc
    })

    // ------------------------------------------------------------------------------------------------- //
    const wstaskdef = new FargateTaskDefinition(this, componentName("ws-taskdef"), {
      memoryLimitMiB: 2048, // Default is 512
      cpu: 512 // Default is 256
    })

    const wscontainer = wstaskdef.addContainer("ws-container", {
      // image: ContainerImage.fromRegistry("compose-pipeline-volatility-services:latest"),
      image: ContainerImage.fromAsset("../.."),
      environment: { SEARCH_DOMAIN: namespace.namespaceName },
      logging: LogDrivers.awsLogs({ streamPrefix: "vg-services-log-group", logRetention: 7 })
    })

    wscontainer.addPortMappings({
      containerPort: 80
    })

    // Create a load-balanced Fargate service and make it public
    const wsservice = new ecsPatterns.ApplicationLoadBalancedFargateService(this, componentName("ws-service"), {
      cluster, // Required
      // taskImageOptions: {
      //   image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
      // },
      // targetGroups: [

      // ],
      // redirectHTTP: true,
      // targetProtocol: ApplicationProtocol.HTTPS,
      // recordType: "dev.volatility.com",
      // sslPolicy: SslPolicy.RECOMMENDED,
      // domainName: "api.dev.volatility.com",
      desiredCount: 1, // Default is 1
      publicLoadBalancer: true, // Default is false
      serviceName: "ws",
      taskDefinition: wstaskdef,
      cloudMapOptions: { name: "ws", cloudMapNamespace: namespace }
    })

    // ------------------------------------------------------------------------------------------------- //

    // ------------------------------------------------------------------------------------------------- //

    const appservertaskdef = new FargateTaskDefinition(this, componentName("appserver-taskdef"), {
      memoryLimitMiB: 2048, // Default is 512
      cpu: 512 // Default is 256
    })

    const appservercontainer = appservertaskdef.addContainer("appserver-container", {
      image: ContainerImage.fromRegistry("mreferre/yelb-appserver:0.5"),
      environment: { SEARCH_DOMAIN: namespace.namespaceName }
    })

    // Create a standard Fargate service
    const appserverservice = new FargateService(this, componentName("appserver-service"), {
      cluster, // Required
      desiredCount: 1, // Default is 1
      serviceName: "appserver",
      taskDefinition: appservertaskdef,
      cloudMapOptions: { name: "appserver", cloudMapNamespace: namespace }
    })

    appserverservice.connections.allowFrom(wsservice.service, ec2.Port.tcp(4567))

    // -------------------------  ------------------------------------------------------------------------ //

    // ------------------------------------------------------------------------------------------------- //

    const dbtaskdef = new FargateTaskDefinition(this, componentName("db-taskdef"), {
      memoryLimitMiB: 2048, // Default is 512
      cpu: 512 // Default is 256
    })

    const dbcontainer = dbtaskdef.addContainer("db-container", {
      image: ContainerImage.fromRegistry("postgres:12.10")
    })

    // Create a standard Fargate service
    const dbservice = new FargateService(this, componentName("db-service"), {
      cluster, // Required
      serviceName: "db",
      taskDefinition: dbtaskdef,
      cloudMapOptions: { name: "db", cloudMapNamespace: namespace }
    })

    dbservice.connections.allowFrom(appserverservice, ec2.Port.tcp(5432))

    // ------------------------------------------------------------------------------------------------- //

    // ------------------------------------------------------------------------------------------------- //

    const redisservertaskdef = new FargateTaskDefinition(this, componentName("redis-server-taskdef"), {
      memoryLimitMiB: 2048, // Default is 512
      cpu: 512 // Default is 256
    })

    const redisservercontainer = redisservertaskdef.addContainer("redis-server", {
      image: ContainerImage.fromRegistry("redis:6.2.6")
    })

    // Create a standard Fargate service
    const redisserverservice = new FargateService(this, componentName("redis-server-service"), {
      cluster, // Required
      serviceName: "redis-server",
      taskDefinition: redisservertaskdef,
      cloudMapOptions: { name: "redis-server", cloudMapNamespace: namespace }
    })

    redisserverservice.connections.allowFrom(appserverservice, ec2.Port.tcp(6379))

    // ------------------------------------------------------------------------------------------------- //

    // ------------------------------------------------------------------------------------------------- //

    const natsservertaskdef = new FargateTaskDefinition(this, componentName("nats-server-taskdef"), {
      memoryLimitMiB: 1024, // Default is 512
      cpu: 512 // Default is 256
    })

    const natsservercontainer = natsservertaskdef.addContainer("nats-server", {
      image: ContainerImage.fromRegistry("nats:2.7.2")
    })

    // Create a standard Fargate service
    const natsserverservice = new FargateService(this, componentName("nats-server-service"), {
      cluster, // Required
      serviceName: "nats-server",
      taskDefinition: natsservertaskdef,
      cloudMapOptions: { name: "nats-server", cloudMapNamespace: namespace }
    })

    natsserverservice.connections.allowFrom(natsserverservice, ec2.Port.tcp(4222))

    // ------------------------------------------------------------------------------------------------- //

    // const queue = new sqs.Queue(this, 'CdkQueue', {
    //   visibilityTimeout: Duration.seconds(300)
    // });

    // const topic = new sns.Topic(this, 'CdkTopic');

    // topic.addSubscription(new subs.SqsSubscription(queue));
  }
}
