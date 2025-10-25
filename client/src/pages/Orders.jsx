import { useState, useContext, useMemo } from 'react'
import useSWR from 'swr'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Loader2,
  Save,
  Trash2,
  ScrollText,
  Eye,
  X,
  User,
  MapPin,
  ShoppingCart,
  CreditCard,
  Phone,
  Calendar,
  BadgeDollarSign,
  ChevronLeft,
  Package,
  Search,
  Filter,
  Download,
  MoreVertical,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import Fetch from '../middlewares/fetcher'
import { AddNewOrder } from '../mod/OrderModal'
import { ContextData } from '../contextData/Context'
import { LoadingState } from '../components/loading-state'

export const ViewOrders = () => {
  const { data, error, isLoading, mutate } = useSWR('/orders', Fetch, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  })
  const { user } = useContext(ContextData)

  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState({})
  const [loading, setLoading] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedClient, setSelectedClient] = useState(null)

  const [searchPhone, setSearchPhone] = useState('')
  const [searchName, setSearchName] = useState('')
  const [searchDate, setSearchDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const orders = data?.data?.data || []

  // Mijozlarni guruhlab olish
  const clients = useMemo(() => {
    const clientMap = {}

    orders.forEach(order => {
      const clientId = order.client?._id || order.client?.phoneNumber
      if (!clientId) return

      if (!clientMap[clientId]) {
        clientMap[clientId] = {
          ...order.client,
          orders: [],
          totalOrders: 0,
          totalSpent: 0,
          lastOrder: null
        }
      }

      clientMap[clientId].orders.push(order)
      clientMap[clientId].totalOrders += 1
      clientMap[clientId].totalSpent += order.totalPrice || 0

      const orderDate = new Date(order.createdAt || order.orderDate)
      if (
        !clientMap[clientId].lastOrder ||
        orderDate > new Date(clientMap[clientId].lastOrder)
      ) {
        clientMap[clientId].lastOrder = orderDate
      }
    })

    return Object.values(clientMap)
  }, [orders])

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const phoneMatch = client.phoneNumber
        ?.toLowerCase()
        .includes(searchPhone.toLowerCase())
      const nameMatch = client.fullName
        ?.toLowerCase()
        .includes(searchName.toLowerCase())

      return phoneMatch && nameMatch
    })
  }, [clients, searchPhone, searchName])

  const filteredClientOrders = useMemo(() => {
    if (!selectedClient) return []

    let orders = selectedClient.orders

    // Date filter
    if (searchDate) {
      orders = orders.filter(
        order =>
          new Date(order.orderDate).toLocaleDateString() ===
          new Date(searchDate).toLocaleDateString()
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      orders = orders.filter(order => order.status === statusFilter)
    }

    return orders
  }, [selectedClient, searchDate, statusFilter])

  const getStatusIcon = status => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle className='text-green-500' size={16} />
      case 'pending':
        return <Clock className='text-yellow-500' size={16} />
      case 'cancelled':
        return <X className='text-red-500' size={16} />
      default:
        return <AlertCircle className='text-gray-500' size={16} />
    }
  }

  const getStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleChange = (id, field, value) => {
    setEditing(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }))
  }

  const handleSave = async id => {
    try {
      setLoading(id)
      await Fetch.put(`/orders/${id}`, editing[id])
      setEditing(prev => {
        const copy = { ...prev }
        delete copy[id]
        return copy
      })
      mutate()
    } catch (err) {
      console.error('Update error:', err)
      alert('❌ Сақлашда хатолик юз берди')
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async (id, title) => {
    const confirmMessage = `⚠️ Сиз ростдан ҳам буюртмасини бекор қилмоқчимисиз?\n\nБу амални кейин тиклаб бўлмайди!`
    const confirmed = window.confirm(confirmMessage)
    if (!confirmed) return

    try {
      setDeleting(id)
      await Fetch.delete(`/orders/${id}`)
      mutate()
    } catch (err) {
      console.error('Cancel error:', err)
      alert('❌ Буюртмани бекор қилишда хатолик юз берди.')
    } finally {
      setDeleting(null)
    }
  }

  if (isLoading) {
    return (
      <div className='min-h-screen flex justify-center items-center'>
        <LoadingState />
      </div>
    )
  }

  if (error)
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className='text-center p-8 bg-red-50 rounded-2xl border border-red-200 max-w-md'
        >
          <AlertCircle className='mx-auto text-red-500 mb-4' size={48} />
          <h3 className='text-lg font-semibold text-red-800 mb-2'>
            Юклашда хатолик
          </h3>
          <p className='text-red-600'>
            Буюртмаларни юклашда хатолик юз берди. Илтимос, қайта уриниб кўринг.
          </p>
        </motion.div>
      </div>
    )

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-6'>
      <div className='mx-auto space-y-6'>
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-white rounded-2xl shadow-lg p-6 border border-gray-200'
        >
          <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4'>
            <div className='flex items-center gap-4'>
              {selectedClient ? (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => setSelectedClient(null)}
                  className='flex items-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-all duration-300'
                >
                  <ChevronLeft size={20} />
                  Орқага
                </motion.button>
              ) : (
                <div className='bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-xl shadow-lg'>
                  <ScrollText className='text-white' size={28} />
                </div>
              )}
              <div>
                <h1 className='text-2xl md:text-3xl font-bold text-gray-800'>
                  {selectedClient
                    ? `${selectedClient.fullName} буюртмалари`
                    : 'Мижозлар'}
                </h1>
                <p className='text-gray-600 mt-1'>
                  {selectedClient
                    ? `${filteredClientOrders.length} та буюртма топилди`
                    : `${filteredClients.length} та мижоз топилди`}
                </p>
              </div>
            </div>

            <div className='flex flex-col sm:flex-row gap-3 w-full lg:w-auto'>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(true)}
                className='flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold'
              >
                <Plus size={20} />
                Янги буюртма
              </motion.button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='bg-white rounded-2xl shadow-lg p-6 border border-gray-200'
        >
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div className='relative'>
              <Search
                className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                size={20}
              />
              <input
                type='text'
                placeholder='Телефон рақам...'
                value={searchPhone}
                onChange={e => setSearchPhone(e.target.value)}
                className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 bg-gray-50'
              />
            </div>

            <div className='relative'>
              <User
                className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                size={20}
              />
              <input
                type='text'
                placeholder='Мижоз Ф.И.Ш...'
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 bg-gray-50'
              />
            </div>

            {selectedClient && (
              <>
                <div className='relative'>
                  <Calendar
                    className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                    size={20}
                  />
                  <input
                    type='date'
                    value={searchDate}
                    onChange={e => setSearchDate(e.target.value)}
                    className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 bg-gray-50'
                  />
                </div>

                <div className='relative'>
                  <Filter
                    className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                    size={20}
                  />
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 bg-gray-50 appearance-none'
                  >
                    <option value='all'>Барча ҳолатлар</option>
                    <option value='pending'>Кутилмоқда</option>
                    <option value='completed'>Бажарилган</option>
                    <option value='cancelled'>Бекор қилинган</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {!selectedClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {filteredClients.length === 0 ? (
              <div className='bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-200'>
                <Package className='mx-auto text-gray-400 mb-4' size={64} />
                <h3 className='text-xl font-semibold text-gray-600 mb-2'>
                  Мижозлар топилмади
                </h3>
                <p className='text-gray-500 mb-6'>
                  Қидирув шартларингизга мос келувчи мижозлар мавжуд эмас
                </p>
                <button
                  onClick={() => {
                    setSearchPhone('')
                    setSearchName('')
                  }}
                  className='text-blue-500 hover:text-blue-700 font-semibold'
                >
                  Филтрни тозалаш
                </button>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
                {filteredClients.map((client, index) => (
                  <motion.div
                    key={client._id || client.phoneNumber}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedClient(client)}
                    className='bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 cursor-pointer group'
                  >
                    <div className='flex items-start justify-between mb-4'>
                      <div className='flex items-center gap-3'>
                        <div className='bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300'>
                          <User className='text-white' size={24} />
                        </div>
                        <div>
                          <h3 className='font-bold text-lg text-gray-800'>
                            {client.fullName || 'Номаълум'}
                          </h3>
                          <p className='text-gray-600 text-sm'>
                            {client.phoneNumber}
                          </p>
                        </div>
                      </div>
                      <div className='text-right'>
                        <div className='flex items-center gap-1 text-green-600 font-semibold text-lg'>
                          <Package size={18} />
                          <span>{client.totalOrders}</span>
                        </div>
                        <div className='text-xs text-gray-500'>буюртма</div>
                      </div>
                    </div>

                    <div className='flex items-center gap-2 text-sm text-gray-600 mb-3'>
                      <MapPin size={16} />
                      <span className='truncate'>
                        {client.address || 'Манзил кўрсатилмаган'}
                      </span>
                    </div>

                    {client.lastOrder && (
                      <div className='text-xs text-gray-500 mb-3'>
                        Охирги буюртма: {client.lastOrder.toLocaleDateString()}
                      </div>
                    )}

                    <div className='flex justify-between items-center pt-4 border-t border-gray-100'>
                      <span className='text-sm text-gray-500'>Жами:</span>
                      <span className='font-bold text-green-600 text-lg'>
                        {client.totalSpent.toLocaleString()} сўм
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {selectedClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {filteredClientOrders.length === 0 ? (
              <div className='bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-200'>
                <ScrollText className='mx-auto text-gray-400 mb-4' size={64} />
                <h3 className='text-xl font-semibold text-gray-600 mb-2'>
                  Буюртмалар топилмади
                </h3>
                <p className='text-gray-500'>
                  Ушбу мижоз учун ҳеч қандай буюртма топилмади.
                </p>
              </div>
            ) : (
              <div className='bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden'>
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead className='bg-gradient-to-r from-gray-50 to-gray-100'>
                      <tr>
                        <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                          Маҳсулотлар
                        </th>
                        <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                          Ҳолат
                        </th>
                        <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                          Умумий нарх
                        </th>
                        <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>
                          Сана
                        </th>
                        <th className='px-6 py-4 text-center text-sm font-semibold text-gray-700'>
                          Амалиёт
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-200'>
                      {filteredClientOrders.map((order, index) => {
                        const isEdited = Boolean(editing[order._id])
                        return (
                          <motion.tr
                            key={order._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className='hover:bg-blue-50 transition-colors duration-200'
                          >
                            <td className='px-6 py-4'>
                              <div className='space-y-1'>
                                {order.products.slice(0, 2).map((item, i) => (
                                  <div
                                    key={i}
                                    className='text-sm text-gray-700'
                                  >
                                    <span className='font-medium'>
                                      {item.productName || 'Мавжуд эмас'}
                                    </span>
                                    <span className='text-gray-500 ml-2'>
                                      {item.amount} {item.unit} ×{' '}
                                      {item.price.toLocaleString()} сўм
                                    </span>
                                  </div>
                                ))}
                                {order.products.length > 2 && (
                                  <div className='text-xs text-blue-500 font-medium'>
                                    + {order.products.length - 2} та бошқа
                                    маҳсулот
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className='px-6 py-4'>
                              <div
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                  order.status
                                )}`}
                              >
                                {getStatusIcon(order.status)}
                                {order.status || '—'}
                              </div>
                            </td>

                            <td className='px-6 py-4'>
                              {user.role === 'admin' ? (
                                <div className='flex items-center gap-2'>
                                  <input
                                    type='number'
                                    value={
                                      editing[order._id]?.totalPrice ??
                                      order.totalPrice ??
                                      ''
                                    }
                                    onChange={e =>
                                      handleChange(
                                        order._id,
                                        'totalPrice',
                                        e.target.value
                                      )
                                    }
                                    className='w-32 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none'
                                  />
                                  <span className='text-gray-500'>сўм</span>
                                </div>
                              ) : (
                                <div className='font-bold text-green-600 text-lg'>
                                  {order.totalPrice?.toLocaleString()} сўм
                                </div>
                              )}
                            </td>

                            <td className='px-6 py-4 text-sm text-gray-600'>
                              {new Date(
                                order.createdAt || order.orderDate
                              ).toLocaleDateString()}
                            </td>

                            <td className='px-6 py-4'>
                              <div className='flex items-center justify-center gap-2'>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setSelectedOrder(order)}
                                  className='flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200'
                                >
                                  <Eye size={16} />
                                  Кўриш
                                </motion.button>

                                {isEdited && (
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleSave(order._id)}
                                    disabled={loading === order._id}
                                    className='flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors duration-200'
                                  >
                                    {loading === order._id ? (
                                      <Loader2
                                        className='animate-spin'
                                        size={16}
                                      />
                                    ) : (
                                      <Save size={16} />
                                    )}
                                    Сақлаш
                                  </motion.button>
                                )}

                                {user.role === 'admin' && (
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleDelete(order._id)}
                                    disabled={deleting === order._id}
                                    className='flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors duration-200'
                                  >
                                    {deleting === order._id ? (
                                      <Loader2
                                        className='animate-spin'
                                        size={16}
                                      />
                                    ) : (
                                      <Trash2 size={16} />
                                    )}
                                    Бекор қилиш
                                  </motion.button>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedOrder(null)}
            className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className='bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative max-h-[90vh] overflow-y-auto'
            >
              <button
                onClick={() => setSelectedOrder(null)}
                className='absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors duration-200'
              >
                <X size={20} />
              </button>

              <div className='p-8'>
                <div className='text-center mb-8'>
                  <div className='bg-gradient-to-r from-blue-500 to-indigo-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg'>
                    <ShoppingCart className='text-white' size={28} />
                  </div>
                  <h2 className='text-2xl font-bold text-gray-800'>
                    Буюртма маълумотлари
                  </h2>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
                  <div className='space-y-4'>
                    <div className='flex items-center gap-3 p-3 bg-blue-50 rounded-xl'>
                      <User className='text-blue-600' size={20} />
                      <div>
                        <p className='text-sm text-gray-600'>Мижоз</p>
                        <p className='font-semibold'>
                          {selectedOrder.client?.fullName || '—'}
                        </p>
                      </div>
                    </div>

                    <div className='flex items-center gap-3 p-3 bg-green-50 rounded-xl'>
                      <Phone className='text-green-600' size={20} />
                      <div>
                        <p className='text-sm text-gray-600'>Телефон</p>
                        <p className='font-semibold'>
                          {selectedOrder.client?.phoneNumber || '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='space-y-4'>
                    <div className='flex items-center gap-3 p-3 bg-red-50 rounded-xl'>
                      <MapPin className='text-red-600' size={20} />
                      <div>
                        <p className='text-sm text-gray-600'>Манзил</p>
                        <p className='font-semibold'>
                          {selectedOrder.client?.address || '—'}
                        </p>
                      </div>
                    </div>

                    <div className='flex items-center gap-3 p-3 bg-purple-50 rounded-xl'>
                      <CreditCard className='text-purple-600' size={20} />
                      <div>
                        <p className='text-sm text-gray-600'>Тўлов тури</p>
                        <p className='font-semibold'>
                          {selectedOrder.payType || '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='mb-8'>
                  <h3 className='text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                    <Package className='text-indigo-600' size={20} />
                    Маҳсулотлар
                  </h3>
                  <div className='space-y-3'>
                    {selectedOrder.products.map((product, index) => (
                      <div
                        key={index}
                        className='flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200'
                      >
                        <div>
                          <p className='font-medium text-gray-800'>
                            {product.productName}
                          </p>
                          <p className='text-sm text-gray-600'>
                            {product.amount} {product.unit}
                          </p>
                        </div>
                        <p className='font-semibold text-green-600'>
                          {product.price.toLocaleString()} сўм
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200'>
                  <div className='text-center'>
                    <p className='text-sm text-gray-600'>Жами нарх</p>
                    <p className='text-2xl font-bold text-green-600'>
                      {selectedOrder.totalPrice?.toLocaleString()} сўм
                    </p>
                  </div>
                  <div className='text-center'>
                    <p className='text-sm text-gray-600'>Сана</p>
                    <p className='text-lg font-semibold text-gray-800'>
                      {new Date(
                        selectedOrder.createdAt || selectedOrder.orderDate
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isOpen && (
        <AddNewOrder onClose={() => setIsOpen(false)} isOpen={isOpen} />
      )}
    </div>
  )
}
