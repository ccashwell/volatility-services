"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatbotStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_chatbot_1 = require("aws-cdk-lib/aws-chatbot");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const aws_kms_1 = require("aws-cdk-lib/aws-kms");
const aws_sns_1 = require("aws-cdk-lib/aws-sns");
class ChatbotStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        this.slackChannelConfiguration = new aws_chatbot_1.SlackChannelConfiguration(this, "ChatbotSlackChannel", {
            slackChannelConfigurationName: "cicd",
            slackWorkspaceId: "T0237LBTJ2K",
            slackChannelId: "C037V1914H0"
        });
        this.slackChannelConfiguration.addToRolePolicy(new aws_iam_1.PolicyStatement({
            effect: aws_iam_1.Effect.ALLOW,
            actions: ["chatbot:DeleteChimeWebhookConfiguration"],
            resources: ["arn:aws:chatbot::061573364520:chat-configuration/*"]
        }));
        this.slackChannelConfiguration.addToRolePolicy(new aws_iam_1.PolicyStatement({
            effect: aws_iam_1.Effect.ALLOW,
            actions: [
                "chatbot:CreateChimeWebhookConfiguration",
                "chatbot:DescribeSlackChannelConfigurations",
                "chatbot:DescribeChimeWebhookConfigurations"
            ],
            resources: ["arn:aws:chatbot::061573364520:chat-configuration/*"]
        }));
        const alias = new aws_kms_1.Key(this, "SnsTopicEncryptionKey").addAlias("cicd");
        this.slackChannelConfiguration.addToRolePolicy(new aws_iam_1.PolicyStatement({
            effect: aws_iam_1.Effect.ALLOW,
            actions: ["kms:Decrypt", "kms:GenerateDataKey"],
            resources: [alias.keyArn]
        }));
        this.slackChannelConfiguration.addNotificationTopic(new aws_sns_1.Topic(this, "CicdTopic", { masterKey: alias }));
        // const rule = project.notifyOnBuildSucceeded("NotifyOnBuildSucceeded", target)
    }
}
exports.ChatbotStack = ChatbotStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdGJvdC1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNoYXRib3Qtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNkNBQStDO0FBQy9DLHlEQUFtRTtBQUNuRSxpREFBNkQ7QUFDN0QsaURBQXlDO0FBQ3pDLGlEQUEyQztBQUczQyxNQUFhLFlBQWEsU0FBUSxtQkFBSztJQUdyQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQWtCO1FBQzFELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBRXZCLElBQUksQ0FBQyx5QkFBeUIsR0FBRyxJQUFJLHVDQUF5QixDQUFDLElBQUksRUFBRSxxQkFBcUIsRUFBRTtZQUMxRiw2QkFBNkIsRUFBRSxNQUFNO1lBQ3JDLGdCQUFnQixFQUFFLGFBQWE7WUFDL0IsY0FBYyxFQUFFLGFBQWE7U0FDOUIsQ0FBQyxDQUFBO1FBRUYsSUFBSSxDQUFDLHlCQUF5QixDQUFDLGVBQWUsQ0FDNUMsSUFBSSx5QkFBZSxDQUFDO1lBQ2xCLE1BQU0sRUFBRSxnQkFBTSxDQUFDLEtBQUs7WUFDcEIsT0FBTyxFQUFFLENBQUMseUNBQXlDLENBQUM7WUFDcEQsU0FBUyxFQUFFLENBQUMsb0RBQW9ELENBQUM7U0FDbEUsQ0FBQyxDQUNILENBQUE7UUFFRCxJQUFJLENBQUMseUJBQXlCLENBQUMsZUFBZSxDQUM1QyxJQUFJLHlCQUFlLENBQUM7WUFDbEIsTUFBTSxFQUFFLGdCQUFNLENBQUMsS0FBSztZQUNwQixPQUFPLEVBQUU7Z0JBQ1AseUNBQXlDO2dCQUN6Qyw0Q0FBNEM7Z0JBQzVDLDRDQUE0QzthQUM3QztZQUNELFNBQVMsRUFBRSxDQUFDLG9EQUFvRCxDQUFDO1NBQ2xFLENBQUMsQ0FDSCxDQUFBO1FBRUQsTUFBTSxLQUFLLEdBQUcsSUFBSSxhQUFHLENBQUMsSUFBSSxFQUFFLHVCQUF1QixDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ3JFLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxlQUFlLENBQzVDLElBQUkseUJBQWUsQ0FBQztZQUNsQixNQUFNLEVBQUUsZ0JBQU0sQ0FBQyxLQUFLO1lBQ3BCLE9BQU8sRUFBRSxDQUFDLGFBQWEsRUFBRSxxQkFBcUIsQ0FBQztZQUMvQyxTQUFTLEVBQUUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO1NBQzFCLENBQUMsQ0FDSCxDQUFBO1FBRUQsSUFBSSxDQUFDLHlCQUF5QixDQUFDLG9CQUFvQixDQUFDLElBQUksZUFBSyxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUUsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBRXZHLGdGQUFnRjtJQUNsRixDQUFDO0NBQ0Y7QUE3Q0Qsb0NBNkNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU3RhY2ssIFN0YWNrUHJvcHMgfSBmcm9tIFwiYXdzLWNkay1saWJcIlxuaW1wb3J0IHsgU2xhY2tDaGFubmVsQ29uZmlndXJhdGlvbiB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtY2hhdGJvdFwiXG5pbXBvcnQgeyBFZmZlY3QsIFBvbGljeVN0YXRlbWVudCB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtaWFtXCJcbmltcG9ydCB7IEtleSB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3Mta21zXCJcbmltcG9ydCB7IFRvcGljIH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1zbnNcIlxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIlxuXG5leHBvcnQgY2xhc3MgQ2hhdGJvdFN0YWNrIGV4dGVuZHMgU3RhY2sge1xuICByZWFkb25seSBzbGFja0NoYW5uZWxDb25maWd1cmF0aW9uOiBTbGFja0NoYW5uZWxDb25maWd1cmF0aW9uXG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcylcblxuICAgIHRoaXMuc2xhY2tDaGFubmVsQ29uZmlndXJhdGlvbiA9IG5ldyBTbGFja0NoYW5uZWxDb25maWd1cmF0aW9uKHRoaXMsIFwiQ2hhdGJvdFNsYWNrQ2hhbm5lbFwiLCB7XG4gICAgICBzbGFja0NoYW5uZWxDb25maWd1cmF0aW9uTmFtZTogXCJjaWNkXCIsXG4gICAgICBzbGFja1dvcmtzcGFjZUlkOiBcIlQwMjM3TEJUSjJLXCIsXG4gICAgICBzbGFja0NoYW5uZWxJZDogXCJDMDM3VjE5MTRIMFwiXG4gICAgfSlcblxuICAgIHRoaXMuc2xhY2tDaGFubmVsQ29uZmlndXJhdGlvbi5hZGRUb1JvbGVQb2xpY3koXG4gICAgICBuZXcgUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgZWZmZWN0OiBFZmZlY3QuQUxMT1csXG4gICAgICAgIGFjdGlvbnM6IFtcImNoYXRib3Q6RGVsZXRlQ2hpbWVXZWJob29rQ29uZmlndXJhdGlvblwiXSxcbiAgICAgICAgcmVzb3VyY2VzOiBbXCJhcm46YXdzOmNoYXRib3Q6OjA2MTU3MzM2NDUyMDpjaGF0LWNvbmZpZ3VyYXRpb24vKlwiXVxuICAgICAgfSlcbiAgICApXG5cbiAgICB0aGlzLnNsYWNrQ2hhbm5lbENvbmZpZ3VyYXRpb24uYWRkVG9Sb2xlUG9saWN5KFxuICAgICAgbmV3IFBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgIGVmZmVjdDogRWZmZWN0LkFMTE9XLFxuICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgXCJjaGF0Ym90OkNyZWF0ZUNoaW1lV2ViaG9va0NvbmZpZ3VyYXRpb25cIixcbiAgICAgICAgICBcImNoYXRib3Q6RGVzY3JpYmVTbGFja0NoYW5uZWxDb25maWd1cmF0aW9uc1wiLFxuICAgICAgICAgIFwiY2hhdGJvdDpEZXNjcmliZUNoaW1lV2ViaG9va0NvbmZpZ3VyYXRpb25zXCJcbiAgICAgICAgXSxcbiAgICAgICAgcmVzb3VyY2VzOiBbXCJhcm46YXdzOmNoYXRib3Q6OjA2MTU3MzM2NDUyMDpjaGF0LWNvbmZpZ3VyYXRpb24vKlwiXVxuICAgICAgfSlcbiAgICApXG5cbiAgICBjb25zdCBhbGlhcyA9IG5ldyBLZXkodGhpcywgXCJTbnNUb3BpY0VuY3J5cHRpb25LZXlcIikuYWRkQWxpYXMoXCJjaWNkXCIpXG4gICAgdGhpcy5zbGFja0NoYW5uZWxDb25maWd1cmF0aW9uLmFkZFRvUm9sZVBvbGljeShcbiAgICAgIG5ldyBQb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBlZmZlY3Q6IEVmZmVjdC5BTExPVyxcbiAgICAgICAgYWN0aW9uczogW1wia21zOkRlY3J5cHRcIiwgXCJrbXM6R2VuZXJhdGVEYXRhS2V5XCJdLFxuICAgICAgICByZXNvdXJjZXM6IFthbGlhcy5rZXlBcm5dXG4gICAgICB9KVxuICAgIClcblxuICAgIHRoaXMuc2xhY2tDaGFubmVsQ29uZmlndXJhdGlvbi5hZGROb3RpZmljYXRpb25Ub3BpYyhuZXcgVG9waWModGhpcywgXCJDaWNkVG9waWNcIiwgeyBtYXN0ZXJLZXk6IGFsaWFzIH0pKVxuXG4gICAgLy8gY29uc3QgcnVsZSA9IHByb2plY3Qubm90aWZ5T25CdWlsZFN1Y2NlZWRlZChcIk5vdGlmeU9uQnVpbGRTdWNjZWVkZWRcIiwgdGFyZ2V0KVxuICB9XG59XG4iXX0=