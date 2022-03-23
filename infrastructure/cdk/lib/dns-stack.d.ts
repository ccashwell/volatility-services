import { Stack, StackProps } from "aws-cdk-lib";
import { PublicHostedZone } from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";
export declare class VgDnsStack extends Stack {
    readonly rootZone: PublicHostedZone;
    constructor(scope: Construct, id: string, props?: StackProps);
}
