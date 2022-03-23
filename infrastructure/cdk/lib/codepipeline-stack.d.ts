import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
export interface VgCodePipelineStackProps extends cdk.StackProps {
    gitBranch: string;
}
export declare class VgCodePipelineStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: VgCodePipelineStackProps);
}
