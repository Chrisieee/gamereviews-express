import mongoose from "mongoose"

const genreModel = new mongoose.Schema({
    name: {type: String, required: true},
})

const Genre = mongoose.model("Genre", genreModel)

export default Genre