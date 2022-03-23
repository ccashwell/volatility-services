import { INotificationRuleSource } from "aws-cdk-lib/aws-codestarnotifications";
import { Stack } from "aws-cdk-lib/core";
import { ISlackNotificationConfig } from "./notification";
export declare class PipelineNotification {
    private readonly stack;
    private readonly appName;
    constructor(stack: Stack);
    configureSlackNotifications: (source: INotificationRuleSource, slackConfig: ISlackNotificationConfig[]) => void;
    private getSlackTargets;
}
