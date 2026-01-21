import express from "express"
import Genre from "../models/genreModel.js";
import Game from "../models/gameModel.js";

const genreRouter = express.Router()

genreRouter.get("/", async (req, res) => {
    const genres = await Genre.find({})
    if (genres) {
        res.status(200).json(genres)
    } else {
        res.status(404).json({message: "Not found"})
    }
})

genreRouter.post("/", async (req, res) => {
    const genres = [
        'Action', 'Platform', 'FPS', 'Hero shooter', 'Fighting', 'Stealth',
        'Survival', 'Rhythm', 'Battle Royal', 'Adventure', 'Puzzle', 'RPG',
        'Roguelikes', 'Simulator', 'Strategy', 'Sports'
    ]
    const saved = []
    await Genre.deleteMany({})

    for (let genre of genres) {
        const genre1 = Genre({name: genre})
        genre1.save()
        saved.push(genre1)
    }

    res.status(201).send(saved)
})

export default genreRouter