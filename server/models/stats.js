import mongoose from 'mongoose'

const GrowthSchema = new mongoose.Schema({
  revenue: { type: Number, default: 0 },
  profit: { type: Number, default: 0 },
  orders: { type: Number, default: 0 }
})

const StatDetailSchema = new mongoose.Schema({
  totalOrders: { type: Number, default: 0 },
  totalOrderPrice: { type: Number, default: 0 },
  totalProducts: { type: Number, default: 0 },
  totalStockValue: { type: Number, default: 0 },
  soldCount: { type: Number, default: 0 },
  soldValue: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  cost: { type: Number, default: 0 },
  profit: { type: Number, default: 0 },
  loss: { type: Number, default: 0 },
  margin: { type: Number, default: 0 },
  averageOrderValue: { type: Number, default: 0 },
  topSelling: {
    name: { type: String, default: 'Маълумот йўқ' },
    total: { type: Number, default: 0 }
  }
})

const PeriodStatSchema = new mongoose.Schema({
  current: { type: StatDetailSchema, required: true },
  previous: { type: StatDetailSchema, required: true },
  growth: { type: GrowthSchema, required: true }
})

const DailyStatSchema = new mongoose.Schema({
  day: { type: Number, required: true },
  stats: { type: PeriodStatSchema, required: true }
})

const StatsSchema = new mongoose.Schema(
  {
    filter: {
      year: { type: Number, required: true },
      month: { type: Number, required: true }
    },
    daily: { type: [DailyStatSchema], default: [] }, // oy bo‘yicha kunliklar
    monthly: { type: PeriodStatSchema, required: true }, // shu oy uchun umumiy
    yearly: { type: PeriodStatSchema, required: true } // shu yil uchun umumiy
  },
  { timestamps: true }
)

export default mongoose.model('Stats', StatsSchema)
