"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeployStage = void 0;
const aws_codedeploy_1 = require("aws-cdk-lib/aws-codedeploy");
const aws_codepipeline_actions_1 = require("aws-cdk-lib/aws-codepipeline-actions");
const aws_ec2_1 = require("aws-cdk-lib/aws-ec2");
const aws_ecs_1 = require("aws-cdk-lib/aws-ecs");
const pipleline_config_1 = require("../../config/pipleline-config");
class DeployStage {
    constructor(stack) {
        /*
         * ECS CodeDeploy action for Blue/Green deployment
         *
         * */
        this.getCodeDeployEcsDeployAction = (env, buildArtifact) => {
            const ecsApplication = aws_codedeploy_1.EcsApplication.fromEcsApplicationName(this.stack, `${this.appName}-EcsCodeDeploymentApp`, "volatility-services-prod");
            const deploymentGroup = aws_codedeploy_1.EcsDeploymentGroup.fromEcsDeploymentGroupAttributes(this.stack, `${this.appName}-EcsCodeDeploymentGroup-${env}`, {
                deploymentGroupName: "VolatilityServices-Prod-Deployment",
                application: ecsApplication
            });
            return new aws_codepipeline_actions_1.CodeDeployEcsDeployAction({
                actionName: `${this.appName}-EcsCodeDeploymentAction-${env}`,
                deploymentGroup,
                taskDefinitionTemplateInput: buildArtifact,
                appSpecTemplateInput: buildArtifact,
                containerImageInputs: [
                    {
                        input: buildArtifact,
                        taskDefinitionPlaceholder: "IMAGE1_NAME"
                    }
                ]
            });
        };
        /*
         * ECS deploy action
         *
         * */
        this.getEcsDeployAction = (env, buildArtifact) => {
            const deployEnv = this.getDeployEnvDetails(env);
            const baseService = aws_ecs_1.FargateService.fromFargateServiceAttributes(this.stack, `${this.appName}-ecs-fargateservice-${env}`, {
                cluster: aws_ecs_1.Cluster.fromClusterAttributes(this.stack, `${this.appName}-ecscluster-${env}`, {
                    clusterName: deployEnv.clusterName,
                    securityGroups: [
                        aws_ec2_1.SecurityGroup.fromSecurityGroupId(this.stack, `${this.appName}-${env}-securityGroup`, pipleline_config_1.PipelineConfig.deployStage.prod.securityGroup)
                    ],
                    vpc: aws_ec2_1.Vpc.fromLookup(this.stack, `${this.appName}-${env}-vpc`, {
                        vpcId: deployEnv.vpcId
                    })
                }),
                serviceName: `${pipleline_config_1.PipelineConfig.serviceName}-${env}`
            });
            return new aws_codepipeline_actions_1.EcsDeployAction({
                actionName: `ECS-${env}`,
                service: baseService,
                input: buildArtifact
            });
        };
        this.getDeployEnvDetails = (env) => {
            switch (env) {
                case "stage": {
                    return pipleline_config_1.PipelineConfig.deployStage.dev;
                }
                case "prod": {
                    return pipleline_config_1.PipelineConfig.deployStage.prod;
                }
                case "test": {
                    return pipleline_config_1.PipelineConfig.deployStage.test;
                }
                case "dev": {
                    return pipleline_config_1.PipelineConfig.deployStage.prod;
                }
                default: {
                    return pipleline_config_1.PipelineConfig.deployStage.dev;
                }
            }
        };
        this.stack = stack;
        this.appName = this.stack.node.tryGetContext("appName");
    }
}
exports.DeployStage = DeployStage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVwbG95LXN0YWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZGVwbG95LXN0YWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLCtEQUFvRztBQUVwRyxtRkFBaUc7QUFDakcsaURBQXdEO0FBQ3hELGlEQUEyRTtBQUUzRSxvRUFBOEQ7QUFFOUQsTUFBYSxXQUFXO0lBSXRCLFlBQVksS0FBWTtRQUt4Qjs7O2FBR0s7UUFDRSxpQ0FBNEIsR0FBRyxDQUFDLEdBQVcsRUFBRSxhQUF1QixFQUE2QixFQUFFO1lBQ3hHLE1BQU0sY0FBYyxHQUFHLCtCQUFjLENBQUMsc0JBQXNCLENBQzFELElBQUksQ0FBQyxLQUFLLEVBQ1YsR0FBRyxJQUFJLENBQUMsT0FBTyx1QkFBdUIsRUFDdEMsMEJBQTBCLENBQzNCLENBQUE7WUFFRCxNQUFNLGVBQWUsR0FBd0IsbUNBQWtCLENBQUMsZ0NBQWdDLENBQzlGLElBQUksQ0FBQyxLQUFLLEVBQ1YsR0FBRyxJQUFJLENBQUMsT0FBTywyQkFBMkIsR0FBRyxFQUFFLEVBQy9DO2dCQUNFLG1CQUFtQixFQUFFLG9DQUFvQztnQkFDekQsV0FBVyxFQUFFLGNBQWM7YUFDNUIsQ0FDRixDQUFBO1lBRUQsT0FBTyxJQUFJLG9EQUF5QixDQUFDO2dCQUNuQyxVQUFVLEVBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyw0QkFBNEIsR0FBRyxFQUFFO2dCQUM1RCxlQUFlO2dCQUNmLDJCQUEyQixFQUFFLGFBQWE7Z0JBQzFDLG9CQUFvQixFQUFFLGFBQWE7Z0JBQ25DLG9CQUFvQixFQUFFO29CQUNwQjt3QkFDRSxLQUFLLEVBQUUsYUFBYTt3QkFDcEIseUJBQXlCLEVBQUUsYUFBYTtxQkFDekM7aUJBQ0Y7YUFDRixDQUFDLENBQUE7UUFDSixDQUFDLENBQUE7UUFFRDs7O2FBR0s7UUFDRSx1QkFBa0IsR0FBRyxDQUFDLEdBQVcsRUFBRSxhQUF1QixFQUFtQixFQUFFO1lBQ3BGLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUMvQyxNQUFNLFdBQVcsR0FBaUIsd0JBQWMsQ0FBQyw0QkFBNEIsQ0FDM0UsSUFBSSxDQUFDLEtBQUssRUFDVixHQUFHLElBQUksQ0FBQyxPQUFPLHVCQUF1QixHQUFHLEVBQUUsRUFDM0M7Z0JBQ0UsT0FBTyxFQUFFLGlCQUFPLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLGVBQWUsR0FBRyxFQUFFLEVBQUU7b0JBQ3RGLFdBQVcsRUFBRSxTQUFTLENBQUMsV0FBVztvQkFDbEMsY0FBYyxFQUFFO3dCQUNkLHVCQUFhLENBQUMsbUJBQW1CLENBQy9CLElBQUksQ0FBQyxLQUFLLEVBQ1YsR0FBRyxJQUFJLENBQUMsT0FBTyxJQUFJLEdBQUcsZ0JBQWdCLEVBQ3RDLGlDQUFjLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQzlDO3FCQUNGO29CQUNELEdBQUcsRUFBRSxhQUFHLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxJQUFJLEdBQUcsTUFBTSxFQUFFO3dCQUM1RCxLQUFLLEVBQUUsU0FBUyxDQUFDLEtBQUs7cUJBQ3ZCLENBQUM7aUJBQ0gsQ0FBQztnQkFDRixXQUFXLEVBQUUsR0FBRyxpQ0FBYyxDQUFDLFdBQVcsSUFBSSxHQUFHLEVBQUU7YUFDcEQsQ0FDRixDQUFBO1lBRUQsT0FBTyxJQUFJLDBDQUFlLENBQUM7Z0JBQ3pCLFVBQVUsRUFBRSxPQUFPLEdBQUcsRUFBRTtnQkFDeEIsT0FBTyxFQUFFLFdBQVc7Z0JBQ3BCLEtBQUssRUFBRSxhQUFhO2FBQ3JCLENBQUMsQ0FBQTtRQUNKLENBQUMsQ0FBQTtRQUVPLHdCQUFtQixHQUFHLENBQUMsR0FBVyxFQUFFLEVBQUU7WUFDNUMsUUFBUSxHQUFHLEVBQUU7Z0JBQ1gsS0FBSyxPQUFPLENBQUMsQ0FBQztvQkFDWixPQUFPLGlDQUFjLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQTtpQkFDdEM7Z0JBQ0QsS0FBSyxNQUFNLENBQUMsQ0FBQztvQkFDWCxPQUFPLGlDQUFjLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQTtpQkFDdkM7Z0JBQ0QsS0FBSyxNQUFNLENBQUMsQ0FBQztvQkFDWCxPQUFPLGlDQUFjLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQTtpQkFDdkM7Z0JBQ0QsS0FBSyxLQUFLLENBQUMsQ0FBQztvQkFDVixPQUFPLGlDQUFjLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQTtpQkFDdkM7Z0JBQ0QsT0FBTyxDQUFDLENBQUM7b0JBQ1AsT0FBTyxpQ0FBYyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUE7aUJBQ3RDO2FBQ0Y7UUFDSCxDQUFDLENBQUE7UUExRkMsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUE7UUFDbEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFXLENBQUE7SUFDbkUsQ0FBQztDQXlGRjtBQWhHRCxrQ0FnR0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFY3NBcHBsaWNhdGlvbiwgRWNzRGVwbG95bWVudEdyb3VwLCBJRWNzRGVwbG95bWVudEdyb3VwIH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1jb2RlZGVwbG95XCJcbmltcG9ydCB7IEFydGlmYWN0IH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1jb2RlcGlwZWxpbmVcIlxuaW1wb3J0IHsgQ29kZURlcGxveUVjc0RlcGxveUFjdGlvbiwgRWNzRGVwbG95QWN0aW9uIH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1jb2RlcGlwZWxpbmUtYWN0aW9uc1wiXG5pbXBvcnQgeyBTZWN1cml0eUdyb3VwLCBWcGMgfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWVjMlwiXG5pbXBvcnQgeyBDbHVzdGVyLCBGYXJnYXRlU2VydmljZSwgSUJhc2VTZXJ2aWNlIH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1lY3NcIlxuaW1wb3J0IHsgU3RhY2sgfSBmcm9tIFwiYXdzLWNkay1saWIvY29yZVwiXG5pbXBvcnQgeyBQaXBlbGluZUNvbmZpZyB9IGZyb20gXCIuLi8uLi9jb25maWcvcGlwbGVsaW5lLWNvbmZpZ1wiXG5cbmV4cG9ydCBjbGFzcyBEZXBsb3lTdGFnZSB7XG4gIHByaXZhdGUgcmVhZG9ubHkgc3RhY2s6IFN0YWNrXG4gIHByaXZhdGUgcmVhZG9ubHkgYXBwTmFtZTogc3RyaW5nXG5cbiAgY29uc3RydWN0b3Ioc3RhY2s6IFN0YWNrKSB7XG4gICAgdGhpcy5zdGFjayA9IHN0YWNrXG4gICAgdGhpcy5hcHBOYW1lID0gdGhpcy5zdGFjay5ub2RlLnRyeUdldENvbnRleHQoXCJhcHBOYW1lXCIpIGFzIHN0cmluZ1xuICB9XG5cbiAgLypcbiAgICogRUNTIENvZGVEZXBsb3kgYWN0aW9uIGZvciBCbHVlL0dyZWVuIGRlcGxveW1lbnRcbiAgICpcbiAgICogKi9cbiAgcHVibGljIGdldENvZGVEZXBsb3lFY3NEZXBsb3lBY3Rpb24gPSAoZW52OiBzdHJpbmcsIGJ1aWxkQXJ0aWZhY3Q6IEFydGlmYWN0KTogQ29kZURlcGxveUVjc0RlcGxveUFjdGlvbiA9PiB7XG4gICAgY29uc3QgZWNzQXBwbGljYXRpb24gPSBFY3NBcHBsaWNhdGlvbi5mcm9tRWNzQXBwbGljYXRpb25OYW1lKFxuICAgICAgdGhpcy5zdGFjayxcbiAgICAgIGAke3RoaXMuYXBwTmFtZX0tRWNzQ29kZURlcGxveW1lbnRBcHBgLFxuICAgICAgXCJ2b2xhdGlsaXR5LXNlcnZpY2VzLXByb2RcIlxuICAgIClcblxuICAgIGNvbnN0IGRlcGxveW1lbnRHcm91cDogSUVjc0RlcGxveW1lbnRHcm91cCA9IEVjc0RlcGxveW1lbnRHcm91cC5mcm9tRWNzRGVwbG95bWVudEdyb3VwQXR0cmlidXRlcyhcbiAgICAgIHRoaXMuc3RhY2ssXG4gICAgICBgJHt0aGlzLmFwcE5hbWV9LUVjc0NvZGVEZXBsb3ltZW50R3JvdXAtJHtlbnZ9YCxcbiAgICAgIHtcbiAgICAgICAgZGVwbG95bWVudEdyb3VwTmFtZTogXCJWb2xhdGlsaXR5U2VydmljZXMtUHJvZC1EZXBsb3ltZW50XCIsXG4gICAgICAgIGFwcGxpY2F0aW9uOiBlY3NBcHBsaWNhdGlvblxuICAgICAgfVxuICAgIClcblxuICAgIHJldHVybiBuZXcgQ29kZURlcGxveUVjc0RlcGxveUFjdGlvbih7XG4gICAgICBhY3Rpb25OYW1lOiBgJHt0aGlzLmFwcE5hbWV9LUVjc0NvZGVEZXBsb3ltZW50QWN0aW9uLSR7ZW52fWAsXG4gICAgICBkZXBsb3ltZW50R3JvdXAsXG4gICAgICB0YXNrRGVmaW5pdGlvblRlbXBsYXRlSW5wdXQ6IGJ1aWxkQXJ0aWZhY3QsXG4gICAgICBhcHBTcGVjVGVtcGxhdGVJbnB1dDogYnVpbGRBcnRpZmFjdCxcbiAgICAgIGNvbnRhaW5lckltYWdlSW5wdXRzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpbnB1dDogYnVpbGRBcnRpZmFjdCxcbiAgICAgICAgICB0YXNrRGVmaW5pdGlvblBsYWNlaG9sZGVyOiBcIklNQUdFMV9OQU1FXCJcbiAgICAgICAgfVxuICAgICAgXVxuICAgIH0pXG4gIH1cblxuICAvKlxuICAgKiBFQ1MgZGVwbG95IGFjdGlvblxuICAgKlxuICAgKiAqL1xuICBwdWJsaWMgZ2V0RWNzRGVwbG95QWN0aW9uID0gKGVudjogc3RyaW5nLCBidWlsZEFydGlmYWN0OiBBcnRpZmFjdCk6IEVjc0RlcGxveUFjdGlvbiA9PiB7XG4gICAgY29uc3QgZGVwbG95RW52ID0gdGhpcy5nZXREZXBsb3lFbnZEZXRhaWxzKGVudilcbiAgICBjb25zdCBiYXNlU2VydmljZTogSUJhc2VTZXJ2aWNlID0gRmFyZ2F0ZVNlcnZpY2UuZnJvbUZhcmdhdGVTZXJ2aWNlQXR0cmlidXRlcyhcbiAgICAgIHRoaXMuc3RhY2ssXG4gICAgICBgJHt0aGlzLmFwcE5hbWV9LWVjcy1mYXJnYXRlc2VydmljZS0ke2Vudn1gLFxuICAgICAge1xuICAgICAgICBjbHVzdGVyOiBDbHVzdGVyLmZyb21DbHVzdGVyQXR0cmlidXRlcyh0aGlzLnN0YWNrLCBgJHt0aGlzLmFwcE5hbWV9LWVjc2NsdXN0ZXItJHtlbnZ9YCwge1xuICAgICAgICAgIGNsdXN0ZXJOYW1lOiBkZXBsb3lFbnYuY2x1c3Rlck5hbWUsXG4gICAgICAgICAgc2VjdXJpdHlHcm91cHM6IFtcbiAgICAgICAgICAgIFNlY3VyaXR5R3JvdXAuZnJvbVNlY3VyaXR5R3JvdXBJZChcbiAgICAgICAgICAgICAgdGhpcy5zdGFjayxcbiAgICAgICAgICAgICAgYCR7dGhpcy5hcHBOYW1lfS0ke2Vudn0tc2VjdXJpdHlHcm91cGAsXG4gICAgICAgICAgICAgIFBpcGVsaW5lQ29uZmlnLmRlcGxveVN0YWdlLnByb2Quc2VjdXJpdHlHcm91cFxuICAgICAgICAgICAgKVxuICAgICAgICAgIF0sXG4gICAgICAgICAgdnBjOiBWcGMuZnJvbUxvb2t1cCh0aGlzLnN0YWNrLCBgJHt0aGlzLmFwcE5hbWV9LSR7ZW52fS12cGNgLCB7XG4gICAgICAgICAgICB2cGNJZDogZGVwbG95RW52LnZwY0lkXG4gICAgICAgICAgfSlcbiAgICAgICAgfSksXG4gICAgICAgIHNlcnZpY2VOYW1lOiBgJHtQaXBlbGluZUNvbmZpZy5zZXJ2aWNlTmFtZX0tJHtlbnZ9YFxuICAgICAgfVxuICAgIClcblxuICAgIHJldHVybiBuZXcgRWNzRGVwbG95QWN0aW9uKHtcbiAgICAgIGFjdGlvbk5hbWU6IGBFQ1MtJHtlbnZ9YCxcbiAgICAgIHNlcnZpY2U6IGJhc2VTZXJ2aWNlLFxuICAgICAgaW5wdXQ6IGJ1aWxkQXJ0aWZhY3RcbiAgICB9KVxuICB9XG5cbiAgcHJpdmF0ZSBnZXREZXBsb3lFbnZEZXRhaWxzID0gKGVudjogc3RyaW5nKSA9PiB7XG4gICAgc3dpdGNoIChlbnYpIHtcbiAgICAgIGNhc2UgXCJzdGFnZVwiOiB7XG4gICAgICAgIHJldHVybiBQaXBlbGluZUNvbmZpZy5kZXBsb3lTdGFnZS5kZXZcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJwcm9kXCI6IHtcbiAgICAgICAgcmV0dXJuIFBpcGVsaW5lQ29uZmlnLmRlcGxveVN0YWdlLnByb2RcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJ0ZXN0XCI6IHtcbiAgICAgICAgcmV0dXJuIFBpcGVsaW5lQ29uZmlnLmRlcGxveVN0YWdlLnRlc3RcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJkZXZcIjoge1xuICAgICAgICByZXR1cm4gUGlwZWxpbmVDb25maWcuZGVwbG95U3RhZ2UucHJvZFxuICAgICAgfVxuICAgICAgZGVmYXVsdDoge1xuICAgICAgICByZXR1cm4gUGlwZWxpbmVDb25maWcuZGVwbG95U3RhZ2UuZGV2XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=