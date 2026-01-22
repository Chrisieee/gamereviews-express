import express from "express"
import {fakerNL} from "@faker-js/faker"
import Review from "../models/reviewModel.js"
import Game from "../models/gameModel.js";

const router = express.Router()

//get routes
//voor hele collectie met pagination
router.get("/", async (req, res) => {
    //verschillende variabelen voor pagination
    let pagination = {firstUri: "", lastUri: "", previousUri: "", nextUri: "", self: "", genres: "", favorite: ""}
    const page = Number(req.query?.page) || 1
    const limit = Number(req.query?.limit) || 0
    const skip = (page - 1) * limit
    const totalItems = await Review.countDocuments();
    let totalPages = Math.ceil(totalItems / limit);

    if (req.query?.page && req.query?.limit) {
        pagination.firstUri = `?page=1&limit=${limit}`
        pagination.lastUri = `?page=${totalPages}&limit=${limit}`
        pagination.previousUri = `?page=${page - 1}&limit=${limit}`
        pagination.nextUri = `?page=${page + 1}&limit=${limit}`
        pagination.self = `?page=${page}&limit=${limit}`
    } else {
        totalPages = 1
    }

    //filteren
    let allgames = ""
    let filter = {}
    if (req.query?.genres) {
        pagination.genres = req.query?.page ? `&genres=${req.query.genres}` : `?genres=${req.query.genres}`
        allgames = await Game.find({genres: {$in: req.query.genres.split(",")}}).select("_id");
        filter.game = {$in: allgames.map(g => g._id)}
    }
    if (req.query?.favorite) {
        filter.favorite = req.query.favorite
        pagination.favorite = req.query?.page || req.query?.genres ? `&favorite=${req.query.favorite}` : `?favorite=${req.query.favorite}`
    }

    //query
    let games = await Review.find(filter)
        .select(["title", "player", "favorite"]).skip(skip).limit(limit).populate({
            path: "game", populate: {path: "genres"}
        })

    if (games) {
        const collection = {
            items: games,
            _links: {
                self: {
                    href: `${process.env.BASE_URI}${pagination.self}${pagination.genres}${pagination.favorite}`
                },
                collection: {
                    href: `${process.env.BASE_URI}`
                }
            },
            pagination: {
                currentPage: page,
                currentItems: limit || totalItems,
                totalPages: totalPages || 1,
                totalItems: totalItems,
                _links: {
                    first: {
                        page: 1,
                        href: `${process.env.BASE_URI}${pagination.firstUri}${pagination.genres}${pagination.favorite}`
                    },
                    last: {
                        page: totalPages,
                        href: `${process.env.BASE_URI}${pagination.lastUri}${pagination.genres}${pagination.favorite}`
                    },
                    previous: page > 1 ? {
                        page: page - 1,
                        href: `${process.env.BASE_URI}${pagination.previousUri}${pagination.genres}${pagination.favorite}`
                    } : null,
                    next: page < totalPages ? {
                        page: page + 1,
                        href: `${process.env.BASE_URI}${pagination.nextUri}${pagination.genres}${pagination.favorite}`
                    } : null
                }
            }
        }
        res.status(200).json(collection)
    } else {
        res.status(404).json({message: "Not found"})
    }
})

//details van een specifieke resource met cachen
router.get("/:id", async (req, res) => {
    const id = req.params.id
    try {
        const game = await Review.findById(id).populate({
            path: "game", populate: {path: "genres"}
        })
        if (!game) {
            res.status(404).json({message: "Not found"})
        }

        const modified = new Date(req.headers["if-modified-since"]) ?? null
        if (req.headers["if-modified-since"] && game.updatedAt < modified) {
            res.header("last-modified", game.updatedAt)
            res.status(304).json({message: "Not Modified"})
        } else {
            res.header("last-modified", game.updatedAt)
            res.status(200).json(game)
        }
    } catch (e) {
        res.status(404).json({message: "Not found"})
    }
})


//create routes
//seeder
router.post("/", async (req, res, next) => {
    if (req.body?.method && req.body.method === "SEED") {

        const reset = req.body?.reset ?? false
        if (reset && reset === "true") {
            await Review.deleteMany({})
        }
        const seedgame = await Game.find({}).select("_id")

        const amount = req.body?.amount ?? 5
        const games = []

        for (let i = 0; i < amount; i++) {
            const number = Math.floor(Math.random() * await Game.countDocuments())

            const game = Review({
                title: fakerNL.lorem.slug(5),
                player: fakerNL.book.author(),
                game: seedgame[number],
                playedConsole: fakerNL.lorem.word(),
                review: fakerNL.lorem.slug(20)
            })
            game.save()
            games.push(game)
        }

        res.status(201).send(games)
    } else {
        next()
    }
})

//create nieuw resource
router.post("/", async (req, res) => {
    if (req.body?.title && req.body?.game && req.body?.player && req.body?.playedConsole && req.body?.review) {
        const gameid = req.body.game
        const checkGame = await Game.find({gameid}).select("_id")
        if (!checkGame) {
            res.status(400).json({message: "Game doesn't exist"})
        }

        const game = Review({
            title: req.body.title,
            game: req.body.game,
            player: req.body.player,
            playedConsole: req.body.playedConsole,
            review: req.body.review,
            favorite: req.body.favorite ?? false
        })
        await game.save()
        res.status(201).json(game)
    } else {
        res.status(400).json({message: "There is a field missing"})
    }
})


//update routes
//update hele resource
router.put("/:id", async (req, res) => {
    const id = req.params.id

    try {
        const game = await Review.findById(id)
        console.log(game)
        if (!game || game === []) {
            res.status(404).json({message: "Not found"})
        }
        const gameId = req.body.game
        const checkGame = await Game.find({gameId}).select("_id")
        if (!checkGame) {
            res.status(400).json({message: "Game doesn't exist"})
        }

        game.title = req.body.title
        game.game = req.body.game
        game.player = req.body.player
        game.playedConsole = req.body.playedConsole
        game.review = req.body.review

        if (req.body.favorite) {
            game.favorite = req.body.favorite
        }

        const succes = await game.save()
        res.status(200).json(succes)
    } catch (e) {
        res.status(400).send(e.message)
    }
})

//favorite aan of uit zetten
router.patch("/:id", async (req, res) => {
    const id = req.params.id

    if (req.body?.title || req.body?.game || req.body?.genre || req.body?.player || req.body?.playedConsole || req.body?.review || req.body?.favorite) {
        try {
            const game = await Review.findById(id)
            if (!game) {
                res.status(404).json({message: "Not found"})
            }

            if (req.body.title) {
                game.title = req.body.title
            }

            if (req.body.game) {
                const gameId = req.body.game
                const checkGame = await Game.find({gameId}).select("_id")
                if (!checkGame) {
                    res.status(400).json({message: "Game doesn't exist"})
                }

                game.game = req.body.game
            }

            if (req.body.player) {
                game.player = req.body.player
            }

            if (req.body.playedConsole) {
                game.playedConsole = req.body.playedConsole
            }

            if (req.body.review) {
                game.review = req.body.review
            }

            if (req.body.favorite) {
                game.favorite = !game.favorite;
            }

            const succes = await game.save()
            res.status(200).json(succes)
        } catch (e) {
            res.status(400).send(e.message)
        }
    } else {
        res.status(400).json({message: "Something went wrong"})
    }
})

//delete route
router.delete("/:id", async (req, res) => {
    const id = req.params.id
    try {
        const game = await Review.findById(id)
        if (!game) {
            res.status(404).json({message: "Not found"})
        }

        await game.deleteOne()
        res.status(204).send()
    } catch (e) {
        res.status(404).json({message: "Not found"})
    }
})

//options routes
router.options("/", (req, res) => {
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.header("Access-Control-Allow-Headers", "Content-Type, Accept")
    res.header("Allow", "GET, POST, OPTIONS").status(204).send()
})

router.options("/:id", (req, res) => {
    res.header("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS")
    res.header("Access-Control-Allow-Headers", "Content-Type, Accept")
    res.header("Allow", "GET, PUT, DELETE, OPTIONS").status(204).send()
})

export default router