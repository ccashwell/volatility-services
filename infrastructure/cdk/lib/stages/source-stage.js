"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceStage = void 0;
const aws_codecommit_1 = require("aws-cdk-lib/aws-codecommit");
const aws_codepipeline_1 = require("aws-cdk-lib/aws-codepipeline");
const aws_codepipeline_actions_1 = require("aws-cdk-lib/aws-codepipeline-actions");
const pipleline_config_1 = require("../../config/pipleline-config");
class SourceStage {
    constructor(stack) {
        this.getCodeCommitSourceAction = () => {
            return new aws_codepipeline_actions_1.CodeCommitSourceAction({
                actionName: "Source-Action",
                output: this.sourceOutput,
                repository: this.repository
            });
        };
        this.getSourceOutput = () => {
            return this.sourceOutput;
        };
        const appName = stack.node.tryGetContext("appName");
        this.stack = stack;
        this.sourceOutput = new aws_codepipeline_1.Artifact();
        this.repository = aws_codecommit_1.Repository.fromRepositoryName(stack, `${appName}-${pipleline_config_1.PipelineConfig.sourceStage.repositoryName}`, pipleline_config_1.PipelineConfig.sourceStage.repositoryName);
    }
}
exports.SourceStage = SourceStage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic291cmNlLXN0YWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic291cmNlLXN0YWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLCtEQUFvRTtBQUNwRSxtRUFBdUQ7QUFDdkQsbUZBQTZFO0FBQzdFLG9FQUE4RDtBQUU5RCxNQUFhLFdBQVc7SUFLdEIsWUFBWSxLQUFZO1FBV2pCLDhCQUF5QixHQUFHLEdBQTJCLEVBQUU7WUFDOUQsT0FBTyxJQUFJLGlEQUFzQixDQUFDO2dCQUNoQyxVQUFVLEVBQUUsZUFBZTtnQkFDM0IsTUFBTSxFQUFFLElBQUksQ0FBQyxZQUFZO2dCQUN6QixVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVU7YUFDNUIsQ0FBQyxDQUFBO1FBQ0osQ0FBQyxDQUFBO1FBRU0sb0JBQWUsR0FBRyxHQUFhLEVBQUU7WUFDdEMsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFBO1FBQzFCLENBQUMsQ0FBQTtRQXBCQyxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQVcsQ0FBQTtRQUM3RCxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQTtRQUNsQixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksMkJBQVEsRUFBRSxDQUFBO1FBQ2xDLElBQUksQ0FBQyxVQUFVLEdBQUcsMkJBQVUsQ0FBQyxrQkFBa0IsQ0FDN0MsS0FBSyxFQUNMLEdBQUcsT0FBTyxJQUFJLGlDQUFjLENBQUMsV0FBVyxDQUFDLGNBQWMsRUFBRSxFQUN6RCxpQ0FBYyxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQzFDLENBQUE7SUFDSCxDQUFDO0NBYUY7QUEzQkQsa0NBMkJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU3RhY2sgfSBmcm9tIFwiYXdzLWNkay1saWJcIlxuaW1wb3J0IHsgSVJlcG9zaXRvcnksIFJlcG9zaXRvcnkgfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWNvZGVjb21taXRcIlxuaW1wb3J0IHsgQXJ0aWZhY3QgfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWNvZGVwaXBlbGluZVwiXG5pbXBvcnQgeyBDb2RlQ29tbWl0U291cmNlQWN0aW9uIH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1jb2RlcGlwZWxpbmUtYWN0aW9uc1wiXG5pbXBvcnQgeyBQaXBlbGluZUNvbmZpZyB9IGZyb20gXCIuLi8uLi9jb25maWcvcGlwbGVsaW5lLWNvbmZpZ1wiXG5cbmV4cG9ydCBjbGFzcyBTb3VyY2VTdGFnZSB7XG4gIHByaXZhdGUgcmVhZG9ubHkgcmVwb3NpdG9yeTogSVJlcG9zaXRvcnlcbiAgcHJpdmF0ZSBzdGFjazogU3RhY2tcbiAgcHJpdmF0ZSByZWFkb25seSBzb3VyY2VPdXRwdXQ6IEFydGlmYWN0XG5cbiAgY29uc3RydWN0b3Ioc3RhY2s6IFN0YWNrKSB7XG4gICAgY29uc3QgYXBwTmFtZSA9IHN0YWNrLm5vZGUudHJ5R2V0Q29udGV4dChcImFwcE5hbWVcIikgYXMgc3RyaW5nXG4gICAgdGhpcy5zdGFjayA9IHN0YWNrXG4gICAgdGhpcy5zb3VyY2VPdXRwdXQgPSBuZXcgQXJ0aWZhY3QoKVxuICAgIHRoaXMucmVwb3NpdG9yeSA9IFJlcG9zaXRvcnkuZnJvbVJlcG9zaXRvcnlOYW1lKFxuICAgICAgc3RhY2ssXG4gICAgICBgJHthcHBOYW1lfS0ke1BpcGVsaW5lQ29uZmlnLnNvdXJjZVN0YWdlLnJlcG9zaXRvcnlOYW1lfWAsXG4gICAgICBQaXBlbGluZUNvbmZpZy5zb3VyY2VTdGFnZS5yZXBvc2l0b3J5TmFtZVxuICAgIClcbiAgfVxuXG4gIHB1YmxpYyBnZXRDb2RlQ29tbWl0U291cmNlQWN0aW9uID0gKCk6IENvZGVDb21taXRTb3VyY2VBY3Rpb24gPT4ge1xuICAgIHJldHVybiBuZXcgQ29kZUNvbW1pdFNvdXJjZUFjdGlvbih7XG4gICAgICBhY3Rpb25OYW1lOiBcIlNvdXJjZS1BY3Rpb25cIixcbiAgICAgIG91dHB1dDogdGhpcy5zb3VyY2VPdXRwdXQsXG4gICAgICByZXBvc2l0b3J5OiB0aGlzLnJlcG9zaXRvcnlcbiAgICB9KVxuICB9XG5cbiAgcHVibGljIGdldFNvdXJjZU91dHB1dCA9ICgpOiBBcnRpZmFjdCA9PiB7XG4gICAgcmV0dXJuIHRoaXMuc291cmNlT3V0cHV0XG4gIH1cbn1cbiJdfQ==