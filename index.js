import express from "express"
import mongoose from "mongoose"
import router from "./routes/gameRouter.js"

const app = express()

try {
    await mongoose.connect(process.env.MONGODB_URI)

    app.listen(process.env.EXPRESS_PORT, () => {
        console.log(`Server is listening on port ${process.env.EXPRESS_PORT}`)
    })

    app.use(express.json());
    app.use(express.urlencoded({extended: true}));
    
    app.use("/", router)

} catch (e) {
    console.log("Database connection failed")
}