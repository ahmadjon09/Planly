import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  subMonths,
  subYears,
  isValid
} from 'date-fns'
import Order from '../models/order.js'
import User from '../models/user.js'
import Product from '../models/product.js'
import { sendErrorResponse } from '../middlewares/sendErrorResponse.js'

export const GetOrderStats = async (req, res) => {
  try {
    const { year, month, day } = req.query
    const now = new Date()

    // 📅 Tanlangan sana yoki hozirgi sanani olish
    const targetYear = Number(year) || now.getFullYear()
    const targetMonth = month ? Number(month) - 1 : now.getMonth()
    const targetDay = Number(day) || now.getDate()
    const targetDate = new Date(targetYear, targetMonth, targetDay)

    if (!isValid(targetDate)) {
      return sendErrorResponse(res, 400, 'Нотўғри сана киритилди.')
    }

    // 📆 Intervallar
    const dayStart = startOfDay(targetDate)
    const dayEnd = endOfDay(targetDate)
    const monthStart = startOfMonth(targetDate)
    const monthEnd = endOfMonth(targetDate)
    const yearStart = startOfYear(new Date(targetYear, 0))
    const yearEnd = endOfYear(new Date(targetYear, 0))

    // 🔥 Statistikani hisoblash funksiyasi
    const calcStats = async (start, end, periodYear = targetYear) => {
      // Buyurtmalarni olish
      const orders = await Order.find({ orderDate: { $gte: start, $lte: end } })

      // Буюртмалардаги барча маҳсулот IDларини олиш
      const allProductIds = []
      orders.forEach(order => {
        order.products.forEach(item => {
          allProductIds.push(item.product)
        })
      })

      // Ушбу даврдаги буюртмаларда келган маҳсулотларни олиш
      const products = await Product.find({
        _id: { $in: allProductIds }
      })

      const totalOrders = orders.length
      const totalOrderPrice = orders.reduce(
        (acc, o) => acc + (o.totalPrice || 0),
        0
      )

      // 📦 Маҳсулотлар статистикаси (фақат ушбу даврдаги маҳсулотлар)
      const totalProducts = products.length
      const totalStockValue = products.reduce(
        (acc, p) => acc + (p.stock || 0),
        0
      )

      // 📊 Сотилган маҳсулотлар ҳисоблари
      let soldCount = 0
      let soldValue = 0 // sotilgan mahsulotlarning umumiy sotuv narxi
      let totalCost = 0 // mahsulotlarning umumiy tannarxi

      // Mahsulotlarni tez qidirish uchun Map yaratish
      const productMap = new Map()
      products.forEach(p => {
        productMap.set(p._id.toString(), p)
      })

      for (const order of orders) {
        for (const item of order.products) {
          const productId = item.product.toString()
          const product = productMap.get(productId)

          if (product) {
            soldCount += item.amount
            soldValue += item.price * item.amount // sotuv narxi
            totalCost += (product.price || 0) * item.amount // tannarx
          }
        }
      }

      // 🔝 Eng ko'p sotilgan mahsulot
      let topSelling = { name: 'Маълумот йўқ', total: 0 }
      const productSales = {}

      for (const order of orders) {
        for (const item of order.products) {
          const productId = item.product.toString()
          productSales[productId] = (productSales[productId] || 0) + item.amount
        }
      }

      if (Object.keys(productSales).length > 0) {
        const maxProductId = Object.keys(productSales).reduce((a, b) =>
          productSales[a] > productSales[b] ? a : b
        )
        const topProduct = productMap.get(maxProductId)
        if (topProduct) {
          topSelling = {
            name: topProduct.title || topProduct.name,
            total: productSales[maxProductId]
          }
        }
      }

      // 💰 Moliyaviy hisob-kitoblar
      const revenue = totalOrderPrice // jami tushum
      const cost = totalCost // jami xarajat (tannarx)
      const margin =
        revenue > 0 ? Math.round(((revenue - cost) / revenue) * 100) : 0
      const averageOrderValue =
        totalOrders > 0 ? Math.round(revenue / totalOrders) : 0

      return {
        totalOrders,
        totalOrderPrice: Math.round(revenue),
        totalProducts,
        totalStockValue,
        soldCount,
        soldValue: Math.round(soldValue),
        revenue: Math.round(revenue),
        cost: Math.round(cost),
        margin,
        averageOrderValue,
        topSelling
      }
    }

    // 📈 O'sish foizlarini hisoblash
    const growthRate = (current, prev) => {
      if (prev === 0 || prev === null || prev === undefined) {
        return current > 0 ? 100 : 0
      }
      return Math.round(((current - prev) / Math.abs(prev)) * 100 * 100) / 100
    }

    // ⚡ ASOSIY LOGIKA - foydalanuvchiga javob qaytarish
    // Paralel hisoblash (tezlik uchun Promise.all)
    const [daily, monthly, yearly, prevDay, prevMonth, prevYear] =
      await Promise.all([
        calcStats(dayStart, dayEnd),
        calcStats(monthStart, monthEnd),
        calcStats(yearStart, yearEnd),
        calcStats(subDays(dayStart, 1), subDays(dayEnd, 1)),
        calcStats(subMonths(monthStart, 1), subMonths(monthEnd, 1)),
        calcStats(subYears(yearStart, 1), subYears(yearEnd, 1))
      ])

    // 🔚 Yakuniy natija - to'g'ridan-to'g'ri qaytarish
    const result = {
      filter: { year: targetYear, month: targetMonth + 1, day: targetDay },
      daily: {
        current: daily,
        previous: prevDay,
        growth: {
          revenue: growthRate(daily.revenue, prevDay.revenue),
          orders: growthRate(daily.totalOrders, prevDay.totalOrders)
        }
      },
      monthly: {
        current: monthly,
        previous: prevMonth,
        growth: {
          revenue: growthRate(monthly.revenue, prevMonth.revenue),
          orders: growthRate(monthly.totalOrders, prevMonth.totalOrders)
        }
      },
      yearly: {
        current: yearly,
        previous: prevYear,
        growth: {
          revenue: growthRate(yearly.revenue, prevYear.revenue),
          orders: growthRate(yearly.totalOrders, prevYear.totalOrders)
        }
      }
    }

    return res.status(200).json(result)
  } catch (error) {
    console.error('❌ GetOrderStats xatosi:', error)
    return sendErrorResponse(res, 500, 'Сервер хатоси', {
      error: error.message
    })
  }
}

export const AllOrders = async (_, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 })

    const enrichedOrders = await Promise.all(
      orders.map(async order => {
        let customerInfo = { firstName: 'Deleted', lastName: 'acc' }
        const customer = await User.findById(order.customer)
        if (customer) {
          customerInfo = {
            firstName: customer.firstName,
            lastName: customer.lastName
          }
        }

        const fullProducts = await Promise.all(
          order.products.map(async item => {
            const product = await Product.findById(item.product)
            return {
              ...item.toObject(),
              productName: product ? product.title : 'Deleted product'
            }
          })
        )

        return {
          ...order.toObject(),
          customer: customerInfo,
          products: fullProducts
        }
      })
    )

    return res.status(200).json({ data: enrichedOrders })
  } catch (error) {
    console.error('❌ Error in AllOrders:', error)
    sendErrorResponse(res, 500, 'Server Error. Please Try Again Later!')
  }
}

export const GetOneOrder = async (req, res) => {
  const { id } = req.params
  try {
    const order = await Order.findById(id)
    if (!order) {
      return sendErrorResponse(res, 404, 'Order not found!')
    }
    return res.status(200).json({ data: order })
  } catch (error) {
    sendErrorResponse(res, 500, 'Server Error. Please Try Again Later!')
  }
}

export const NewOrder = async (req, res) => {
  try {
    const { products } = req.body

    if (!req.body || !products?.length) {
      return sendErrorResponse(res, 400, 'Invalid order data!')
    }

    // 1️⃣ Avval barcha productlarni bazadan topamiz
    const productIds = products.map(p => p.product)
    const foundProducts = await Product.find({ _id: { $in: productIds } })

    if (foundProducts.length !== products.length) {
      return sendErrorResponse(res, 404, 'Some products were not found!')
    }

    // 2️⃣ Har bir mahsulot uchun stock tekshirish
    for (const item of products) {
      const product = foundProducts.find(p => p._id.toString() === item.product)
      if (!product) continue

      if (product.stock < item.amount) {
        return sendErrorResponse(
          res,
          400,
          `Not enough stock for "${product.title}"!`
        )
      }
    }

    // 3️⃣ Barcha mahsulotlar uchun stockni kamaytirish (parallel)
    await Promise.all(
      products.map(async item => {
        const product = foundProducts.find(
          p => p._id.toString() === item.product
        )
        if (product) {
          product.stock -= item.amount
          await product.save()
        }
      })
    )

    // 4️⃣ Orderni yaratish
    const newOrder = new Order(req.body)
    await newOrder.save()

    return res.status(201).json({
      data: newOrder,
      message: 'Order created successfully ✅'
    })
  } catch (error) {
    console.error('❌ Error creating order:', error)
    sendErrorResponse(res, 500, 'Server Error. Please Try Again Later!')
  }
}

export const CancelOrder = async (req, res) => {
  try {
    const { id } = req.params
    const canceledOrder = await Order.findByIdAndDelete(id)
    if (!canceledOrder) {
      return sendErrorResponse(res, 404, 'Order not found!')
    }

    const restoreTasks = canceledOrder.products.map(async item => {
      const product = await Product.findById(item.product)
      if (product) {
        product.stock += item.amount
        await product.save()
      }
    })
    await Promise.all(restoreTasks)

    return res.status(200).json({
      data: canceledOrder,
      message: 'Order has been canceled ❌'
    })
  } catch (error) {
    console.error('❌ Error canceling order:', error)
    sendErrorResponse(res, 500, 'Server Error. Please Try Again Later!')
  }
}

export const UpdateOrder = async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const updatedOrder = await Order.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    })

    if (!updatedOrder) {
      return sendErrorResponse(res, 404, 'Order not found!')
    }

    return res.status(200).json({
      data: updatedOrder,
      message: 'Order updated successfully ✅'
    })
  } catch (error) {
    console.error('❌ Error updating order:', error)
    sendErrorResponse(res, 500, 'Server Error. Please Try Again Later!')
  }
}
