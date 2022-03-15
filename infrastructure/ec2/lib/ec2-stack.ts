import { Stack, StackProps } from "aws-cdk-lib"
import { AutoScalingGroup, HealthCheck } from "aws-cdk-lib/aws-autoscaling"
import { Certificate, CertificateValidation } from "aws-cdk-lib/aws-certificatemanager"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import { ApplicationLoadBalancer, ApplicationProtocol, SslPolicy } from "aws-cdk-lib/aws-elasticloadbalancingv2"
import { Role } from "aws-cdk-lib/aws-iam"
import { ARecord, CrossAccountZoneDelegationRecord, PublicHostedZone, RecordTarget } from "aws-cdk-lib/aws-route53"
import { LoadBalancerTarget } from "aws-cdk-lib/aws-route53-targets"
import { Construct } from "constructs"
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class Ec2Stack extends Stack {
  readonly aRecord: ARecord

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

    const vpc = new ec2.Vpc(this, "Vpc", {
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

    const sg = new ec2.SecurityGroup(this, "VgServicesSecurityGroup", {
      vpc,
      allowAllOutbound: true,
      description: "security group for volatility services ec2 instance"
    })

    const lb = new ApplicationLoadBalancer(this, "LB", {
      vpc,
      internetFacing: true,
      http2Enabled: true
      // vpcSubnets: vpc.publicSubnets.map(subnet => subnet.subnetId)
    })

    sg.addIngressRule(ec2.Peer.ipv4("71.10.62.5/32"), ec2.Port.tcp(22), "allow SSH access from anywhere")

    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), "allow HTTP traffic from anywhere")

    // webserverSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), "allow HTTPS traffic from anywhere")

    sg.addIngressRule(ec2.Peer.ipv4("10.0.0.0/16"), ec2.Port.allIcmp(), "allow ICMP traffic from a specific IP range")

    const userData = ec2.UserData.forLinux()
    userData.addCommands(
      "sudo su",
      "amazon-linux-extras install docker",
      "yum install -y git",
      "service docker start",
      "usermod -a -G docker ec2-user",
      "chkconfig docker on",
      "curl -L https://github.com/docker/compose/releases/download/1.22.0/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose",
      "chmod +x /usr/local/bin/docker-compose",
      "yum install -y https://s3.region.amazonaws.com/amazon-ssm-region/latest/linux_amd64/amazon-ssm-agent.rpm",
      "systemctl enable amazon-ssm-agent",
      "systemctl start amazon-ssm-agent",
      'echo "Hello World" > /var/www/html/index.html',
      "docker-compose version"
    )

    const httpsListener = lb.addListener("ALBListenerHttps", {
      certificates: [certificate],
      protocol: ApplicationProtocol.HTTPS,
      port: 443,
      sslPolicy: SslPolicy.TLS12
    })

    const asg = new AutoScalingGroup(this, "AutoScalingGroup", {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.LARGE),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
      }),
      allowAllOutbound: true,
      healthCheck: HealthCheck.ec2(),
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_NAT },
      securityGroup: sg,
      userData,
      minCapacity: 1,
      maxCapacity: 2
      //role:
    })

    httpsListener.addTargets("TargetGroup", {
      port: 80,
      protocol: ApplicationProtocol.HTTP,
      targets: [asg],
      healthCheck: {
        path: "/",
        port: "80",
        healthyHttpCodes: "200"
      }
    })

    this.aRecord = new ARecord(this, "AliasRecord", {
      zone: subZone,
      target: RecordTarget.fromAlias(new LoadBalancerTarget(lb)),
      recordName: "api.dev.volatility.com"
    })
    // listener.addTargets("default-target", {
    //   port: 80,
    //   targets: [asg],
    //   healthCheck: {
    //     path: "/",
    //     unhealthyThresholdCount: 2,
    //     healthyThresholdCount: 5,
    //     interval: cdk.Duration.seconds(30)
    //   }
    // })

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'Ec2Queue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
