import * as cdk from "aws-cdk-lib"
import { CodePipeline, CodePipelineSource, ShellStep } from "aws-cdk-lib/pipelines"
import { Construct } from "constructs"
import { getEnv } from "../functions/utils"
import { VgPipelineAppStage } from "./pipeline-app-stage"
import { PlatformAccount } from "./types"

export interface VgCodePipelineStackProps extends cdk.StackProps {
  gitBranch: string
  devCertificateArn: string
}

export class VgCodePipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: VgCodePipelineStackProps) {
    super(scope, id, props)

    //const ecr = new Repository(this, "EcrRepository", { repositoryName: "" })
    //const mfivSource = CodePipelineSource.gitHub("VolatilityGroup/node-volatility-mfiv-internal", "develop")

    const source = CodePipelineSource.gitHub("VolatilityGroup/volatility-services", props.gitBranch)
    const pipeline = new CodePipeline(this, "Pipeline", {
      pipelineName: "CdkPipeline",
      synth: new ShellStep("Synth", {
        input: source,
        commands: ["make bootstrap-pipeline"]
      })
    })

    const devEnv = getEnv(this, "dev")
    const stageEnv = getEnv(this, "stage")
    const prodEnv = getEnv(this, "prod")

    const devStage = pipeline.addStage(
      new VgPipelineAppStage(this, `${devEnv.awsEnv}VolatilityServicesAppStage`, {
        env: devEnv,
        platformAccount: devEnv.stage as PlatformAccount,
        certificateArn: props.devCertificateArn
      })
    )
    // devStage.addPost(new ManualApprovalStep("approval"))

    // const stagingStage = pipeline.addStage(
    //   new VgPipelineAppStage(this, `${stageEnv.awsEnv}VolatilityServicesAppStage`, {
    //     env: stageEnv,
    //     platformAccount: stageEnv.stage as PlatformAccount,
    //     certificate: props.devCertificate
    //   })
    // )

    // const prodStage = pipeline.addStage(
    //   new VgPipelineAppStage(this, `${prodEnv.awsEnv}VolatilityServicesAppStage`, {
    //     env: prodEnv,
    //     platformAccount: prodEnv.stage as PlatformAccount,
    //     certificate: props.devCertificate
    //   })
    // )
    //prodStage.addPost(new ManualApprovalStep("approval"))
  }
}
