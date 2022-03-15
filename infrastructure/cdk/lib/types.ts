export interface IEnv {
  account: string
  stage: "root" | "dns" | "automation" | "identity" | "devplatform" | "prodplatform"
  environment: "gbl" | "ue1" | "ue2"
  region: "us-east-1" | "us-east-2"
  domain?: string
}
