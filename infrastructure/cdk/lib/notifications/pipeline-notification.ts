import { SlackChannelConfiguration } from "aws-cdk-lib/aws-chatbot"
import {
  INotificationRuleSource,
  INotificationRuleTarget,
  NotificationRule
} from "aws-cdk-lib/aws-codestarnotifications"
import { Stack } from "aws-cdk-lib/core"
import { ISlackNotificationConfig } from "./notification"

export class PipelineNotification {
  private readonly stack: Stack
  private readonly appName: string

  constructor(stack: Stack) {
    this.stack = stack
    this.appName = this.stack.node.tryGetContext("appName") as string
  }

  public configureSlackNotifications = (source: INotificationRuleSource, slackConfig: ISlackNotificationConfig[]) => {
    new NotificationRule(this.stack, `${this.appName}-slack-notifications`, {
      events: [
        "codepipeline-pipeline-stage-execution-succeeded",
        "codepipeline-pipeline-stage-execution-failed",
        "codepipeline-pipeline-pipeline-execution-failed"
      ],
      source,
      targets: this.getSlackTargets(slackConfig)
    })
  }

  private getSlackTargets = (slackConfig: ISlackNotificationConfig[]): INotificationRuleTarget[] => {
    const targets: INotificationRuleTarget[] = []
    if (slackConfig && slackConfig.length > 0) {
      for (const config of slackConfig) {
        const slack = SlackChannelConfiguration.fromSlackChannelConfigurationArn(
          this.stack,
          `${this.appName}-${config.channelName}-slack-channel-config`,
          config.arn
        )
        targets.push(slack)
      }
    }
    return targets
  }
}
