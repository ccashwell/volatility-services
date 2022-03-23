import { NestedStack, NestedStackProps } from "aws-cdk-lib";
import { ISecurityGroup, ISubnet } from "aws-cdk-lib/aws-ec2";
import { CfnCacheCluster } from "aws-cdk-lib/aws-elasticache";
import { Construct } from "constructs";
export interface VgFargateRedisNestedStackProps extends NestedStackProps {
    securityGroups: ISecurityGroup[];
    subnets: ISubnet[];
}
export declare class VgFargateRedisCacheNestedStack extends NestedStack {
    readonly redisCluster: CfnCacheCluster;
    constructor(scope: Construct, id: string, props?: VgFargateRedisNestedStackProps);
}
