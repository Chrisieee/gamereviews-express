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
router.get("/games", async (req, res) => {
    let games = ""
    if (req.query?.limit) {
        games = await Game.find({}).select(["title", "game", "player"]).limit(Number(req.query.limit))
    } else {
        games = await Game.find({}).select(["title", "game", "player"])
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
            // pagination: {
            //     currentPage: req.query?.page ?? 1,
            //     currentItems: req.query?.limit ?? collection.items.length,
            //     totalPages: Math.ceil(this.items.length / req.query?.limit ?? 0),
            //     totalItems: this.items.length,
            //     _links: {
            //         first: {
            //             page: 1,
            //             href: `${process.env.BASE_URI}/`
            //         },
            //         last: {
            //             page: 2,
            //             href: "http://example.com/?page=2&limit=6"
            //         },
            //         previous: null,
            //         next: {
            //             page: 2,
            //             href: "http://example.com/?page=2&limit=6"
            //         }
            //     }
            // }
        }
        res.status(200).json(collection)
    } else {
        res.status(404).json({message: "Not found"})
    }
})

router.get("/games/:id", async (req, res) => {
    const id = req.params.id
    try {
        const game = await Game.findById(id)
        if (!game) {
            res.status(404).json({message: "Not found"})
        }
        res.status(200).json(game)
    } catch (e) {
        res.status(404).json({message: "Not found"})
    }
})


//create route
router.post("/games", (req, res) => {
    if (req.body?.title && req.body?.author && req.body?.body) {
        const game = Game({
            title: req.body.title,
            author: req.body.author,
            body: req.body.body,
        })
        game.save()
        res.status(201).json(game)
    } else {
        res.status(400).json({message: "Something went wrong"})
    }
})


//update routes
router.put("/games/:id", (req, res) => {

})


//delete route
router.delete("/games/:id", (req, res) => {

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


//seeder
router.post("/games/seed", async (req, res) => {
    const reset = req.body?.reset
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
})

export default router