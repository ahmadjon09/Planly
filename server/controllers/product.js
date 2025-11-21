import Product from '../models/product.js'
import { sendErrorResponse } from '../middlewares/sendErrorResponse.js'
import Clients from "../models/client.js"
import History from '../models/history.js'
import Input from "../models/input.js"

const normalize = (str) => {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04FF]/g, "");
};

export const CreateNewProduct = async (req, res) => {
  try {
    const { clientId: bodyClientId, client: bodyClient, products: bodyProducts } = req.body;

    const products = Array.isArray(bodyProducts) ? bodyProducts : [bodyProducts];

    let clientId = null;
    let client = null;

    // --- CLIENT TOPISH YOKI YARATISH ---
    if (bodyClientId) {
      client = await Clients.findById(bodyClientId);
      if (!client) {
        return res.status(404).json({ message: "Клиент топилмади!" });
      }
      clientId = client._id;
    } else if (bodyClient?.name && bodyClient?.phoneNumber) {
      client = await Clients.create({
        name: bodyClient.name,
        phoneNumber: bodyClient.phoneNumber,
        clietn: false,
        debtUZ: 0,
        debtEN: 0
      });

      clientId = client._id;
    } else {
      return res.status(400).json({
        message: "Client ID ёки янги клиент маълумотлари керак!"
      });
    }

    // --- OPTIMIZATION START ---
    const normalizedTitles = products.map(p => normalize(p.title));

    // Barcha kerakli productlarni bitta sorov bilan olish
    const existingProducts = await Product.find({
      normalizedTitle: { $in: normalizedTitles }
    });

    // Map qilish — loop ichida 0 ms qidiruv!
    const productMap = {};
    existingProducts.forEach(p => {
      productMap[p.normalizedTitle] = p;
    });

    // Oxirgi ID larni oldindan olish
    const lastProduct = await Product.findOne().sort({ ID: -1 });
    let nextProductID = lastProduct ? lastProduct.ID + 1 : 1;

    const lastInput = await Input.findOne().sort({ ID: -1 });
    let nextInputID = lastInput ? lastInput.ID + 1 : 1;
    // --- OPTIMIZATION END ---

    let totalUZ = 0;
    let totalEN = 0;
    const createdProducts = [];

    // --- MAIN LOOP ---
    for (const p of products) {
      const normalizedTitle = normalize(p.title);

      let productDoc = productMap[normalizedTitle];

      if (productDoc) {
        // EXISTING PRODUCT
        productDoc.stock += Number(p.stock) || 1;
        productDoc.price = Number(p.price) || productDoc.price;
        productDoc.priceType = p.priceType || productDoc.priceType;
        await productDoc.save();
      } else {
        // NEW PRODUCT
        productDoc = await Product.create({
          ...p,
          ID: nextProductID++,
          stock: Number(p.stock) || 1,
          normalizedTitle
        });
      }

      createdProducts.push(productDoc);

      // --- INPUT ---
      await Input.create({
        title: p.title,
        price: p.price,
        priceType: p.priceType,
        unit: p.unit,
        stock: Number(p.stock),
        ID: nextInputID++,
        from: clientId
      });

      // --- DEBT ---
      const amount = Number(p.stock) || 1;
      const price = Number(p.price) || 0;

      if (p.priceType === "uz") totalUZ += price * amount;
      else totalEN += price * amount;
    }

    if (totalUZ > 0 || totalEN > 0) {
      await Clients.findByIdAndUpdate(clientId, {
        $inc: { debtUZ: totalUZ, debtEN: totalEN }
      });
    }

    return res.status(201).json({
      message: "Маҳсулотлар муваффақиятли сақланди ✅",
      client,
      products: createdProducts
    });

  } catch (error) {
    return res.status(500).json({
      message: "Сервер хатолиги!",
      error: error.message
    });
  }
};





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
        const [inputs, history] = await Promise.all([
          Input.find({ from: client._id }).sort({ createdAt: -1 }),
          History.find({ client: client._id }).sort({ createdAt: -1 })
        ]);

        return {
          ...client.toObject(),
          products: inputs,        // ✔️ Product o‘rniga Input
          productCount: inputs.length, // ✔️ Product soni Inputs.length
          history,
          historyCount: history.length
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


    // Yangi qarzlarni hisoblash
    const newDebtUZ = client.debtUZ - Number(uz);
    const newDebtEN = client.debtEN - Number(en);

    client.debtUZ = newDebtUZ < 0 ? 0 : newDebtUZ;
    client.debtEN = newDebtEN < 0 ? 0 : newDebtEN;

    await client.save();


    if (Number(uz) > 0) {
      await History.create({
        client: clientId,
        price: Number(uz),
        type: "uz"
      })
    }

    if (Number(en) > 0) {
      await History.create({
        client: clientId,
        price: Number(en),
        type: "en"
      })
    }

    return res.status(200).json({
      message: "Қарз муваффақиятли тўланди ✅",
      data: client
    });

  } catch (error) {
    console.error("❌:", error);
    sendErrorResponse(res, 500, "Сервер хатолиги! Илтимос, кейинроқ қайта уриниб кўринг.");
  }
};
