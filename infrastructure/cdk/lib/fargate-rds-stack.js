"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VgFargateRdsNestedStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_ec2_1 = require("aws-cdk-lib/aws-ec2");
const aws_rds_1 = require("aws-cdk-lib/aws-rds");
const aws_secretsmanager_1 = require("aws-cdk-lib/aws-secretsmanager");
const aws_ssm_1 = require("aws-cdk-lib/aws-ssm");
class VgFargateRdsNestedStack extends aws_cdk_lib_1.NestedStack {
    constructor(scope, id, props) {
        var _a;
        super(scope, id, props);
        const serviceName = "volatility-services";
        const databaseName = "volatility-rds";
        const databaseUsername = "volatility";
        const stage = props === null || props === void 0 ? void 0 : props.stage;
        const vpc = props === null || props === void 0 ? void 0 : props.vpc;
        const subnetIds = (_a = vpc === null || vpc === void 0 ? void 0 : vpc.isolatedSubnets.map(subnet => subnet.subnetId)) !== null && _a !== void 0 ? _a : [];
        const dbSubnetGroup = new aws_rds_1.CfnDBSubnetGroup(this, "AuroraSubnetGroup", {
            dbSubnetGroupDescription: "Subnet group to access aurora",
            dbSubnetGroupName: "aurora-serverless-subnet-group",
            subnetIds
        });
        this.databaseCredentialsSecret = new aws_secretsmanager_1.Secret(this, "DBCredentialsSecret", {
            secretName: `${serviceName}-${stage}-credentials`,
            generateSecretString: {
                secretStringTemplate: JSON.stringify({
                    username: databaseUsername
                }),
                excludePunctuation: true,
                includeSpace: false,
                generateStringKey: "password"
            }
        });
        new aws_ssm_1.StringParameter(this, "DBCredentialsArn", {
            parameterName: `${serviceName}-${stage}-credentials-arn`,
            stringValue: this.databaseCredentialsSecret.secretArn
        });
        const dbClusterSecurityGroup = new aws_ec2_1.SecurityGroup(this, "DBClusterSecurityGroup", { vpc });
        // A better security approach would be allow ingress from private subnet only
        // but I haven't been able to get the ipv4 cidr block of subnets in aws-cwk
        dbClusterSecurityGroup.addIngressRule(aws_ec2_1.Peer.ipv4("10.0.0.0/16"), aws_ec2_1.Port.tcp(5432));
        const dbConfig = {
            dbClusterIdentifier: `${serviceName}-${stage}-cluster`,
            engineMode: "serverless",
            engine: "aurora-postgresql",
            engineVersion: "10.7",
            databaseName,
            masterUsername: this.databaseCredentialsSecret.secretValueFromJson("username").toString(),
            masterUserPassword: this.databaseCredentialsSecret.secretValueFromJson("password").toString(),
            // Note: aurora serverless cluster can be accessed within its VPC only
            // https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless.html
            dbSubnetGroupName: dbSubnetGroup.dbSubnetGroupName,
            scalingConfiguration: {
                autoPause: true,
                maxCapacity: 2,
                minCapacity: 2,
                secondsUntilAutoPause: 3600
            },
            vpcSecurityGroupIds: [dbClusterSecurityGroup.securityGroupId]
        };
        // const cluster = new ServerlessCluster(this, "AuroraCluster", {
        //   engine: DatabaseClusterEngine.AURORA_POSTGRESQL,
        //   parameterGroup: ParameterGroup.fromParameterGroupName(this, "ParameterGroup", "default.aurora-postgresql10"),
        //   defaultDatabaseName: databaseName,
        //   vpc,
        //   secret: this.databaseCredentialsSecret,
        //   // credentials: Credentials.fromGeneratedSecret(this.databaseCredentialsSecret.secretValueFromJson("username").toString(),
        //   // ) this.databaseCredentialsSecret,
        //   scaling: { autoPause: Duration.seconds(3600), minCapacity: 1, maxCapacity: 2 } // Optional. If not set, then instance will pause after 5 minutes
        // })
        this.rdsCluster = new aws_rds_1.CfnDBCluster(this, "DBCluster", dbConfig);
        this.rdsCluster.addDependsOn(dbSubnetGroup);
        new aws_cdk_lib_1.CfnOutput(this, "rdsCluster", {
            value: this.rdsCluster.attrEndpointAddress,
            description: "The endpoint of the rds cluster",
            exportName: "rdsClusterAttrEndpointAddress"
        });
        // const cluster = new Cluster(this, "Cluster", { vpc })
        // const loadBalancedService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "FargateService", {
        //   cluster,
        //   taskImageOptions: {
        //     image: ecs.ContainerImage.fromRegistry("billykong/express-database-checker"),
        //     environment: {
        //       DATABASE_HOST: rdsCluster.attrEndpointAddress,
        //       DATABASE_NAME: databaseName,
        //       // TODO: use secret instead of environment
        //       DATABASE_USERNAME: databaseCredentialsSecret.secretValueFromJson("username").toString(),
        //       DATABASE_PASSWORD: databaseCredentialsSecret.secretValueFromJson("password").toString()
        //     }
        //   }
        // })
    }
}
exports.VgFargateRdsNestedStack = VgFargateRdsNestedStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmFyZ2F0ZS1yZHMtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJmYXJnYXRlLXJkcy1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2Q0FBc0U7QUFDdEUsaURBQW9FO0FBQ3BFLGlEQUFvRTtBQUNwRSx1RUFBdUQ7QUFDdkQsaURBQXFEO0FBUXJELE1BQWEsdUJBQXdCLFNBQVEseUJBQVc7SUFJdEQsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFvQzs7UUFDNUUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFFdkIsTUFBTSxXQUFXLEdBQUcscUJBQXFCLENBQUE7UUFDekMsTUFBTSxZQUFZLEdBQUcsZ0JBQWdCLENBQUE7UUFDckMsTUFBTSxnQkFBZ0IsR0FBRyxZQUFZLENBQUE7UUFDckMsTUFBTSxLQUFLLEdBQUcsS0FBSyxhQUFMLEtBQUssdUJBQUwsS0FBSyxDQUFFLEtBQWUsQ0FBQTtRQUNwQyxNQUFNLEdBQUcsR0FBRyxLQUFLLGFBQUwsS0FBSyx1QkFBTCxLQUFLLENBQUUsR0FBVSxDQUFBO1FBQzdCLE1BQU0sU0FBUyxTQUFHLEdBQUcsYUFBSCxHQUFHLHVCQUFILEdBQUcsQ0FBRSxlQUFlLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFFBQVEsb0NBQUssRUFBRSxDQUFBO1FBQzNFLE1BQU0sYUFBYSxHQUFxQixJQUFJLDBCQUFnQixDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRTtZQUN0Rix3QkFBd0IsRUFBRSwrQkFBK0I7WUFDekQsaUJBQWlCLEVBQUUsZ0NBQWdDO1lBQ25ELFNBQVM7U0FDVixDQUFDLENBQUE7UUFFRixJQUFJLENBQUMseUJBQXlCLEdBQUcsSUFBSSwyQkFBTSxDQUFDLElBQUksRUFBRSxxQkFBcUIsRUFBRTtZQUN2RSxVQUFVLEVBQUUsR0FBRyxXQUFXLElBQUksS0FBSyxjQUFjO1lBQ2pELG9CQUFvQixFQUFFO2dCQUNwQixvQkFBb0IsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO29CQUNuQyxRQUFRLEVBQUUsZ0JBQWdCO2lCQUMzQixDQUFDO2dCQUNGLGtCQUFrQixFQUFFLElBQUk7Z0JBQ3hCLFlBQVksRUFBRSxLQUFLO2dCQUNuQixpQkFBaUIsRUFBRSxVQUFVO2FBQzlCO1NBQ0YsQ0FBQyxDQUFBO1FBRUYsSUFBSSx5QkFBZSxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUM1QyxhQUFhLEVBQUUsR0FBRyxXQUFXLElBQUksS0FBSyxrQkFBa0I7WUFDeEQsV0FBVyxFQUFFLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxTQUFTO1NBQ3RELENBQUMsQ0FBQTtRQUVGLE1BQU0sc0JBQXNCLEdBQUcsSUFBSSx1QkFBYSxDQUFDLElBQUksRUFBRSx3QkFBd0IsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUE7UUFDekYsNkVBQTZFO1FBQzdFLDJFQUEyRTtRQUMzRSxzQkFBc0IsQ0FBQyxjQUFjLENBQUMsY0FBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxjQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUE7UUFFL0UsTUFBTSxRQUFRLEdBQUc7WUFDZixtQkFBbUIsRUFBRSxHQUFHLFdBQVcsSUFBSSxLQUFLLFVBQVU7WUFDdEQsVUFBVSxFQUFFLFlBQVk7WUFDeEIsTUFBTSxFQUFFLG1CQUFtQjtZQUMzQixhQUFhLEVBQUUsTUFBTTtZQUNyQixZQUFZO1lBQ1osY0FBYyxFQUFFLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxtQkFBbUIsQ0FBQyxVQUFVLENBQUMsQ0FBQyxRQUFRLEVBQUU7WUFDekYsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLHlCQUF5QixDQUFDLG1CQUFtQixDQUFDLFVBQVUsQ0FBQyxDQUFDLFFBQVEsRUFBRTtZQUM3RixzRUFBc0U7WUFDdEUsc0ZBQXNGO1lBQ3RGLGlCQUFpQixFQUFFLGFBQWEsQ0FBQyxpQkFBaUI7WUFDbEQsb0JBQW9CLEVBQUU7Z0JBQ3BCLFNBQVMsRUFBRSxJQUFJO2dCQUNmLFdBQVcsRUFBRSxDQUFDO2dCQUNkLFdBQVcsRUFBRSxDQUFDO2dCQUNkLHFCQUFxQixFQUFFLElBQUk7YUFDNUI7WUFDRCxtQkFBbUIsRUFBRSxDQUFDLHNCQUFzQixDQUFDLGVBQWUsQ0FBQztTQUM5RCxDQUFBO1FBRUQsaUVBQWlFO1FBQ2pFLHFEQUFxRDtRQUNyRCxrSEFBa0g7UUFDbEgsdUNBQXVDO1FBQ3ZDLFNBQVM7UUFDVCw0Q0FBNEM7UUFDNUMsK0hBQStIO1FBQy9ILHlDQUF5QztRQUN6QyxxSkFBcUo7UUFDckosS0FBSztRQUVMLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxzQkFBWSxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUE7UUFDL0QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLENBQUE7UUFFM0MsSUFBSSx1QkFBUyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7WUFDaEMsS0FBSyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsbUJBQW1CO1lBQzFDLFdBQVcsRUFBRSxpQ0FBaUM7WUFDOUMsVUFBVSxFQUFFLCtCQUErQjtTQUM1QyxDQUFDLENBQUE7UUFFRix3REFBd0Q7UUFDeEQsK0dBQStHO1FBQy9HLGFBQWE7UUFDYix3QkFBd0I7UUFDeEIsb0ZBQW9GO1FBQ3BGLHFCQUFxQjtRQUNyQix1REFBdUQ7UUFDdkQscUNBQXFDO1FBQ3JDLG1EQUFtRDtRQUNuRCxpR0FBaUc7UUFDakcsZ0dBQWdHO1FBQ2hHLFFBQVE7UUFDUixNQUFNO1FBQ04sS0FBSztJQUNQLENBQUM7Q0FDRjtBQWhHRCwwREFnR0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDZm5PdXRwdXQsIE5lc3RlZFN0YWNrLCBOZXN0ZWRTdGFja1Byb3BzIH0gZnJvbSBcImF3cy1jZGstbGliXCJcbmltcG9ydCB7IFBlZXIsIFBvcnQsIFNlY3VyaXR5R3JvdXAsIFZwYyB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtZWMyXCJcbmltcG9ydCB7IENmbkRCQ2x1c3RlciwgQ2ZuREJTdWJuZXRHcm91cCB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtcmRzXCJcbmltcG9ydCB7IFNlY3JldCB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3Mtc2VjcmV0c21hbmFnZXJcIlxuaW1wb3J0IHsgU3RyaW5nUGFyYW1ldGVyIH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1zc21cIlxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIlxuXG5leHBvcnQgaW50ZXJmYWNlIFZnRmFyZ2F0ZVJkc05lc3RlZFN0YWNrUHJvcHMgZXh0ZW5kcyBOZXN0ZWRTdGFja1Byb3BzIHtcbiAgdnBjOiBWcGNcbiAgc3RhZ2U6IFwiZGV2XCIgfCBcInN0YWdlXCIgfCBcInByb2RcIlxufVxuXG5leHBvcnQgY2xhc3MgVmdGYXJnYXRlUmRzTmVzdGVkU3RhY2sgZXh0ZW5kcyBOZXN0ZWRTdGFjayB7XG4gIHB1YmxpYyByZWFkb25seSByZHNDbHVzdGVyOiBDZm5EQkNsdXN0ZXJcbiAgcHVibGljIHJlYWRvbmx5IGRhdGFiYXNlQ3JlZGVudGlhbHNTZWNyZXQ6IFNlY3JldFxuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogVmdGYXJnYXRlUmRzTmVzdGVkU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpXG5cbiAgICBjb25zdCBzZXJ2aWNlTmFtZSA9IFwidm9sYXRpbGl0eS1zZXJ2aWNlc1wiXG4gICAgY29uc3QgZGF0YWJhc2VOYW1lID0gXCJ2b2xhdGlsaXR5LXJkc1wiXG4gICAgY29uc3QgZGF0YWJhc2VVc2VybmFtZSA9IFwidm9sYXRpbGl0eVwiXG4gICAgY29uc3Qgc3RhZ2UgPSBwcm9wcz8uc3RhZ2UgYXMgc3RyaW5nXG4gICAgY29uc3QgdnBjID0gcHJvcHM/LnZwYyBhcyBWcGNcbiAgICBjb25zdCBzdWJuZXRJZHMgPSB2cGM/Lmlzb2xhdGVkU3VibmV0cy5tYXAoc3VibmV0ID0+IHN1Ym5ldC5zdWJuZXRJZCkgPz8gW11cbiAgICBjb25zdCBkYlN1Ym5ldEdyb3VwOiBDZm5EQlN1Ym5ldEdyb3VwID0gbmV3IENmbkRCU3VibmV0R3JvdXAodGhpcywgXCJBdXJvcmFTdWJuZXRHcm91cFwiLCB7XG4gICAgICBkYlN1Ym5ldEdyb3VwRGVzY3JpcHRpb246IFwiU3VibmV0IGdyb3VwIHRvIGFjY2VzcyBhdXJvcmFcIixcbiAgICAgIGRiU3VibmV0R3JvdXBOYW1lOiBcImF1cm9yYS1zZXJ2ZXJsZXNzLXN1Ym5ldC1ncm91cFwiLFxuICAgICAgc3VibmV0SWRzXG4gICAgfSlcblxuICAgIHRoaXMuZGF0YWJhc2VDcmVkZW50aWFsc1NlY3JldCA9IG5ldyBTZWNyZXQodGhpcywgXCJEQkNyZWRlbnRpYWxzU2VjcmV0XCIsIHtcbiAgICAgIHNlY3JldE5hbWU6IGAke3NlcnZpY2VOYW1lfS0ke3N0YWdlfS1jcmVkZW50aWFsc2AsXG4gICAgICBnZW5lcmF0ZVNlY3JldFN0cmluZzoge1xuICAgICAgICBzZWNyZXRTdHJpbmdUZW1wbGF0ZTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIHVzZXJuYW1lOiBkYXRhYmFzZVVzZXJuYW1lXG4gICAgICAgIH0pLFxuICAgICAgICBleGNsdWRlUHVuY3R1YXRpb246IHRydWUsXG4gICAgICAgIGluY2x1ZGVTcGFjZTogZmFsc2UsXG4gICAgICAgIGdlbmVyYXRlU3RyaW5nS2V5OiBcInBhc3N3b3JkXCJcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgbmV3IFN0cmluZ1BhcmFtZXRlcih0aGlzLCBcIkRCQ3JlZGVudGlhbHNBcm5cIiwge1xuICAgICAgcGFyYW1ldGVyTmFtZTogYCR7c2VydmljZU5hbWV9LSR7c3RhZ2V9LWNyZWRlbnRpYWxzLWFybmAsXG4gICAgICBzdHJpbmdWYWx1ZTogdGhpcy5kYXRhYmFzZUNyZWRlbnRpYWxzU2VjcmV0LnNlY3JldEFyblxuICAgIH0pXG5cbiAgICBjb25zdCBkYkNsdXN0ZXJTZWN1cml0eUdyb3VwID0gbmV3IFNlY3VyaXR5R3JvdXAodGhpcywgXCJEQkNsdXN0ZXJTZWN1cml0eUdyb3VwXCIsIHsgdnBjIH0pXG4gICAgLy8gQSBiZXR0ZXIgc2VjdXJpdHkgYXBwcm9hY2ggd291bGQgYmUgYWxsb3cgaW5ncmVzcyBmcm9tIHByaXZhdGUgc3VibmV0IG9ubHlcbiAgICAvLyBidXQgSSBoYXZlbid0IGJlZW4gYWJsZSB0byBnZXQgdGhlIGlwdjQgY2lkciBibG9jayBvZiBzdWJuZXRzIGluIGF3cy1jd2tcbiAgICBkYkNsdXN0ZXJTZWN1cml0eUdyb3VwLmFkZEluZ3Jlc3NSdWxlKFBlZXIuaXB2NChcIjEwLjAuMC4wLzE2XCIpLCBQb3J0LnRjcCg1NDMyKSlcblxuICAgIGNvbnN0IGRiQ29uZmlnID0ge1xuICAgICAgZGJDbHVzdGVySWRlbnRpZmllcjogYCR7c2VydmljZU5hbWV9LSR7c3RhZ2V9LWNsdXN0ZXJgLFxuICAgICAgZW5naW5lTW9kZTogXCJzZXJ2ZXJsZXNzXCIsXG4gICAgICBlbmdpbmU6IFwiYXVyb3JhLXBvc3RncmVzcWxcIixcbiAgICAgIGVuZ2luZVZlcnNpb246IFwiMTAuN1wiLFxuICAgICAgZGF0YWJhc2VOYW1lLFxuICAgICAgbWFzdGVyVXNlcm5hbWU6IHRoaXMuZGF0YWJhc2VDcmVkZW50aWFsc1NlY3JldC5zZWNyZXRWYWx1ZUZyb21Kc29uKFwidXNlcm5hbWVcIikudG9TdHJpbmcoKSxcbiAgICAgIG1hc3RlclVzZXJQYXNzd29yZDogdGhpcy5kYXRhYmFzZUNyZWRlbnRpYWxzU2VjcmV0LnNlY3JldFZhbHVlRnJvbUpzb24oXCJwYXNzd29yZFwiKS50b1N0cmluZygpLFxuICAgICAgLy8gTm90ZTogYXVyb3JhIHNlcnZlcmxlc3MgY2x1c3RlciBjYW4gYmUgYWNjZXNzZWQgd2l0aGluIGl0cyBWUEMgb25seVxuICAgICAgLy8gaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL0FtYXpvblJEUy9sYXRlc3QvQXVyb3JhVXNlckd1aWRlL2F1cm9yYS1zZXJ2ZXJsZXNzLmh0bWxcbiAgICAgIGRiU3VibmV0R3JvdXBOYW1lOiBkYlN1Ym5ldEdyb3VwLmRiU3VibmV0R3JvdXBOYW1lLFxuICAgICAgc2NhbGluZ0NvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgYXV0b1BhdXNlOiB0cnVlLFxuICAgICAgICBtYXhDYXBhY2l0eTogMixcbiAgICAgICAgbWluQ2FwYWNpdHk6IDIsXG4gICAgICAgIHNlY29uZHNVbnRpbEF1dG9QYXVzZTogMzYwMFxuICAgICAgfSxcbiAgICAgIHZwY1NlY3VyaXR5R3JvdXBJZHM6IFtkYkNsdXN0ZXJTZWN1cml0eUdyb3VwLnNlY3VyaXR5R3JvdXBJZF1cbiAgICB9XG5cbiAgICAvLyBjb25zdCBjbHVzdGVyID0gbmV3IFNlcnZlcmxlc3NDbHVzdGVyKHRoaXMsIFwiQXVyb3JhQ2x1c3RlclwiLCB7XG4gICAgLy8gICBlbmdpbmU6IERhdGFiYXNlQ2x1c3RlckVuZ2luZS5BVVJPUkFfUE9TVEdSRVNRTCxcbiAgICAvLyAgIHBhcmFtZXRlckdyb3VwOiBQYXJhbWV0ZXJHcm91cC5mcm9tUGFyYW1ldGVyR3JvdXBOYW1lKHRoaXMsIFwiUGFyYW1ldGVyR3JvdXBcIiwgXCJkZWZhdWx0LmF1cm9yYS1wb3N0Z3Jlc3FsMTBcIiksXG4gICAgLy8gICBkZWZhdWx0RGF0YWJhc2VOYW1lOiBkYXRhYmFzZU5hbWUsXG4gICAgLy8gICB2cGMsXG4gICAgLy8gICBzZWNyZXQ6IHRoaXMuZGF0YWJhc2VDcmVkZW50aWFsc1NlY3JldCxcbiAgICAvLyAgIC8vIGNyZWRlbnRpYWxzOiBDcmVkZW50aWFscy5mcm9tR2VuZXJhdGVkU2VjcmV0KHRoaXMuZGF0YWJhc2VDcmVkZW50aWFsc1NlY3JldC5zZWNyZXRWYWx1ZUZyb21Kc29uKFwidXNlcm5hbWVcIikudG9TdHJpbmcoKSxcbiAgICAvLyAgIC8vICkgdGhpcy5kYXRhYmFzZUNyZWRlbnRpYWxzU2VjcmV0LFxuICAgIC8vICAgc2NhbGluZzogeyBhdXRvUGF1c2U6IER1cmF0aW9uLnNlY29uZHMoMzYwMCksIG1pbkNhcGFjaXR5OiAxLCBtYXhDYXBhY2l0eTogMiB9IC8vIE9wdGlvbmFsLiBJZiBub3Qgc2V0LCB0aGVuIGluc3RhbmNlIHdpbGwgcGF1c2UgYWZ0ZXIgNSBtaW51dGVzXG4gICAgLy8gfSlcblxuICAgIHRoaXMucmRzQ2x1c3RlciA9IG5ldyBDZm5EQkNsdXN0ZXIodGhpcywgXCJEQkNsdXN0ZXJcIiwgZGJDb25maWcpXG4gICAgdGhpcy5yZHNDbHVzdGVyLmFkZERlcGVuZHNPbihkYlN1Ym5ldEdyb3VwKVxuXG4gICAgbmV3IENmbk91dHB1dCh0aGlzLCBcInJkc0NsdXN0ZXJcIiwge1xuICAgICAgdmFsdWU6IHRoaXMucmRzQ2x1c3Rlci5hdHRyRW5kcG9pbnRBZGRyZXNzLFxuICAgICAgZGVzY3JpcHRpb246IFwiVGhlIGVuZHBvaW50IG9mIHRoZSByZHMgY2x1c3RlclwiLFxuICAgICAgZXhwb3J0TmFtZTogXCJyZHNDbHVzdGVyQXR0ckVuZHBvaW50QWRkcmVzc1wiXG4gICAgfSlcblxuICAgIC8vIGNvbnN0IGNsdXN0ZXIgPSBuZXcgQ2x1c3Rlcih0aGlzLCBcIkNsdXN0ZXJcIiwgeyB2cGMgfSlcbiAgICAvLyBjb25zdCBsb2FkQmFsYW5jZWRTZXJ2aWNlID0gbmV3IGVjc19wYXR0ZXJucy5BcHBsaWNhdGlvbkxvYWRCYWxhbmNlZEZhcmdhdGVTZXJ2aWNlKHRoaXMsIFwiRmFyZ2F0ZVNlcnZpY2VcIiwge1xuICAgIC8vICAgY2x1c3RlcixcbiAgICAvLyAgIHRhc2tJbWFnZU9wdGlvbnM6IHtcbiAgICAvLyAgICAgaW1hZ2U6IGVjcy5Db250YWluZXJJbWFnZS5mcm9tUmVnaXN0cnkoXCJiaWxseWtvbmcvZXhwcmVzcy1kYXRhYmFzZS1jaGVja2VyXCIpLFxuICAgIC8vICAgICBlbnZpcm9ubWVudDoge1xuICAgIC8vICAgICAgIERBVEFCQVNFX0hPU1Q6IHJkc0NsdXN0ZXIuYXR0ckVuZHBvaW50QWRkcmVzcyxcbiAgICAvLyAgICAgICBEQVRBQkFTRV9OQU1FOiBkYXRhYmFzZU5hbWUsXG4gICAgLy8gICAgICAgLy8gVE9ETzogdXNlIHNlY3JldCBpbnN0ZWFkIG9mIGVudmlyb25tZW50XG4gICAgLy8gICAgICAgREFUQUJBU0VfVVNFUk5BTUU6IGRhdGFiYXNlQ3JlZGVudGlhbHNTZWNyZXQuc2VjcmV0VmFsdWVGcm9tSnNvbihcInVzZXJuYW1lXCIpLnRvU3RyaW5nKCksXG4gICAgLy8gICAgICAgREFUQUJBU0VfUEFTU1dPUkQ6IGRhdGFiYXNlQ3JlZGVudGlhbHNTZWNyZXQuc2VjcmV0VmFsdWVGcm9tSnNvbihcInBhc3N3b3JkXCIpLnRvU3RyaW5nKClcbiAgICAvLyAgICAgfVxuICAgIC8vICAgfVxuICAgIC8vIH0pXG4gIH1cbn1cbiJdfQ==