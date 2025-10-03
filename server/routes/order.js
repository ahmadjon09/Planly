import exress from 'express'
import isExisted from '../middlewares/isExisted.js'
import {
  AllOrders,
  CancelOrder,
  GetOneOrder,
  NewOrder
} from '../controllers/order.js'

const router = exress.Router()

router.get('/', isExisted, AllOrders)
router.get('/:id', isExisted, GetOneOrder)
router.post('/new-order', isExisted, NewOrder)
router.delete('/:id', isExisted, CancelOrder)

export default router
