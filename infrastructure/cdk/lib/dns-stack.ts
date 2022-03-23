import { CfnOutput, PhysicalName, Stack, StackProps } from "aws-cdk-lib"
import { AccountPrincipal, CompositePrincipal } from "aws-cdk-lib/aws-iam"
import { PublicHostedZone } from "aws-cdk-lib/aws-route53"
import { Construct } from "constructs"

export class VgDnsStack extends Stack {
  readonly rootZone: PublicHostedZone

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    // this.rootZone = PublicHostedZone.fromPublicHostedZoneId(
    //   this,
    //   "RootZone",
    //   "Z00960273HOHML2G4GOJT"
    // ) as PublicHostedZone

    this.rootZone = new PublicHostedZone(this, PhysicalName.GENERATE_IF_NEEDED, {
      zoneName: "volatility.com", // Z00960273HOHML2G4GOJT
      crossAccountZoneDelegationPrincipal: new CompositePrincipal(
        new AccountPrincipal("061573364520"), // automation
        new AccountPrincipal("994224827437"), // dev
        new AccountPrincipal("594739244103"), // stage
        new AccountPrincipal("359424057345") // prod
      )
    })

    console.info("Cross Account Arn", this.rootZone.crossAccountZoneDelegationRole?.roleArn as string)

    new CfnOutput(this, "DnsCrossAccountZoneDelegationRoleArn", {
      description: "Role ARN for CrossAccountZoneDelegation in the DNS account",
      value: this.rootZone.crossAccountZoneDelegationRole?.roleArn as string
      // value: Fn.getAtt("RootZone", "CrossAccountZoneDelegationRole").toString()
    })

    // new CfnOutput(this, "DnsCrossAccountZoneDelegationRole", {})
    // this.rootZone.crossAccountZoneDelegationRole
    // const devEnv = getEnv(scope, "dev")
    // const prodEnv = getEnv(scope, "prod")
    // const stageEnv = getEnv(scope, "stage")
    // const automationEnv = getEnv(scope, "automation")

    // const componentName = stackPrefix("vg", dnsEnv.environment, dnsEnv.stage)

    // new PublicHostedZone(this, componentName("DevHostedZone"), {
    //   zoneName: devEnv.domain as string,
    //   crossAccountZoneDelegationPrincipal: new AccountPrincipal(devEnv.account)
    // })

    // new PublicHostedZone(this, componentName("StageHostedZone"), {
    //   zoneName: stageEnv.domain as string,
    //   crossAccountZoneDelegationPrincipal: new AccountPrincipal(stageEnv.account)
    // })

    // new PublicHostedZone(this, componentName("AutomationHostedZone"), {
    //   zoneName: automationEnv.domain as string,
    //   crossAccountZoneDelegationPrincipal: new AccountPrincipal(automationEnv.account)
    // })

    // new PublicHostedZone(this, componentName("ProdHostedZone"), {
    //   zoneName: prodEnv.domain as string,
    //   crossAccountZoneDelegationPrincipal: new AccountPrincipal(prodEnv.account)
    // })

    // const env = getEnv(scope, "devplatform")
    // const componentName = stackPrefix("vg", env.environment, env.stage)

    // if (env.stage === "dns") {
    //   const devEnv = getEnv(scope, "devplatform")
    //   const parentZone = new PublicHostedZone(this, componentName("HostedZone"), {
    //     zoneName: devEnv.domain as string,
    //     crossAccountZoneDelegationPrincipal: new AccountPrincipal(devEnv.account)
    //   })

    //   return
    // }

    // const subZone = new PublicHostedZone(this, componentName("SubZone"), {
    //   zoneName: env.domain as string
    // })

    // // import the delegation role by constructing the roleArn
    // const delegationRoleArn = Stack.of(this).formatArn({
    //   region: "", // IAM is global in each partition
    //   service: "iam",
    //   account: dnsEnv.account,
    //   resource: "role",
    //   resourceName: "MyDelegationRole"
    // })

    // const delegationRole = Role.fromRoleArn(this, "DelegationRole", delegationRoleArn)

    // // create the record
    // new CrossAccountZoneDelegationRecord(this, "delegate", {
    //   delegatedZone: subZone,
    //   parentHostedZoneName: dnsEnv.domain, // or you can use parentHostedZoneId
    //   delegationRole
    // })

    // const domainZone = HostedZone.fromLookup(this, "Zone", { domainName: "volatility.com" })
    // const certificate = Certificate.fromCertificateArn(this, "Cert", "arn:aws:acm:us-east-1:123456:certificate/abcdefg")
  }
}
