import mongoose from 'mongoose'

const ProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    normalizedTitle: { type: String, required: true },
    price: { type: Number, required: true },
    priceType: { type: String, enum: ["uz", "en"], default: "uz" },
    ID: { type: Number, required: true },
    stock: { type: Number, default: 1 },
    count: { type: Number, default: 0 },
    unit: {
      type: String,
      enum: ['дона', 'кг', 'метр', 'литр', 'м²', 'м³', 'сет', 'упаковка'],
      default: 'дона'
    },
    ready: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export default mongoose.model('Product', ProductSchema)
