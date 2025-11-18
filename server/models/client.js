import mongoose from 'mongoose'

const Client = new mongoose.Schema({
    phoneNumber: { type: String, required: true, },
    name: { type: String, required: true },
    clietn: { type: Boolean, default: false },
    debtUZ: { type: Number, default: 0 },
    debtEN: { type: Number, default: 0 },
})

export default mongoose.model('Clients', Client)
