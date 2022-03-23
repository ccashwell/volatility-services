import { Construct } from "constructs"
import { IEnv } from "./../lib/types"
// import { EnvCtx } from "../infra/src/lib/types"

export function getEnv(app: Construct, env: string) {
  return app.node.tryGetContext(env) as IEnv
}
