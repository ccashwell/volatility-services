#!/usr/bin/env node
import * as cdk from "aws-cdk-lib"
import { Tags } from "aws-cdk-lib"
import { getEnv } from "../functions/utils"
import { VgServicesStack } from "../lib/services-stack"

const app = new cdk.App()
const dns = getEnv(app, "dns")
const dev = getEnv(app, "dev")

// new VgDnsStack(app, "DnsStack", { env: dns })
new VgServicesStack(app, "ServicesStack", { env: dev })
// new VgFargateRdsStack(app, "RdsStack", { env: dev })
// const envDevPlatform = { account: "994224827437", region: "us-east-2" }
// const app = new cdk.App()
// console.log()

// new VgDnsStack(app, "DnsStack", { env: dns })
Tags.of(app).add("Stage", dns.stage)
Tags.of(app).add("Environment", dns.environment)
Tags.of(app).add("Cost", "infra")
Tags.of(app).add("Cdk", "true")
// const stage = app.node.tryGetContext("stage")
//console.log(stage)
// const servicesStack = new VgServicesStack(app, "ServicesStack", { env: envDevPlatform })
// Tag.
// Tag.add(app, "Stage", )
