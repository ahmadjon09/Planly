import Product from '../models/product.js'
import { sendErrorResponse } from '../middlewares/sendErrorResponse.js'
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  subMonths,
  subYears
} from 'date-fns'

// export const CreateNewProduct = async (req, res) => {
//   try {
//     const products = Array.isArray(req.body) ? req.body : [req.body]
//     const createdProducts = []

//     for (const productData of products) {
//       let existing = await Product.findOne({ title: productData.title })

//       if (existing) {
//         existing.stock += Number(productData.stock) || 0
//         if (productData.price) existing.price = productData.price
//         if (productData.size) existing.size = productData.size
//         if (productData.poundage) existing.poundage = productData.poundage

//         await existing.save()
//         createdProducts.push(existing)
//       } else {
//         const lastProduct = await Product.findOne().sort({ createdAt: -1 })
//         const nextID = lastProduct ? lastProduct.ID + 1 : 1

//         const newProduct = new Product({
//           ...productData,
//           ID: nextID,
//           stock: Number(productData.stock) || 0
//         })

//         await newProduct.save()
//         createdProducts.push(newProduct)
//       }
//     }

//     return res.status(201).json({
//       message: 'Маҳсулот(лар) муваффақиятли сақланди ✅',
//       products: createdProducts
//     })
//   } catch (error) {
//     return res.status(500).json({
//       message: 'Сервер хатолиги. Илтимос, қайта уриниб кўринг!',
//       error: error.message
//     })
//   }
// }

export const CreateNewProduct = async (req, res) => {
  try {
    const products = Array.isArray(req.body) ? req.body : [req.body]
    const createdProducts = []

    for (const productData of products) {
      const lastProduct = await Product.findOne().sort({ createdAt: -1 })
      const nextID = lastProduct ? lastProduct.ID + 1 : 1

      const newProduct = new Product({
        ...productData,
        ID: nextID,
        stock: Number(productData.stock) || 0
      })

      await newProduct.save()
      createdProducts.push(newProduct)
    }

    return res.status(201).json({
      message: 'Маҳсулот(лар) муваффақиятли сақланди ✅',
      products: createdProducts
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Сервер хатолиги. Илтимос, қайта уриниб кўринг!',
      error: error.message
    })
  }
}

export const GetAllProducts = async (_, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 })

    if (products.length === 0) {
      return res.status(404).json({ message: 'No products found.' })
    }
    return res.status(200).json({ data: products })
  } catch (error) {
    return sendErrorResponse(
      res,
      500,
      'Server Error. Please Try Again Later!',
      error
    )
  }
}

export const GetOneProduct = async (req, res) => {
  const { id } = req.params
  try {
    const product = await Product.findById(id).populate('reviews.user', 'title')
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }
    return res.status(200).json({ data: product })
  } catch (error) {
    return res.status(500).json({
      message: 'Server Error. Please Try Again Later!',
      error: error.message
    })
  }
}

export const UpdateProduct = async (req, res) => {
  const { id } = req.params
  try {
    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
      new: true
    })
    if (!updatedProduct) {
      return sendErrorResponse(res, 404, 'Product not found.')
    }
    return res
      .status(200)
      .json({ message: 'Product updated successfully', data: updatedProduct })
  } catch (error) {
    if (error.title === 'CastError') {
      return sendErrorResponse(res, 400, 'Invalid product ID.', error)
    }
    return sendErrorResponse(
      res,
      500,
      'Server Error. Please Try Again Later!',
      error
    )
  }
}

export const DeleteProduct = async (req, res) => {
  const { id } = req.params
  try {
    const deletedProduct = await Product.findByIdAndDelete(id)
    if (!deletedProduct) {
      return sendErrorResponse(res, 404, 'Product not found.')
    }
    return res
      .status(200)
      .json({ message: 'Product has been deleted successfully.' })
  } catch (error) {
    if (error.title === 'CastError') {
      return sendErrorResponse(res, 400, 'Invalid product ID.', error)
    }
    return sendErrorResponse(
      res,
      500,
      'Server Error. Please Try Again Later!',
      error
    )
  }
}

export const GetProductStats = async (req, res) => {
  try {
    const { year, month, day } = req.query
    const now = new Date()

    // Dinamik sana
    const targetYear = year ? Number(year) : now.getFullYear()
    const targetMonth = month ? Number(month) - 1 : now.getMonth()
    const targetDay = day ? Number(day) : now.getDate()

    // 📅 Tanlangan sana intervallari
    const dayStart = startOfDay(new Date(targetYear, targetMonth, targetDay))
    const dayEnd = endOfDay(new Date(targetYear, targetMonth, targetDay))

    const monthStart = startOfMonth(new Date(targetYear, targetMonth))
    const monthEnd = endOfMonth(new Date(targetYear, targetMonth))

    const yearStart = startOfYear(new Date(targetYear, 0))
    const yearEnd = endOfYear(new Date(targetYear, 0))

    // 📊 Aggregation function
    const getStats = async (start, end) => {
      const data = await Product.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            totalStock: { $sum: '$stock' },
            // umumiy qiymat = narx * soni
            totalPrice: { $sum: { $multiply: ['$price', '$stock'] } }
          }
        }
      ])
      return data[0] || { totalProducts: 0, totalStock: 0, totalPrice: 0 }
    }

    // ✅ Hozirgi davr
    const daily = await getStats(dayStart, dayEnd)
    const monthly = await getStats(monthStart, monthEnd)
    const yearly = await getStats(yearStart, yearEnd)

    // ⏪ Oldingi davr
    const prevDay = await getStats(
      startOfDay(subDays(dayStart, 1)),
      endOfDay(subDays(dayStart, 1))
    )
    const prevMonth = await getStats(
      startOfMonth(subMonths(monthStart, 1)),
      endOfMonth(subMonths(monthStart, 1))
    )
    const prevYear = await getStats(
      startOfYear(subYears(yearStart, 1)),
      endOfYear(subYears(yearStart, 1))
    )

    return res.json({
      filter: { year: targetYear, month: targetMonth + 1, day: targetDay },
      daily: { current: daily, previous: prevDay },
      monthly: { current: monthly, previous: prevMonth },
      yearly: { current: yearly, previous: prevYear }
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Статистика олишда хатолик',
      error: error.message
    })
  }
}
