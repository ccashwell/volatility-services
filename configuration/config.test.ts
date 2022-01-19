import { config as _config, EnvConfig } from "./config.base";

export const config: EnvConfig = {
	..._config,
	...{},
};
