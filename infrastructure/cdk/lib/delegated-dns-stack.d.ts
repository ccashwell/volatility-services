import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
interface DelegateDnsStackProps extends StackProps {
    stage: string;
    environment: string;
    zoneName: string;
    stackPrefixFn: (constructName: string) => string;
    crossAccountDelegationRoleArn: string;
    subjectAlternativeNames: string[];
}
export declare class VgDelegatedDnsStack extends Stack {
    readonly nameservers: string[];
    constructor(scope: Construct, id: string, props: DelegateDnsStackProps);
}
export {};
