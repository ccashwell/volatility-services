import { Artifact } from "aws-cdk-lib/aws-codepipeline";
import { CodeBuildAction } from "aws-cdk-lib/aws-codepipeline-actions";
import { Stack } from "aws-cdk-lib/core";
export declare class BuildStage {
    private readonly stack;
    private readonly appName;
    private readonly ecrRepository;
    private readonly buildOutput;
    constructor(stack: Stack);
    getCodeBuildAction: (sourceOutput: Artifact) => CodeBuildAction;
    getBuildOutput: () => Artifact;
    private createCodeBuildProject;
    private getEnvironmentVariables;
}
