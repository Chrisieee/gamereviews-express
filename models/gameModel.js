import mongoose from "mongoose"

const gameModel = new mongoose.Schema({
        title: {type: String, required: true},
        game: {type: String, required: true},
        genre: {type: String, required: true},
        player: {type: String, required: true},
        playedConsole: {type: String, required: true},
        favorite: {type: Boolean, required: true, default: false},
        review: {type: String, required: true},
    }, {
        toJSON: {
            timestamps: true,
            virtuals: true,
            versionKey: false,
            transform: (doc, ret) => {
                ret._links = {
                    self: {
                        href: `${process.env.BASE_URI}/${ret._id}`,
                    },
                    collection: {
                        href: `${process.env.BASE_URI}`,
                    },
                };

                delete ret._id;
            },
        },
    }
)

const Game = mongoose.model("Game", gameModel)

export default Game