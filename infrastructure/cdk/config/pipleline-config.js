"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineConfig = void 0;
const buildspec_content_1 = require("./buildspec-content");
exports.PipelineConfig = {
    serviceName: "volatility-services",
    sourceStage: {
        repositoryName: "volatility-services"
    },
    buildStage: {
        ecrRepositoryName: "volatility-services",
        buildSpec: buildspec_content_1.BuildSpecContent
    },
    deployStage: {
        dev: {
            clusterName: "VolatilityServicesDev",
            vpcId: "vpc-0651c12a2d226ed6c",
            securityGroup: ""
        },
        prod: {
            clusterName: "VolatilityServicesProd",
            vpcId: "vpc-b9dbb0c4",
            securityGroup: "sg-02537d092ba986307"
        },
        stage: {
            clusterName: "VolatilityServicesProd",
            vpcId: "vpc-b9dbb0c4",
            securityGroup: "sg-02537d092ba986307"
        },
        test: {
            clusterName: "VolatilityServicesProd",
            vpcId: "vpc-b9dbb0c4",
            securityGroup: "sg-02537d092ba986307"
        }
    },
    approvalStage: {
        notifyEmails: ["ops+dev@volatility.com"],
        notifyTopic: "arn:aws:sns:us-east-1:000:volatility-services-approval-notification"
    },
    notification: {
        slack: [
            {
                channelName: "cicd",
                channelId: "C02EBB23W7N",
                workspaceId: "T02CQ1XC99Q",
                arn: "arn:aws:chatbot::0000:chat-configuration/slack-channel/volatility-services-slack"
            }
        ]
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwbGVsaW5lLWNvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInBpcGxlbGluZS1jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsMkRBQXNEO0FBRXpDLFFBQUEsY0FBYyxHQUF5QjtJQUNsRCxXQUFXLEVBQUUscUJBQXFCO0lBQ2xDLFdBQVcsRUFBRTtRQUNYLGNBQWMsRUFBRSxxQkFBcUI7S0FDdEM7SUFDRCxVQUFVLEVBQUU7UUFDVixpQkFBaUIsRUFBRSxxQkFBcUI7UUFDeEMsU0FBUyxFQUFFLG9DQUFnQjtLQUM1QjtJQUNELFdBQVcsRUFBRTtRQUNYLEdBQUcsRUFBRTtZQUNILFdBQVcsRUFBRSx1QkFBdUI7WUFDcEMsS0FBSyxFQUFFLHVCQUF1QjtZQUM5QixhQUFhLEVBQUUsRUFBRTtTQUNsQjtRQUNELElBQUksRUFBRTtZQUNKLFdBQVcsRUFBRSx3QkFBd0I7WUFDckMsS0FBSyxFQUFFLGNBQWM7WUFDckIsYUFBYSxFQUFFLHNCQUFzQjtTQUN0QztRQUNELEtBQUssRUFBRTtZQUNMLFdBQVcsRUFBRSx3QkFBd0I7WUFDckMsS0FBSyxFQUFFLGNBQWM7WUFDckIsYUFBYSxFQUFFLHNCQUFzQjtTQUN0QztRQUNELElBQUksRUFBRTtZQUNKLFdBQVcsRUFBRSx3QkFBd0I7WUFDckMsS0FBSyxFQUFFLGNBQWM7WUFDckIsYUFBYSxFQUFFLHNCQUFzQjtTQUN0QztLQUNGO0lBQ0QsYUFBYSxFQUFFO1FBQ2IsWUFBWSxFQUFFLENBQUMsd0JBQXdCLENBQUM7UUFDeEMsV0FBVyxFQUFFLHFFQUFxRTtLQUNuRjtJQUNELFlBQVksRUFBRTtRQUNaLEtBQUssRUFBRTtZQUNMO2dCQUNFLFdBQVcsRUFBRSxNQUFNO2dCQUNuQixTQUFTLEVBQUUsYUFBYTtnQkFDeEIsV0FBVyxFQUFFLGFBQWE7Z0JBQzFCLEdBQUcsRUFBRSxrRkFBa0Y7YUFDeEY7U0FDRjtLQUNGO0NBQ0YsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IElQaXBlbGluZUNvbmZpZ1Byb3BzIH0gZnJvbSBcIi4uL2xpYi9QaXBlbGluZUNvbmZpZ1Byb3BzXCJcbmltcG9ydCB7IEJ1aWxkU3BlY0NvbnRlbnQgfSBmcm9tIFwiLi9idWlsZHNwZWMtY29udGVudFwiXG5cbmV4cG9ydCBjb25zdCBQaXBlbGluZUNvbmZpZzogSVBpcGVsaW5lQ29uZmlnUHJvcHMgPSB7XG4gIHNlcnZpY2VOYW1lOiBcInZvbGF0aWxpdHktc2VydmljZXNcIixcbiAgc291cmNlU3RhZ2U6IHtcbiAgICByZXBvc2l0b3J5TmFtZTogXCJ2b2xhdGlsaXR5LXNlcnZpY2VzXCJcbiAgfSxcbiAgYnVpbGRTdGFnZToge1xuICAgIGVjclJlcG9zaXRvcnlOYW1lOiBcInZvbGF0aWxpdHktc2VydmljZXNcIixcbiAgICBidWlsZFNwZWM6IEJ1aWxkU3BlY0NvbnRlbnRcbiAgfSxcbiAgZGVwbG95U3RhZ2U6IHtcbiAgICBkZXY6IHtcbiAgICAgIGNsdXN0ZXJOYW1lOiBcIlZvbGF0aWxpdHlTZXJ2aWNlc0RldlwiLFxuICAgICAgdnBjSWQ6IFwidnBjLTA2NTFjMTJhMmQyMjZlZDZjXCIsXG4gICAgICBzZWN1cml0eUdyb3VwOiBcIlwiXG4gICAgfSxcbiAgICBwcm9kOiB7XG4gICAgICBjbHVzdGVyTmFtZTogXCJWb2xhdGlsaXR5U2VydmljZXNQcm9kXCIsXG4gICAgICB2cGNJZDogXCJ2cGMtYjlkYmIwYzRcIixcbiAgICAgIHNlY3VyaXR5R3JvdXA6IFwic2ctMDI1MzdkMDkyYmE5ODYzMDdcIlxuICAgIH0sXG4gICAgc3RhZ2U6IHtcbiAgICAgIGNsdXN0ZXJOYW1lOiBcIlZvbGF0aWxpdHlTZXJ2aWNlc1Byb2RcIixcbiAgICAgIHZwY0lkOiBcInZwYy1iOWRiYjBjNFwiLFxuICAgICAgc2VjdXJpdHlHcm91cDogXCJzZy0wMjUzN2QwOTJiYTk4NjMwN1wiXG4gICAgfSxcbiAgICB0ZXN0OiB7XG4gICAgICBjbHVzdGVyTmFtZTogXCJWb2xhdGlsaXR5U2VydmljZXNQcm9kXCIsXG4gICAgICB2cGNJZDogXCJ2cGMtYjlkYmIwYzRcIixcbiAgICAgIHNlY3VyaXR5R3JvdXA6IFwic2ctMDI1MzdkMDkyYmE5ODYzMDdcIlxuICAgIH1cbiAgfSxcbiAgYXBwcm92YWxTdGFnZToge1xuICAgIG5vdGlmeUVtYWlsczogW1wib3BzK2RldkB2b2xhdGlsaXR5LmNvbVwiXSxcbiAgICBub3RpZnlUb3BpYzogXCJhcm46YXdzOnNuczp1cy1lYXN0LTE6MDAwOnZvbGF0aWxpdHktc2VydmljZXMtYXBwcm92YWwtbm90aWZpY2F0aW9uXCJcbiAgfSxcbiAgbm90aWZpY2F0aW9uOiB7XG4gICAgc2xhY2s6IFtcbiAgICAgIHtcbiAgICAgICAgY2hhbm5lbE5hbWU6IFwiY2ljZFwiLFxuICAgICAgICBjaGFubmVsSWQ6IFwiQzAyRUJCMjNXN05cIixcbiAgICAgICAgd29ya3NwYWNlSWQ6IFwiVDAyQ1ExWEM5OVFcIixcbiAgICAgICAgYXJuOiBcImFybjphd3M6Y2hhdGJvdDo6MDAwMDpjaGF0LWNvbmZpZ3VyYXRpb24vc2xhY2stY2hhbm5lbC92b2xhdGlsaXR5LXNlcnZpY2VzLXNsYWNrXCJcbiAgICAgIH1cbiAgICBdXG4gIH1cbn1cbiJdfQ==