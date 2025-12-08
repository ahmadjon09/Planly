import express from 'express'
import isExisted from '../middlewares/isExisted.js'
import {
  AllOrders,
  CancelOrder,
  GetOrderStats,
  NewOrder,
  UpdateOrder
} from '../controllers/order.js'
import { DeleteInProduct, getClientOrders, getClientPaymentHistory, getClientsForOrders, getProductsForOrder } from '../controllers/client.js'

const router = express.Router()

router.get('/', isExisted, AllOrders)
router.get('/clients', isExisted, getClientsForOrders)
router.get('/client-orders', isExisted, getClientOrders);
router.get('/client-payments', isExisted, getClientPaymentHistory);
router.get('/products', isExisted, getProductsForOrder)
router.get('/stats', isExisted, GetOrderStats)
router.put('/:id', isExisted, UpdateOrder)
router.post('/new', isExisted, NewOrder)
router.delete('/:id', isExisted, CancelOrder)
router.delete('/product/:id', isExisted, DeleteInProduct)

export default router
