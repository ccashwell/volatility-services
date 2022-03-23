"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildStage = void 0;
const aws_codebuild_1 = require("aws-cdk-lib/aws-codebuild");
const aws_codepipeline_1 = require("aws-cdk-lib/aws-codepipeline");
const aws_codepipeline_actions_1 = require("aws-cdk-lib/aws-codepipeline-actions");
const aws_ecr_1 = require("aws-cdk-lib/aws-ecr");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const pipleline_config_1 = require("../../config/pipleline-config");
class BuildStage {
    constructor(stack) {
        this.getCodeBuildAction = (sourceOutput) => {
            return new aws_codepipeline_actions_1.CodeBuildAction({
                actionName: "Build-Action",
                input: sourceOutput,
                project: this.createCodeBuildProject(),
                outputs: [this.buildOutput]
            });
        };
        this.getBuildOutput = () => {
            return this.buildOutput;
        };
        this.createCodeBuildProject = () => {
            var _a;
            const codeBuildProject = new aws_codebuild_1.PipelineProject(this.stack, `${this.stack.node.tryGetContext("appName")}-Codebuild-Project`, {
                projectName: `${this.appName}-Codebuild-Project`,
                environment: {
                    buildImage: aws_codebuild_1.LinuxBuildImage.STANDARD_5_0,
                    privileged: true
                },
                environmentVariables: this.getEnvironmentVariables(),
                buildSpec: aws_codebuild_1.BuildSpec.fromObject(pipleline_config_1.PipelineConfig.buildStage.buildSpec),
                cache: aws_codebuild_1.Cache.local(aws_codebuild_1.LocalCacheMode.DOCKER_LAYER, aws_codebuild_1.LocalCacheMode.CUSTOM)
            });
            (_a = codeBuildProject.role) === null || _a === void 0 ? void 0 : _a.addManagedPolicy(aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2ContainerRegistryPowerUser"));
            return codeBuildProject;
        };
        this.getEnvironmentVariables = () => {
            return {
                ACCOUNT_ID: {
                    value: this.stack.account
                },
                ACCOUNT_REGION: {
                    value: this.stack.region
                },
                ECR_REPO: {
                    value: this.ecrRepository.repositoryUri
                },
                IMAGE_NAME: {
                    value: pipleline_config_1.PipelineConfig.serviceName
                },
                DOCKER_USER_NAME: {
                    type: aws_codebuild_1.BuildEnvironmentVariableType.PARAMETER_STORE,
                    value: "/DOCKER/USER"
                },
                DOCKER_USER_PASSWORD: {
                    type: aws_codebuild_1.BuildEnvironmentVariableType.PARAMETER_STORE,
                    value: "/DOCKER/USER/PASSWORD"
                }
            };
        };
        this.stack = stack;
        this.appName = this.stack.node.tryGetContext("appName");
        this.ecrRepository = aws_ecr_1.Repository.fromRepositoryName(this.stack, `EcrRepo-${pipleline_config_1.PipelineConfig.serviceName}`, pipleline_config_1.PipelineConfig.buildStage.ecrRepositoryName);
        this.buildOutput = new aws_codepipeline_1.Artifact();
    }
}
exports.BuildStage = BuildStage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGQtc3RhZ2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJidWlsZC1zdGFnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2REFPa0M7QUFDbEMsbUVBQXVEO0FBQ3ZELG1GQUFzRTtBQUN0RSxpREFBNkQ7QUFDN0QsaURBQW1EO0FBRW5ELG9FQUE4RDtBQUU5RCxNQUFhLFVBQVU7SUFNckIsWUFBWSxLQUFZO1FBV2pCLHVCQUFrQixHQUFHLENBQUMsWUFBc0IsRUFBbUIsRUFBRTtZQUN0RSxPQUFPLElBQUksMENBQWUsQ0FBQztnQkFDekIsVUFBVSxFQUFFLGNBQWM7Z0JBQzFCLEtBQUssRUFBRSxZQUFZO2dCQUNuQixPQUFPLEVBQUUsSUFBSSxDQUFDLHNCQUFzQixFQUFFO2dCQUN0QyxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO2FBQzVCLENBQUMsQ0FBQTtRQUNKLENBQUMsQ0FBQTtRQUVNLG1CQUFjLEdBQUcsR0FBYSxFQUFFO1lBQ3JDLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQTtRQUN6QixDQUFDLENBQUE7UUFFTywyQkFBc0IsR0FBRyxHQUFvQixFQUFFOztZQUNyRCxNQUFNLGdCQUFnQixHQUFHLElBQUksK0JBQWUsQ0FDMUMsSUFBSSxDQUFDLEtBQUssRUFDVixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQVcsb0JBQW9CLEVBQ3pFO2dCQUNFLFdBQVcsRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLG9CQUFvQjtnQkFDaEQsV0FBVyxFQUFFO29CQUNYLFVBQVUsRUFBRSwrQkFBZSxDQUFDLFlBQVk7b0JBQ3hDLFVBQVUsRUFBRSxJQUFJO2lCQUNqQjtnQkFDRCxvQkFBb0IsRUFBRSxJQUFJLENBQUMsdUJBQXVCLEVBQUU7Z0JBQ3BELFNBQVMsRUFBRSx5QkFBUyxDQUFDLFVBQVUsQ0FBQyxpQ0FBYyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUM7Z0JBQ3BFLEtBQUssRUFBRSxxQkFBSyxDQUFDLEtBQUssQ0FBQyw4QkFBYyxDQUFDLFlBQVksRUFBRSw4QkFBYyxDQUFDLE1BQU0sQ0FBQzthQUN2RSxDQUNGLENBQUE7WUFFRCxNQUFBLGdCQUFnQixDQUFDLElBQUksMENBQUUsZ0JBQWdCLENBQ3JDLHVCQUFhLENBQUMsd0JBQXdCLENBQUMscUNBQXFDLENBQUMsRUFDOUU7WUFDRCxPQUFPLGdCQUFnQixDQUFBO1FBQ3pCLENBQUMsQ0FBQTtRQUVPLDRCQUF1QixHQUFHLEdBQUcsRUFBRTtZQUNyQyxPQUFPO2dCQUNMLFVBQVUsRUFBRTtvQkFDVixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPO2lCQUMxQjtnQkFDRCxjQUFjLEVBQUU7b0JBQ2QsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTTtpQkFDekI7Z0JBQ0QsUUFBUSxFQUFFO29CQUNSLEtBQUssRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWE7aUJBQ3hDO2dCQUNELFVBQVUsRUFBRTtvQkFDVixLQUFLLEVBQUUsaUNBQWMsQ0FBQyxXQUFXO2lCQUNsQztnQkFDRCxnQkFBZ0IsRUFBRTtvQkFDaEIsSUFBSSxFQUFFLDRDQUE0QixDQUFDLGVBQWU7b0JBQ2xELEtBQUssRUFBRSxjQUFjO2lCQUN0QjtnQkFDRCxvQkFBb0IsRUFBRTtvQkFDcEIsSUFBSSxFQUFFLDRDQUE0QixDQUFDLGVBQWU7b0JBQ2xELEtBQUssRUFBRSx1QkFBdUI7aUJBQy9CO2FBQ0YsQ0FBQTtRQUNILENBQUMsQ0FBQTtRQXBFQyxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQTtRQUNsQixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQVcsQ0FBQTtRQUNqRSxJQUFJLENBQUMsYUFBYSxHQUFHLG9CQUFVLENBQUMsa0JBQWtCLENBQ2hELElBQUksQ0FBQyxLQUFLLEVBQ1YsV0FBVyxpQ0FBYyxDQUFDLFdBQVcsRUFBRSxFQUN2QyxpQ0FBYyxDQUFDLFVBQVUsQ0FBQyxpQkFBaUIsQ0FDNUMsQ0FBQTtRQUNELElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSwyQkFBUSxFQUFFLENBQUE7SUFDbkMsQ0FBQztDQTZERjtBQTVFRCxnQ0E0RUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBCdWlsZEVudmlyb25tZW50VmFyaWFibGVUeXBlLFxuICBCdWlsZFNwZWMsXG4gIENhY2hlLFxuICBMaW51eEJ1aWxkSW1hZ2UsXG4gIExvY2FsQ2FjaGVNb2RlLFxuICBQaXBlbGluZVByb2plY3Rcbn0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1jb2RlYnVpbGRcIlxuaW1wb3J0IHsgQXJ0aWZhY3QgfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWNvZGVwaXBlbGluZVwiXG5pbXBvcnQgeyBDb2RlQnVpbGRBY3Rpb24gfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWNvZGVwaXBlbGluZS1hY3Rpb25zXCJcbmltcG9ydCB7IElSZXBvc2l0b3J5LCBSZXBvc2l0b3J5IH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1lY3JcIlxuaW1wb3J0IHsgTWFuYWdlZFBvbGljeSB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtaWFtXCJcbmltcG9ydCB7IFN0YWNrIH0gZnJvbSBcImF3cy1jZGstbGliL2NvcmVcIlxuaW1wb3J0IHsgUGlwZWxpbmVDb25maWcgfSBmcm9tIFwiLi4vLi4vY29uZmlnL3BpcGxlbGluZS1jb25maWdcIlxuXG5leHBvcnQgY2xhc3MgQnVpbGRTdGFnZSB7XG4gIHByaXZhdGUgcmVhZG9ubHkgc3RhY2s6IFN0YWNrXG4gIHByaXZhdGUgcmVhZG9ubHkgYXBwTmFtZTogc3RyaW5nXG4gIHByaXZhdGUgcmVhZG9ubHkgZWNyUmVwb3NpdG9yeTogSVJlcG9zaXRvcnlcbiAgcHJpdmF0ZSByZWFkb25seSBidWlsZE91dHB1dDogQXJ0aWZhY3RcblxuICBjb25zdHJ1Y3RvcihzdGFjazogU3RhY2spIHtcbiAgICB0aGlzLnN0YWNrID0gc3RhY2tcbiAgICB0aGlzLmFwcE5hbWUgPSB0aGlzLnN0YWNrLm5vZGUudHJ5R2V0Q29udGV4dChcImFwcE5hbWVcIikgYXMgc3RyaW5nXG4gICAgdGhpcy5lY3JSZXBvc2l0b3J5ID0gUmVwb3NpdG9yeS5mcm9tUmVwb3NpdG9yeU5hbWUoXG4gICAgICB0aGlzLnN0YWNrLFxuICAgICAgYEVjclJlcG8tJHtQaXBlbGluZUNvbmZpZy5zZXJ2aWNlTmFtZX1gLFxuICAgICAgUGlwZWxpbmVDb25maWcuYnVpbGRTdGFnZS5lY3JSZXBvc2l0b3J5TmFtZVxuICAgIClcbiAgICB0aGlzLmJ1aWxkT3V0cHV0ID0gbmV3IEFydGlmYWN0KClcbiAgfVxuXG4gIHB1YmxpYyBnZXRDb2RlQnVpbGRBY3Rpb24gPSAoc291cmNlT3V0cHV0OiBBcnRpZmFjdCk6IENvZGVCdWlsZEFjdGlvbiA9PiB7XG4gICAgcmV0dXJuIG5ldyBDb2RlQnVpbGRBY3Rpb24oe1xuICAgICAgYWN0aW9uTmFtZTogXCJCdWlsZC1BY3Rpb25cIixcbiAgICAgIGlucHV0OiBzb3VyY2VPdXRwdXQsXG4gICAgICBwcm9qZWN0OiB0aGlzLmNyZWF0ZUNvZGVCdWlsZFByb2plY3QoKSxcbiAgICAgIG91dHB1dHM6IFt0aGlzLmJ1aWxkT3V0cHV0XVxuICAgIH0pXG4gIH1cblxuICBwdWJsaWMgZ2V0QnVpbGRPdXRwdXQgPSAoKTogQXJ0aWZhY3QgPT4ge1xuICAgIHJldHVybiB0aGlzLmJ1aWxkT3V0cHV0XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUNvZGVCdWlsZFByb2plY3QgPSAoKTogUGlwZWxpbmVQcm9qZWN0ID0+IHtcbiAgICBjb25zdCBjb2RlQnVpbGRQcm9qZWN0ID0gbmV3IFBpcGVsaW5lUHJvamVjdChcbiAgICAgIHRoaXMuc3RhY2ssXG4gICAgICBgJHt0aGlzLnN0YWNrLm5vZGUudHJ5R2V0Q29udGV4dChcImFwcE5hbWVcIikgYXMgc3RyaW5nfS1Db2RlYnVpbGQtUHJvamVjdGAsXG4gICAgICB7XG4gICAgICAgIHByb2plY3ROYW1lOiBgJHt0aGlzLmFwcE5hbWV9LUNvZGVidWlsZC1Qcm9qZWN0YCxcbiAgICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgICBidWlsZEltYWdlOiBMaW51eEJ1aWxkSW1hZ2UuU1RBTkRBUkRfNV8wLFxuICAgICAgICAgIHByaXZpbGVnZWQ6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgZW52aXJvbm1lbnRWYXJpYWJsZXM6IHRoaXMuZ2V0RW52aXJvbm1lbnRWYXJpYWJsZXMoKSxcbiAgICAgICAgYnVpbGRTcGVjOiBCdWlsZFNwZWMuZnJvbU9iamVjdChQaXBlbGluZUNvbmZpZy5idWlsZFN0YWdlLmJ1aWxkU3BlYyksXG4gICAgICAgIGNhY2hlOiBDYWNoZS5sb2NhbChMb2NhbENhY2hlTW9kZS5ET0NLRVJfTEFZRVIsIExvY2FsQ2FjaGVNb2RlLkNVU1RPTSlcbiAgICAgIH1cbiAgICApXG5cbiAgICBjb2RlQnVpbGRQcm9qZWN0LnJvbGU/LmFkZE1hbmFnZWRQb2xpY3koXG4gICAgICBNYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZShcIkFtYXpvbkVDMkNvbnRhaW5lclJlZ2lzdHJ5UG93ZXJVc2VyXCIpXG4gICAgKVxuICAgIHJldHVybiBjb2RlQnVpbGRQcm9qZWN0XG4gIH1cblxuICBwcml2YXRlIGdldEVudmlyb25tZW50VmFyaWFibGVzID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBBQ0NPVU5UX0lEOiB7XG4gICAgICAgIHZhbHVlOiB0aGlzLnN0YWNrLmFjY291bnRcbiAgICAgIH0sXG4gICAgICBBQ0NPVU5UX1JFR0lPTjoge1xuICAgICAgICB2YWx1ZTogdGhpcy5zdGFjay5yZWdpb25cbiAgICAgIH0sXG4gICAgICBFQ1JfUkVQTzoge1xuICAgICAgICB2YWx1ZTogdGhpcy5lY3JSZXBvc2l0b3J5LnJlcG9zaXRvcnlVcmlcbiAgICAgIH0sXG4gICAgICBJTUFHRV9OQU1FOiB7XG4gICAgICAgIHZhbHVlOiBQaXBlbGluZUNvbmZpZy5zZXJ2aWNlTmFtZVxuICAgICAgfSxcbiAgICAgIERPQ0tFUl9VU0VSX05BTUU6IHtcbiAgICAgICAgdHlwZTogQnVpbGRFbnZpcm9ubWVudFZhcmlhYmxlVHlwZS5QQVJBTUVURVJfU1RPUkUsXG4gICAgICAgIHZhbHVlOiBcIi9ET0NLRVIvVVNFUlwiXG4gICAgICB9LFxuICAgICAgRE9DS0VSX1VTRVJfUEFTU1dPUkQ6IHtcbiAgICAgICAgdHlwZTogQnVpbGRFbnZpcm9ubWVudFZhcmlhYmxlVHlwZS5QQVJBTUVURVJfU1RPUkUsXG4gICAgICAgIHZhbHVlOiBcIi9ET0NLRVIvVVNFUi9QQVNTV09SRFwiXG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=