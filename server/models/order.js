import mongoose from 'mongoose'

const OrderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      amount: {
        type: Number,
        required: true,
        default: 1
      },
      unit: {
        type: String,
        enum: ['дона', 'кг', 'метр', 'литр', 'м²', 'м³', 'сет', 'упаковка'],
        default: 'дона'
      },
      price: {
        type: Number,
        required: true
      }
    }
  ],
  client: {
    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    address: { type: String }
  },
  status: { type: String, required: true },
  payType: { type: String, default: '--' },
  totalPrice: { type: Number, default: 0 },
  orderDate: {
    type: Date,
    default: Date.now
  }
})

const Order = mongoose.model('Order', OrderSchema)
export default Order
