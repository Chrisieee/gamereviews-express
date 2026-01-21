import express from "express"
import mongoose from "mongoose"
import router from "./routes/reviewRouter.js"
import genreRouter from "./routes/genreRouter.js";
import gameRouter from "./routes/gameRouter1.js";

const app = express()

try {
    await mongoose.connect(process.env.MONGODB_URI)

    app.listen(process.env.EXPRESS_PORT, () => {
        console.log(`Server is listening on port ${process.env.EXPRESS_PORT}`)
    })

    app.use(express.json());
    app.use(express.urlencoded({extended: true}));

    app.use("/genres", genreRouter)
    app.use("/games", gameRouter)
    app.use("/reviews", router)

} catch (e) {
    console.log("Database connection failed")
}