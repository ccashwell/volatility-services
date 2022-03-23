import { Stack, StackProps } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Repository } from "aws-cdk-lib/aws-ecr";
import { Construct } from "constructs";
import { IEnv, RdsSupportPlatforms } from "./types";
interface RdsStackProps extends StackProps {
    env: IEnv;
    platform: RdsSupportPlatforms;
    vpc: ec2.IVpc;
}
export declare class RdsStack extends Stack {
    readonly ecrRepository: Repository;
    constructor(scope: Construct, id: string, props: RdsStackProps);
}
export {};
