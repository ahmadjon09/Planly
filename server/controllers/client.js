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
                const count = await Product.countDocuments({ from: client._id })
                return {
                    ...client.toObject(),
                    productCount: count
                }
            })
        )

        return res.status(200).json({
            message: "✅",
            data: clientsWithCount
        })
    } catch (error) {
        console.error("❌:", error)
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

        clientsWithOrderInfo.sort((a, b) => b.unpaidOrders - a.unpaidOrders);

        return res.status(200).json({
            message: "✅",
            data: clientsWithOrderInfo
        });

    } catch (error) {
        console.error("❌:", error);
        sendErrorResponse(res, 500, "Сервер хатолиги! Илтимос, кейинроқ қайта уриниб кўринг.");
    }
};

export const DeleteInProduct = async (req, res) => {
    const { id } = req.params
    try {
        const deletedProduct = await Input.findByIdAndDelete(id)
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
