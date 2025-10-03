import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/user.js'
import { sendErrorResponse } from '../middlewares/sendErrorResponse.js'

const KEY = process.env.JWTSECRET_KEY

export const RegisterUser = async (req, res) => {
  try {
    const { phoneNumber, firstName, lastName, role, password } = req.body

    const existingUser = await User.findOne({ phoneNumber })
    if (existingUser) {
      return sendErrorResponse(res, 400, 'User already exists.')
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = new User({
      phoneNumber,
      firstName,
      lastName,
      role,
      password: hashedPassword
    })

    await newUser.save()

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        phoneNumber: newUser.phoneNumber,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role
      }
    })
  } catch (error) {
    return sendErrorResponse(
      res,
      500,
      'Server Error. Please Try Again Later!',
      error
    )
  }
}

export const LoginUser = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body

    const user = await User.findOne({ phoneNumber })
    if (!user) {
      return sendErrorResponse(res, 404, 'User not found.')
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return sendErrorResponse(res, 400, 'Invalid credentials.')
    }

    const token = jwt.sign({ id: user._id, role: user.role }, KEY, {
      expiresIn: '31d'
    })

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    })
  } catch (error) {
    return sendErrorResponse(
      res,
      500,
      'Server Error. Please Try Again Later!',
      error
    )
  }
}

export const GetAllUsers = async (_, res) => {
  try {
    const users = await User.find().select('-password')
    if (users.length === 0) {
      return res.status(404).json({ message: 'No users found.' })
    }
    return res.status(200).json({ data: users })
  } catch (error) {
    return sendErrorResponse(
      res,
      500,
      'Server Error. Please Try Again Later!',
      error
    )
  }
}

export const GetOneUser = async (req, res) => {
  const { id } = req.params
  try {
    const user = await User.findById(id).select('-password')
    if (!user) {
      return sendErrorResponse(res, 404, 'User not found.')
    }
    return res.status(200).json({ data: user })
  } catch (error) {
    return sendErrorResponse(
      res,
      500,
      'Server Error. Please Try Again Later!',
      error
    )
  }
}

export const getMe = async (req, res) => {
  try {
    const token = (req.headers.authorization || '').replace(/Bearer\s?/, '')
    if (!token) return sendErrorResponse(res, 401, 'Access not allowed! 📛')

    const decoded = jwt.verify(token, KEY)
    let user = await User.findById(decoded.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found!' })
    }

    return res.status(200).json({ data: user })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const UpdateUser = async (req, res) => {
  const { id } = req.params
  try {
    let updateData = { ...req.body }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10)
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true
    }).select('-password')

    if (!updatedUser) {
      return sendErrorResponse(res, 404, 'User not found.')
    }

    return res.status(200).json({
      message: 'User updated successfully',
      data: updatedUser
    })
  } catch (error) {
    return sendErrorResponse(
      res,
      500,
      'Server Error. Please Try Again Later!',
      error
    )
  }
}

export const DeleteUser = async (req, res) => {
  const { id } = req.params
  try {
    const deletedUser = await User.findByIdAndDelete(id)
    if (!deletedUser) {
      return sendErrorResponse(res, 404, 'User not found.')
    }
    return res
      .status(200)
      .json({ message: 'User has been deleted successfully.' })
  } catch (error) {
    return sendErrorResponse(
      res,
      500,
      'Server Error. Please Try Again Later!',
      error
    )
  }
}
