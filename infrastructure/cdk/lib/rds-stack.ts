import { Stack, StackProps } from "aws-cdk-lib"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import { Repository } from "aws-cdk-lib/aws-ecr"
import * as rds from "aws-cdk-lib/aws-rds"
import { Construct } from "constructs"
import { IEnv, RdsSupportPlatforms } from "./types"

interface RdsStackProps extends StackProps {
  env: IEnv
  platform: RdsSupportPlatforms
  vpc: ec2.IVpc
}

interface RdsEc2InstanceMap {
  instanceType: ec2.InstanceType
  multiAz: boolean
  storageType: rds.StorageType
}

const ec2InstanceMap: Record<RdsSupportPlatforms, RdsEc2InstanceMap> = {
  devplatform: {
    multiAz: false,
    instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
    storageType: rds.StorageType.STANDARD
  },
  stageplatform: {
    multiAz: true,
    instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
    storageType: rds.StorageType.GP2
  },
  prodplatform: {
    multiAz: true,
    instanceType: ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.LARGE),
    storageType: rds.StorageType.GP2
  }
}

export class RdsStack extends Stack {
  readonly ecrRepository: Repository

  constructor(scope: Construct, id: string, props: RdsStackProps) {
    super(scope, id, props)

    const cfg = ec2InstanceMap[props.platform]
    const cluster = new rds.DatabaseCluster(this, "Database", {
      engine: rds.DatabaseClusterEngine.AURORA,
      // engine: rds.DatabaseClusterEngine.auroraPostgres({ version: rds.AuroraPostgresEngineVersion.VER_13_4 }),
      credentials: rds.Credentials.fromGeneratedSecret("volatility"),
      storageEncrypted: true,
      copyTagsToSnapshot: true,
      defaultDatabaseName: "volatility",
      instanceProps: {
        vpc: props.vpc,
        instanceType: cfg.instanceType,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        }
      }
    })
    const cpuUtilization = cluster.metricCPUUtilization()
    const dbConnectionUtilization = cluster.metricDatabaseConnections()
    const freeLocalStorage = cluster.metricFreeLocalStorage()

    //const readLatency = instance.metric("ReadLatency", { statistic: "Average", period: Duration.seconds(60) })
  }
}
