import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import { VgServicesStack } from "./fargate-services-stack"
import { IEnv, PlatformAccount } from "./types"

interface VgPipelineAppStageProps extends cdk.StackProps {
  env: IEnv
  platformAccount: PlatformAccount
  certificateArn: string
}

export class VgPipelineAppStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: VgPipelineAppStageProps) {
    super(scope, id, props)

    const stack = new VgServicesStack(this, "VolatilityServicesStack", props)
  }
}
