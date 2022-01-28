//#region Global Imports
import { EntityRepository, Repository } from "typeorm"
//#endregion Global Imports

//#region Local Imports
import { FleekTransaction } from "@entities/fleek_transaction"
//#endregion Local Imports

@EntityRepository(FleekTransaction)
export class FleekTransactionRepository extends Repository<FleekTransaction> {}
