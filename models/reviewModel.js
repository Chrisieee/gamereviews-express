import mongoose from "mongoose"

const reviewModel = new mongoose.Schema({
        title: {type: String, required: true},
        game: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Game",
            required: true
        },
        player: {type: String, required: true},
        playedConsole: {type: String, required: true},
        favorite: {type: Boolean, required: true, default: false},
        review: {type: String, required: true},
    }, {
        timestamps: true,
        toJSON: {
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

const Review = mongoose.model("Review", reviewModel)

export default Review