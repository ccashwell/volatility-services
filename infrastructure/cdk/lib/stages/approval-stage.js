"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalStage = void 0;
const aws_codepipeline_actions_1 = require("aws-cdk-lib/aws-codepipeline-actions");
const aws_sns_1 = require("aws-cdk-lib/aws-sns");
const pipleline_config_1 = require("../../config/pipleline-config");
class ApprovalStage {
    constructor(stack) {
        this.getManualApprovalAction = () => {
            var _a, _b;
            return new aws_codepipeline_actions_1.ManualApprovalAction({
                actionName: "QA-Approval",
                notifyEmails: (_a = pipleline_config_1.PipelineConfig.approvalStage) === null || _a === void 0 ? void 0 : _a.notifyEmails,
                notificationTopic: aws_sns_1.Topic.fromTopicArn(this.stack, `${this.appName}-QA-approval`, (_b = pipleline_config_1.PipelineConfig.approvalStage) === null || _b === void 0 ? void 0 : _b.notifyTopic)
            });
        };
        this.stack = stack;
        this.appName = this.stack.node.tryGetContext("appName");
    }
}
exports.ApprovalStage = ApprovalStage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwcm92YWwtc3RhZ2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhcHByb3ZhbC1zdGFnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtRkFBMkU7QUFDM0UsaURBQTJDO0FBRTNDLG9FQUE4RDtBQUU5RCxNQUFhLGFBQWE7SUFJeEIsWUFBWSxLQUFZO1FBS2pCLDRCQUF1QixHQUFHLEdBQXlCLEVBQUU7O1lBQzFELE9BQU8sSUFBSSwrQ0FBb0IsQ0FBQztnQkFDOUIsVUFBVSxFQUFFLGFBQWE7Z0JBQ3pCLFlBQVksUUFBRSxpQ0FBYyxDQUFDLGFBQWEsMENBQUUsWUFBWTtnQkFDeEQsaUJBQWlCLEVBQUUsZUFBSyxDQUFDLFlBQVksQ0FDbkMsSUFBSSxDQUFDLEtBQUssRUFDVixHQUFHLElBQUksQ0FBQyxPQUFPLGNBQWMsUUFDN0IsaUNBQWMsQ0FBQyxhQUFhLDBDQUFFLFdBQVcsQ0FDMUM7YUFDRixDQUFDLENBQUE7UUFDSixDQUFDLENBQUE7UUFkQyxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQTtRQUNsQixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQVcsQ0FBQTtJQUNuRSxDQUFDO0NBYUY7QUFwQkQsc0NBb0JDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTWFudWFsQXBwcm92YWxBY3Rpb24gfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWNvZGVwaXBlbGluZS1hY3Rpb25zXCJcbmltcG9ydCB7IFRvcGljIH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1zbnNcIlxuaW1wb3J0IHsgU3RhY2sgfSBmcm9tIFwiYXdzLWNkay1saWIvY29yZVwiXG5pbXBvcnQgeyBQaXBlbGluZUNvbmZpZyB9IGZyb20gXCIuLi8uLi9jb25maWcvcGlwbGVsaW5lLWNvbmZpZ1wiXG5cbmV4cG9ydCBjbGFzcyBBcHByb3ZhbFN0YWdlIHtcbiAgcHJpdmF0ZSByZWFkb25seSBzdGFjazogU3RhY2tcbiAgcHJpdmF0ZSByZWFkb25seSBhcHBOYW1lOiBzdHJpbmdcblxuICBjb25zdHJ1Y3RvcihzdGFjazogU3RhY2spIHtcbiAgICB0aGlzLnN0YWNrID0gc3RhY2tcbiAgICB0aGlzLmFwcE5hbWUgPSB0aGlzLnN0YWNrLm5vZGUudHJ5R2V0Q29udGV4dChcImFwcE5hbWVcIikgYXMgc3RyaW5nXG4gIH1cblxuICBwdWJsaWMgZ2V0TWFudWFsQXBwcm92YWxBY3Rpb24gPSAoKTogTWFudWFsQXBwcm92YWxBY3Rpb24gPT4ge1xuICAgIHJldHVybiBuZXcgTWFudWFsQXBwcm92YWxBY3Rpb24oe1xuICAgICAgYWN0aW9uTmFtZTogXCJRQS1BcHByb3ZhbFwiLFxuICAgICAgbm90aWZ5RW1haWxzOiBQaXBlbGluZUNvbmZpZy5hcHByb3ZhbFN0YWdlPy5ub3RpZnlFbWFpbHMsXG4gICAgICBub3RpZmljYXRpb25Ub3BpYzogVG9waWMuZnJvbVRvcGljQXJuKFxuICAgICAgICB0aGlzLnN0YWNrLFxuICAgICAgICBgJHt0aGlzLmFwcE5hbWV9LVFBLWFwcHJvdmFsYCxcbiAgICAgICAgUGlwZWxpbmVDb25maWcuYXBwcm92YWxTdGFnZT8ubm90aWZ5VG9waWNcbiAgICAgIClcbiAgICB9KVxuICB9XG59XG4iXX0=