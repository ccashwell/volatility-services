"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildSpecContent = void 0;
exports.BuildSpecContent = {
    version: "0.2",
    phases: {
        install: {
            "runtime-versions": {
                java: "corretto8"
            }
        },
        pre_build: {
            commands: [
                // "echo login to DockerHub",
                // "docker login -u $DOCKER_USER_NAME -p $DOCKER_USER_PASSWORD",
                "echo login to AWS ECR",
                "echo $ACCOUNT_ID.dkr.ecr.$ACCOUNT_REGION.amazonaws.com",
                "(aws ecr get-login-password --region $ACCOUNT_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$ACCOUNT_REGION.amazonaws.com)",
                "COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)",
                "IMAGE_TAG=${COMMIT_HASH:=latest}"
            ]
        },
        build: {
            commands: [
                "echo Build started on `date`",
                "mvn clean install",
                "echo Building the Docker image...",
                "export CODEARTIFACT_AUTH_TOKEN=$(aws codeartifact get-authorization-token --domain artifacts --domain-owner 061573364520 --query authorizationToken --output text)",
                "docker build -t $IMAGE_NAME:latest CODEARTIFACT_AUTH_TOKEN=${CODEARTIFACT_AUTH_TOKEN} .",
                "docker tag $IMAGE_NAME:latest $ACCOUNT_ID.dkr.ecr.$ACCOUNT_REGION.amazonaws.com/$IMAGE_NAME:latest",
                "echo Build completed on `date`"
            ]
        },
        post_build: {
            commands: [
                "echo Build completed on `date`",
                "echo Pushing the Docker image...",
                "docker push  $ACCOUNT_ID.dkr.ecr.$ACCOUNT_REGION.amazonaws.com/$IMAGE_NAME:latest",
                'printf \'{"ImageURI":"%s"}\' $ECR_REPO:latest > imageDetail.json',
                'printf \'[{"name":"driver-service","imageUri":"%s"}]\' $ECR_REPO:latest > imagedefinitions.json',
                "echo Pushing Docker Image completed on `date`"
            ]
        }
    },
    artifacts: {
        files: ["imageDetail.json", "imagedefinitions.json", "appspec.yaml", "taskdef.json"]
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGRzcGVjLWNvbnRlbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJidWlsZHNwZWMtY29udGVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBYSxRQUFBLGdCQUFnQixHQUFHO0lBQzlCLE9BQU8sRUFBRSxLQUFLO0lBQ2QsTUFBTSxFQUFFO1FBQ04sT0FBTyxFQUFFO1lBQ1Asa0JBQWtCLEVBQUU7Z0JBQ2xCLElBQUksRUFBRSxXQUFXO2FBQ2xCO1NBQ0Y7UUFDRCxTQUFTLEVBQUU7WUFDVCxRQUFRLEVBQUU7Z0JBQ1IsNkJBQTZCO2dCQUM3QixnRUFBZ0U7Z0JBQ2hFLHVCQUF1QjtnQkFDdkIsd0RBQXdEO2dCQUN4RCx3SkFBd0o7Z0JBQ3hKLHFFQUFxRTtnQkFDckUsa0NBQWtDO2FBQ25DO1NBQ0Y7UUFDRCxLQUFLLEVBQUU7WUFDTCxRQUFRLEVBQUU7Z0JBQ1IsOEJBQThCO2dCQUM5QixtQkFBbUI7Z0JBQ25CLG1DQUFtQztnQkFDbkMsb0tBQW9LO2dCQUNwSyx5RkFBeUY7Z0JBQ3pGLG9HQUFvRztnQkFDcEcsZ0NBQWdDO2FBQ2pDO1NBQ0Y7UUFDRCxVQUFVLEVBQUU7WUFDVixRQUFRLEVBQUU7Z0JBQ1IsZ0NBQWdDO2dCQUNoQyxrQ0FBa0M7Z0JBQ2xDLG1GQUFtRjtnQkFDbkYsa0VBQWtFO2dCQUNsRSxpR0FBaUc7Z0JBQ2pHLCtDQUErQzthQUNoRDtTQUNGO0tBQ0Y7SUFDRCxTQUFTLEVBQUU7UUFDVCxLQUFLLEVBQUUsQ0FBQyxrQkFBa0IsRUFBRSx1QkFBdUIsRUFBRSxjQUFjLEVBQUUsY0FBYyxDQUFDO0tBQ3JGO0NBQ0YsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjb25zdCBCdWlsZFNwZWNDb250ZW50ID0ge1xuICB2ZXJzaW9uOiBcIjAuMlwiLFxuICBwaGFzZXM6IHtcbiAgICBpbnN0YWxsOiB7XG4gICAgICBcInJ1bnRpbWUtdmVyc2lvbnNcIjoge1xuICAgICAgICBqYXZhOiBcImNvcnJldHRvOFwiXG4gICAgICB9XG4gICAgfSxcbiAgICBwcmVfYnVpbGQ6IHtcbiAgICAgIGNvbW1hbmRzOiBbXG4gICAgICAgIC8vIFwiZWNobyBsb2dpbiB0byBEb2NrZXJIdWJcIixcbiAgICAgICAgLy8gXCJkb2NrZXIgbG9naW4gLXUgJERPQ0tFUl9VU0VSX05BTUUgLXAgJERPQ0tFUl9VU0VSX1BBU1NXT1JEXCIsXG4gICAgICAgIFwiZWNobyBsb2dpbiB0byBBV1MgRUNSXCIsXG4gICAgICAgIFwiZWNobyAkQUNDT1VOVF9JRC5ka3IuZWNyLiRBQ0NPVU5UX1JFR0lPTi5hbWF6b25hd3MuY29tXCIsXG4gICAgICAgIFwiKGF3cyBlY3IgZ2V0LWxvZ2luLXBhc3N3b3JkIC0tcmVnaW9uICRBQ0NPVU5UX1JFR0lPTiB8IGRvY2tlciBsb2dpbiAtLXVzZXJuYW1lIEFXUyAtLXBhc3N3b3JkLXN0ZGluICRBQ0NPVU5UX0lELmRrci5lY3IuJEFDQ09VTlRfUkVHSU9OLmFtYXpvbmF3cy5jb20pXCIsXG4gICAgICAgIFwiQ09NTUlUX0hBU0g9JChlY2hvICRDT0RFQlVJTERfUkVTT0xWRURfU09VUkNFX1ZFUlNJT04gfCBjdXQgLWMgMS03KVwiLFxuICAgICAgICBcIklNQUdFX1RBRz0ke0NPTU1JVF9IQVNIOj1sYXRlc3R9XCJcbiAgICAgIF1cbiAgICB9LFxuICAgIGJ1aWxkOiB7XG4gICAgICBjb21tYW5kczogW1xuICAgICAgICBcImVjaG8gQnVpbGQgc3RhcnRlZCBvbiBgZGF0ZWBcIixcbiAgICAgICAgXCJtdm4gY2xlYW4gaW5zdGFsbFwiLFxuICAgICAgICBcImVjaG8gQnVpbGRpbmcgdGhlIERvY2tlciBpbWFnZS4uLlwiLFxuICAgICAgICBcImV4cG9ydCBDT0RFQVJUSUZBQ1RfQVVUSF9UT0tFTj0kKGF3cyBjb2RlYXJ0aWZhY3QgZ2V0LWF1dGhvcml6YXRpb24tdG9rZW4gLS1kb21haW4gYXJ0aWZhY3RzIC0tZG9tYWluLW93bmVyIDA2MTU3MzM2NDUyMCAtLXF1ZXJ5IGF1dGhvcml6YXRpb25Ub2tlbiAtLW91dHB1dCB0ZXh0KVwiLFxuICAgICAgICBcImRvY2tlciBidWlsZCAtdCAkSU1BR0VfTkFNRTpsYXRlc3QgQ09ERUFSVElGQUNUX0FVVEhfVE9LRU49JHtDT0RFQVJUSUZBQ1RfQVVUSF9UT0tFTn0gLlwiLFxuICAgICAgICBcImRvY2tlciB0YWcgJElNQUdFX05BTUU6bGF0ZXN0ICRBQ0NPVU5UX0lELmRrci5lY3IuJEFDQ09VTlRfUkVHSU9OLmFtYXpvbmF3cy5jb20vJElNQUdFX05BTUU6bGF0ZXN0XCIsXG4gICAgICAgIFwiZWNobyBCdWlsZCBjb21wbGV0ZWQgb24gYGRhdGVgXCJcbiAgICAgIF1cbiAgICB9LFxuICAgIHBvc3RfYnVpbGQ6IHtcbiAgICAgIGNvbW1hbmRzOiBbXG4gICAgICAgIFwiZWNobyBCdWlsZCBjb21wbGV0ZWQgb24gYGRhdGVgXCIsXG4gICAgICAgIFwiZWNobyBQdXNoaW5nIHRoZSBEb2NrZXIgaW1hZ2UuLi5cIixcbiAgICAgICAgXCJkb2NrZXIgcHVzaCAgJEFDQ09VTlRfSUQuZGtyLmVjci4kQUNDT1VOVF9SRUdJT04uYW1hem9uYXdzLmNvbS8kSU1BR0VfTkFNRTpsYXRlc3RcIixcbiAgICAgICAgJ3ByaW50ZiBcXCd7XCJJbWFnZVVSSVwiOlwiJXNcIn1cXCcgJEVDUl9SRVBPOmxhdGVzdCA+IGltYWdlRGV0YWlsLmpzb24nLFxuICAgICAgICAncHJpbnRmIFxcJ1t7XCJuYW1lXCI6XCJkcml2ZXItc2VydmljZVwiLFwiaW1hZ2VVcmlcIjpcIiVzXCJ9XVxcJyAkRUNSX1JFUE86bGF0ZXN0ID4gaW1hZ2VkZWZpbml0aW9ucy5qc29uJyxcbiAgICAgICAgXCJlY2hvIFB1c2hpbmcgRG9ja2VyIEltYWdlIGNvbXBsZXRlZCBvbiBgZGF0ZWBcIlxuICAgICAgXVxuICAgIH1cbiAgfSxcbiAgYXJ0aWZhY3RzOiB7XG4gICAgZmlsZXM6IFtcImltYWdlRGV0YWlsLmpzb25cIiwgXCJpbWFnZWRlZmluaXRpb25zLmpzb25cIiwgXCJhcHBzcGVjLnlhbWxcIiwgXCJ0YXNrZGVmLmpzb25cIl1cbiAgfVxufVxuIl19