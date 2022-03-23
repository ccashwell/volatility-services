import { Stack } from "aws-cdk-lib";
import { Artifact } from "aws-cdk-lib/aws-codepipeline";
import { CodeCommitSourceAction } from "aws-cdk-lib/aws-codepipeline-actions";
export declare class SourceStage {
    private readonly repository;
    private stack;
    private readonly sourceOutput;
    constructor(stack: Stack);
    getCodeCommitSourceAction: () => CodeCommitSourceAction;
    getSourceOutput: () => Artifact;
}
