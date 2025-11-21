import mongoose from 'mongoose'

const History = new mongoose.Schema({
    client: { type: mongoose.Types.ObjectId, ref: "Clients", required: true },
    price: { type: Number, required: true },
    type: { type: String, enum: ["uz", "en"], required: true }
}, { timestamps: true })

export default mongoose.model('Historys', History)
