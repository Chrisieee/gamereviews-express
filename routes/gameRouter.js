import express from "express"
import {fakerNL} from "@faker-js/faker"
import Game from "../models/gameModel.js"

const router = express.Router()

//middleware
router.use((req, res, next) => {
    const headers = req.headers["accept"]
    const method = req.method

    res.header("Access-Control-Allow-Origin", '*')

    if (method === "OPTIONS") {
        next()
    } else if (headers && headers.includes("application/json")) {
        next()
    } else {
        res.status(406).json({message: "Webservice only supports json."})
    }
})


//get routes
//voor hele collectie met pagination
router.get("/games", async (req, res) => {
    let pagination = {firstUri: "", lastUri: "", previousUri: "", nextUri: "", previous: null, next: null, self: ""}

    const page = Number(req.query?.page) || 1
    const limit = Number(req.query?.limit) || 0
    const skip = (page - 1) * limit

    const totalItems = await Game.countDocuments();
    let totalPages = Math.ceil(totalItems / limit);

    const games = await Game.find({}).select(["title", "game", "player"]).skip(skip).limit(limit)

    if (req.query?.page && req.query?.limit) {
        pagination.firstUri = `?page=1&limit=${limit}`
        pagination.lastUri = `?page=${totalPages}&limit=${limit}`
        pagination.previousUri = `?page=${page - 1}&limit=${limit}`
        pagination.nextUri = `?page=${page + 1}&limit=${limit}`
        pagination.self = `?page=${page}&limit=${limit}`
        if (page !== 1) {
            pagination.previous = {
                page: page - 1,
                href: `${process.env.BASE_URI}${pagination.previousUri}`
            }
            pagination.next = page < totalPages ? {
                page: page + 1,
                href: `${process.env.BASE_URI}${pagination.nextUri}`
            } : null
        } else {
            totalPages = 1
        }
    } else {
        totalPages = 1
    }

    if (games) {
        const collection = {
            items: games,
            _links: {
                self: {
                    href: `${process.env.BASE_URI}`
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
                        href: `${process.env.BASE_URI}${pagination.firstUri}`
                    },
                    last: {
                        page: totalPages,
                        href: `${process.env.BASE_URI}${pagination.lastUri}`
                    },
                    previous: pagination.previous,
                    next: pagination.next,
                    self: {
                        href: `${process.env.BASE_URI}${pagination.self}`
                    },
                    collection: {
                        href: `${process.env.BASE_URI}`
                    }
                }
            }
        }
        res.status(200).json(collection)
    } else {
        res.status(404).json({message: "Not found"})
    }
})

//details van een specifieke resource met cachen
router.get("/games/:id", async (req, res) => {
    const id = req.params.id
    try {
        const game = await Game.findById(id)
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
router.post("/games", async (req, res, next) => {
    if (req.body?.method && req.body.method === "SEED") {

        const reset = req.body?.reset ?? false
        if (reset && reset === "true") {
            await Game.deleteMany({})
        }

        const amount = req.body?.amount ?? 5
        const games = []

        for (let i = 0; i < amount; i++) {
            const game = Game({
                title: fakerNL.lorem.slug(5),
                player: fakerNL.book.author(),
                game: fakerNL.book.title(),
                genre: fakerNL.lorem.word(),
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
router.post("/games", async (req, res) => {
    if (req.body?.title && req.body?.game && req.body?.genre && req.body?.player && req.body?.playedConsole && req.body?.review) {
        const game = Game({
            title: req.body.title,
            game: req.body.game,
            genre: req.body.genre,
            player: req.body.player,
            playedConsole: req.body.playedConsole,
            review: req.body.review
        })
        await game.save()
        res.status(201).json(game)
    } else {
        res.status(400).json({message: "Something went wrong", request: req.body ?? "body is leeg"})
    }
})


//update routes
//update hele resource
router.put("/games/:id", async (req, res) => {
    const id = req.params.id

    try {
        const game = await Game.findById(id)
        if (!game) {
            res.status(404).json({message: "Not found"})
        }

        game.title = req.body.title
        game.game = req.body.game
        game.genre = req.body.genre
        game.player = req.body.player
        game.playedConsole = req.body.playedConsole
        game.review = req.body.review

        const succes = await game.save()
        res.status(200).json(succes)
    } catch (e) {
        res.status(400).send(e.message)
    }
})

//favorite aan of uit zetten
router.patch("/games/:id", async (req, res) => {
    const id = req.params.id

    if (req.body) {
        try {
            const game = await Game.findById(id)
            if (!game) {
                res.status(404).json({message: "Not found"})
            }

            game.favorite = !game.favorite;

            const succes = await game.save()
            res.status(200).json(succes)
        } catch (e) {
            res.status(400).send(e.message)
        }
    }
})

//delete route
router.delete("/games/:id", async (req, res) => {
    const id = req.params.id
    try {
        const game = await Game.findById(id)
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
router.options("/games", (req, res) => {
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.header("Access-Control-Allow-Headers", "Content-Type, Accept")
    res.header("Allow", "GET, POST, OPTIONS").status(204).send()
})

router.options("/games/:id", (req, res) => {
    res.header("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS")
    res.header("Access-Control-Allow-Headers", "Content-Type, Accept")
    res.header("Allow", "GET, PUT, DELETE, OPTIONS").status(204).send()
})

export default router