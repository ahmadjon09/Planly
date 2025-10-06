import Product from '../models/product.js'
import { sendErrorResponse } from '../middlewares/sendErrorResponse.js'

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
