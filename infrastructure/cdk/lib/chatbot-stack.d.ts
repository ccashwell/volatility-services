import { Stack, StackProps } from "aws-cdk-lib";
import { SlackChannelConfiguration } from "aws-cdk-lib/aws-chatbot";
import { Construct } from "constructs";
export declare class ChatbotStack extends Stack {
    readonly slackChannelConfiguration: SlackChannelConfiguration;
    constructor(scope: Construct, id: string, props?: StackProps);
}
