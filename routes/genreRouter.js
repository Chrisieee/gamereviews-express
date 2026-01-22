import express from "express"
import Genre from "../models/genreModel.js";
import router from "./reviewRouter.js";

const genreRouter = express.Router()

genreRouter.get("/", async (req, res) => {
    const genres = await Genre.find({})
    if (genres) {
        res.status(200).json(genres)
    } else {
        res.status(404).json({message: "Not found"})
    }
})

genreRouter.get("/:id", async (req, res) => {
    const genre = await Genre.find(req.params.id)
    if (genre) {
        res.status(200).json(genre)
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

router.options("/", (req, res) => {
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.header("Access-Control-Allow-Headers", "Content-Type, Accept")
    res.header("Allow", "GET, POST, OPTIONS").status(204).send()
})

router.options("/:id", (req, res) => {
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS")
    res.header("Access-Control-Allow-Headers", "Content-Type, Accept")
    res.header("Allow", "GET, OPTIONS").status(204).send()
})

export default genreRouter