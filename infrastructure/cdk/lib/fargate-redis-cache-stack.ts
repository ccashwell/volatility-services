import { NestedStack, NestedStackProps } from "aws-cdk-lib"
import { ISecurityGroup, ISubnet, SecurityGroup, Subnet } from "aws-cdk-lib/aws-ec2"
import { CfnCacheCluster, CfnSubnetGroup } from "aws-cdk-lib/aws-elasticache"
import { Construct } from "constructs"

export interface VgFargateRedisNestedStackProps extends NestedStackProps {
  // vpc: Vpc
  // stage: "dev" | "stage" | "prod"
  securityGroups: ISecurityGroup[]
  subnets: ISubnet[]
}

export class VgFargateRedisCacheNestedStack extends NestedStack {
  readonly redisCluster: CfnCacheCluster

  constructor(scope: Construct, id: string, props?: VgFargateRedisNestedStackProps) {
    super(scope, id, props)

    // const stage = props?.stage as string
    // const vpc = props?.vpc as Vpc
    const securityGroups = props?.securityGroups as SecurityGroup[]
    const subnets = props?.subnets as Subnet[]
    const subnetGroup = new CfnSubnetGroup(this, "RedisClusterPrivateSubnetGroup", {
      cacheSubnetGroupName: "data-cache",
      subnetIds: subnets.map(subnet => subnet.subnetId),
      description: "Subnets for RedisCache"
    })
    this.redisCluster = new CfnCacheCluster(this, "RedisCluster", {
      engine: "redis",
      cacheNodeType: "cache.t2.small",
      numCacheNodes: 1,
      clusterName: "redis-cluster",
      vpcSecurityGroupIds: securityGroups.map(sg => sg.securityGroupId),
      cacheSubnetGroupName: subnetGroup.cacheSubnetGroupName
    })

    this.redisCluster.addDependsOn(subnetGroup)
  }
}
