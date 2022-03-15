import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib"
import { Repository } from "aws-cdk-lib/aws-ecr"
import { Construct } from "constructs"

export class CicdStack extends Stack {
  readonly ecrRepository: Repository

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const repository = new Repository(this, "EcrRepository", {
      repositoryName: "volatility-group/volatility-services",
      imageScanOnPush: true,
      removalPolicy: RemovalPolicy.DESTROY
    })

    //   const bbSource = codebuild.Source.bitBucket({
    //     // BitBucket account
    //     owner: 'mycompany',
    //     // Name of the repository this project belongs to
    //     repo: 'reponame',
    //     // Enable webhook
    //     webhook: true,
    //     // Configure so webhook only fires when the master branch has an update to any code other than this CDK project (e.g. Spring source only)
    //     webhookFilters: [codebuild.FilterGroup.inEventOf(codebuild.EventAction.PUSH).andBranchIs('master').andFilePathIsNot('./cdk/*')],
    // });
  }
}
