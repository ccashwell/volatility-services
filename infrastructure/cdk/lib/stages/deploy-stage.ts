import { EcsApplication, EcsDeploymentGroup, IEcsDeploymentGroup } from "aws-cdk-lib/aws-codedeploy"
import { Artifact } from "aws-cdk-lib/aws-codepipeline"
import { CodeDeployEcsDeployAction, EcsDeployAction } from "aws-cdk-lib/aws-codepipeline-actions"
import { SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2"
import { Cluster, FargateService, IBaseService } from "aws-cdk-lib/aws-ecs"
import { Stack } from "aws-cdk-lib/core"
import { PipelineConfig } from "../../config/pipleline-config"

export class DeployStage {
  private readonly stack: Stack
  private readonly appName: string

  constructor(stack: Stack) {
    this.stack = stack
    this.appName = this.stack.node.tryGetContext("appName") as string
  }

  /*
   * ECS CodeDeploy action for Blue/Green deployment
   *
   * */
  public getCodeDeployEcsDeployAction = (env: string, buildArtifact: Artifact): CodeDeployEcsDeployAction => {
    const ecsApplication = EcsApplication.fromEcsApplicationName(
      this.stack,
      `${this.appName}-EcsCodeDeploymentApp`,
      "volatility-services-prod"
    )

    const deploymentGroup: IEcsDeploymentGroup = EcsDeploymentGroup.fromEcsDeploymentGroupAttributes(
      this.stack,
      `${this.appName}-EcsCodeDeploymentGroup-${env}`,
      {
        deploymentGroupName: "VolatilityServices-Prod-Deployment",
        application: ecsApplication
      }
    )

    return new CodeDeployEcsDeployAction({
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
    })
  }

  /*
   * ECS deploy action
   *
   * */
  public getEcsDeployAction = (env: string, buildArtifact: Artifact): EcsDeployAction => {
    const deployEnv = this.getDeployEnvDetails(env)
    const baseService: IBaseService = FargateService.fromFargateServiceAttributes(
      this.stack,
      `${this.appName}-ecs-fargateservice-${env}`,
      {
        cluster: Cluster.fromClusterAttributes(this.stack, `${this.appName}-ecscluster-${env}`, {
          clusterName: deployEnv.clusterName,
          securityGroups: [
            SecurityGroup.fromSecurityGroupId(
              this.stack,
              `${this.appName}-${env}-securityGroup`,
              PipelineConfig.deployStage.prod.securityGroup
            )
          ],
          vpc: Vpc.fromLookup(this.stack, `${this.appName}-${env}-vpc`, {
            vpcId: deployEnv.vpcId
          })
        }),
        serviceName: `${PipelineConfig.serviceName}-${env}`
      }
    )

    return new EcsDeployAction({
      actionName: `ECS-${env}`,
      service: baseService,
      input: buildArtifact
    })
  }

  private getDeployEnvDetails = (env: string) => {
    switch (env) {
      case "stage": {
        return PipelineConfig.deployStage.dev
      }
      case "prod": {
        return PipelineConfig.deployStage.prod
      }
      case "test": {
        return PipelineConfig.deployStage.test
      }
      case "dev": {
        return PipelineConfig.deployStage.prod
      }
      default: {
        return PipelineConfig.deployStage.dev
      }
    }
  }
}
