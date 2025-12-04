import Clients from "../models/client.js"
import { sendErrorResponse } from "../middlewares/sendErrorResponse.js"
import Order from "../models/order.js"
import History from "../models/history.js"
import Input from "../models/input.js"

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

export const GetClientsWithOrders = async (_, res) => {
    try {
        const clients = await Clients.find();

        const clientsWithOrderInfo = await Promise.all(
            clients.map(async client => {
                const [orders, history] = await Promise.all([
                    Order.find({ client: client._id })
                        .sort({ createdAt: -1 })
                        .populate('products.product'),
                    History.find({ client: client._id }).sort({ createdAt: -1 })
                ]);

                const totalOrders = orders.length;
                const unpaidOrders = orders.filter(o => !o.paid).length;

                return {
                    ...client.toObject(),
                    totalOrders,
                    unpaidOrders,
                    orders,
                    history,
                    historyCount: history.length
                };
            })
        );

        // To‘lanmagan buyurtmalar bo‘yicha kamayish tartibida saralash
        clientsWithOrderInfo.sort((a, b) => b.unpaidOrders - a.unpaidOrders);

        return res.status(200).json({
            message: "Маълумотлар муваффақиятли юклаб олинди",
            data: clientsWithOrderInfo
        });

    } catch (error) {
        console.error("Хатолик:", error);
        sendErrorResponse(res, 500, "Сервер хатолиги! Илтимос, кейинроқ қайта уриниб кўринг.");
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

        // 2) Shu nomdagi Productni topamiz (normalize orqali)
        const normalizedTitle = normalize(deletedInput.title);

        const product = await Product.findOne({ normalizedTitle });

        if (product) {
            // 3) Product.stock va count dan ayiramiz
            const inputStock = Number(deletedInput.stock) || 0;
            const inputCount = Number(deletedInput.count) || 0;

            product.stock = Math.max(0, (Number(product.stock) || 0) - inputStock);
            product.count = Math.max(0, (Number(product.count) || 0) - inputCount);

            await product.save();
        }

        // 4) Input ni o‘chiramiz
        await deletedInput.deleteOne();

        return res.status(200).json({
            message: "Маҳсулот муваффақиятли ўчирилди."
        });

    } catch (error) {
        if (error.name === "CastError") {
            return sendErrorResponse(res, 400, "Маҳсулот ID си нотўғри форматада.", error);
        }

        return sendErrorResponse(
            res,
            500,
            "Сервер хатолиги! Илтимос, кейинроқ қайта уриниб кўринг.",
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
