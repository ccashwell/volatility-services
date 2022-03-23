import { Stack, StackProps, Tags } from "aws-cdk-lib"
import { Certificate, CertificateValidation } from "aws-cdk-lib/aws-certificatemanager"
import { Role } from "aws-cdk-lib/aws-iam"
import { CrossAccountZoneDelegationRecord, PublicHostedZone } from "aws-cdk-lib/aws-route53"
import { Construct } from "constructs"

interface DelegateDnsStackProps extends StackProps {
  stage: string
  environment: string
  zoneName: string
  stackPrefixFn: (constructName: string) => string
  crossAccountDelegationRoleArn: string
  subjectAlternativeNames: string[]
}

export class VgDelegatedDnsStack extends Stack {
  readonly nameservers: string[]
  readonly certificateArn: string

  constructor(scope: Construct, id: string, props: DelegateDnsStackProps) {
    super(scope, id, props)

    console.log("Processing", props.zoneName, props.crossAccountDelegationRoleArn)
    // const domainZone = HostedZone.fromLookup(this, "Zone", { domainName: "volatility.com" })
    // const certificate = Certificate.fromCertificateArn(this, "Cert", "arn:aws:acm:us-east-1:123456:certificate/abcdefg")
    const parentZone = PublicHostedZone.fromPublicHostedZoneId(
      this,
      "RootZone",
      "Z00960273HOHML2G4GOJT"
    ) as PublicHostedZone
    //const parentZone = props?.parentZone as PublicHostedZone
    // const delegationRole = parentZone.crossAccountZoneDelegationRole as Role
    // const delgationRole = Fn.getAtt("RootZone", "CrossAccountZoneDelegationRole").toString()
    const stackPrefixFn = props?.stackPrefixFn as (id: string) => string
    const subZone = new PublicHostedZone(this, "SubZone", {
      zoneName: props.zoneName,
      caaAmazon: true
    })
    const makeFqdn = (subdomain: string) => `${subdomain}.${subZone.zoneName}`

    const zoneDelegationRecord = new CrossAccountZoneDelegationRecord(this, "delegate", {
      delegatedZone: subZone,
      parentHostedZoneId: parentZone.hostedZoneId,
      delegationRole: Role.fromRoleArn(this, "CrossAccountDelegationRole", props.crossAccountDelegationRoleArn)
    })

    zoneDelegationRecord.node.addDependency(subZone)

    this.nameservers = subZone.hostedZoneNameServers as string[]
    const subjectAlternativeNames = props.subjectAlternativeNames ?? []
    const sans = [subZone.zoneName, ...subjectAlternativeNames.map(makeFqdn)]
    console.log("SANS", sans)
    const certificate = new Certificate(this, `${stackPrefixFn("SubZoneSSLCertificate")}`, {
      domainName: subZone.zoneName,
      subjectAlternativeNames: sans,
      validation: CertificateValidation.fromDns(subZone)
    })
    certificate.node.addDependency(zoneDelegationRecord)

    this.certificateArn = certificate.certificateArn

    Tags.of(this).add("Stage", props.stage)
    Tags.of(this).add("Environment", props.environment)
    Tags.of(this).add("Cost", "infra")
    Tags.of(this).add("Cdk", "true")
  }
}
