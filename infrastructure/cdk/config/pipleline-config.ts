import { IPipelineConfigProps } from "../lib/PipelineConfigProps"
import { BuildSpecContent } from "./buildspec-content"

export const PipelineConfig: IPipelineConfigProps = {
  serviceName: "volatility-services",
  sourceStage: {
    repositoryName: "volatility-services"
  },
  buildStage: {
    ecrRepositoryName: "volatility-services",
    buildSpec: BuildSpecContent
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
}
