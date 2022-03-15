#!/usr/bin/env node
import * as cdk from "aws-cdk-lib"
import { Tags } from "aws-cdk-lib"
import { getEnv } from "../functions/utils"
import { VgDnsStack } from "../lib/dns-stack"

const app = new cdk.App()
const dns = getEnv(app, "dns")
new VgDnsStack(app, "DevDnsStack", { env: dns })
Tags.of(app).add("Stage", dns.stage)
Tags.of(app).add("Environment", dns.environment)
Tags.of(app).add("Cost", "dns")
Tags.of(app).add("Cdk", "true")
