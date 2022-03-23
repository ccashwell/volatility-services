import { ManualApprovalAction } from "aws-cdk-lib/aws-codepipeline-actions";
import { Stack } from "aws-cdk-lib/core";
export declare class ApprovalStage {
    private readonly stack;
    private readonly appName;
    constructor(stack: Stack);
    getManualApprovalAction: () => ManualApprovalAction;
}
