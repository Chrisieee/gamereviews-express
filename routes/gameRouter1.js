import express from "express"
import Game from "../models/gameModel.js";
import Genre from "../models/genreModel.js";
import mongoose from "mongoose";

const gameRouter = express.Router()

gameRouter.get("/", async (req, res) => {
    const games = await Game.find({}).populate("genres")
    if (games) {
        res.status(200).json(games)
    } else {
        res.status(404).json({message: "Not found"})
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

export default gameRouter