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
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
  Send
} from 'lucide-react'
import Fetch from '../middlewares/fetcher'
import { AddNewOrder } from '../mod/OrderModal'
import { ContextData } from '../contextData/Context'
import { LoadingState } from '../components/loading-state'

export const ViewOrders = () => {
  const { data, error, isLoading, mutate } = useSWR('/orders/clients', Fetch, {
    refreshInterval: 10000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  })

  const { user } = useContext(ContextData)

  // State lar
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState({})
  const [loading, setLoading] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedClient, setSelectedClient] = useState(null)
  const [hideButton, setHideButton] = useState(false)
  const [debt, setDebt] = useState(0)
  const [debtL, setDebtL] = useState(false)

  // Search va filter state lar
  const [searchPhone, setSearchPhone] = useState('')
  const [searchName, setSearchName] = useState('')
  const [searchDate, setSearchDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Ma'lumotlarni olish
  const clients = (data?.data?.data || []).filter(u => u.clietn === true)

  // Clientlarni filter qilish
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const phoneMatch = client.phoneNumber?.toLowerCase().includes(searchPhone.toLowerCase())
      const nameMatch = client.name?.toLowerCase().includes(searchName.toLowerCase())
      return phoneMatch && nameMatch
    })
  }, [clients, searchPhone, searchName])

  // Buyurtmalarni filter qilish
  const filteredClientOrders = useMemo(() => {
    if (!selectedClient) return []

    let orders = selectedClient.orders || []

    // Sana bo'yicha filter
    if (searchDate) {
      orders = orders.filter(order =>
        new Date(order.orderDate || order.createdAt).toLocaleDateString() ===
        new Date(searchDate).toLocaleDateString()
      )
    }

    // Status bo'yicha filter
    if (statusFilter !== 'all') {
      orders = orders.filter(order => order.status === statusFilter)
    }

    return orders
  }, [selectedClient, searchDate, statusFilter])

  // Status iconlari
  const getStatusIcon = status => {
    switch (status?.toLowerCase()) {
      case 'completed': return <CheckCircle className='text-green-500' size={16} />
      case 'pending': return <Clock className='text-yellow-500' size={16} />
      case 'cancelled': return <X className='text-red-500' size={16} />
      default: return <AlertCircle className='text-gray-500' size={16} />
    }
  }

  // Status ranglari
  const getStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Faqat raqam qabul qilish
  const handleNumberInput = (value, setter) => {
    const numericValue = value.replace(/[^\d.]/g, '')
    const parts = numericValue.split('.')
    if (parts.length > 2) return
    setter(numericValue)
  }

  // Tahrirlash funksiyasi
  const handleChange = (id, field, value) => {
    setEditing(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }))
  }

  // Saqlash funksiyasi
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

  // O'chirish funksiyasi
  const handleDelete = async id => {
    const confirmMessage = `⚠️ Сиз ростдан ҳам буюртмасини бекор қилмоқчимисиз?\n\nБу амални кейин тиклаб бўлмайди!`
    const confirmed = window.confirm(confirmMessage)
    if (!confirmed) return

    try {
      setDeleting(id)
      await axios.delete(`/orders/${id}`)
      mutate()
    } catch (err) {
      console.error('Cancel error:', err)
      alert('❌ Буюртмани бекор қилишда хатолик юз берди.')
    } finally {
      setDeleting(null)
    }
  }

  // Mahsulot narxini yangilash
  const handleProductPriceUpdate = async (product, newPrice, index) => {
    try {
      const updatedProducts = [...selectedOrder.products]
      updatedProducts[index] = {
        ...updatedProducts[index],
        price: Number(newPrice)
      }

      const updatedOrder = {
        ...selectedOrder,
        products: updatedProducts,
        totalPrice: updatedProducts.reduce((sum, p) => sum + (p.amount * p.price), 0)
      }

      await Fetch.put(`/orders/${selectedOrder._id}`, {
        products: updatedOrder.products,
        totalPrice: updatedOrder.totalPrice
      })

      setSelectedOrder(updatedOrder)
      mutate()
      alert('✅ Маҳсулот нархи муваффақиятли янгиланди')
    } catch (err) {
      console.error('Product price update error:', err)
      alert('❌ Нархни янгилашда хатолик юз берди')
    }
  }

  // Barcha mahsulot narxlarini yangilash
  const handleBulkPriceUpdate = async () => {
    setHideButton(true)
    try {
      const updatedOrder = {
        ...selectedOrder,
        totalPrice: selectedOrder.products.reduce((sum, product) =>
          sum + (product.amount * product.price), 0
        )
      }

      await Fetch.put(`/orders/${selectedOrder._id}`, {
        products: updatedOrder.products,
        totalPrice: updatedOrder.totalPrice
      })

      const updatedProducts = selectedOrder.products?.map(p => ({
        ...p,
        editing: false
      }))
      setSelectedOrder(prev => ({
        ...prev,
        products: updatedProducts
      }))

      mutate()
      alert('✅ Барча маҳсулот нархлари муваффақиятли янгиланди')
    } catch (err) {
      console.error('Bulk update error:', err)
      alert('❌ Нархларни янгилашда хатолик юз берди')
    }
  }

  // Qarz to'lash funksiyasi
  const handlePayDebt = async () => {
    if (!selectedClient) {
      alert('❌ Мижоз танланмаган')
      return
    }

    if (!debt || debt <= 0) {
      alert('❌ Тўлов суммасини киритинг')
      return
    }

    try {
      setDebtL(true)
      console.log('Sending request to server...', {
        clientId: selectedClient._id,
        uz: Number(debt)
      })

      const response = await Fetch.post("/products/pay", {
        clientId: selectedClient._id,
        uz: Number(debt)
      })

      console.log('Server response:', response)

      setDebt(0)
      mutate() // Ma'lumotlarni yangilash
      alert("✅ Қарз муваффақиятли тўланди")
    } catch (error) {
      console.error('Pay debt error:', error)
      console.error('Error details:', error.response?.data || error.message)
      alert("❌ Тўловда хатолик юз берди: " + (error.response?.data?.message || error.message))
    } finally {
      setDebtL(false)
    }
  }

  // Client statistikasi
  const calculateClientStats = (client) => {
    const orders = client.orders || []
    const totalOrders = orders.length
    const totalAmount = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0)
    const unpaidOrders = orders.filter(order => !order.paid).length

    return { totalOrders, totalAmount, unpaidOrders }
  }

  // Loading holati
  if (isLoading) {
    return (
      <div className='min-h-screen flex justify-center items-center'>
        <LoadingState />
      </div>
    )
  }

  // Xato holati
  if (error) {
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
            Мижозлар маълумотларини юклашда хатолик юз берди. Илтимос, қайта уриниб кўринг.
          </p>
        </motion.div>
      </div>
    )
  }

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
                  <ShoppingCart className='text-white' size={28} />
                </div>
              )}
              <div>
                <h1 className='text-2xl md:text-3xl font-bold text-gray-800'>
                  {selectedClient ? `${selectedClient.name} буюртмалари` : 'Буюртмалар'}
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

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='bg-white rounded-2xl shadow-lg p-6 border border-gray-200'
        >
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' size={20} />
              <input
                type='text'
                placeholder='Телефон рақам...'
                value={searchPhone}
                onChange={e => setSearchPhone(e.target.value)}
                className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 bg-gray-50'
              />
            </div>

            <div className='relative'>
              <User className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' size={20} />
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
                  <Calendar className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' size={20} />
                  <input
                    type='date'
                    value={searchDate}
                    onChange={e => setSearchDate(e.target.value)}
                    className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 bg-gray-50'
                  />
                </div>

                <div className='relative'>
                  <Filter className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' size={20} />
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
        <div className='bg-white rounded-2xl shadow-lg p-6 border border-gray-200'>
          <h3 className='text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2'>
            <Plus size={20} className='text-purple-500' />
            Қарзни ёпиш
          </h3>
          <br />
          <div className='space-y-3 relative'>
            <input
              type='text'
              placeholder="Ёпилаётган қиймат"
              value={debt}
              onChange={e => {
                const value = e.target.value;
                if (/^\d*$/.test(value)) {
                  setDebt(value);
                }
              }}
              className='w-full pl-2 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 bg-gray-50'
            />
            {debt > 0 && (
              <button
                onClick={handlePayDebt}
                disabled={debtL}
                className='absolute right-4 top-2.5 z-10 cursor-pointer hover:bg-blue-500 hover:text-white rounded p-1 transition-colors duration-200'
              >
                {debtL ? <Loader2 className='animate-spin' size={20} /> : <Send size={20} />}
              </button>
            )}
          </div>
        </div>
        {/* Clients List */}
        {!selectedClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {filteredClients.length === 0 ? (
              <div className='bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-200'>
                <User className='mx-auto text-gray-400 mb-4' size={64} />
                <h3 className='text-xl font-semibold text-gray-600 mb-2'>
                  Мижозлар топилмади
                </h3>
                <p className='text-gray-500 mb-6'>
                  Қидирув шартларингизга мос келувчи мижозлар мавжуд эмас
                </p>
                <button
                  onClick={() => { setSearchPhone(''); setSearchName('') }}
                  className='text-blue-500 hover:text-blue-700 font-semibold'
                >
                  Филтрни тозалаш
                </button>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
                {filteredClients.map((client, index) => {
                  const stats = calculateClientStats(client)
                  return (
                    <motion.div
                      key={client._id}
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
                            <h3 className='font-bold text-lg text-gray-800'>{client.name || 'Номаълум'}</h3>
                            <p className='text-gray-600 text-sm'>{client.phoneNumber}</p>
                          </div>
                        </div>
                        <div className='text-right'>
                          <div className='flex items-center gap-1 text-green-600 font-semibold text-lg'>
                            <Package size={18} />
                            <span>{stats.totalOrders}</span>
                          </div>
                          <div className='text-xs text-gray-500'>буюртма</div>
                        </div>
                      </div>

                      <div className='flex items-center gap-2 text-sm text-gray-600 mb-3'>
                        <MapPin size={16} />
                        <span className='truncate'>{client.address || 'Манзил кўрсатилмаган'}</span>
                      </div>

                      <div className='space-y-2 mb-4'>
                        <div className='flex justify-between items-center'>
                          <span className='text-sm text-gray-600'>Жами сумма:</span>
                          <span className='font-bold text-green-600'>{stats.totalAmount.toLocaleString()} сўм</span>
                        </div>
                        {stats.unpaidOrders > 0 && (
                          <div className='flex justify-between items-center'>
                            <span className='text-sm text-gray-600'>Тўланмаган:</span>
                            <span className='font-bold text-red-600'>{stats.unpaidOrders} та</span>
                          </div>
                        )}
                      </div>

                      <div className='flex justify-between items-center pt-4 border-t border-gray-100'>
                        <span className='text-sm text-gray-500'>Қарз:</span>
                        <span className='font-bold text-red-600 text-lg'>
                          -{(client.debtUZ || 0).toLocaleString()} сўм
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Client Orders */}
        {selectedClient && (() => {
          const clientStats = calculateClientStats(selectedClient)

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {/* Client Overview Section */}
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
                {/* Client Info Card */}
                <div className='bg-white rounded-2xl shadow-lg p-6 border border-gray-200'>
                  <div className='flex items-center gap-3 mb-4'>
                    <div className='bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-xl'>
                      <User className='text-white' size={24} />
                    </div>
                    <div>
                      <h2 className='text-xl font-bold text-gray-800'>{selectedClient.name}</h2>
                      <p className='text-gray-600'>{selectedClient.phoneNumber}</p>
                    </div>
                  </div>

                  <div className='space-y-3'>
                    <div className='flex items-center gap-2 text-sm text-gray-600'>
                      <MapPin size={16} />
                      <span>{selectedClient.address || 'Манзил кўрсатилмаган'}</span>
                    </div>
                    <div className='flex items-center gap-2 text-sm text-red-600'>
                      <BadgeDollarSign size={16} />
                      <span>Қарз: {(selectedClient.debtUZ || 0).toLocaleString()} сўм</span>
                    </div>
                  </div>
                </div>

                {/* Statistics Card */}
                <div className='bg-white rounded-2xl shadow-lg p-6 border border-gray-200'>
                  <h3 className='text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                    <ScrollText size={20} className='text-blue-500' />
                    Статистика
                  </h3>
                  <div className='space-y-3'>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-600'>Жами буюртма:</span>
                      <span className='font-bold text-blue-600'>{clientStats.totalOrders} та</span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-600'>Жами сумма:</span>
                      <span className='font-bold text-green-600'>{clientStats.totalAmount.toLocaleString()} сўм</span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-600'>Тўланмаган:</span>
                      <span className='font-bold text-red-600'>{clientStats.unpaidOrders} та</span>
                    </div>
                  </div>
                </div>


              </div>

              {/* Orders Table */}
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
                          <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>Маҳсулотлар</th>
                          <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>Ҳолат</th>
                          <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>Умумий нарх</th>
                          <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>Тўлов</th>
                          <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>Сана</th>
                          <th className='px-6 py-4 text-center text-sm font-semibold text-gray-700'>Амалиёт</th>
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
                              className={`${order.totalPrice == 0 ? "bg-red-300 text-white" : ""} transition-colors duration-200`}
                            >
                              <td className='px-6 py-4'>
                                <div className='space-y-1'>
                                  {(order.products || []).slice(0, 3).map((item, i) => (
                                    <div key={i} className='text-sm text-gray-700'>
                                      <span className='font-medium'>{item.product?.title || 'Мавжуд эмас'}</span>
                                      <span className='text-gray-500 ml-2'>
                                        {item.amount} {item.unit} × {item.price?.toLocaleString() || 0} сўм
                                      </span>
                                    </div>
                                  ))}
                                  {(order.products || []).length > 3 && (
                                    <div className='text-xs text-blue-500 font-medium'>
                                      + {(order.products || []).length - 3} та бошқа маҳсулот
                                    </div>
                                  )}
                                </div>
                              </td>

                              <td className='px-6 py-4'>
                                {editing[order._id] ? (
                                  <select
                                    value={editing[order._id]?.status || order.status}
                                    onChange={(e) => handleChange(order._id, 'status', e.target.value)}
                                    className='border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none'
                                  >
                                    <option value='pending'>Кутилмоқда</option>
                                    <option value='completed'>Бажарилган</option>
                                    <option value='cancelled'>Бекор қилинган</option>
                                  </select>
                                ) : (
                                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                    {getStatusIcon(order.status)}
                                    {order.status || '—'}
                                  </div>
                                )}
                              </td>

                              <td className='px-6 py-4'>
                                {user.role === '!admin' ? (
                                  <div className='flex items-center gap-2'>
                                    <input
                                      type='text'
                                      value={editing[order._id]?.totalPrice ?? order.totalPrice ?? ''}
                                      onChange={e => handleNumberInput(e.target.value, (value) => handleChange(order._id, 'totalPrice', value))}
                                      className='w-32 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none'
                                      placeholder='0'
                                    />
                                    <span className='text-gray-500'>сўм</span>
                                    {isEdited && (
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleSave(order._id)}
                                        disabled={loading === order._id}
                                        className='flex items-center gap-2 bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors duration-200'
                                      >
                                        {loading === order._id ? <Loader2 className='animate-spin' size={16} /> : <Save size={16} />}
                                      </motion.button>
                                    )}
                                  </div>
                                ) : (
                                  <div className='font-bold text-green-600 text-lg'>{(order.totalPrice || 0).toLocaleString()} сўм</div>
                                )}
                              </td>

                              <td className='px-6 py-4'>
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${order.paid ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
                                  }`}>
                                  {order.paid ? 'Тўланган' : 'Тўланмаган'}
                                </div>
                              </td>

                              <td className='px-6 py-4 text-sm text-gray-600'>
                                {new Date(order.createdAt || order.orderDate).toLocaleDateString()}
                              </td>

                              <td className='px-6 py-4'>
                                <div className='flex items-center justify-center gap-2'>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSelectedOrder(order)}
                                    className='flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200'
                                  >
                                    <Eye size={16} />
                                  </motion.button>

                                  {user.role === 'admin' && !order.paid && (
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => handleDelete(order._id)}
                                      disabled={deleting === order._id}
                                      className='flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors duration-200'
                                    >
                                      {deleting === order._id ? <Loader2 className='animate-spin' size={16} /> : <Trash2 size={16} />}
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
          )
        })()}
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
                  <h2 className='text-2xl font-bold text-gray-800'>Буюртма маълумотлари</h2>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
                  <div className='space-y-4'>
                    <div className='flex items-center gap-3 p-3 bg-blue-50 rounded-xl'>
                      <User className='text-blue-600' size={20} />
                      <div>
                        <p className='text-sm text-gray-600'>Мижоз</p>
                        <p className='font-semibold'>{selectedClient?.name || '—'}</p>
                      </div>
                    </div>
                    <div className='flex items-center gap-3 p-3 bg-green-50 rounded-xl'>
                      <Phone className='text-green-600' size={20} />
                      <div>
                        <p className='text-sm text-gray-600'>Телефон</p>
                        <p className='font-semibold'>{selectedClient?.phoneNumber || '—'}</p>
                      </div>
                    </div>
                  </div>
                  <div className='space-y-4'>
                    <div className='flex items-center gap-3 p-3 bg-red-50 rounded-xl'>
                      <MapPin className='text-red-600' size={20} />
                      <div>
                        <p className='text-sm text-gray-600'>Манзил</p>
                        <p className='font-semibold'>{selectedOrder.client?.address || '—'}</p>
                      </div>
                    </div>
                    <div className='flex items-center gap-3 p-3 bg-purple-50 rounded-xl'>
                      <CreditCard className='text-purple-600' size={20} />
                      <div>
                        <p className='text-sm text-gray-600'>Тўлов ҳолати</p>
                        <p className='font-semibold'>{selectedOrder.paid ? 'Тўланган' : 'Тўланмаган'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='mb-8'>
                  <div className='flex justify-between items-center mb-4'>
                    <h3 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
                      <Package className='text-indigo-600' size={20} />
                      Маҳсулотлар ({selectedOrder.products?.length || 0})
                    </h3>
                    {user.role === 'admin' && !selectedOrder.paid && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const updatedProducts = selectedOrder.products?.map(product => ({
                            ...product,
                            editing: true
                          }))
                          setSelectedOrder(prev => ({ ...prev, products: updatedProducts }))
                        }}
                        className='flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200'
                      >
                        <Edit size={16} />
                        Нархларни таҳрирлаш
                      </motion.button>
                    )}
                  </div>

                  <div className='space-y-3'>
                    {selectedOrder.products?.map((product, index) => (
                      <div key={index} className='flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200'>
                        <div className='flex-1'>
                          <p className='font-medium text-gray-800'>{product.product?.title || ""}</p>
                          <p className='text-sm text-gray-600'>{product.amount} {product.unit}</p>
                        </div>

                        {user.role === 'admin' && product.editing ? (
                          <div className='flex items-center gap-2'>
                            <input
                              type='text'
                              value={product.price || 0}
                              onChange={(e) => {
                                const numericValue = e.target.value.replace(/[^\d.]/g, '')
                                const parts = numericValue.split('.')
                                if (parts.length > 2) return

                                const updatedProducts = [...selectedOrder.products]
                                updatedProducts[index] = {
                                  ...updatedProducts[index],
                                  price: numericValue === '' ? 0 : Number(numericValue)
                                }
                                setSelectedOrder(prev => ({ ...prev, products: updatedProducts }))
                              }}
                              className='w-24 border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-right'
                              placeholder='0'
                            />
                            <span className='text-gray-500 text-sm'>сўм</span>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleProductPriceUpdate(product, product.price, index)}
                              className='flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-colors duration-200 text-sm'
                            >
                              <Save size={14} />
                              Сақлаш
                            </motion.button>
                          </div>
                        ) : (
                          <p className='font-semibold text-green-600'>{(product.price * product.amount).toLocaleString()} сўм</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200'>
                  <div className='text-center'>
                    <p className='text-sm text-gray-600'>Жами нарх</p>
                    <p className='text-2xl font-bold text-green-600'>{selectedOrder.totalPrice?.toLocaleString()} сўм</p>
                  </div>
                  <div className='text-center'>
                    <p className='text-sm text-gray-600'>Сана</p>
                    <p className='text-lg font-semibold text-gray-800'>
                      {new Date(selectedOrder.createdAt || selectedOrder.orderDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {user.role === 'admin' && selectedOrder.products?.some(p => p.editing) && (
                  <div className='mt-4 flex justify-end gap-2'>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const updatedProducts = selectedOrder.products?.map(product => ({
                          ...product,
                          editing: false
                        }))
                        setSelectedOrder(prev => ({ ...prev, products: updatedProducts }))
                      }}
                      className='flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200'
                    >
                      Бекор қилиш
                    </motion.button>

                    {!hideButton && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleBulkPriceUpdate}
                        className='flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200'
                      >
                        <Save size={16} />
                        Барчасини сақлаш
                      </motion.button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isOpen && <AddNewOrder onClose={() => setIsOpen(false)} isOpen={isOpen} />}
    </div>
  )
}