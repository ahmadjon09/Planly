import mongoose from 'mongoose'

const User = new mongoose.Schema({
  phoneNumber: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String },
  role: { type: String, required: true },
  ability: { type: String, enum: ["both", "ready", "!ready"], default: "both" },
  owner: { type: Boolean, default: false },
  telegramId: { type: String, default: "---" },
  password: { type: String, required: true }
})

export default mongoose.model('Users', User)
