import { Stack, StackProps } from "aws-cdk-lib";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { IEnv, PlatformAccount } from "./types";
export interface VgServicesStackProps extends StackProps {
    env: IEnv;
    platformAccount: PlatformAccount;
}
export declare class VgServicesStack extends Stack {
    readonly vpc: Vpc;
    constructor(scope: Construct, id: string, props: VgServicesStackProps);
}
