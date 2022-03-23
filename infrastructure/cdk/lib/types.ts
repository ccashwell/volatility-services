export const STAGES = ["root", "dns", "automation", "identity", "devplatform", "stageplatform", "prodplatform"] as const
export type Stage = typeof STAGES[number]

export interface IEnv {
  awsEnv: "Dev" | "Stage" | "Prod"
  account: string
  stage: Stage
  environment: "gbl" | "ue1" | "ue2"
  region: "us-east-1" | "us-east-2"
  domain?: string
  crossAccountDelegationRoleArn?: string
}

// The accounts that support rds connections
export type RdsSupportPlatforms = Extract<Stage, "devplatform" | "stageplatform" | "prodplatform">
export type PlatformAccount = Extract<Stage, "devplatform" | "stageplatform" | "prodplatform">
