import mongoose from 'mongoose'

const ProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    price: { type: Number, required: true },
    ID: { type: Number, required: true, unique: true },
    stock: { type: Number, default: 1 },
    size: { type: String },
    count: { type: Number },
    poundage: { type: String }
  },
  { timestamps: true }
)

export default mongoose.model('Product', ProductSchema)
