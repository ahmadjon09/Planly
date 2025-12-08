import Clients from "../models/client.js"
import { sendErrorResponse } from "../middlewares/sendErrorResponse.js"
import Order from "../models/order.js"
import History from "../models/history.js"
import Input from "../models/input.js"
import User from "../models/user.js"
import Product from "../models/product.js"

const normalize = (str) => {
    return String(str)
        .toLowerCase()
        .replace(/[^a-z0-9\u0400-\u04FF]/g, "");
};

export const GetNonClients = async (_, res) => {
    try {
        const clients = await Clients.find({ clietn: false })

        const clientsWithCount = await Promise.all(
            clients.map(async client => {
                const count = await Input.countDocuments({ from: client._id }) // Product emas, Input ishlatilgan
                return {
                    ...client.toObject(),
                    productCount: count
                }
            })
        )

        return res.status(200).json({
            message: "Муваффақиятли юклаб олинди",
            data: clientsWithCount
        })
    } catch (error) {
        console.error("Хатолик:", error)
        sendErrorResponse(res, 500, "Сервер хатолиги! Илтимос, кейинроқ қайта уриниб кўринг.")
    }
}

export const getClientsForOrders = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search = '',
            searchField = 'name'
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const query = {};

        // Faqat mijoz bo'lgan userlarni olish
        query.clietn = true;

        // Search filter
        if (search) {
            if (searchField === 'name') {
                query.name = { $regex: search, $options: 'i' };
            } else if (searchField === 'phone') {
                query.phoneNumber = { $regex: search, $options: 'i' };
            } else {
                // Search in all fields
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { phoneNumber: { $regex: search, $options: 'i' } }
                ];
            }
        }

        // Get total count
        const total = await Clients.countDocuments(query);

        // Get clients with pagination
        const clients = await Clients.find(query)
            .select('-password -__v')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Har bir mijozning buyurtmalari va qarzi
        const clientsWithDetails = await Promise.all(
            clients.map(async (client) => {
                const orders = await Order.find({
                    client: client._id
                })
                    .select('-__v')
                    .populate({
                        path: 'products.product',
                        select: 'title price priceType unit'
                    })
                    .sort({ createdAt: -1 });

                // Qarzni hisoblash
                const debtUZ = client.debtUZ || 0;
                const debtEN = client.debtEN || 0;

                // Umumiy summani hisoblash
                const totalOrders = orders.length;
                const totalAmountUZ = orders.reduce((sum, order) => sum + (order.totalUZ || 0), 0);
                const totalAmountEN = orders.reduce((sum, order) => sum + (order.totalEN || 0), 0);
                const unpaidOrders = orders.filter(order => !order.paid).length;

                // History (to'lovlar tarixi)
                const history = await History.find({ clientId: client._id })
                    .select('type amount createdAt')
                    .sort({ createdAt: -1 })
                    .limit(100);

                return {
                    ...client.toObject(),
                    orders,
                    history,
                    totalOrders,
                    totalAmountUZ,
                    totalAmountEN,
                    unpaidOrders,
                    debtUZ,
                    debtEN
                };
            })
        );

        return res.status(200).json({
            data: clientsWithDetails,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Get clients for orders error:', error);
        return res.status(500).json({
            message: "Server Error. Please Try Again Later!",
            error: error.message
        });
    }
};

// Tanlangan mijozning buyurtmalarini olish (pagination va filter bilan)
export const getClientOrders = async (req, res) => {
    try {
        const {
            clientId,
            page = 1,
            limit = 10,
            date = '',
            search = ''
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const query = { client: clientId };



        // Date filter (TO'G'RI)
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);

            query.orderDate = {
                $gte: startDate,
                $lte: endDate
            };
        }

        // Search filter
        if (search) {
            const productIds = await Product.find({
                title: { $regex: search, $options: 'i' }
            }).distinct('_id');

            if (productIds.length > 0) {
                query['products.product'] = { $in: productIds };
            }
        }

        const total = await Order.countDocuments(query);

        const orders = await Order.find(query)
            .select('-__v')
            .populate({
                path: 'products.product',
                select: 'title price priceType unit ID'
            })
            .sort({ orderDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const client = await User.findById(clientId)
            .select('name phoneNumber debtUZ debtEN');


        return res.status(200).json({
            data: {
                client,
                orders,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });

    } catch (error) {
        console.error('Get client orders error:', error);
        return res.status(500).json({
            message: "Server Error. Please Try Again Later!",
            error: error.message
        });
    }
};


// Mijozning to'lovlar tarixini olish (pagination bilan)
export const getClientPaymentHistory = async (req, res) => {
    try {
        const {
            clientId,
            page = 1,
            limit = 10
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const query = { client: clientId };

        // Get total count
        const total = await History.countDocuments(query);

        // Get payment history with pagination
        const history = await History.find(query)
            .select('type price createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        return res.status(200).json({
            data: history,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Get client payment history error:', error);
        return res.status(500).json({
            message: "Server Error. Please Try Again Later!",
            error: error.message
        });
    }
};

export const DeleteInProduct = async (req, res) => {
    const { id } = req.params;

    try {
        // 1) O'chiriladigan Input ni topamiz
        const deletedInput = await Input.findById(id);
        if (!deletedInput) {
            return sendErrorResponse(res, 404, "Маҳсулот топилмади.");
        }

        // 2) Inputdagi title + unit bo'yicha Product topiladi
        const normalizedTitle = normalize(deletedInput.title);
        const unit = deletedInput.unit || "";

        const product = await Product.findOne({
            normalizedTitle,
            unit
        });

        if (product) {
            const inputStock = Number(deletedInput.stock) || 0;
            const inputCount = Number(deletedInput.count) || 0;

            product.stock = Math.max(0, (Number(product.stock) || 0) - inputStock);
            product.count = Math.max(0, (Number(product.count) || 0) - inputCount);

            await product.save();
        }

        // 3) CLIENTni debt dan ayiramiz
        const clientId = deletedInput.from;

        if (clientId) {
            const price = Number(deletedInput.price) || 0;
            const stock = Number(deletedInput.stock) || 0;
            const total = price * stock;

            if (total > 0) {
                if (deletedInput.priceType === "uz") {
                    await Clients.findByIdAndUpdate(clientId, {
                        $inc: { debtUZ: -total }
                    });
                } else {
                    await Clients.findByIdAndUpdate(clientId, {
                        $inc: { debtEN: -total }
                    });
                }
            }
        }

        // 4) Inputni o'chiramiz
        await deletedInput.deleteOne();

        return res.status(200).json({
            message: "Маҳсулот муваффақиятли ўчирилди."
        });

    } catch (error) {
        if (error.name === "CastError") {
            return sendErrorResponse(
                res,
                400,
                "Маҳсулот ID си нотўғри.",
                error
            );
        }
        console.log(error);


        return sendErrorResponse(
            res,
            500,
            "Сервер хатолиги! Кейинroq уриниб кўринг.",
            error
        );


    }
};


export const UpdateInProduct = async (req, res) => {
    const { id } = req.params;
    const { name, price, priceType } = req.body;

    try {
        // 1) Маҳсулотни топиш
        const product = await Input.findById(id);
        if (!product) return sendErrorResponse(res, 404, "Маҳсулот топилмади.");

        // Янги маълумотларни қўйиш
        if (name) product.name = name;
        if (price) product.price = price;
        if (priceType) product.priceType = priceType;

        const stock = Number(product.stock || 0);
        const priceNum = Number(product.price);

        // 2) Клиентни топиш
        const client = await Clients.findById(product.from);
        if (!client) return sendErrorResponse(res, 404, "Клиент топилмади.");

        // 3) Умумий суммани ҳисоблаш
        let summa = stock * priceNum;

        // 4) Қарзни қўшиш
        if (product.priceType === "uz") {
            client.debtUZ = Number(client.debtUZ || 0) + summa;
        }

        if (product.priceType === "en") {
            client.debtEN = Number(client.debtEN || 0) + summa;
        }

        // 5) Сақлаш
        await product.save();
        await client.save();

        return res.status(200).json({
            message: "Маҳсулот янланди ва клиент қарзига қўшилди!",
            product,
            client
        });

    } catch (error) {
        if (error.name === "CastError") {
            return sendErrorResponse(res, 400, "Маҳсулот ID си нотўғри форматада.", error);
        }

        return sendErrorResponse(
            res,
            500,
            "Сервер хатолиги! Илтимос, кейинроқ қайта уриниб кўринг!",
            error
        );
    }
};

export const PayClientDebt = async (req, res) => {
    try {
        const { clientId, uz = 0, en = 0 } = req.body;

        if (!clientId) {
            return sendErrorResponse(res, 400, "clientId майдони тўлдирилиши шарт!");
        }

        const client = await Clients.findById(clientId);
        if (!client) {
            return sendErrorResponse(res, 404, "Клиент топилмади!");
        }

        // Қарзни камайтириш
        const newDebtUZ = Number(client.debtUZ || 0) - Number(uz);
        const newDebtEN = Number(client.debtEN || 0) - Number(en);

        // Қарзни нолдан пастга тушмаслиги учун
        client.debtUZ = newDebtUZ < 0 ? 0 : newDebtUZ;
        client.debtEN = newDebtEN < 0 ? 0 : newDebtEN;

        await client.save();

        return res.status(200).json({
            message: "Қарз муваффақиятли тўланди",
            data: client
        });
    } catch (error) {
        console.error("Қарз тўлашда хатолик:", error);
        sendErrorResponse(res, 500, "Сервер хатолиги! Илтимос, кейинроқ қайта уриниб кўринг.");
    }
};

export const DeleteClient = async (req, res) => {
    const { id } = req.params;

    try {
        // 1) Клиентни топиш
        const client = await Clients.findById(id);
        if (!client) {
            return sendErrorResponse(res, 404, "Клиент топилмади.");
        }

        // 2) Клиентни ўчириш
        await Clients.findByIdAndDelete(id);

        // 3) Клиентга тегишли барча orderларни ўчириш
        await Order.deleteMany({ client: id });

        // 4) Клиентга тегишли барча history ёзувларни ўчириш
        await History.deleteMany({ client: id });

        // 5) Клиент томонидан киритилган барча маҳсулотларни ўчириш
        await Input.deleteMany({ from: id });

        return res.status(200).json({
            message: "Клиент ва унга тегишли барча маълумотлар муваффақиятли ўчирилди."
        });

    } catch (error) {
        console.error("Клиентни ўчиришда хатолик:", error);
        return sendErrorResponse(
            res,
            500,
            "Сервер хатолиги! Илтимос, кейинроқ қайта уриниб кўринг.",
            error
        );
    }
};

export const getProductsForOrder = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 30,
            search = '',
            searchField = '',
            type = 'ready'
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const query = {};

        // Type filter
        if (type) {
            query.ready = type === 'ready';
        }

        // Search filter
        if (search) {
            if (searchField === 'ID') {

                // Convert to number
                const num = Number(search);

                // If not a number → error
                if (!isNaN(num)) {
                    query.ID = num;
                } else {
                    return res.status(400).json({ message: "ID must be a number" });
                }

            } else if (searchField === 'title') {

                query.title = { $regex: search, $options: 'i' };

            } else {
                // Search in ALL fields
                const num = Number(search);

                query.$or = [
                    // If search is number, allow ID starting with search
                    !isNaN(num)
                        ? { ID: { $gte: num, $lt: num + 1 } }
                        : null,
                    { title: { $regex: search, $options: 'i' } }
                ].filter(Boolean);
            }
        }

        // Stock filter (faqat mavjud mahsulotlar)
        query.stock = { $gt: 0 };

        // Get total count
        const total = await Product.countDocuments(query);

        // Get products with pagination
        const products = await Product.find(query)
            .select('-__v')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        return res.status(200).json({
            data: products,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Get products for order error:', error);
        return res.status(500).json({
            message: "Server Error. Please Try Again Later!",
            error: error.message
        });
    }
};