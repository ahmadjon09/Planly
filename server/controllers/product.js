import Product from '../models/product.js'
import { sendErrorResponse } from '../middlewares/sendErrorResponse.js'
import Clients from "../models/client.js"

export const CreateNewProduct = async (req, res) => {
  try {
    const { clientId: bodyClientId, client: bodyClient, products: bodyProducts } = req.body

    const products = Array.isArray(bodyProducts) ? bodyProducts : [bodyProducts]

    let clientId = null
    let client = null

    if (bodyClientId) {
      client = await Clients.findById(bodyClientId)
      if (!client) {
        return res.status(404).json({ message: "Клиент топилмади!" })
      }
      clientId = client._id
    } else if (bodyClient?.name && bodyClient?.phoneNumber) {
      client = new Clients({
        name: bodyClient.name,
        phoneNumber: bodyClient.phoneNumber,
        clietn: false,
        debtUZ: 0,
        debtEN: 0
      })
      await client.save()
      clientId = client._id
    } else {
      return res.status(400).json({
        message: "Client ID ёки янги клиент маълумотлари керак!"
      })
    }

    let totalUZ = 0
    let totalEN = 0
    const createdProducts = []

    for (const p of products) {
      const lastProduct = await Product.findOne().sort({ createdAt: -1 })
      const nextID = lastProduct ? lastProduct.ID + 1 : 1

      const newProduct = new Product({
        ...p,
        ID: nextID,
        stock: Number(p.stock) || 0,
        from: clientId
      })

      await newProduct.save()
      createdProducts.push(newProduct)

      const amount = Number(p.stock) || 1
      const price = Number(p.price) || 0

      if (p.priceType === "uz") {
        totalUZ += price * amount
      } else if (p.priceType === "en") {
        totalEN += price * amount
      }
    }

    if (totalUZ > 0 || totalEN > 0) {
      await Clients.findByIdAndUpdate(clientId, {
        $inc: { debtUZ: totalUZ, debtEN: totalEN }
      })
    }

    return res.status(201).json({
      message: "Маҳсулотлар муваффақиятли сақланди ✅",
      client,
      products: createdProducts
    })
  } catch (error) {
    return res.status(500).json({
      message: "Сервер хатолиги!",
      error: error.message
    })
  }
}

export const GetAllProducts = async (_, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    if (products.length === 0) {
      return res.status(404).json({ message: "No products found." });
    }

    const productsWithClient = await Promise.all(
      products.map(async (product) => {
        if (!product.from) {
          return {
            ...product.toObject(),
            client: null,
            deleted: true
          };
        }

        const client = await Clients.findById(product.from);

        return {
          ...product.toObject(),
          client: client || null,
          deleted: !client   // client bo'lmasa deleted = true
        };
      })
    );

    return res.status(200).json({ data: productsWithClient });

  } catch (error) {
    return res.status(500).json({
      message: "Server Error. Please Try Again Later!",
      error: error.message
    });
  }
};

export const GetAllReadyProducts = async (_, res) => {
  try {
    const products = await Product.find({ ready: true }).sort({ createdAt: -1 });

    if (products.length === 0) {
      return res.status(404).json({ message: "No ready products found." });
    }

    const productsWithClient = await Promise.all(
      products.map(async (product) => {
        if (!product.from) {
          return {
            ...product.toObject(),
            client: null,
            deleted: true
          };
        }

        const client = await Clients.findById(product.from);

        return {
          ...product.toObject(),
          client: client || null,
          deleted: !client
        };
      })
    );

    return res.status(200).json({ data: productsWithClient });

  } catch (error) {
    return res.status(500).json({
      message: "Server Error. Please Try Again Later!",
      error: error.message
    });
  }
};

export const GetAllNotReadyProducts = async (_, res) => {
  try {
    const products = await Product.find({ ready: false }).sort({ createdAt: -1 });

    if (products.length === 0) {
      return res.status(404).json({ message: "No not-ready products found." });
    }

    const productsWithClient = await Promise.all(
      products.map(async (product) => {
        if (!product.from) {
          return {
            ...product.toObject(),
            client: null,
            deleted: true
          };
        }

        const client = await Clients.findById(product.from);

        return {
          ...product.toObject(),
          client: client || null,
          deleted: !client
        };
      })
    );

    return res.status(200).json({ data: productsWithClient });

  } catch (error) {
    return res.status(500).json({
      message: "Server Error. Please Try Again Later!",
      error: error.message
    });
  }
};

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

export const GetClientsWithProducts = async (_, res) => {
  try {
    const clients = await Clients.find().sort({ createdAt: -1 });

    const result = await Promise.all(
      clients.map(async (client) => {
        const products = await Product.find({ from: client._id }).sort({ createdAt: -1 });

        return {
          ...client.toObject(),
          products,
          productCount: products.length
        };
      })
    );

    return res.status(200).json({
      message: "OK",
      data: result
    });

  } catch (error) {
    console.error("❌:", error);
    return res.status(500).json({
      message: "Server Error!",
      error: error.message
    });
  }
};

export const PayClientDebt = async (req, res) => {

  try {
    const { clientId, uz = 0, en = 0 } = req.body;

    if (!clientId) {
      return sendErrorResponse(res, 400, "clientId керак!");
    }

    const client = await Clients.findById(clientId);
    if (!client) {
      return sendErrorResponse(res, 404, "Клиент топилмади!");
    }

    // Uz va En bo'yicha qarzni kamaytirish
    const newDebtUZ = client.debtUZ - Number(uz);
    const newDebtEN = client.debtEN - Number(en);

    // Qarzni minus qiymatga tushib ketmasligi uchun
    client.debtUZ = newDebtUZ < 0 ? 0 : newDebtUZ;
    client.debtEN = newDebtEN < 0 ? 0 : newDebtEN;

    await client.save();

    return res.status(200).json({
      message: "Қарз муваффақиятли тўланди ✅",
      data: client
    });
  } catch (error) {
    console.error("❌:", error);
    sendErrorResponse(res, 500, "Сервер хатолиги! Илтимос, кейинроқ қайта уриниб кўринг.");
  }
};