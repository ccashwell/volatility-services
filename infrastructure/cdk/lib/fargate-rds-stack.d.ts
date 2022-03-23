import { NestedStack, NestedStackProps } from "aws-cdk-lib";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { CfnDBCluster } from "aws-cdk-lib/aws-rds";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
export interface VgFargateRdsNestedStackProps extends NestedStackProps {
    vpc: Vpc;
    stage: "dev" | "stage" | "prod";
}
export declare class VgFargateRdsNestedStack extends NestedStack {
    readonly rdsCluster: CfnDBCluster;
    readonly databaseCredentialsSecret: Secret;
    constructor(scope: Construct, id: string, props?: VgFargateRdsNestedStackProps);
}
