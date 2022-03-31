"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
!/usr/bin / env;
node;
const cdk = require("aws-cdk-lib");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const utils_1 = require("../functions/utils");
const delegated_dns_stack_1 = require("../lib/delegated-dns-stack");
const fargate_services_stack_1 = require("../lib/fargate-services-stack");
const stack_prefix_1 = require("./../functions/stack_prefix");
const app = new cdk.App();
const dns = utils_1.getEnv(app, "dns");
const dev = utils_1.getEnv(app, "dev");
const prod = utils_1.getEnv(app, "prod");
const stage = utils_1.getEnv(app, "stage");
const automation = utils_1.getEnv(app, "automation");
// const dnsStack = new VgDnsStack(app, "DnsStack", { env: dns })
const subZoneSubDomains = ["ws", "api"];
const automationSubDomains = ["git", "monitoring", "artifacts", "ecr"];
new delegated_dns_stack_1.VgDelegatedDnsStack(app, "AutomationDelegatedDnsStack", {
    ...automation,
    env: automation,
    zoneName: automation.domain,
    stackPrefixFn: stack_prefix_1.stackPrefix("vg", automation.environment, automation.stage),
    crossAccountDelegationRoleArn: automation.crossAccountDelegationRoleArn,
    subjectAlternativeNames: automationSubDomains
});
new delegated_dns_stack_1.VgDelegatedDnsStack(app, "DevDelegatedDnsStack", {
    ...dev,
    env: dev,
    zoneName: dev.domain,
    stackPrefixFn: stack_prefix_1.stackPrefix("vg", dev.environment, dev.stage),
    crossAccountDelegationRoleArn: dev.crossAccountDelegationRoleArn,
    subjectAlternativeNames: subZoneSubDomains
});
new delegated_dns_stack_1.VgDelegatedDnsStack(app, "StageDelegatedDnsStack", {
    ...stage,
    env: stage,
    zoneName: stage.domain,
    stackPrefixFn: stack_prefix_1.stackPrefix("vg", stage.environment, stage.stage),
    crossAccountDelegationRoleArn: stage.crossAccountDelegationRoleArn,
    subjectAlternativeNames: subZoneSubDomains
});
new delegated_dns_stack_1.VgDelegatedDnsStack(app, "ProdDelegatedDnsStack", {
    ...prod,
    env: prod,
    zoneName: prod.domain,
    stackPrefixFn: stack_prefix_1.stackPrefix("vg", prod.environment, prod.stage),
    crossAccountDelegationRoleArn: prod.crossAccountDelegationRoleArn,
    subjectAlternativeNames: subZoneSubDomains
});
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
const tagStack = (stack, env) => {
    aws_cdk_lib_1.Tags.of(stack).add("Stage", env.stage);
    aws_cdk_lib_1.Tags.of(stack).add("Environment", env.environment);
    aws_cdk_lib_1.Tags.of(stack).add("Cost", "infra");
    aws_cdk_lib_1.Tags.of(stack).add("Cdk", "true");
};
const vgServicesStackProps = [{ env: dev, platformAccount: "devplatform" }, { env: prod, platformAccount: "prodplatform" }];
// Build the platform stacks
vgServicesStackProps.map(props => {
    const stack = new fargate_services_stack_1.VgServicesStack(app, `${props.env.awsEnv}VolatilityServicesStack`, props);
    tagStack(stack, props.env);
});
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2RrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0MsQ0FBQyxRQUFRLEdBQUMsR0FBRyxDQUFBO0FBQUMsSUFBSSxDQUFBO0FBQ25CLG1DQUFrQztBQUNsQyw2Q0FBa0M7QUFFbEMsOENBQTJDO0FBQzNDLG9FQUFnRTtBQUNoRSwwRUFBK0Q7QUFFL0QsOERBQXlEO0FBRXpELE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFBO0FBQ3pCLE1BQU0sR0FBRyxHQUFHLGNBQU0sQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUE7QUFDOUIsTUFBTSxHQUFHLEdBQUcsY0FBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQTtBQUM5QixNQUFNLElBQUksR0FBRyxjQUFNLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFBO0FBQ2hDLE1BQU0sS0FBSyxHQUFHLGNBQU0sQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUE7QUFDbEMsTUFBTSxVQUFVLEdBQUcsY0FBTSxDQUFDLEdBQUcsRUFBRSxZQUFZLENBQUMsQ0FBQTtBQUM1QyxpRUFBaUU7QUFDakUsTUFBTSxpQkFBaUIsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQTtBQUN2QyxNQUFNLG9CQUFvQixHQUFHLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUE7QUFFdEUsSUFBSSx5Q0FBbUIsQ0FBQyxHQUFHLEVBQUUsNkJBQTZCLEVBQUU7SUFDMUQsR0FBRyxVQUFVO0lBQ2IsR0FBRyxFQUFFLFVBQVU7SUFDZixRQUFRLEVBQUUsVUFBVSxDQUFDLE1BQWdCO0lBQ3JDLGFBQWEsRUFBRSwwQkFBVyxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsV0FBVyxFQUFFLFVBQVUsQ0FBQyxLQUFLLENBQUM7SUFDMUUsNkJBQTZCLEVBQUUsVUFBVSxDQUFD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QUFzRTtBQUN0RSxxRUFBcUU7QUFDckUsdURBQXVEO0FBQ3ZELDBFQUEwRTtBQUMxRSw0QkFBNEI7QUFDNUIsZ0JBQWdCO0FBQ2hCLGdEQUFnRDtBQUNoRCxnREFBZ0Q7QUFDaEQsb0JBQW9CO0FBQ3BCLDJGQUEyRjtBQUMzRixPQUFPO0FBQ1AsMEJBQTBCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVmdTZXJ2aWNlc1N0YWNrUHJvcHMgfSBmcm9tICcuLi9saWIvZmFyZ2F0ZS1zZXJ2aWNlcy1zdGFjayc7XG4jIS91c3IvYmluL2VudiBub2RlXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSBcImF3cy1jZGstbGliXCJcbmltcG9ydCB7IFRhZ3MgfSBmcm9tIFwiYXdzLWNkay1saWJcIlxuaW1wb3J0IHsgSUNvbnN0cnVjdCB9IGZyb20gXCJjb25zdHJ1Y3RzXCJcbmltcG9ydCB7IGdldEVudiB9IGZyb20gXCIuLi9mdW5jdGlvbnMvdXRpbHNcIlxuaW1wb3J0IHsgVmdEZWxlZ2F0ZWREbnNTdGFjayB9IGZyb20gXCIuLi9saWIvZGVsZWdhdGVkLWRucy1zdGFja1wiXG5pbXBvcnQgeyBWZ1NlcnZpY2VzU3RhY2sgfSBmcm9tIFwiLi4vbGliL2ZhcmdhdGUtc2VydmljZXMtc3RhY2tcIlxuaW1wb3J0IHsgSUVudiB9IGZyb20gXCIuLi9saWIvdHlwZXNcIlxuaW1wb3J0IHsgc3RhY2tQcmVmaXggfSBmcm9tIFwiLi8uLi9mdW5jdGlvbnMvc3RhY2tfcHJlZml4XCJcblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKVxuY29uc3QgZG5zID0gZ2V0RW52KGFwcCwgXCJkbnNcIilcbmNvbnN0IGRldiA9IGdldEVudihhcHAsIFwiZGV2XCIpXG5jb25zdCBwcm9kID0gZ2V0RW52KGFwcCwgXCJwcm9kXCIpXG5jb25zdCBzdGFnZSA9IGdldEVudihhcHAsIFwic3RhZ2VcIilcbmNvbnN0IGF1dG9tYXRpb24gPSBnZXRFbnYoYXBwLCBcImF1dG9tYXRpb25cIilcbi8vIGNvbnN0IGRuc1N0YWNrID0gbmV3IFZnRG5zU3RhY2soYXBwLCBcIkRuc1N0YWNrXCIsIHsgZW52OiBkbnMgfSlcbmNvbnN0IHN1YlpvbmVTdWJEb21haW5zID0gW1wid3NcIiwgXCJhcGlcIl1cbmNvbnN0IGF1dG9tYXRpb25TdWJEb21haW5zID0gW1wiZ2l0XCIsIFwibW9uaXRvcmluZ1wiLCBcImFydGlmYWN0c1wiLCBcImVjclwiXVxuXG5uZXcgVmdEZWxlZ2F0ZWREbnNTdGFjayhhcHAsIFwiQXV0b21hdGlvbkRlbGVnYXRlZERuc1N0YWNrXCIsIHtcbiAgLi4uYXV0b21hdGlvbixcbiAgZW52OiBhdXRvbWF0aW9uLFxuICB6b25lTmFtZTogYXV0b21hdGlvbi5kb21haW4gYXMgc3RyaW5nLFxuICBzdGFja1ByZWZpeEZuOiBzdGFja1ByZWZpeChcInZnXCIsIGF1dG9tYXRpb24uZW52aXJvbm1lbnQsIGF1dG9tYXRpb24uc3RhZ2UpLFxuICBjcm9zc0FjY291bnREZWxlZ2F0aW9uUm9sZUFybjogYXV0b21hdGlvbi5jcm9zc0FjY291bnREZWxlZ2F0aW9uUm9sZUFybiBhcyBzdHJpbmcsXG4gIHN1YmplY3RBbHRlcm5hdGl2ZU5hbWVzOiBhdXRvbWF0aW9uU3ViRG9tYWluc1xufSlcblxubmV3IFZnRGVsZWdhdGVkRG5zU3RhY2soYXBwLCBcIkRldkRlbGVnYXRlZERuc1N0YWNrXCIsIHtcbiAgLi4uZGV2LFxuICBlbnY6IGRldixcbiAgem9uZU5hbWU6IGRldi5kb21haW4gYXMgc3RyaW5nLFxuICBzdGFja1ByZWZpeEZuOiBzdGFja1ByZWZpeChcInZnXCIsIGRldi5lbnZpcm9ubWVudCwgZGV2LnN0YWdlKSxcbiAgY3Jvc3NBY2NvdW50RGVsZWdhdGlvblJvbGVBcm46IGRldi5jcm9zc0FjY291bnREZWxlZ2F0aW9uUm9sZUFybiBhcyBzdHJpbmcsXG4gIHN1YmplY3RBbHRlcm5hdGl2ZU5hbWVzOiBzdWJab25lU3ViRG9tYWluc1xufSlcblxubmV3IFZnRGVsZWdhdGVkRG5zU3RhY2soYXBwLCBcIlN0YWdlRGVsZWdhdGVkRG5zU3RhY2tcIiwge1xuICAuLi5zdGFnZSxcbiAgZW52OiBzdGFnZSxcbiAgem9uZU5hbWU6IHN0YWdlLmRvbWFpbiBhcyBzdHJpbmcsXG4gIHN0YWNrUHJlZml4Rm46IHN0YWNrUHJlZml4KFwidmdcIiwgc3RhZ2UuZW52aXJvbm1lbnQsIHN0YWdlLnN0YWdlKSxcbiAgY3Jvc3NBY2NvdW50RGVsZWdhdGlvblJvbGVBcm46IHN0YWdlLmNyb3NzQWNjb3VudERlbGVnYXRpb25Sb2xlQXJuIGFzIHN0cmluZyxcbiAgc3ViamVjdEFsdGVybmF0aXZlTmFtZXM6IHN1YlpvbmVTdWJEb21haW5zXG59KVxuXG5uZXcgVmdEZWxlZ2F0ZWREbnNTdGFjayhhcHAsIFwiUHJvZERlbGVnYXRlZERuc1N0YWNrXCIsIHtcbiAgLi4ucHJvZCxcbiAgZW52OiBwcm9kLFxuICB6b25lTmFtZTogcHJvZC5kb21haW4gYXMgc3RyaW5nLFxuICBzdGFja1ByZWZpeEZuOiBzdGFja1ByZWZpeChcInZnXCIsIHByb2QuZW52aXJvbm1lbnQsIHByb2Quc3RhZ2UpLFxuICBjcm9zc0FjY291bnREZWxlZ2F0aW9uUm9sZUFybjogcHJvZC5jcm9zc0FjY291bnREZWxlZ2F0aW9uUm9sZUFybiBhcyBzdHJpbmcsXG4gIHN1YmplY3RBbHRlcm5hdGl2ZU5hbWVzOiBzdWJab25lU3ViRG9tYWluc1xufSlcblxuLy8gbmV3IENoYXRib3RTdGFjayhhcHAsIFwiVm9sYXRpbGl0eVNlcnZpY2VzQ2hhdGJvdFN0YWNrXCIsIHsgZW52OiBhdXRvbWF0aW9uIH0pXG5cbi8vIG5ldyBDaWNkU3RhY2soYXBwLCBcIlZvbGF0aWxpdHlTZXJ2aWNlc0NpY2RQaXBlbGluZVN0YWNrXCIsIHtcbi8vICAgLyogSWYgeW91IGRvbid0IHNwZWNpZnkgJ2VudicsIHRoaXMgc3RhY2sgd2lsbCBiZSBlbnZpcm9ubWVudC1hZ25vc3RpYy5cbi8vICAgICogQWNjb3VudC9SZWdpb24tZGVwZW5kZW50IGZlYXR1cmVzIGFuZCBjb250ZXh0IGxvb2t1cHMgd2lsbCBub3Qgd29yayxcbi8vICAgICogYnV0IGEgc2luZ2xlIHN5bnRoZXNpemVkIHRlbXBsYXRlIGNhbiBiZSBkZXBsb3llZCBhbnl3aGVyZS4gKi9cblxuLy8gICAvKiBVbmNvbW1lbnQgdGhlIG5leHQgbGluZSB0byBzcGVjaWFsaXplIHRoaXMgc3RhY2sgZm9yIHRoZSBBV1MgQWNjb3VudFxuLy8gICAgKiBhbmQgUmVnaW9uIHRoYXQgYXJlIGltcGxpZWQgYnkgdGhlIGN1cnJlbnQgQ0xJIGNvbmZpZ3VyYXRpb24uICovXG4vLyAgIC8vIGVudjogeyBhY2NvdW50OiBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9BQ0NPVU5ULCByZWdpb246IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX1JFR0lPTiB9LFxuXG4vLyAgIC8qIFVuY29tbWVudCB0aGUgbmV4dCBsaW5lIGlmIHlvdSBrbm93IGV4YWN0bHkgd2hhdCBBY2NvdW50IGFuZCBSZWdpb24geW91XG4vLyAgICAqIHdhbnQgdG8gZGVwbG95IHRoZSBzdGFjayB0by4gKi9cbi8vICAgLy9lbnY6IHsgYWNjb3VudDogXCIwNjE1NzMzNjQ1MjBcIiwgcmVnaW9uOiBcInVzLWVhc3QtMlwiIH0gLy8gQXV0b21hdGlvbiBhY2NvdW50XG4vLyAgIGVudjogYXV0b21hdGlvblxuLy8gICAvKiBGb3IgbW9yZSBpbmZvcm1hdGlvbiwgc2VlIGh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9jZGsvbGF0ZXN0L2d1aWRlL2Vudmlyb25tZW50cy5odG1sICovXG4vLyB9KVxuXG5jb25zdCB0YWdTdGFjayA9IChzdGFjazogSUNvbnN0cnVjdCwgZW52OiBJRW52KSA9PiB7XG4gIFRhZ3Mub2Yoc3RhY2spLmFkZChcIlN0YWdlXCIsIGVudi5zdGFnZSlcbiAgVGFncy5vZihzdGFjaykuYWRkKFwiRW52aXJvbm1lbnRcIiwgZW52LmVudmlyb25tZW50KVxuICBUYWdzLm9mKHN0YWNrKS5hZGQoXCJDb3N0XCIsIFwiaW5mcmFcIilcbiAgVGFncy5vZihzdGFjaykuYWRkKFwiQ2RrXCIsIFwidHJ1ZVwiKVxufVxuXG5jb25zdCB2Z1NlcnZpY2VzU3RhY2tQcm9wczogVmdTZXJ2aWNlc1N0YWNrUHJvcHNbXSA9IFt7IGVudjogZGV2LCBwbGF0Zm9ybUFjY291bnQ6IFwiZGV2cGxhdGZvcm1cIn0sIHsgZW52OiBwcm9kLCBwbGF0Zm9ybUFjY291bnQ6IFwicHJvZHBsYXRmb3JtXCIgfV1cblxuLy8gQnVpbGQgdGhlIHBsYXRmb3JtIHN0YWNrc1xudmdTZXJ2aWNlc1N0YWNrUHJvcHMubWFwKHByb3BzID0+IHtcbiAgY29uc3Qgc3RhY2sgPSBuZXcgVmdTZXJ2aWNlc1N0YWNrKGFwcCwgYCR7cHJvcHMuZW52LmF3c0Vudn1Wb2xhdGlsaXR5U2VydmljZXNTdGFja2AsIHByb3BzKVxuICB0YWdTdGFjayhzdGFjaywgcHJvcHMuZW52KVxufSlcblxuLy8gbmV3IFZnU2VydmljZXNTdGFjayhhcHAsIFwiVm9sYXRpbGl0eVNlcnZpY2VzU3RhY2tcIiwgeyBlbnY6IGRldiB9KVxuLy8gbmV3IFZnU2VydmljZXNTdGFjayhhcHAsIFwiVm9sYXRpbGl0eVNlcnZpY2VzU3RhY2tcIiwgeyBlbnY6IHN0YWdlIH0pXG4vLyBuZXcgVmdTZXJ2aWNlc1N0YWNrKGFwcCwgXCJWb2xhdGlsaXR5U2VydmljZXNTdGFja1wiLCB7IGVudjogcHJvZCB9KVxuLy8gbmV3IFZnRmFyZ2F0ZVJkc1N0YWNrKGFwcCwgXCJSZHNTdGFja1wiLCB7IGVudjogZGV2IH0pXG4vLyBjb25zdCBlbnZEZXZQbGF0Zm9ybSA9IHsgYWNjb3VudDogXCI5OTQyMjQ4Mjc0MzdcIiwgcmVnaW9uOiBcInVzLWVhc3QtMlwiIH1cbi8vIGNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKClcbi8vIGNvbnNvbGUubG9nKClcbi8vIG5ldyBWZ0Ruc1N0YWNrKGFwcCwgXCJEbnNTdGFja1wiLCB7IGVudjogZG5zIH0pXG4vLyBjb25zdCBzdGFnZSA9IGFwcC5ub2RlLnRyeUdldENvbnRleHQoXCJzdGFnZVwiKVxuLy9jb25zb2xlLmxvZyhzdGFnZSlcbi8vIGNvbnN0IHNlcnZpY2VzU3RhY2sgPSBuZXcgVmdTZXJ2aWNlc1N0YWNrKGFwcCwgXCJTZXJ2aWNlc1N0YWNrXCIsIHsgZW52OiBlbnZEZXZQbGF0Zm9ybSB9KVxuLy8gVGFnLlxuLy8gVGFnLmFkZChhcHAsIFwiU3RhZ2VcIiwgKVxuIl19