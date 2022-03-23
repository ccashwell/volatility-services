"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineNotification = void 0;
const aws_chatbot_1 = require("aws-cdk-lib/aws-chatbot");
const aws_codestarnotifications_1 = require("aws-cdk-lib/aws-codestarnotifications");
class PipelineNotification {
    constructor(stack) {
        this.configureSlackNotifications = (source, slackConfig) => {
            new aws_codestarnotifications_1.NotificationRule(this.stack, `${this.appName}-slack-notifications`, {
                events: [
                    "codepipeline-pipeline-stage-execution-succeeded",
                    "codepipeline-pipeline-stage-execution-failed",
                    "codepipeline-pipeline-pipeline-execution-failed"
                ],
                source,
                targets: this.getSlackTargets(slackConfig)
            });
        };
        this.getSlackTargets = (slackConfig) => {
            const targets = [];
            if (slackConfig && slackConfig.length > 0) {
                for (const config of slackConfig) {
                    const slack = aws_chatbot_1.SlackChannelConfiguration.fromSlackChannelConfigurationArn(this.stack, `${this.appName}-${config.channelName}-slack-channel-config`, config.arn);
                    targets.push(slack);
                }
            }
            return targets;
        };
        this.stack = stack;
        this.appName = this.stack.node.tryGetContext("appName");
    }
}
exports.PipelineNotification = PipelineNotification;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZWxpbmUtbm90aWZpY2F0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicGlwZWxpbmUtbm90aWZpY2F0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHlEQUFtRTtBQUNuRSxxRkFJOEM7QUFJOUMsTUFBYSxvQkFBb0I7SUFJL0IsWUFBWSxLQUFZO1FBS2pCLGdDQUEyQixHQUFHLENBQUMsTUFBK0IsRUFBRSxXQUF1QyxFQUFFLEVBQUU7WUFDaEgsSUFBSSw0Q0FBZ0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sc0JBQXNCLEVBQUU7Z0JBQ3RFLE1BQU0sRUFBRTtvQkFDTixpREFBaUQ7b0JBQ2pELDhDQUE4QztvQkFDOUMsaURBQWlEO2lCQUNsRDtnQkFDRCxNQUFNO2dCQUNOLE9BQU8sRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQzthQUMzQyxDQUFDLENBQUE7UUFDSixDQUFDLENBQUE7UUFFTyxvQkFBZSxHQUFHLENBQUMsV0FBdUMsRUFBNkIsRUFBRTtZQUMvRixNQUFNLE9BQU8sR0FBOEIsRUFBRSxDQUFBO1lBQzdDLElBQUksV0FBVyxJQUFJLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUN6QyxLQUFLLE1BQU0sTUFBTSxJQUFJLFdBQVcsRUFBRTtvQkFDaEMsTUFBTSxLQUFLLEdBQUcsdUNBQXlCLENBQUMsZ0NBQWdDLENBQ3RFLElBQUksQ0FBQyxLQUFLLEVBQ1YsR0FBRyxJQUFJLENBQUMsT0FBTyxJQUFJLE1BQU0sQ0FBQyxXQUFXLHVCQUF1QixFQUM1RCxNQUFNLENBQUMsR0FBRyxDQUNYLENBQUE7b0JBQ0QsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtpQkFDcEI7YUFDRjtZQUNELE9BQU8sT0FBTyxDQUFBO1FBQ2hCLENBQUMsQ0FBQTtRQTdCQyxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQTtRQUNsQixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQVcsQ0FBQTtJQUNuRSxDQUFDO0NBNEJGO0FBbkNELG9EQW1DQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFNsYWNrQ2hhbm5lbENvbmZpZ3VyYXRpb24gfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWNoYXRib3RcIlxuaW1wb3J0IHtcbiAgSU5vdGlmaWNhdGlvblJ1bGVTb3VyY2UsXG4gIElOb3RpZmljYXRpb25SdWxlVGFyZ2V0LFxuICBOb3RpZmljYXRpb25SdWxlXG59IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtY29kZXN0YXJub3RpZmljYXRpb25zXCJcbmltcG9ydCB7IFN0YWNrIH0gZnJvbSBcImF3cy1jZGstbGliL2NvcmVcIlxuaW1wb3J0IHsgSVNsYWNrTm90aWZpY2F0aW9uQ29uZmlnIH0gZnJvbSBcIi4vbm90aWZpY2F0aW9uXCJcblxuZXhwb3J0IGNsYXNzIFBpcGVsaW5lTm90aWZpY2F0aW9uIHtcbiAgcHJpdmF0ZSByZWFkb25seSBzdGFjazogU3RhY2tcbiAgcHJpdmF0ZSByZWFkb25seSBhcHBOYW1lOiBzdHJpbmdcblxuICBjb25zdHJ1Y3RvcihzdGFjazogU3RhY2spIHtcbiAgICB0aGlzLnN0YWNrID0gc3RhY2tcbiAgICB0aGlzLmFwcE5hbWUgPSB0aGlzLnN0YWNrLm5vZGUudHJ5R2V0Q29udGV4dChcImFwcE5hbWVcIikgYXMgc3RyaW5nXG4gIH1cblxuICBwdWJsaWMgY29uZmlndXJlU2xhY2tOb3RpZmljYXRpb25zID0gKHNvdXJjZTogSU5vdGlmaWNhdGlvblJ1bGVTb3VyY2UsIHNsYWNrQ29uZmlnOiBJU2xhY2tOb3RpZmljYXRpb25Db25maWdbXSkgPT4ge1xuICAgIG5ldyBOb3RpZmljYXRpb25SdWxlKHRoaXMuc3RhY2ssIGAke3RoaXMuYXBwTmFtZX0tc2xhY2stbm90aWZpY2F0aW9uc2AsIHtcbiAgICAgIGV2ZW50czogW1xuICAgICAgICBcImNvZGVwaXBlbGluZS1waXBlbGluZS1zdGFnZS1leGVjdXRpb24tc3VjY2VlZGVkXCIsXG4gICAgICAgIFwiY29kZXBpcGVsaW5lLXBpcGVsaW5lLXN0YWdlLWV4ZWN1dGlvbi1mYWlsZWRcIixcbiAgICAgICAgXCJjb2RlcGlwZWxpbmUtcGlwZWxpbmUtcGlwZWxpbmUtZXhlY3V0aW9uLWZhaWxlZFwiXG4gICAgICBdLFxuICAgICAgc291cmNlLFxuICAgICAgdGFyZ2V0czogdGhpcy5nZXRTbGFja1RhcmdldHMoc2xhY2tDb25maWcpXG4gICAgfSlcbiAgfVxuXG4gIHByaXZhdGUgZ2V0U2xhY2tUYXJnZXRzID0gKHNsYWNrQ29uZmlnOiBJU2xhY2tOb3RpZmljYXRpb25Db25maWdbXSk6IElOb3RpZmljYXRpb25SdWxlVGFyZ2V0W10gPT4ge1xuICAgIGNvbnN0IHRhcmdldHM6IElOb3RpZmljYXRpb25SdWxlVGFyZ2V0W10gPSBbXVxuICAgIGlmIChzbGFja0NvbmZpZyAmJiBzbGFja0NvbmZpZy5sZW5ndGggPiAwKSB7XG4gICAgICBmb3IgKGNvbnN0IGNvbmZpZyBvZiBzbGFja0NvbmZpZykge1xuICAgICAgICBjb25zdCBzbGFjayA9IFNsYWNrQ2hhbm5lbENvbmZpZ3VyYXRpb24uZnJvbVNsYWNrQ2hhbm5lbENvbmZpZ3VyYXRpb25Bcm4oXG4gICAgICAgICAgdGhpcy5zdGFjayxcbiAgICAgICAgICBgJHt0aGlzLmFwcE5hbWV9LSR7Y29uZmlnLmNoYW5uZWxOYW1lfS1zbGFjay1jaGFubmVsLWNvbmZpZ2AsXG4gICAgICAgICAgY29uZmlnLmFyblxuICAgICAgICApXG4gICAgICAgIHRhcmdldHMucHVzaChzbGFjaylcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRhcmdldHNcbiAgfVxufVxuIl19