#!/usr/bin/env node
import * as cdk from "aws-cdk-lib"
import { Tags } from "aws-cdk-lib"
import { IConstruct } from "constructs"
import { getEnv } from "../functions/utils"
import { VgDelegatedDnsStack } from "../lib/delegated-dns-stack"
import { VgServicesStack, VgServicesStackProps } from "../lib/fargate-services-stack"
import { RdsStack } from "../lib/rds-stack"
import { IEnv } from "../lib/types"
import { stackPrefix } from "./../functions/stack_prefix"

const app = new cdk.App()
// const dns = getEnv(app, "dns")
const dev = getEnv(app, "dev")
const prod = getEnv(app, "prod")
const stage = getEnv(app, "stage")
const automation = getEnv(app, "automation")
const subZoneSubDomains = ["ws", "api"]
const automationSubDomains = ["git", "monitoring", "artifacts", "ecr"]

// const dnsStack = new VgDnsStack(app, "DnsStack", { env: dns })
new VgDelegatedDnsStack(app, "AutomationDelegatedDnsStack", {
  ...automation,
  env: automation,
  zoneName: automation.domain as string,
  stackPrefixFn: stackPrefix("vg", automation.environment, automation.stage),
  crossAccountDelegationRoleArn: automation.crossAccountDelegationRoleArn as string,
  subjectAlternativeNames: automationSubDomains
})

const devDnsStack = new VgDelegatedDnsStack(app, "DevDelegatedDnsStack", {
  ...dev,
  env: dev,
  zoneName: dev.domain as string,
  stackPrefixFn: stackPrefix("vg", dev.environment, dev.stage),
  crossAccountDelegationRoleArn: dev.crossAccountDelegationRoleArn as string,
  subjectAlternativeNames: subZoneSubDomains
})

new VgDelegatedDnsStack(app, "StageDelegatedDnsStack", {
  ...stage,
  env: stage,
  zoneName: stage.domain as string,
  stackPrefixFn: stackPrefix("vg", stage.environment, stage.stage),
  crossAccountDelegationRoleArn: stage.crossAccountDelegationRoleArn as string,
  subjectAlternativeNames: subZoneSubDomains
})

const prodDnsStack = new VgDelegatedDnsStack(app, "ProdDelegatedDnsStack", {
  ...prod,
  env: prod,
  zoneName: prod.domain as string,
  stackPrefixFn: stackPrefix("vg", prod.environment, prod.stage),
  crossAccountDelegationRoleArn: prod.crossAccountDelegationRoleArn as string,
  subjectAlternativeNames: subZoneSubDomains
})

// new VgCodePipelineStack(app, "AutomationCodepipelineStack", {
//   env: automation,
//   gitBranch: "feat/nick-add-cdk-infrastructure",
//   devCertificateArn: devDnsStack.certificateArn
// })

// new ChatbotStack(app, "VolatilityServicesChatbotStack", { env: automation })

// new CicdStack(app, "VolatilityServicesCicdPipelineStack", {
//   /* If you don't specify 'env', this stack will be environment-agnostic.
//    * Account/Region-dependent features and context lookups will not work,
//    * but a single synthesized template can be deployed anywhere. */

//   /* Uncomment the next line to specialize this stack for the AWS Account
//    * and Region that are implied by the current CLI configuration. */
//   // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

//   /* Uncomment the next line if you know exactly what Account and Region you
//    * want to deploy the stack to. */
//   //env: { account: "061573364520", region: "us-east-2" } // Automation account
//   env: automation
//   /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
// })

const tagStack = (stack: IConstruct, env: IEnv) => {
  Tags.of(stack).add("Stage", env.stage)
  Tags.of(stack).add("Environment", env.environment)
  Tags.of(stack).add("Cost", "infra")
  Tags.of(stack).add("Cdk", "true")
}

const vgServicesStackProps: VgServicesStackProps[] = [
  { env: dev, platformAccount: "devplatform", certificateArn: devDnsStack.certificateArn },
  { env: prod, platformAccount: "prodplatform", certificateArn: prodDnsStack.certificateArn }
]

// Build the platform stacks
vgServicesStackProps.map(props => {
  const stack = new VgServicesStack(app, `${props.env.awsEnv}VolatilityServicesStack`, props)
  tagStack(stack, props.env)

  const rdsStack = new RdsStack(app, `${props.env.awsEnv}RdsStack`, {
    env: props.env,
    platform: props.platformAccount,
    vpc: stack.vpc
  })
  tagStack(rdsStack, props.env)
})

// new VgServicesStack(app, "VolatilityServicesStack", { env: dev })
// new VgServicesStack(app, "VolatilityServicesStack", { env: stage })
// new VgServicesStack(app, "VolatilityServicesStack", { env: prod })
// new VgFargateRdsStack(app, "RdsStack", { env: dev })
// const envDevPlatform = { account: "994224827437", region: "us-east-2" }
// const app = new cdk.App()
// console.log()
// new VgDnsStack(app, "DnsStack", { env: dns })
// const stage = app.node.tryGetContext("stage")
//console.log(stage)
// const servicesStack = new VgServicesStack(app, "ServicesStack", { env: envDevPlatform })
// Tag.
// Tag.add(app, "Stage", )
