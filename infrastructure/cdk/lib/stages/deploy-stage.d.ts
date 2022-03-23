import { Artifact } from "aws-cdk-lib/aws-codepipeline";
import { CodeDeployEcsDeployAction, EcsDeployAction } from "aws-cdk-lib/aws-codepipeline-actions";
import { Stack } from "aws-cdk-lib/core";
export declare class DeployStage {
    private readonly stack;
    private readonly appName;
    constructor(stack: Stack);
    getCodeDeployEcsDeployAction: (env: string, buildArtifact: Artifact) => CodeDeployEcsDeployAction;
    getEcsDeployAction: (env: string, buildArtifact: Artifact) => EcsDeployAction;
    private getDeployEnvDetails;
}
