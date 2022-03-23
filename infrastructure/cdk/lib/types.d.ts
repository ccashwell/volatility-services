export declare const STAGES: readonly ["root", "dns", "automation", "identity", "devplatform", "stageplatform", "prodplatform"];
export declare type Stage = typeof STAGES[number];
export interface IEnv {
    awsEnv: "Dev" | "Stage" | "Prod";
    account: string;
    stage: Stage;
    environment: "gbl" | "ue1" | "ue2";
    region: "us-east-1" | "us-east-2";
    domain?: string;
    crossAccountDelegationRoleArn?: string;
}
export declare type RdsSupportPlatforms = Extract<Stage, "devplatform" | "stageplatform" | "prodplatform">;
export declare type PlatformAccount = Extract<Stage, "devplatform" | "stageplatform" | "prodplatform">;
