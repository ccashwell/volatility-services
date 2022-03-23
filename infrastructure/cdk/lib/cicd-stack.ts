import { Stack, StackProps } from "aws-cdk-lib"
import { Pipeline } from "aws-cdk-lib/aws-codepipeline"
import { Repository } from "aws-cdk-lib/aws-ecr"
import { Construct } from "constructs"
import { PipelineConfig } from "../config/pipleline-config"
import { PipelineNotification } from "./notifications/pipeline-notification"
import { ApprovalStage } from "./stages/approval-stage"
import { BuildStage } from "./stages/build-stage"
import { DeployStage } from "./stages/deploy-stage"
import { SourceStage } from "./stages/source-stage"

export class CicdStack extends Stack {
  readonly ecrRepository: Repository

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const appName = scope.node.tryGetContext("appName") as string

    const codepipeline = new Pipeline(this, appName, {
      crossAccountKeys: true
    })

    //Source Stage
    const sourceStage = new SourceStage(this)
    codepipeline.addStage({
      stageName: "Source",
      actions: [sourceStage.getCodeCommitSourceAction()]
    })

    //Build Stage
    const buildStage = new BuildStage(this)
    codepipeline.addStage({
      stageName: "Build",
      actions: [buildStage.getCodeBuildAction(sourceStage.getSourceOutput())]
    })

    //Staging Stage
    const deployStage = new DeployStage(this)
    codepipeline.addStage({
      stageName: "Deploy-TEST",
      actions: [deployStage.getEcsDeployAction("dev", buildStage.getBuildOutput())]
    })

    //QA Approval Stage
    const approvalStage = new ApprovalStage(this)
    codepipeline.addStage({
      stageName: "Approval",
      actions: [approvalStage.getManualApprovalAction()]
    })

    //Deploy to Prod
    codepipeline.addStage({
      stageName: "Deploy-Prod",
      actions: [deployStage.getCodeDeployEcsDeployAction("prod", buildStage.getBuildOutput())]
    })

    //Configure notifications for the pipeline events
    const pipelineNotification = new PipelineNotification(this)
    pipelineNotification.configureSlackNotifications(codepipeline, PipelineConfig.notification.slack)
  }

  // constructor(scope: Construct, id: string, props?: StackProps) {
  //   super(scope, id, props)

  //   const repository = new Repository(this, "EcrRepository", {
  //     repositoryName: "volatility-group/volatility-services",
  //     imageScanOnPush: true,
  //     removalPolicy: RemovalPolicy.DESTROY
  //   })

  //   const bbSource = codebuild.Source.bitBucket({
  //     // BitBucket account
  //     owner: 'mycompany',
  //     // Name of the repository this project belongs to
  //     repo: 'reponame',
  //     // Enable webhook
  //     webhook: true,
  //     // Configure so webhook only fires when the master branch has an update to any code other than this CDK project (e.g. Spring source only)
  //     webhookFilters: [codebuild.FilterGroup.inEventOf(codebuild.EventAction.PUSH).andBranchIs('master').andFilePathIsNot('./cdk/*')],
  // });
  //}
}
