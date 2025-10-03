import mongoose from 'mongoose'

const User = new mongoose.Schema({
  phoneNumber: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, required: true },
  owner: { type: Boolean, default: false },
  password: { type: String, required: true }
})

export default mongoose.model('Users', User)
