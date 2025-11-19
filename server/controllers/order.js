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
import Client from "../models/client.js"

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

      // 🔥 CLIENT STATISTIKASI - barcha clientlarni olish
      const allClients = await Client.find({})

      // Clientlarni turi bo'yicha ajratish
      const suppliers = allClients.filter(client => client.clietn === false) // manbalar (biz ularga qarzdamiz)
      const customers = allClients.filter(client => client.clietn === true)   // mijozlar (ular bizga qarzdi)

      // Qarz hisob-kitoblari
      const totalSupplierDebtUZ = suppliers.reduce((sum, client) => sum + (client.debtUZ || 0), 0)
      const totalSupplierDebtEN = suppliers.reduce((sum, client) => sum + (client.debtEN || 0), 0)
      const totalCustomerDebtUZ = customers.reduce((sum, client) => sum + (client.debtUZ || 0), 0)
      const totalCustomerDebtEN = customers.reduce((sum, client) => sum + (client.debtEN || 0), 0)

      // Qarzdor clientlar soni
      const debtorSuppliers = suppliers.filter(client => (client.debtUZ || 0) > 0 || (client.debtEN || 0) > 0).length
      const debtorCustomers = customers.filter(client => (client.debtUZ || 0) > 0 || (client.debtEN || 0) > 0).length

      // 📊 Buyurtma statistikasi
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
        // Buyurtma statistikasi
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
        topSelling,

        // Client statistikasi
        clients: {
          total: allClients.length,
          suppliers: suppliers.length,
          customers: customers.length,
          debtorSuppliers,
          debtorCustomers
        },
        debts: {
          // Manbalarga qarzlarimiz (biz ularga berishimiz kerak)
          supplierDebts: {
            totalUZ: totalSupplierDebtUZ,
            totalEN: totalSupplierDebtEN,
            count: debtorSuppliers,
            averageUZ: debtorSuppliers > 0 ? totalSupplierDebtUZ / debtorSuppliers : 0,
            averageEN: debtorSuppliers > 0 ? totalSupplierDebtEN / debtorSuppliers : 0
          },
          // Mijozlardan olishimiz kerak bo'lgan qarzlar
          customerDebts: {
            totalUZ: totalCustomerDebtUZ,
            totalEN: totalCustomerDebtEN,
            count: debtorCustomers,
            averageUZ: debtorCustomers > 0 ? totalCustomerDebtUZ / debtorCustomers : 0,
            averageEN: debtorCustomers > 0 ? totalCustomerDebtEN / debtorCustomers : 0
          },
          // Umumiy qarz balansi
          netBalance: {
            uz: totalCustomerDebtUZ - totalSupplierDebtUZ, // ijobiy = bizga ko'proq qarzdorlar
            en: totalCustomerDebtEN - totalSupplierDebtEN,
            status: totalCustomerDebtUZ - totalSupplierDebtUZ >= 0 ? 'positive' : 'negative'
          }
        }
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
          orders: growthRate(daily.totalOrders, prevDay.totalOrders),
          clients: growthRate(daily.clients.total, prevDay.clients.total),
          customerDebts: growthRate(daily.debts.customerDebts.totalUZ, prevDay.debts.customerDebts.totalUZ),
          supplierDebts: growthRate(daily.debts.supplierDebts.totalUZ, prevDay.debts.supplierDebts.totalUZ)
        }
      },
      monthly: {
        current: monthly,
        previous: prevMonth,
        growth: {
          revenue: growthRate(monthly.revenue, prevMonth.revenue),
          orders: growthRate(monthly.totalOrders, prevMonth.totalOrders),
          clients: growthRate(monthly.clients.total, prevMonth.clients.total),
          customerDebts: growthRate(monthly.debts.customerDebts.totalUZ, prevMonth.debts.customerDebts.totalUZ),
          supplierDebts: growthRate(monthly.debts.supplierDebts.totalUZ, prevMonth.debts.supplierDebts.totalUZ)
        }
      },
      yearly: {
        current: yearly,
        previous: prevYear,
        growth: {
          revenue: growthRate(yearly.revenue, prevYear.revenue),
          orders: growthRate(yearly.totalOrders, prevYear.totalOrders),
          clients: growthRate(yearly.clients.total, prevYear.clients.total),
          customerDebts: growthRate(yearly.debts.customerDebts.totalUZ, prevYear.debts.customerDebts.totalUZ),
          supplierDebts: growthRate(yearly.debts.supplierDebts.totalUZ, prevYear.debts.supplierDebts.totalUZ)
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


export const NewOrder = async (req, res) => {
  try {
    let { customer, client, clientId = "", products, status } = req.body;

    if (!customer) {
      return sendErrorResponse(res, 400, "Мижоз (customer) маълумоти йўқ!");
    }

    if (!products || !products.length) {
      return sendErrorResponse(res, 400, "Буюртмада маҳсулотлар йўқ!");
    }

    // 1️⃣ Agar client kelmasa → yangi client yaratamiz
    if (!clientId) {
      const newClient = await Client.create({
        name: client.name,
        phoneNumber: client.phoneNumber,
        clientn: true
      });

      client = newClient._id;
    }


    const productIds = products.map((p) => p.product);
    const foundProducts = await Product.find({ _id: { $in: productIds } });

    if (foundProducts.length !== products.length) {
      return sendErrorResponse(res, 404, "Айрим маҳсулотлар топилмади!");
    }

    for (const item of products) {
      const product = foundProducts.find(
        (p) => p._id.toString() === item.product
      );
      if (product.stock < item.amount) {
        return sendErrorResponse(
          res,
          400,
          `“${product.title}” маҳсулоти учун омборда етарли миқдор йўқ!`
        );
      }
    }

    const orderProducts = products.map((item) => {
      const dbProduct = foundProducts.find(
        (p) => p._id.toString() === item.product
      );

      return {
        product: item.product,
        amount: item.amount,
        unit: item.unit || dbProduct.unit,
        price: 0
      };
    });

    await Promise.all(
      products.map(async (item) => {
        const p = foundProducts.find(
          (fp) => fp._id.toString() === item.product
        );
        p.stock -= item.amount;
        await p.save();
      })
    );

    const newOrder = new Order({
      customer,
      client: client || clientId,
      products: orderProducts,
      totalPrice: 0,
      paid: false,
      status: status,
      orderDate: new Date()
    });

    await newOrder.save();

    return res.status(201).json({
      message: "Буюртма муваффақиятли яратилди ✅",
      data: newOrder
    });
  } catch (error) {
    console.error("❌ Буюртма яратишда хатолик:", error);
    sendErrorResponse(
      res,
      500,
      "Сервер хатолиги! Илтимос, кейинроқ қайта уриниб кўринг."
    );
  }
};


export const CancelOrder = async (req, res) => {
  try {
    const { id } = req.params

    const order = await Order.findById(id)
    if (!order) {
      return sendErrorResponse(res, 404, "Буюртма топилмади!")
    }

    if (order.paid) {
      return sendErrorResponse(res, 400, "Тўлов қилинган буюртмани бекор қилиш мумкин эмас!")
    }


    const restoreTasks = order.products.map(async item => {
      const product = await Product.findById(item.product)
      if (product) {
        product.stock += item.amount
        await product.save()
      }
    })
    await Promise.all(restoreTasks)

    const canceledOrder = await Order.findByIdAndDelete(id)

    return res.status(200).json({
      data: canceledOrder,
      message: "Буюртма бекор қилинди ❌"
    })
  } catch (error) {
    console.error("❌ Буюртма бекор қилишда хатолик:", error)
    sendErrorResponse(res, 500, "Сервер хатолиги! Илтимос, кейинроқ қайта уриниб кўринг.")
  }
}

export const UpdateOrder = async (req, res) => {
  try {
    const { id } = req.params
    const { products, status } = req.body

    const order = await Order.findById(id)
    if (!order) {
      return sendErrorResponse(res, 404, "Буюртма топилмади!")
    }


    let totalPrice = 0

    if (products && products.length) {
      const updatedProducts = products.map(item => {
        const price = Number(item.price) || 0
        const amount = Number(item.amount) || 0

        totalPrice += price * amount

        return {
          product: item.product,
          amount,
          unit: item.unit || 'дона',
          price
        }
      })

      order.products = updatedProducts
    }


    if (status) order.status = status

    order.paid = true
    order.totalPrice = totalPrice

    await order.save()

    if (totalPrice > 0) {
      await Client.findByIdAndUpdate(
        order.client,
        { $inc: { debtUZ: totalPrice } },
        { new: true }
      )
    }

    return res.status(200).json({
      data: order,
      message: "Буюртма муваффақиятли янгиланди ✅"
    })
  } catch (error) {
    console.error("❌ Буюртма янгилашда хатолик:", error)
    sendErrorResponse(res, 500, "Сервер хатолиги! Илтимос, кейинроқ қайта уриниб кўринг.")
  }
}

