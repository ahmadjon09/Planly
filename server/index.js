import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import axios from 'axios'
import ProductRoutes from './routes/product.js'
import OrderRoutes from './routes/order.js'
import path from 'path'
import UserRoutes from './routes/user.js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, '../client/dist')))

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

app.use((req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'))
  }
})

const keepServerAlive = () => {
  setInterval(() => {
    axios
      .get(process.env.RENDER_URL)
      .then(() => console.log('🔄 Server active'))
      .catch(() => console.log('⚠️ Ping failed'))
  }, 10 * 60 * 1000)
}

keepServerAlive()
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
