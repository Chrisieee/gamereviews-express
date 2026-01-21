import mongoose from "mongoose"

const gameModel = new mongoose.Schema({
    title: {type: String, required: true},
    genres: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Genre"
    }]
})

const Game = mongoose.model("Game", gameModel)

export default Game