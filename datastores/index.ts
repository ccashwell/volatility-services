// import { createConnection } from "typeorm"
// import { FleekTransaction } from "../entities/fleek_transaction"

// createConnection()
//   .then(async connection => {
//     const transaction = new FleekTransaction()
//     transaction.hash = "123"
//     transaction.key = "skjfsjf"
//     transaction.modelType = "MfivResult"
//     transaction.metadata = { fileSize: 12345, mimeType: "application/json; version=2022-01-01" }
//     const ipfsRepository = connection.getRepository(FleekTransaction)
//     await ipfsRepository.save(transaction)
//     console.log("IPFS has been saved")

//     //await connection.manager.save(transaction)
//     return
//   })
//   .catch(error => console.log(error))
// // createConnection()
// //   .then(async connection => {
// //     console.log("Inserting a new user into the database...")
// //     const user = new User()
// //     user.firstName = "Timber"
// //     user.lastName = "Saw"
// //     user.age = 25
// //     await connection.manager.save(user)
// //     console.log("Saved a new user with id: " + user.id)

// //     console.log("Loading users from the database...")
// //     const users = await connection.manager.find(User)
// //     console.log("Loaded users: ", users)

// //     console.log("Here you can setup and run express/koa/any other framework.")
// //   })
// //   .catch(error => console.log(error))
