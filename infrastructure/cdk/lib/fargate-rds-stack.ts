import { CfnOutput, NestedStack, NestedStackProps } from "aws-cdk-lib"
import { Peer, Port, SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2"
import { CfnDBCluster, CfnDBSubnetGroup } from "aws-cdk-lib/aws-rds"
import { Secret } from "aws-cdk-lib/aws-secretsmanager"
import { StringParameter } from "aws-cdk-lib/aws-ssm"
import { Construct } from "constructs"

export interface VgFargateRdsNestedStackProps extends NestedStackProps {
  vpc: Vpc
  stage: "dev" | "stage" | "prod"
}

export class VgFargateRdsNestedStack extends NestedStack {
  public readonly rdsCluster: CfnDBCluster
  public readonly databaseCredentialsSecret: Secret

  constructor(scope: Construct, id: string, props?: VgFargateRdsNestedStackProps) {
    super(scope, id, props)

    const serviceName = "volatility-services"
    const databaseName = "volatility-rds"
    const databaseUsername = "volatility"
    const stage = props?.stage as string
    const vpc = props?.vpc as Vpc
    const subnetIds = vpc?.isolatedSubnets.map(subnet => subnet.subnetId) ?? []
    const dbSubnetGroup: CfnDBSubnetGroup = new CfnDBSubnetGroup(this, "AuroraSubnetGroup", {
      dbSubnetGroupDescription: "Subnet group to access aurora",
      dbSubnetGroupName: "aurora-serverless-subnet-group",
      subnetIds
    })

    this.databaseCredentialsSecret = new Secret(this, "DBCredentialsSecret", {
      secretName: `${serviceName}-${stage}-credentials`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: databaseUsername
        }),
        excludePunctuation: true,
        includeSpace: false,
        generateStringKey: "password"
      }
    })

    new StringParameter(this, "DBCredentialsArn", {
      parameterName: `${serviceName}-${stage}-credentials-arn`,
      stringValue: this.databaseCredentialsSecret.secretArn
    })

    const dbClusterSecurityGroup = new SecurityGroup(this, "DBClusterSecurityGroup", { vpc })
    // A better security approach would be allow ingress from private subnet only
    // but I haven't been able to get the ipv4 cidr block of subnets in aws-cwk
    dbClusterSecurityGroup.addIngressRule(Peer.ipv4("10.0.0.0/16"), Port.tcp(5432))

    const dbConfig = {
      dbClusterIdentifier: `${serviceName}-${stage}-cluster`,
      engineMode: "serverless",
      engine: "aurora-postgresql",
      engineVersion: "10.7",
      databaseName,
      masterUsername: this.databaseCredentialsSecret.secretValueFromJson("username").toString(),
      masterUserPassword: this.databaseCredentialsSecret.secretValueFromJson("password").toString(),
      // Note: aurora serverless cluster can be accessed within its VPC only
      // https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless.html
      dbSubnetGroupName: dbSubnetGroup.dbSubnetGroupName,
      scalingConfiguration: {
        autoPause: true,
        maxCapacity: 2,
        minCapacity: 2,
        secondsUntilAutoPause: 3600
      },
      vpcSecurityGroupIds: [dbClusterSecurityGroup.securityGroupId]
    }

    // const cluster = new ServerlessCluster(this, "AuroraCluster", {
    //   engine: DatabaseClusterEngine.AURORA_POSTGRESQL,
    //   parameterGroup: ParameterGroup.fromParameterGroupName(this, "ParameterGroup", "default.aurora-postgresql10"),
    //   defaultDatabaseName: databaseName,
    //   vpc,
    //   secret: this.databaseCredentialsSecret,
    //   // credentials: Credentials.fromGeneratedSecret(this.databaseCredentialsSecret.secretValueFromJson("username").toString(),
    //   // ) this.databaseCredentialsSecret,
    //   scaling: { autoPause: Duration.seconds(3600), minCapacity: 1, maxCapacity: 2 } // Optional. If not set, then instance will pause after 5 minutes
    // })

    this.rdsCluster = new CfnDBCluster(this, "DBCluster", dbConfig)
    this.rdsCluster.addDependsOn(dbSubnetGroup)

    new CfnOutput(this, "rdsCluster", {
      value: this.rdsCluster.attrEndpointAddress,
      description: "The endpoint of the rds cluster",
      exportName: "rdsClusterAttrEndpointAddress"
    })

    // const cluster = new Cluster(this, "Cluster", { vpc })
    // const loadBalancedService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "FargateService", {
    //   cluster,
    //   taskImageOptions: {
    //     image: ecs.ContainerImage.fromRegistry("billykong/express-database-checker"),
    //     environment: {
    //       DATABASE_HOST: rdsCluster.attrEndpointAddress,
    //       DATABASE_NAME: databaseName,
    //       // TODO: use secret instead of environment
    //       DATABASE_USERNAME: databaseCredentialsSecret.secretValueFromJson("username").toString(),
    //       DATABASE_PASSWORD: databaseCredentialsSecret.secretValueFromJson("password").toString()
    //     }
    //   }
    // })
  }
}
