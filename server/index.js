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
import { getSystemHealth } from './controllers/health.js'
import { bot } from './bot.js'
import os from 'os'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, '../client/dist')))
app.use(express.static(path.join(__dirname, 'public')))
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
app.use('/api/health', getSystemHealth)
app.get('/api/system', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'health.html'))
})
app.get('/api/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})
app.use((req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'))
  }
})


const keepServerAlive = () => {
  const pingInterval = 12 * 60 * 1000;

  const checkAndPing = () => {
    const now = new Date();
    const hourTashkent = (now.getUTCHours() + 5) % 24;

    if (hourTashkent >= 8 || hourTashkent < 3) {
      axios
        .get(process.env.RENDER_URL)
        .then(() => console.log('🔄 Server active (Tashkent time)'))
        .catch(() => console.log('⚠️ Ping failed'))
    } else {
      console.log('💤 Keep-alive uyqu rejimida (Tashkent time)')
    }
  }

  checkAndPing();
  setInterval(checkAndPing, pingInterval);
}

keepServerAlive();


const getLocalIP = () => {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address
      }
    }
  }
  return 'localhost'
}

const startApp = async () => {
  const PORT = process.env.PORT || 3000
  try {
    await mongoose.connect(process.env.MONGODB_URL)
    console.log('✔️ MongoDB connected')

    app.listen(PORT, () => {
      const ip = getLocalIP()
      console.log(`
✔️ Server is running!
🌐 Local:   http://localhost:${PORT}
📡 Network: http://${ip}:${PORT}
`)
    })
  } catch (error) {
    console.log('❌ Server error:', error)
  }
}

startApp()
