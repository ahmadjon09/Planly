import mongoose from 'mongoose'

const ProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    price: { type: Number, required: true },
    ID: { type: Number, required: true, unique: true },
    stock: { type: Number, default: 1 },
    unit: {
      type: String,
      enum: ['дона', 'кг', 'метр', 'литр', 'м²', 'м³', 'сет', 'упаковка'],
      default: 'дона'
    },
    from: {
      phoneNumber: { type: String },
      address: { type: String },
      name: { type: String }
    }
  },
  { timestamps: true }
)

export default mongoose.model('Product', ProductSchema)
