import mongoose from 'mongoose'

const InputSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        price: { type: Number, required: true },
        priceType: { type: String, enum: ["uz", "en"], default: "uz" },
        ID: { type: Number, required: true },
        stock: { type: Number, default: 1 },
        unit: {
            type: String,
            enum: ['дона', 'кг', 'метр', 'литр', 'м²', 'м³', 'сет', 'упаковка'],
            default: 'дона'
        },
        ready: { type: Boolean, default: false },
        from: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Clients',
            required: true
        }
    },
    { timestamps: true }
)

export default mongoose.model('Input', InputSchema)
