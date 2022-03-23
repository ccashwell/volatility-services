import { Stack, StackProps } from "aws-cdk-lib"
import { SlackChannelConfiguration } from "aws-cdk-lib/aws-chatbot"
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam"
import { Key } from "aws-cdk-lib/aws-kms"
import { Topic } from "aws-cdk-lib/aws-sns"
import { Construct } from "constructs"

export class ChatbotStack extends Stack {
  readonly slackChannelConfiguration: SlackChannelConfiguration

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    this.slackChannelConfiguration = new SlackChannelConfiguration(this, "ChatbotSlackChannel", {
      slackChannelConfigurationName: "cicd",
      slackWorkspaceId: "T0237LBTJ2K",
      slackChannelId: "C037V1914H0"
    })

    this.slackChannelConfiguration.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["chatbot:DeleteChimeWebhookConfiguration"],
        resources: ["arn:aws:chatbot::061573364520:chat-configuration/*"]
      })
    )

    this.slackChannelConfiguration.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          "chatbot:CreateChimeWebhookConfiguration",
          "chatbot:DescribeSlackChannelConfigurations",
          "chatbot:DescribeChimeWebhookConfigurations"
        ],
        resources: ["arn:aws:chatbot::061573364520:chat-configuration/*"]
      })
    )

    const alias = new Key(this, "SnsTopicEncryptionKey").addAlias("cicd")
    this.slackChannelConfiguration.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["kms:Decrypt", "kms:GenerateDataKey"],
        resources: [alias.keyArn]
      })
    )

    this.slackChannelConfiguration.addNotificationTopic(new Topic(this, "CicdTopic", { masterKey: alias }))

    // const rule = project.notifyOnBuildSucceeded("NotifyOnBuildSucceeded", target)
  }
}
