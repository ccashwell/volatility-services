import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { IEnv, PlatformAccount } from "./types";
interface VgPipelineAppStageProps extends cdk.StackProps {
    env: IEnv;
    platformAccount: PlatformAccount;
}
export declare class VgPipelineAppStage extends cdk.Stage {
    constructor(scope: Construct, id: string, props: VgPipelineAppStageProps);
}
export {};
