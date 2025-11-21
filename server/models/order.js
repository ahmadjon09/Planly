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
        default: 0
      },
      priceType: {
        type: String,
      }
    }
  ],
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Clients",
    required: true
  },
  status: { type: String, required: true },
  paid: { type: Boolean, default: false },
  totalUZ: { type: Number, default: 0 },
  totalEN: { type: Number, default: 0 },
  orderDate: {
    type: Date,
    default: Date.now
  }
})

const Order = mongoose.model('Order', OrderSchema)
export default Order
