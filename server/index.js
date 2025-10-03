import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'

import ProductRoutes from './routes/product.js'
import OrderRoutes from './routes/order.js'
import UserRoutes from './routes/user.js'
import dotenv from 'dotenv'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())
app.get('/api/status', (req, res) => {
  setImmediate(() => {
    res.json({
      status: 'working',
      port: process.env.PORT || 3000
    })
  })
})
app.get('/api/', (_, res) => res.send('Server is running!'))
app.use('/api/users', UserRoutes)
app.use('/api/products', ProductRoutes)
app.use('/api/orders', OrderRoutes)

const startApp = async () => {
  const PORT = process.env.PORT || 3000
  try {
    await mongoose.connect(process.env.MONGODB_URL)
    console.log('✔️  MongoDB connected')
    app.listen(PORT, () =>
      console.log(`✔️  Server is running on port: ${PORT}
👍 Server is running on http://localhost:${PORT}
    `)
    )
  } catch (error) {
    console.log(error)
  }
}

startApp()
