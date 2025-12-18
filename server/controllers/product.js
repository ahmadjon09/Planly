import Product from '../models/product.js'
import { sendErrorResponse } from '../middlewares/sendErrorResponse.js'
import Clients from "../models/client.js"
import History from '../models/history.js'
import Input from "../models/input.js"
import Users from "../models/user.js"
import { bot } from '../bot.js'

const normalize = (str) => {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04FF]/g, "");
};

const sendBotNotification = async (products) => {
  try {
    const loggedUsers = await Users.find({ isLoggedIn: true }).lean();

    if (!loggedUsers.length) return;
    if (!products.length) return;

    for (const user of loggedUsers) {
      if (!user.telegramId) continue;

      // Header qismi
      let message = `╔═══════════════════╗\n`;
      message += `  📦 ЯНГИ МАҲСУЛОТЛАР   \n`;
      message += `╚═══════════════════╝\n\n`;

      // Mahsulotlar ro'yxati
      products.forEach((product, index) => {
        const priceCurrency = product.priceType === 'uz' ? 'сўм' : '$';

        message += `▫️ <b>${index + 1}. ${product.title}</b>\n`;
        message += `   ├─ 📦 Миқдор: ${product.stock} ${product.unit || ''}\n`;
        message += `   ├─ 🔢 Дона: ${product.count || 0}\n`;
        message += `   └─ 💰 Нархи: <b>${product.price} ${priceCurrency}</b>\n\n`;
      });

      // Footer qismi
      message += `📊 <i>Умумий қўшилган маҳсулотлар: ${products.length} та</i>`;
      message += `\n🕒 ${new Date().toLocaleString('uz-UZ', {
        timeZone: 'Asia/Tashkent'
      })
        }`;

      await bot.telegram.sendMessage(
        user.telegramId,
        message,
        {
          parse_mode: "HTML",
          disable_web_page_preview: true
        }
      );
    }
  } catch (err) {
    console.error("Bot хабар юборишда хатолик:", err.message);
  }
};
export const CreateNewProduct = async (req, res) => {
  try {
    const { clientId: bodyClientId, client: bodyClient, products: bodyProducts } = req.body;
    const products = Array.isArray(bodyProducts) ? bodyProducts : [bodyProducts];

    // --- CLIENT ---
    let clientId;
    let client;

    if (bodyClientId) {
      client = await Clients.findById(bodyClientId).lean();
      if (!client) return res.status(404).json({ message: "Клиент топилмади!" });
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
      return res.status(400).json({ message: "Client ID ёки янги клиент маълумотлари керак!" });
    }

    // --- BULK OPTIMIZATION START ---
    const normalizedData = products.map(p => ({
      ...p,
      normalizedTitle: normalize(p.title),
      unit: p.unit || "",
      stock: Number(p.stock) || 1,
      count: Number(p.count) || 1,
      price: Number(p.price) || 0
    }));

    // Unique kalitlar bo‘yicha izlash (bitta query!)
    const uniqueKeys = [...new Set(normalizedData.map(p => `${p.normalizedTitle}__${p.unit}`))];
    const titleUnitPairs = uniqueKeys.map(key => {
      const [normalizedTitle, unit] = key.split('__');
      return { normalizedTitle, unit };
    });

    const existingProducts = await Product.find({
      $or: titleUnitPairs.map(pair => ({
        normalizedTitle: pair.normalizedTitle,
        unit: pair.unit
      }))
    }).lean();

    const productMap = {};
    existingProducts.forEach(p => {
      productMap[`${p.normalizedTitle}__${p.unit || ""}`] = p;
    });

    // Atomic ID generation (bitta queryda ikkalasini ham olish)
    const [lastProduct, lastInput] = await Promise.all([
      Product.findOne().sort({ ID: -1 }).select('ID'),
      Input.findOne().sort({ ID: -1 }).select('ID')
    ]);

    let nextProductID = (lastProduct?.ID ?? 0) + 1;
    let nextInputID = (lastInput?.ID ?? 0) + 1;

    // --- PREPARE BULK OPERATIONS ---
    const productBulkOps = [];
    const inputDocs = [];
    let totalUZ = 0;
    let totalEN = 0;
    const createdProducts = [];

    for (const p of normalizedData) {
      const key = `${p.normalizedTitle}__${p.unit}`;
      const existing = productMap[key];

      if (existing) {
        // Update existing
        const newStock = existing.stock + p.stock;
        const newCount = existing.count + p.count;

        productBulkOps.push({
          updateOne: {
            filter: { _id: existing._id },
            update: {
              $set: {
                price: p.price,
                priceType: p.priceType
              },
              $inc: {
                stock: p.stock,
                count: p.count
              }
            }
          }
        });

        createdProducts.push({ ...existing, stock: newStock, count: newCount });
      } else {
        // Create new
        const newProduct = {
          ...p,
          ID: nextProductID++,
          normalizedTitle: p.normalizedTitle
        };
        productBulkOps.push({
          insertOne: { document: newProduct }
        });
        createdProducts.push(newProduct);
      }

      // Input document (keyin bulk insert qilamiz)
      inputDocs.push({
        title: p.title,
        price: p.price,
        priceType: p.priceType,
        unit: p.unit,
        stock: p.stock,
        count: p.count,
        ID: nextInputID++,
        from: clientId
      });

      // Debt hisoblash
      if (p.priceType === "uz") totalUZ += p.price * p.stock;
      else totalEN += p.price * p.stock;
    }

    // --- BULK EXECUTE (eng tez joyi!) ---
    if (productBulkOps.length > 0) {
      await Product.bulkWrite(productBulkOps, { ordered: false });
    }

    if (inputDocs.length > 0) {
      await Input.insertMany(inputDocs); // insertMany juda tez!
    }

    // Bitta queryda debtni oshirish
    if (totalUZ > 0 || totalEN > 0) {
      await Clients.findByIdAndUpdate(clientId, {
        $inc: { debtUZ: totalUZ, debtEN: totalEN }
      });
    }
    sendBotNotification(products)
    return res.status(201).json({
      message: "Маҳсулотлар муваффақиятли сақланди ✅",
      client,
      products: createdProducts
    });

  } catch (error) {
    console.error("CreateNewProduct error:", error);
    return res.status(500).json({
      message: "Сервер хатолиги!",
      error: error.message
    });
  }
};




export const GetAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      searchField = '',
      type = '',
      date = ''
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};

    // Type filter
    if (type === 'ready') {
      query.ready = true;
    } else if (type === 'raw') {
      query.ready = false;
    }


    // Date filter
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      query.createdAt = {
        $gte: startDate,
        $lte: endDate
      };
    }

    // Search filter
    if (search) {
      if (searchField === 'ID') {
        const numValue = Number(search);

        if (!isNaN(numValue)) {
          query.ID = numValue;
        } else {
          return res.status(400).json({
            message: "ID must be a number"
          });
        }

      } else if (searchField === 'title') {
        query.title = { $regex: search, $options: 'i' };
      } else {
        query.$or = [
          { title: { $regex: search, $options: 'i' } }
        ];
      }
    }
    // Get total count
    const total = await Product.countDocuments(query);

    // Get products with pagination
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    if (products.length === 0) {
      return res.status(200).json({
        data: [],
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    }

    // Add client info if needed
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

    return res.status(200).json({
      data: productsWithClient,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('GetAllProducts Error:', error);
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
      return res.status(404).json({ message: "Маҳсулотлар топилмади❗" });
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
      return res.status(404).json({ message: "Маҳсулотлар топилмади❗" });
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
    // Agar price === 0 bo'lsa, price ni o'chirib tashlaymiz
    if (req.body.price === 0) {
      delete req.body.price
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
      new: true
    })

    if (!updatedProduct) {
      return sendErrorResponse(res, 404, 'Product not found.')
    }

    return res.status(200).json({
      message: 'Product updated successfully',
      data: updatedProduct
    })

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
