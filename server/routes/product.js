import express from 'express'
import {
  CreateNewProduct,
  DeleteProduct,
  GetAllNotReadyProducts,
  GetAllProducts,
  GetAllReadyProducts,
  GetClientsWithProducts,
  GetOneProduct,
  PayClientDebt,
  UpdateProduct
} from '../controllers/product.js'
import isExisted from '../middlewares/isExisted.js'

const router = express.Router()

router.get('/', isExisted, GetAllProducts)
router.get('/clients', isExisted, GetClientsWithProducts)
router.post('/pay', isExisted, PayClientDebt)
router.get('/ready', isExisted, GetAllReadyProducts)
router.get('/raw', isExisted, GetAllNotReadyProducts)
router.get('/one/:id', isExisted, GetOneProduct)
router.post('/create', isExisted, CreateNewProduct)
router.put('/:id', isExisted, UpdateProduct)
router.delete('/:id', isExisted, DeleteProduct)

export default router
