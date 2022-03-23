import { Stack, StackProps } from "aws-cdk-lib";
import { Repository } from "aws-cdk-lib/aws-ecr";
import { Construct } from "constructs";
export declare class CicdStack extends Stack {
    readonly ecrRepository: Repository;
    constructor(scope: Construct, id: string, props?: StackProps);
}
