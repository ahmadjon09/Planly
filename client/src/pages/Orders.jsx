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
  Send,
  ChevronRight,
  ChevronLeft as ChevronLeftIcon,
  DollarSign
} from 'lucide-react'
import Fetch from '../middlewares/fetcher'
import { AddNewOrder } from '../mod/OrderModal'
import { ContextData } from '../contextData/Context'
import { LoadingState } from '../components/loading-state'

export const ViewOrders = () => {
  const { data, error, isLoading, mutate } = useSWR('/orders/clients', Fetch, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  })

  const { user, kurs } = useContext(ContextData)

  // State lar
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState({})
  const [loading, setLoading] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedClient, setSelectedClient] = useState(null)
  const [hideButton, setHideButton] = useState(false)
  const [debt, setDebt] = useState(0)
  const [debtType, setDebtType] = useState('uz') // 'uz' yoki 'en'
  const [debtL, setDebtL] = useState(false)

  // Search va filter state lar
  const [searchPhone, setSearchPhone] = useState('')
  const [searchName, setSearchName] = useState('')
  const [searchDate, setSearchDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // History state lari
  const [currentHistoryPage, setCurrentHistoryPage] = useState(1)
  const historyPerPage = 10

  // Ma'lumotlarni olish
  const clients = (data?.data?.data || []).filter(u => u.clietn === true)

  // Yangilangan client ma'lumotlarini olish
  const updatedSelectedClient = useMemo(() => {
    if (!selectedClient) return null
    return clients.find(client => client._id === selectedClient._id) || selectedClient
  }, [clients, selectedClient])

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
    if (!updatedSelectedClient) return []

    let orders = updatedSelectedClient.orders || []

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

    // Yangi orderlar tepada bo'lishi uchun sort
    orders = orders.sort((a, b) =>
      new Date(b.createdAt || b.orderDate) - new Date(a.createdAt || a.orderDate)
    )

    return orders
  }, [updatedSelectedClient, searchDate, statusFilter])

  // History ni sahifalash
  const clientHistory = useMemo(() => {
    if (!updatedSelectedClient) return []
    return updatedSelectedClient.history || []
  }, [updatedSelectedClient])

  const paginatedHistory = useMemo(() => {
    const startIndex = (currentHistoryPage - 1) * historyPerPage
    const endIndex = startIndex + historyPerPage
    return clientHistory.slice(startIndex, endIndex)
  }, [clientHistory, currentHistoryPage])

  const totalHistoryPages = Math.ceil(clientHistory.length / historyPerPage)

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

  // Tahrirlash funksiyasi
  const handleChange = (id, field, value) => {
    setEditing(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }))
  }

  // O'chirish funksiyasi
  const handleDelete = async id => {
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

  // Barcha mahsulot narxlarini yangilash - YANGILANGAN
  const handleBulkPriceUpdate = async () => {
    setHideButton(true)
    try {
      // Calculate totals separately for UZS and USD
      const totalUZ = selectedOrder.products.reduce((sum, product) => {
        if (product.priceType === 'uz') {
          return sum + ((product.price || 0) * (product.amount || 0))
        }
        return sum
      }, 0)

      const totalEN = selectedOrder.products.reduce((sum, product) => {
        if (product.priceType === 'en') {
          return sum + ((product.price || 0) * (product.amount || 0))
        }
        return sum
      }, 0)

      const updatedOrder = {
        ...selectedOrder,
        totalUZ,
        totalEN
      }

      await Fetch.put(`/orders/${selectedOrder._id}`, {
        kurs: kurs,
        products: updatedOrder.products,
        totalUZ: updatedOrder.totalUZ,
        totalEN: updatedOrder.totalEN
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
    if (!updatedSelectedClient) {
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
        clientId: updatedSelectedClient._id,
        [debtType]: Number(debt)
      })

      const response = await Fetch.post("/products/pay", {
        clientId: updatedSelectedClient._id,
        [debtType]: Number(debt)
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
    const totalAmountUZ = orders.reduce((sum, order) => sum + (order.totalUZ || 0), 0)
    const totalAmountEN = orders.reduce((sum, order) => sum + (order.totalEN || 0), 0)
    const unpaidOrders = orders.filter(order => !order.paid).length

    return { totalOrders, totalAmountUZ, totalAmountEN, unpaidOrders }
  }

  // Umumiy qarzni hisoblash
  const calculateTotalDebt = (client) => {
    const debtUZ = client.debtUZ || 0
    const debtEN = client.debtEN || 0
    return { debtUZ, debtEN }
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
              {updatedSelectedClient ? (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => {
                    setSelectedClient(null)
                    setCurrentHistoryPage(1)
                  }}
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
                  {updatedSelectedClient ? `${updatedSelectedClient.name} буюртмалари` : 'Буюртмалар'}
                </h1>
                <p className='text-gray-600 mt-1'>
                  {updatedSelectedClient
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

            {updatedSelectedClient && (
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

        {/* Qarz to'lash section */}
        {updatedSelectedClient && (
          <div className='bg-white rounded-2xl shadow-lg p-6 border border-gray-200'>
            <h3 className='text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2'>
              <BadgeDollarSign size={20} className='text-purple-500' />
              Қарзни ёпиш
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='md:col-span-2 space-y-3 relative'>
                <input
                  type='text'
                  placeholder="Ёпилаётган қиймат"
                  value={debt}
                  onChange={e => {
                    const value = e.target.value;
                    if (/^\d*\.?\d*$/.test(value)) {
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

              <div className='flex gap-2'>
                <button
                  onClick={() => setDebtType('uz')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all duration-300 ${debtType === 'uz'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    }`}
                >
                  <span>UZS</span>
                </button>
                <button
                  onClick={() => setDebtType('en')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all duration-300 ${debtType === 'en'
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    }`}
                >
                  <DollarSign size={16} />
                  <span>USD</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Clients List */}
        {!updatedSelectedClient && (
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
                  const debtInfo = calculateTotalDebt(client)

                  return (
                    <motion.div
                      key={client._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => {
                        setSelectedClient(client)
                        setCurrentHistoryPage(1)
                      }}
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
                          <span className='text-sm text-gray-600'>Жами сумма (UZS):</span>
                          <span className='font-bold text-green-600'>{stats.totalAmountUZ.toLocaleString()} сўм</span>
                        </div>
                        {stats.totalAmountEN > 0 && (
                          <div className='flex justify-between items-center'>
                            <span className='text-sm text-gray-600'>Жами сумма (USD):</span>
                            <span className='font-bold text-blue-600'>{stats.totalAmountEN.toLocaleString()} $</span>
                          </div>
                        )}
                        {stats.unpaidOrders > 0 && (
                          <div className='flex justify-between items-center'>
                            <span className='text-sm text-gray-600'>Тўланмаган:</span>
                            <span className='font-bold text-red-600'>{stats.unpaidOrders} та</span>
                          </div>
                        )}
                      </div>

                      <div className='space-y-2 pt-4 border-t border-gray-100'>
                        <div className='flex justify-between items-center'>
                          <span className='text-sm text-gray-500'>Қарз (UZS):</span>
                          <span className={`font-bold text-red-500 ${debtInfo.debtUZ > 0 ? 'text-lg' : ''}`}>
                            {(client.debtUZ || 0).toLocaleString()} сўм
                          </span>
                        </div>
                        {debtInfo.debtEN > 0 && (
                          <div className='flex justify-between items-center'>
                            <span className='text-sm text-gray-500'>Қарз (USD):</span>
                            <span className='font-bold text-red-500 text-lg'>
                              {(client.debtEN || 0).toLocaleString()} $
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Client Orders va History */}
        {updatedSelectedClient && (() => {
          const clientStats = calculateClientStats(updatedSelectedClient)
          const debtInfo = calculateTotalDebt(updatedSelectedClient)

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {/* Client Overview Section */}
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6'>
                {/* Client Info Card */}
                <div className='bg-white rounded-2xl shadow-lg p-6 border border-gray-200'>
                  <div className='flex items-center gap-3 mb-4'>
                    <div className='bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-xl'>
                      <User className='text-white' size={24} />
                    </div>
                    <div>
                      <h2 className='text-xl font-bold text-gray-800'>{updatedSelectedClient.name}</h2>
                      <p className='text-gray-600'>{updatedSelectedClient.phoneNumber}</p>
                    </div>
                  </div>

                  <div className='space-y-3'>
                    <div className='flex items-center gap-2 text-sm text-gray-600'>
                      <MapPin size={16} />
                      <span>{updatedSelectedClient.address || 'Манзил кўрсатилмаган'}</span>
                    </div>
                    <div className='space-y-2'>
                      <div className='flex items-center gap-2 text-sm text-red-600'>
                        <BadgeDollarSign size={16} />
                        <span>Қарз (UZS): {(updatedSelectedClient.debtUZ || 0).toLocaleString()} сўм</span>
                      </div>
                      {debtInfo.debtEN > 0 && (
                        <div className='flex items-center gap-2 text-sm text-red-600'>
                          <DollarSign size={16} />
                          <span>Қарз (USD): {(updatedSelectedClient.debtEN || 0).toLocaleString()} $</span>
                        </div>
                      )}
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
                      <span className='text-gray-600'>Жами сумма (UZS):</span>
                      <span className='font-bold text-green-600'>{clientStats.totalAmountUZ.toLocaleString()} сўм</span>
                    </div>
                    {clientStats.totalAmountEN > 0 && (
                      <div className='flex justify-between items-center'>
                        <span className='text-gray-600'>Жами сумма (USD):</span>
                        <span className='font-bold text-blue-600'>{clientStats.totalAmountEN.toLocaleString()} $</span>
                      </div>
                    )}
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-600'>Тўланмаган:</span>
                      <span className='font-bold text-red-600'>{clientStats.unpaidOrders} та</span>
                    </div>
                  </div>
                </div>

                {/* History Stats Card */}
                <div className='bg-white rounded-2xl shadow-lg p-6 border border-gray-200'>
                  <h3 className='text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                    <Clock size={20} className='text-purple-500' />
                    Тўлов тарихи
                  </h3>
                  <div className='space-y-3'>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-600'>Жами тўловлар:</span>
                      <span className='font-bold text-purple-600'>{clientHistory.length} та</span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-600'>Жорий саҳифа:</span>
                      <span className='font-bold text-gray-800'>{currentHistoryPage} / {totalHistoryPages}</span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-600'>Кўрсатилмоқда:</span>
                      <span className='font-bold text-green-600'>{paginatedHistory.length} та</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* History Section */}
              {clientHistory.length > 0 && (
                <div className='bg-white rounded-2xl shadow-lg p-6 border border-gray-200 mb-6'>
                  <h3 className='text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                    <Clock className='text-purple-500' size={20} />
                    Тўловлар тарихи ({clientHistory.length} та)
                  </h3>

                  <div className='space-y-3 mb-4'>
                    {paginatedHistory.map((historyItem, index) => (
                      <motion.div
                        key={historyItem._id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className='flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200'
                      >
                        <div className='flex items-center gap-3'>
                          <div className={`p-2 rounded-lg ${historyItem.type === 'uz' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                            {historyItem.type === 'uz' ? <BadgeDollarSign size={16} /> : <DollarSign size={16} />}
                          </div>
                          <div>
                            <p className='font-medium text-gray-800'>
                              {historyItem.type === 'uz' ? 'Сўм' : 'Доллар'} тўлови
                            </p>
                            <p className='text-sm text-gray-600'>
                              {new Date(historyItem.createdAt).toLocaleDateString()} - {new Date(historyItem.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <div className='text-right'>
                          <p className='font-bold text-lg text-green-600'>
                            {historyItem.price?.toLocaleString()} {historyItem.type === 'uz' ? 'сўм' : '$'}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalHistoryPages > 1 && (
                    <div className='flex justify-center items-center gap-4'>
                      <button
                        onClick={() => setCurrentHistoryPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentHistoryPage === 1}
                        className='flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
                      >
                        <ChevronLeftIcon size={16} />
                        Олдинги
                      </button>

                      <span className='text-sm text-gray-600'>
                        Саҳифа {currentHistoryPage} / {totalHistoryPages}
                      </span>

                      <button
                        onClick={() => setCurrentHistoryPage(prev => Math.min(prev + 1, totalHistoryPages))}
                        disabled={currentHistoryPage === totalHistoryPages}
                        className='flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
                      >
                        Кейинги
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Orders Table - YANGILANGAN */}
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
                          const totalUZ = order.totalUZ || 0
                          const totalEN = order.totalEN || 0

                          return (
                            <motion.tr
                              key={order._id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={`${totalUZ === 0 && totalEN === 0 ? "bg-red-300 text-white" : ""} transition-colors duration-200`}
                            >
                              <td className='px-6 py-4'>
                                <div className='space-y-1'>
                                  {(order.products || []).slice(0, 3).map((item, i) => (
                                    <div key={i} className='text-sm text-gray-700'>
                                      <span className='font-medium'>{item.product?.title || 'Мавжуд эмас'}</span>
                                      <span className='text-gray-500 ml-2'>
                                        {item.amount} {item.unit} × {item.price?.toLocaleString() || 0} {item.priceType === 'en' ? '$' : 'сўм'}
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
                                <div className='space-y-1'>
                                  {totalUZ > 0 && (
                                    <div className='font-bold text-green-600 text-sm'>
                                      {totalUZ.toLocaleString()} сўм
                                    </div>
                                  )}
                                  {totalEN > 0 && (
                                    <div className='font-bold text-blue-600 text-sm'>
                                      {totalEN.toLocaleString()} $
                                    </div>
                                  )}
                                  {totalUZ === 0 && totalEN === 0 && (
                                    <div className='text-red-500 text-sm font-medium'>
                                      Нарх белгиланмаган
                                    </div>
                                  )}
                                </div>
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
                        <p className='font-semibold'>{updatedSelectedClient?.name || '—'}</p>
                      </div>
                    </div>
                    <div className='flex items-center gap-3 p-3 bg-green-50 rounded-xl'>
                      <Phone className='text-green-600' size={20} />
                      <div>
                        <p className='text-sm text-gray-600'>Телефон</p>
                        <p className='font-semibold'>{updatedSelectedClient?.phoneNumber || '—'}</p>
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
                    {user.role === 'admin' && selectedOrder.paid == false && (
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
                              type='number'
                              value={product.price || null}
                              onChange={(e) => {
                                const numericValue = e.target.value
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

                            <select
                              value={product.priceType || 'uz'}
                              onChange={(e) => {
                                const updatedProducts = [...selectedOrder.products]
                                updatedProducts[index] = {
                                  ...updatedProducts[index],
                                  priceType: e.target.value
                                }
                                setSelectedOrder(prev => ({ ...prev, products: updatedProducts }))
                              }}
                              className='border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none'
                            >
                              <option value='uz'>сўм</option>
                              <option value='en'>$</option>
                            </select>
                          </div>
                        ) : (
                          <div className='text-right'>
                            <p className='font-semibold text-green-600'>
                              {(product.price * product.amount).toLocaleString()} {product.priceType === 'en' ? '$' : 'сўм'}
                            </p>
                            <p className='text-xs text-gray-500'>
                              {product.price?.toLocaleString()} {product.priceType === 'en' ? '$' : 'сўм'} дан
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Price Section - YANGILANGAN */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200'>
                  <div className='text-center'>
                    <p className='text-sm text-gray-600'>Сўмда</p>
                    <p className='text-lg font-semibold text-blue-600'>{(selectedOrder.totalUZ || 0).toLocaleString()} сўм</p>
                  </div>
                  <div className='text-center'>
                    <p className='text-sm text-gray-600'>Долларда</p>
                    <p className='text-lg font-semibold text-purple-600'>{(selectedOrder.totalEN || 0).toLocaleString()} $</p>
                  </div>
                </div>

                <div className='text-center mt-4'>
                  <p className='text-sm text-gray-600'>Сана</p>
                  <p className='text-lg font-semibold text-gray-800'>
                    {new Date(selectedOrder.createdAt || selectedOrder.orderDate).toLocaleDateString()}
                  </p>
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
    </div >
  )
}