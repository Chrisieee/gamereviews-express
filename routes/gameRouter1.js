import express from "express"
import Game from "../models/gameModel.js";
import Genre from "../models/genreModel.js";
import {fakerNL} from "@faker-js/faker";

const gameRouter = express.Router()

gameRouter.get("/", async (req, res) => {
    const games = await Game.find({}).populate("genres")
    if (games) {
        res.status(200).json(games)
    } else {
        res.status(404).json({message: "Not found"})
    }
})

gameRouter.get("/:id", async (req, res) => {
    const game = await Game.find(req.params.id)
    if (game) {
        res.status(200).json(game)
    } else {
        res.status(404).json({message: "Not found"})
    }
})

gameRouter.post("/", async (req, res, next) => {
    if (req.body?.method && req.body.method === "SEED") {

        const reset = req.body?.reset ?? false
        if (reset && reset === "true") {
            await Game.deleteMany({})
        }

        const amount = req.body?.amount ?? 10
        const games = []

        for (let i = 0; i < amount; i++) {
            const genre = await Genre.find({}).select("_id")
            const number = Math.floor(Math.random() * 16)
            const game = Game({
                title: fakerNL.book.title(),
                genres: genre[number],
            })
            await game.save()
            games.push(game)
        }
        res.status(201).json(games)

    } else {
        next()
    }
})

gameRouter.post("/", async (req, res) => {
    if (req.body?.title && req.body?.genres) {
        const genres = await Genre.find({
            _id: {$in: req.body.genres}
        });

        if (genres.length !== req.body.genres.length) {
            return res.status(400).json({message: "Invalid genre id"});
        }

        const game = Game({
            title: req.body.title,
            genres: req.body.genres,
        })
        await game.save()
        res.status(201).json(game)
    } else {
        res.status(400).json({message: "Something went wrong"})
    }
})

gameRouter.delete("/", async (req, res) => {
    await Game.deleteMany({})
    res.status(204).json({message: "games is leeg"})
})

gameRouter.options("/", (req, res) => {
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.header("Access-Control-Allow-Headers", "Content-Type, Accept")
    res.header("Allow", "GET, POST, OPTIONS").status(204).send()
})

gameRouter.options("/:id", (req, res) => {
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS")
    res.header("Access-Control-Allow-Headers", "Content-Type, Accept")
    res.header("Allow", "GET, OPTIONS").status(204).send()
})

export default gameRouter