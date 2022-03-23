"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VgDnsStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const aws_route53_1 = require("aws-cdk-lib/aws-route53");
class VgDnsStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        var _a, _b;
        super(scope, id, props);
        // this.rootZone = PublicHostedZone.fromPublicHostedZoneId(
        //   this,
        //   "RootZone",
        //   "Z00960273HOHML2G4GOJT"
        // ) as PublicHostedZone
        this.rootZone = new aws_route53_1.PublicHostedZone(this, aws_cdk_lib_1.PhysicalName.GENERATE_IF_NEEDED, {
            zoneName: "volatility.com",
            crossAccountZoneDelegationPrincipal: new aws_iam_1.CompositePrincipal(new aws_iam_1.AccountPrincipal("061573364520"), // automation
            new aws_iam_1.AccountPrincipal("994224827437"), // dev
            new aws_iam_1.AccountPrincipal("594739244103"), // stage
            new aws_iam_1.AccountPrincipal("359424057345") // prod
            )
        });
        console.info("Cross Account Arn", (_a = this.rootZone.crossAccountZoneDelegationRole) === null || _a === void 0 ? void 0 : _a.roleArn);
        new aws_cdk_lib_1.CfnOutput(this, "DnsCrossAccountZoneDelegationRoleArn", {
            description: "Role ARN for CrossAccountZoneDelegation in the DNS account",
            value: (_b = this.rootZone.crossAccountZoneDelegationRole) === null || _b === void 0 ? void 0 : _b.roleArn
            // value: Fn.getAtt("RootZone", "CrossAccountZoneDelegationRole").toString()
        });
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
exports.VgDnsStack = VgDnsStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG5zLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZG5zLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZDQUF3RTtBQUN4RSxpREFBMEU7QUFDMUUseURBQTBEO0FBRzFELE1BQWEsVUFBVyxTQUFRLG1CQUFLO0lBR25DLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBa0I7O1FBQzFELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBRXZCLDJEQUEyRDtRQUMzRCxVQUFVO1FBQ1YsZ0JBQWdCO1FBQ2hCLDRCQUE0QjtRQUM1Qix3QkFBd0I7UUFFeEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLDhCQUFnQixDQUFDLElBQUksRUFBRSwwQkFBWSxDQUFDLGtCQUFrQixFQUFFO1lBQzFFLFFBQVEsRUFBRSxnQkFBZ0I7WUFDMUIsbUNBQW1DLEVBQUUsSUFBSSw0QkFBa0IsQ0FDekQsSUFBSSwwQkFBZ0IsQ0FBQyxjQUFjLENBQUMsRUFBRSxhQUFhO1lBQ25ELElBQUksMEJBQWdCLENBQUMsY0FBYyxDQUFDLEVBQUUsTUFBTTtZQUM1QyxJQUFJLDBCQUFnQixDQUFDLGNBQWMsQ0FBQyxFQUFFLFFBQVE7WUFDOUMsSUFBSSwwQkFBZ0IsQ0FBQyxjQUFjLENBQUMsQ0FBQyxPQUFPO2FBQzdDO1NBQ0YsQ0FBQyxDQUFBO1FBRUYsT0FBTyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxNQUFBLElBQUksQ0FBQyxRQUFRLENBQUMsOEJBQThCLDBDQUFFLE9BQWlCLENBQUMsQ0FBQTtRQUVsRyxJQUFJLHVCQUFTLENBQUMsSUFBSSxFQUFFLHNDQUFzQyxFQUFFO1lBQzFELFdBQVcsRUFBRSw0REFBNEQ7WUFDekUsS0FBSyxFQUFFLE1BQUEsSUFBSSxDQUFDLFFBQVEsQ0FBQyw4QkFBOEIsMENBQUUsT0FBaUI7WUFDdEUsNEVBQTRFO1NBQzdFLENBQUMsQ0FBQTtRQUVGLCtEQUErRDtRQUMvRCwrQ0FBK0M7UUFDL0Msc0NBQXNDO1FBQ3RDLHdDQUF3QztRQUN4QywwQ0FBMEM7UUFDMUMsb0RBQW9EO1FBRXBELDRFQUE0RTtRQUU1RSwrREFBK0Q7UUFDL0QsdUNBQXVDO1FBQ3ZDLDhFQUE4RTtRQUM5RSxLQUFLO1FBRUwsaUVBQWlFO1FBQ2pFLHlDQUF5QztRQUN6QyxnRkFBZ0Y7UUFDaEYsS0FBSztRQUVMLHNFQUFzRTtRQUN0RSw4Q0FBOEM7UUFDOUMscUZBQXFGO1FBQ3JGLEtBQUs7UUFFTCxnRUFBZ0U7UUFDaEUsd0NBQXdDO1FBQ3hDLCtFQUErRTtRQUMvRSxLQUFLO1FBRUwsMkNBQTJDO1FBQzNDLHNFQUFzRTtRQUV0RSw2QkFBNkI7UUFDN0IsZ0RBQWdEO1FBQ2hELGlGQUFpRjtRQUNqRix5Q0FBeUM7UUFDekMsZ0ZBQWdGO1FBQ2hGLE9BQU87UUFFUCxXQUFXO1FBQ1gsSUFBSTtRQUVKLHlFQUF5RTtRQUN6RSxtQ0FBbUM7UUFDbkMsS0FBSztRQUVMLDREQUE0RDtRQUM1RCx1REFBdUQ7UUFDdkQsbURBQW1EO1FBQ25ELG9CQUFvQjtRQUNwQiw2QkFBNkI7UUFDN0Isc0JBQXNCO1FBQ3RCLHFDQUFxQztRQUNyQyxLQUFLO1FBRUwscUZBQXFGO1FBRXJGLHVCQUF1QjtRQUN2QiwyREFBMkQ7UUFDM0QsNEJBQTRCO1FBQzVCLDhFQUE4RTtRQUM5RSxtQkFBbUI7UUFDbkIsS0FBSztRQUVMLDJGQUEyRjtRQUMzRix1SEFBdUg7SUFDekgsQ0FBQztDQUNGO0FBakdELGdDQWlHQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENmbk91dHB1dCwgUGh5c2ljYWxOYW1lLCBTdGFjaywgU3RhY2tQcm9wcyB9IGZyb20gXCJhd3MtY2RrLWxpYlwiXG5pbXBvcnQgeyBBY2NvdW50UHJpbmNpcGFsLCBDb21wb3NpdGVQcmluY2lwYWwgfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWlhbVwiXG5pbXBvcnQgeyBQdWJsaWNIb3N0ZWRab25lIH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1yb3V0ZTUzXCJcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gXCJjb25zdHJ1Y3RzXCJcblxuZXhwb3J0IGNsYXNzIFZnRG5zU3RhY2sgZXh0ZW5kcyBTdGFjayB7XG4gIHJlYWRvbmx5IHJvb3Rab25lOiBQdWJsaWNIb3N0ZWRab25lXG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcylcblxuICAgIC8vIHRoaXMucm9vdFpvbmUgPSBQdWJsaWNIb3N0ZWRab25lLmZyb21QdWJsaWNIb3N0ZWRab25lSWQoXG4gICAgLy8gICB0aGlzLFxuICAgIC8vICAgXCJSb290Wm9uZVwiLFxuICAgIC8vICAgXCJaMDA5NjAyNzNIT0hNTDJHNEdPSlRcIlxuICAgIC8vICkgYXMgUHVibGljSG9zdGVkWm9uZVxuXG4gICAgdGhpcy5yb290Wm9uZSA9IG5ldyBQdWJsaWNIb3N0ZWRab25lKHRoaXMsIFBoeXNpY2FsTmFtZS5HRU5FUkFURV9JRl9ORUVERUQsIHtcbiAgICAgIHpvbmVOYW1lOiBcInZvbGF0aWxpdHkuY29tXCIsIC8vIFowMDk2MDI3M0hPSE1MMkc0R09KVFxuICAgICAgY3Jvc3NBY2NvdW50Wm9uZURlbGVnYXRpb25QcmluY2lwYWw6IG5ldyBDb21wb3NpdGVQcmluY2lwYWwoXG4gICAgICAgIG5ldyBBY2NvdW50UHJpbmNpcGFsKFwiMDYxNTczMzY0NTIwXCIpLCAvLyBhdXRvbWF0aW9uXG4gICAgICAgIG5ldyBBY2NvdW50UHJpbmNpcGFsKFwiOTk0MjI0ODI3NDM3XCIpLCAvLyBkZXZcbiAgICAgICAgbmV3IEFjY291bnRQcmluY2lwYWwoXCI1OTQ3MzkyNDQxMDNcIiksIC8vIHN0YWdlXG4gICAgICAgIG5ldyBBY2NvdW50UHJpbmNpcGFsKFwiMzU5NDI0MDU3MzQ1XCIpIC8vIHByb2RcbiAgICAgIClcbiAgICB9KVxuXG4gICAgY29uc29sZS5pbmZvKFwiQ3Jvc3MgQWNjb3VudCBBcm5cIiwgdGhpcy5yb290Wm9uZS5jcm9zc0FjY291bnRab25lRGVsZWdhdGlvblJvbGU/LnJvbGVBcm4gYXMgc3RyaW5nKVxuXG4gICAgbmV3IENmbk91dHB1dCh0aGlzLCBcIkRuc0Nyb3NzQWNjb3VudFpvbmVEZWxlZ2F0aW9uUm9sZUFyblwiLCB7XG4gICAgICBkZXNjcmlwdGlvbjogXCJSb2xlIEFSTiBmb3IgQ3Jvc3NBY2NvdW50Wm9uZURlbGVnYXRpb24gaW4gdGhlIEROUyBhY2NvdW50XCIsXG4gICAgICB2YWx1ZTogdGhpcy5yb290Wm9uZS5jcm9zc0FjY291bnRab25lRGVsZWdhdGlvblJvbGU/LnJvbGVBcm4gYXMgc3RyaW5nXG4gICAgICAvLyB2YWx1ZTogRm4uZ2V0QXR0KFwiUm9vdFpvbmVcIiwgXCJDcm9zc0FjY291bnRab25lRGVsZWdhdGlvblJvbGVcIikudG9TdHJpbmcoKVxuICAgIH0pXG5cbiAgICAvLyBuZXcgQ2ZuT3V0cHV0KHRoaXMsIFwiRG5zQ3Jvc3NBY2NvdW50Wm9uZURlbGVnYXRpb25Sb2xlXCIsIHt9KVxuICAgIC8vIHRoaXMucm9vdFpvbmUuY3Jvc3NBY2NvdW50Wm9uZURlbGVnYXRpb25Sb2xlXG4gICAgLy8gY29uc3QgZGV2RW52ID0gZ2V0RW52KHNjb3BlLCBcImRldlwiKVxuICAgIC8vIGNvbnN0IHByb2RFbnYgPSBnZXRFbnYoc2NvcGUsIFwicHJvZFwiKVxuICAgIC8vIGNvbnN0IHN0YWdlRW52ID0gZ2V0RW52KHNjb3BlLCBcInN0YWdlXCIpXG4gICAgLy8gY29uc3QgYXV0b21hdGlvbkVudiA9IGdldEVudihzY29wZSwgXCJhdXRvbWF0aW9uXCIpXG5cbiAgICAvLyBjb25zdCBjb21wb25lbnROYW1lID0gc3RhY2tQcmVmaXgoXCJ2Z1wiLCBkbnNFbnYuZW52aXJvbm1lbnQsIGRuc0Vudi5zdGFnZSlcblxuICAgIC8vIG5ldyBQdWJsaWNIb3N0ZWRab25lKHRoaXMsIGNvbXBvbmVudE5hbWUoXCJEZXZIb3N0ZWRab25lXCIpLCB7XG4gICAgLy8gICB6b25lTmFtZTogZGV2RW52LmRvbWFpbiBhcyBzdHJpbmcsXG4gICAgLy8gICBjcm9zc0FjY291bnRab25lRGVsZWdhdGlvblByaW5jaXBhbDogbmV3IEFjY291bnRQcmluY2lwYWwoZGV2RW52LmFjY291bnQpXG4gICAgLy8gfSlcblxuICAgIC8vIG5ldyBQdWJsaWNIb3N0ZWRab25lKHRoaXMsIGNvbXBvbmVudE5hbWUoXCJTdGFnZUhvc3RlZFpvbmVcIiksIHtcbiAgICAvLyAgIHpvbmVOYW1lOiBzdGFnZUVudi5kb21haW4gYXMgc3RyaW5nLFxuICAgIC8vICAgY3Jvc3NBY2NvdW50Wm9uZURlbGVnYXRpb25QcmluY2lwYWw6IG5ldyBBY2NvdW50UHJpbmNpcGFsKHN0YWdlRW52LmFjY291bnQpXG4gICAgLy8gfSlcblxuICAgIC8vIG5ldyBQdWJsaWNIb3N0ZWRab25lKHRoaXMsIGNvbXBvbmVudE5hbWUoXCJBdXRvbWF0aW9uSG9zdGVkWm9uZVwiKSwge1xuICAgIC8vICAgem9uZU5hbWU6IGF1dG9tYXRpb25FbnYuZG9tYWluIGFzIHN0cmluZyxcbiAgICAvLyAgIGNyb3NzQWNjb3VudFpvbmVEZWxlZ2F0aW9uUHJpbmNpcGFsOiBuZXcgQWNjb3VudFByaW5jaXBhbChhdXRvbWF0aW9uRW52LmFjY291bnQpXG4gICAgLy8gfSlcblxuICAgIC8vIG5ldyBQdWJsaWNIb3N0ZWRab25lKHRoaXMsIGNvbXBvbmVudE5hbWUoXCJQcm9kSG9zdGVkWm9uZVwiKSwge1xuICAgIC8vICAgem9uZU5hbWU6IHByb2RFbnYuZG9tYWluIGFzIHN0cmluZyxcbiAgICAvLyAgIGNyb3NzQWNjb3VudFpvbmVEZWxlZ2F0aW9uUHJpbmNpcGFsOiBuZXcgQWNjb3VudFByaW5jaXBhbChwcm9kRW52LmFjY291bnQpXG4gICAgLy8gfSlcblxuICAgIC8vIGNvbnN0IGVudiA9IGdldEVudihzY29wZSwgXCJkZXZwbGF0Zm9ybVwiKVxuICAgIC8vIGNvbnN0IGNvbXBvbmVudE5hbWUgPSBzdGFja1ByZWZpeChcInZnXCIsIGVudi5lbnZpcm9ubWVudCwgZW52LnN0YWdlKVxuXG4gICAgLy8gaWYgKGVudi5zdGFnZSA9PT0gXCJkbnNcIikge1xuICAgIC8vICAgY29uc3QgZGV2RW52ID0gZ2V0RW52KHNjb3BlLCBcImRldnBsYXRmb3JtXCIpXG4gICAgLy8gICBjb25zdCBwYXJlbnRab25lID0gbmV3IFB1YmxpY0hvc3RlZFpvbmUodGhpcywgY29tcG9uZW50TmFtZShcIkhvc3RlZFpvbmVcIiksIHtcbiAgICAvLyAgICAgem9uZU5hbWU6IGRldkVudi5kb21haW4gYXMgc3RyaW5nLFxuICAgIC8vICAgICBjcm9zc0FjY291bnRab25lRGVsZWdhdGlvblByaW5jaXBhbDogbmV3IEFjY291bnRQcmluY2lwYWwoZGV2RW52LmFjY291bnQpXG4gICAgLy8gICB9KVxuXG4gICAgLy8gICByZXR1cm5cbiAgICAvLyB9XG5cbiAgICAvLyBjb25zdCBzdWJab25lID0gbmV3IFB1YmxpY0hvc3RlZFpvbmUodGhpcywgY29tcG9uZW50TmFtZShcIlN1YlpvbmVcIiksIHtcbiAgICAvLyAgIHpvbmVOYW1lOiBlbnYuZG9tYWluIGFzIHN0cmluZ1xuICAgIC8vIH0pXG5cbiAgICAvLyAvLyBpbXBvcnQgdGhlIGRlbGVnYXRpb24gcm9sZSBieSBjb25zdHJ1Y3RpbmcgdGhlIHJvbGVBcm5cbiAgICAvLyBjb25zdCBkZWxlZ2F0aW9uUm9sZUFybiA9IFN0YWNrLm9mKHRoaXMpLmZvcm1hdEFybih7XG4gICAgLy8gICByZWdpb246IFwiXCIsIC8vIElBTSBpcyBnbG9iYWwgaW4gZWFjaCBwYXJ0aXRpb25cbiAgICAvLyAgIHNlcnZpY2U6IFwiaWFtXCIsXG4gICAgLy8gICBhY2NvdW50OiBkbnNFbnYuYWNjb3VudCxcbiAgICAvLyAgIHJlc291cmNlOiBcInJvbGVcIixcbiAgICAvLyAgIHJlc291cmNlTmFtZTogXCJNeURlbGVnYXRpb25Sb2xlXCJcbiAgICAvLyB9KVxuXG4gICAgLy8gY29uc3QgZGVsZWdhdGlvblJvbGUgPSBSb2xlLmZyb21Sb2xlQXJuKHRoaXMsIFwiRGVsZWdhdGlvblJvbGVcIiwgZGVsZWdhdGlvblJvbGVBcm4pXG5cbiAgICAvLyAvLyBjcmVhdGUgdGhlIHJlY29yZFxuICAgIC8vIG5ldyBDcm9zc0FjY291bnRab25lRGVsZWdhdGlvblJlY29yZCh0aGlzLCBcImRlbGVnYXRlXCIsIHtcbiAgICAvLyAgIGRlbGVnYXRlZFpvbmU6IHN1YlpvbmUsXG4gICAgLy8gICBwYXJlbnRIb3N0ZWRab25lTmFtZTogZG5zRW52LmRvbWFpbiwgLy8gb3IgeW91IGNhbiB1c2UgcGFyZW50SG9zdGVkWm9uZUlkXG4gICAgLy8gICBkZWxlZ2F0aW9uUm9sZVxuICAgIC8vIH0pXG5cbiAgICAvLyBjb25zdCBkb21haW5ab25lID0gSG9zdGVkWm9uZS5mcm9tTG9va3VwKHRoaXMsIFwiWm9uZVwiLCB7IGRvbWFpbk5hbWU6IFwidm9sYXRpbGl0eS5jb21cIiB9KVxuICAgIC8vIGNvbnN0IGNlcnRpZmljYXRlID0gQ2VydGlmaWNhdGUuZnJvbUNlcnRpZmljYXRlQXJuKHRoaXMsIFwiQ2VydFwiLCBcImFybjphd3M6YWNtOnVzLWVhc3QtMToxMjM0NTY6Y2VydGlmaWNhdGUvYWJjZGVmZ1wiKVxuICB9XG59XG4iXX0=