import express from 'express'
import {
  CreateNewProduct,
  DeleteProduct,
  GetAllProducts,
  GetOneProduct,
  UpdateProduct
} from '../controllers/product.js'
import isExisted from '../middlewares/isExisted.js'

const router = express.Router()

router.get('/', isExisted, GetAllProducts)
router.get('/one/:id', isExisted, GetOneProduct)
router.post('/create', isExisted, CreateNewProduct)
router.put('/:id', isExisted, UpdateProduct)
router.delete('/:id', isExisted, DeleteProduct)

export default router
