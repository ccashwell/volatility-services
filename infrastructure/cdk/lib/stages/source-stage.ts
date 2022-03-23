import { Stack } from "aws-cdk-lib"
import { IRepository, Repository } from "aws-cdk-lib/aws-codecommit"
import { Artifact } from "aws-cdk-lib/aws-codepipeline"
import { CodeCommitSourceAction } from "aws-cdk-lib/aws-codepipeline-actions"
import { PipelineConfig } from "../../config/pipleline-config"

export class SourceStage {
  private readonly repository: IRepository
  private stack: Stack
  private readonly sourceOutput: Artifact

  constructor(stack: Stack) {
    const appName = stack.node.tryGetContext("appName") as string
    this.stack = stack
    this.sourceOutput = new Artifact()
    this.repository = Repository.fromRepositoryName(
      stack,
      `${appName}-${PipelineConfig.sourceStage.repositoryName}`,
      PipelineConfig.sourceStage.repositoryName
    )
  }

  public getCodeCommitSourceAction = (): CodeCommitSourceAction => {
    return new CodeCommitSourceAction({
      actionName: "Source-Action",
      output: this.sourceOutput,
      repository: this.repository
    })
  }

  public getSourceOutput = (): Artifact => {
    return this.sourceOutput
  }
}
