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
import { DeleteClient, DeleteInProduct, UpdateInProduct } from '../controllers/client.js'

const router = express.Router()

router.get('/clients', isExisted, GetClientsWithProducts)
router.post('/pay', isExisted, PayClientDebt)
router.get('/ready', isExisted, GetAllProducts)
router.get('/one/:id', isExisted, GetOneProduct)
router.post('/create', isExisted, CreateNewProduct)
router.put('/:id', isExisted, UpdateProduct)
router.put('/in/:id', isExisted, UpdateInProduct)
router.delete('/:id', isExisted, DeleteProduct)
router.delete('/in/:id', isExisted, DeleteInProduct)
router.delete('/client/:id', isExisted, DeleteClient)

export default router
