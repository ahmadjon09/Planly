import mongoose from 'mongoose'

const OrderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stockman',
    required: true
  },
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        default: 1
      },
      price: {
        type: Number,
        required: true
      }
    }
  ],
  status: { type: String, required: true },
  payType: { type: String, default: '--' },
  totalPrice: { type: Number, required: true },
  orderDate: {
    type: Date,
    default: Date.now
  }
})

const Order = mongoose.model('Order', OrderSchema)
export default Order
