export declare const BuildSpecContent: {
    version: string;
    phases: {
        install: {
            "runtime-versions": {
                java: string;
            };
        };
        pre_build: {
            commands: string[];
        };
        build: {
            commands: string[];
        };
        post_build: {
            commands: string[];
        };
    };
    artifacts: {
        files: string[];
    };
};
