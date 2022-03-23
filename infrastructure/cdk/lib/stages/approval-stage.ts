import { ManualApprovalAction } from "aws-cdk-lib/aws-codepipeline-actions"
import { Topic } from "aws-cdk-lib/aws-sns"
import { Stack } from "aws-cdk-lib/core"
import { PipelineConfig } from "../../config/pipleline-config"

export class ApprovalStage {
  private readonly stack: Stack
  private readonly appName: string

  constructor(stack: Stack) {
    this.stack = stack
    this.appName = this.stack.node.tryGetContext("appName") as string
  }

  public getManualApprovalAction = (): ManualApprovalAction => {
    return new ManualApprovalAction({
      actionName: "QA-Approval",
      notifyEmails: PipelineConfig.approvalStage?.notifyEmails,
      notificationTopic: Topic.fromTopicArn(
        this.stack,
        `${this.appName}-QA-approval`,
        PipelineConfig.approvalStage?.notifyTopic
      )
    })
  }
}
