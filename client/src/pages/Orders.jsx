import { useState, useContext, useMemo, useEffect, useCallback } from 'react'
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
  DollarSign,
  ArrowUpDown,
  RefreshCw,
  CreditCard,
  Wallet,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import Fetch from '../middlewares/fetcher'
import { AddNewOrder } from '../mod/OrderModal'
import { ContextData } from '../contextData/Context'
import { LoadingState } from '../components/loading-state'

export const ViewOrders = () => {
  const { user, kurs, dark } = useContext(ContextData)

  // State lar
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState({})
  const [deleting, setDeleting] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedClient, setSelectedClient] = useState(null)
  const [hideButton, setHideButton] = useState(false)
  const [debt, setDebt] = useState(0)
  const [debtType, setDebtType] = useState('uz')
  const [debtL, setDebtL] = useState(false)

  // Search va filter state lar
  const [searchPhone, setSearchPhone] = useState('')
  const [searchName, setSearchName] = useState('')
  const [searchDate, setSearchDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [orderSearch, setOrderSearch] = useState('')
  const [sortBy, setSortBy] = useState('date_desc')

  // Real-time update uchun timer
  const [lastUpdate, setLastUpdate] = useState(Date.now())

  // Pagination state lari
  const [clientPage, setClientPage] = useState(1)
  const [orderPage, setOrderPage] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)
  const [clientLimit] = useState(20)
  const [orderLimit] = useState(10)
  const [historyLimit] = useState(10)

  // Clientni real-time yangilash uchun timer
  useEffect(() => {
    if (selectedClient) {
      const interval = setInterval(() => {
        setLastUpdate(Date.now())
      }, 10000) // Har 10 soniyada yangilash

      return () => clearInterval(interval)
    }
  }, [selectedClient])

  // Build API endpoints with pagination va real-time updates
  const buildClientsEndpoint = useCallback(() => {
    const params = new URLSearchParams()
    params.append('page', clientPage)
    params.append('limit', clientLimit)
    if (searchPhone) params.append('search', searchPhone)
    if (searchName) params.append('search', searchName)
    params.append('searchField', 'name')
    return `/orders/clients?${params.toString()}&_t=${lastUpdate}`
  }, [clientPage, searchPhone, searchName, lastUpdate])

  const buildClientOrdersEndpoint = useCallback(() => {
    if (!selectedClient) return null
    const params = new URLSearchParams()
    params.append('clientId', selectedClient._id)
    params.append('page', orderPage)
    params.append('limit', orderLimit)
    if (statusFilter !== 'all') params.append('status', statusFilter)
    if (searchDate) params.append('date', searchDate)
    if (orderSearch) params.append('search', orderSearch)
    return `/orders/client-orders?${params.toString()}&_t=${lastUpdate}`
  }, [selectedClient, orderPage, statusFilter, searchDate, orderSearch, lastUpdate])

  const buildPaymentHistoryEndpoint = useCallback(() => {
    if (!selectedClient) return null
    const params = new URLSearchParams()
    params.append('clientId', selectedClient._id)
    params.append('page', historyPage)
    params.append('limit', historyLimit)
    return `/orders/client-payments?${params.toString()}&_t=${lastUpdate}`
  }, [selectedClient, historyPage, lastUpdate])

  // SWR hooks
  const {
    data: clientsData,
    error: clientsError,
    isLoading: clientsLoading,
    mutate: mutateClients
  } = useSWR(buildClientsEndpoint(), Fetch, {
    revalidateOnFocus: false,
    keepPreviousData: true,
    refreshInterval: selectedClient ? 0 : 10000, // Faqat mijoz tanlanmagan bo'lsa 10 soniyada yangilash
    dedupingInterval: 5000
  })

  const {
    data: ordersData,
    error: ordersError,
    isLoading: ordersLoading,
    mutate: mutateOrders
  } = useSWR(buildClientOrdersEndpoint(), Fetch, {
    revalidateOnFocus: false,
    keepPreviousData: true,
    enabled: !!selectedClient,
    refreshInterval: 5000, // Mijoz tanlangan bo'lsa har 5 soniyada yangilash
    dedupingInterval: 3000
  })

  const {
    data: historyData,
    error: historyError,
    isLoading: historyLoading,
    mutate: mutateHistory
  } = useSWR(buildPaymentHistoryEndpoint(), Fetch, {
    revalidateOnFocus: false,
    keepPreviousData: true,
    enabled: !!selectedClient,
    refreshInterval: 10000,
    dedupingInterval: 5000
  })

  // Extract data
  const clients = clientsData?.data?.data || []
  const clientPagination = clientsData?.data?.pagination || {
    page: 1,
    limit: clientLimit,
    total: 0,
    totalPages: 0
  }

  const ordersDataResult = ordersData?.data
  const orders = ordersDataResult?.orders || []
  const selectedClientData = ordersDataResult?.client
  const orderPagination = ordersDataResult?.pagination || {
    page: 1,
    limit: orderLimit,
    total: 0,
    totalPages: 0
  }

  const clientHistory = historyData?.data?.data || []
  const historyPagination = historyData?.data?.pagination || {
    page: 1,
    limit: historyLimit,
    total: 0,
    totalPages: 0
  }

  // Mijoz ma'lumotlarini real-time yangilash
  useEffect(() => {
    if (selectedClient && selectedClientData) {
      // Faqat yangi ma'lumotlar bo'lsa yangilash
      if (JSON.stringify(selectedClient) !== JSON.stringify({
        ...selectedClient,
        ...selectedClientData,
        orders: orders
      })) {
        setSelectedClient(prev => ({
          ...prev,
          ...selectedClientData,
          orders: orders
        }))
      }
    }
  }, [selectedClientData, orders])

  // Filtered clients (client-side search)
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const phoneMatch = !searchPhone || client.phoneNumber?.toLowerCase().includes(searchPhone.toLowerCase())
      const nameMatch = !searchName || client.name?.toLowerCase().includes(searchName.toLowerCase())
      return phoneMatch && nameMatch
    })
  }, [clients, searchPhone, searchName])


  // Status iconlari va ranglari
  const getStatusConfig = status => {
    const statusLower = status?.toLowerCase()

    switch (statusLower) {
      case 'completed':
      case 'бажарилган':
        return {
          icon: <CheckCircle className='text-green-500' size={16} />,
          color: dark ? 'bg-green-900 text-green-200 border-green-700' : 'bg-green-100 text-green-800 border-green-200',
          text: 'Бажарилган'
        }
      case 'pending':
      case 'кутилмоқда':
      case 'янги':
        return {
          icon: <Clock className='text-yellow-500' size={16} />,
          color: dark ? 'bg-yellow-900 text-yellow-200 border-yellow-700' : 'bg-yellow-100 text-yellow-800 border-yellow-200',
          text: 'Кутилмоқда'
        }
      case 'cancelled':
      case 'бекор қилинган':
        return {
          icon: <X className='text-red-500' size={16} />,
          color: dark ? 'bg-red-900 text-red-200 border-red-700' : 'bg-red-100 text-red-800 border-red-200',
          text: 'Бекор қилинган'
        }
      case 'юборилди':
        return {
          icon: <Send className='text-blue-500' size={16} />,
          color: dark ? 'bg-blue-900 text-blue-200 border-blue-700' : 'bg-blue-100 text-blue-800 border-blue-200',
          text: 'Юборилди'
        }
      case 'тасдиқланди':
        return {
          icon: <CheckCircle className='text-purple-500' size={16} />,
          color: dark ? 'bg-purple-900 text-purple-200 border-purple-700' : 'bg-purple-100 text-purple-800 border-purple-200',
          text: 'Тасдиқланди'
        }
      default:
        return {
          icon: <AlertCircle className='text-gray-500' size={16} />,
          color: dark ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-100 text-gray-800 border-gray-200',
          text: status || '—'
        }
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

      // Optimistic update
      if (selectedClient) {
        setSelectedClient(prev => ({
          ...prev,
          orders: prev.orders.filter(order => order._id !== id)
        }))
      }

      // Mutate all related data
      mutateOrders()
      mutateClients()

    } catch (err) {
      console.error('Cancel error:', err)
      alert('❌ Буюртмани бекор қилишда хатолик юз берди.')
    } finally {
      setDeleting(null)
    }
  }

  const handleDeleteClient = async id => {
    const confirmMessage = `⚠️Сиз ростан ҳам бу клиентни ўчирмоқчимисиз?\n\nБу амални кейин тиклаб бўлмайди!`
    const confirmed = window.confirm(confirmMessage)
    if (!confirmed) return

    try {
      const { data } = await Fetch.delete(`/products/client/${id}`)

      // Optimistic update
      setSelectedClient(null)
      setClientPage(1)

      mutateClients()
      alert(`${data.message} ✅`)
    } catch (err) {
      console.error('Cancel error:', err)
      alert('❌ Клиентни бекор ўчиришда хатолик юз берди.')
    } finally {
      setDeleting(null)
    }
  }

  // Barcha mahsulot narxlarini yangilash
  const handleBulkPriceUpdate = async () => {
    if (!selectedOrder) return

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

      await Fetch.put(`/orders/${selectedOrder._id}`, {
        kurs: kurs,
        products: selectedOrder.products.map(p => ({
          product: p.product?._id || p.product,
          amount: p.amount,
          price: p.price,
          priceType: p.priceType,
          unit: p.unit
        })),
        totalUZ: totalUZ,
        totalEN: totalEN
      })

      // Optimistic update
      if (selectedClient) {
        setSelectedClient(prev => ({
          ...prev,
          orders: prev.orders.map(order =>
            order._id === selectedOrder._id
              ? { ...order, totalUZ, totalEN }
              : order
          )
        }))
      }

      // Mutate data
      mutateOrders()
      mutateClients()

      alert('✅ Барча маҳсулот нархлари муваффақиятли янгиланди')
      setSelectedOrder(null)
    } catch (err) {
      console.error('Bulk update error:', err)
      alert('❌ Нархларни янгилашда хатолик юз берди')
    } finally {
      setHideButton(false)
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
      const response = await Fetch.post("/products/pay", {
        clientId: selectedClient._id,
        [debtType]: Number(debt)
      })

      // Optimistic update
      setSelectedClient(prev => ({
        ...prev,
        debtUZ: debtType === 'uz' ? Math.max(0, (prev.debtUZ || 0) - Number(debt)) : (prev.debtUZ || 0),
        debtEN: debtType === 'en' ? Math.max(0, (prev.debtEN || 0) - Number(debt)) : (prev.debtEN || 0)
      }))

      setDebt(0)

      // Mutate all related data
      mutateClients()
      mutateOrders()
      mutateHistory()

      alert("✅ Қарз муваффақиятли тўланди")
    } catch (error) {
      console.error('Pay debt error:', error)
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

  // Qarz mavjudligini tekshirish
  const hasDebt = useMemo(() => {
    if (!selectedClient) return false
    const debtUZ = selectedClient.debtUZ || 0
    const debtEN = selectedClient.debtEN || 0
    return debtUZ > 0 || debtEN > 0
  }, [selectedClient])

  // Faqat UZS qarz bo'lsa
  const hasOnlyUZSDebt = useMemo(() => {
    if (!selectedClient) return false
    const debtUZ = selectedClient.debtUZ || 0
    const debtEN = selectedClient.debtEN || 0
    return debtUZ > 0 && debtEN === 0
  }, [selectedClient])

  // Faqat USD qarz bo'lsa
  const hasOnlyUSDDebt = useMemo(() => {
    if (!selectedClient) return false
    const debtUZ = selectedClient.debtUZ || 0
    const debtEN = selectedClient.debtEN || 0
    return debtEN > 0 && debtUZ === 0
  }, [selectedClient])

  // Dark mode styles
  const bgGradient = dark ? 'from-gray-900 to-gray-800' : 'from-blue-50 to-indigo-100'
  const cardBg = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  const textColor = dark ? 'text-white' : 'text-gray-800'
  const textMuted = dark ? 'text-gray-300' : 'text-gray-600'
  const inputBg = dark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'
  const headerBg = dark ? 'from-gray-700 to-gray-600' : 'from-gray-50 to-gray-100'
  const tableHeaderBg = dark ? 'from-gray-700 to-gray-600' : 'from-gray-50 to-gray-100'
  const tableHeaderText = dark ? 'text-gray-200' : 'text-gray-700'
  const tableRowHover = dark ? 'hover:bg-gray-700' : 'hover:bg-blue-50'
  const infoCardBg = dark ? 'bg-gray-700' : 'bg-gray-50'
  const successColor = dark ? 'text-green-400' : 'text-green-600'
  const warningColor = dark ? 'text-yellow-400' : 'text-yellow-600'
  const dangerColor = dark ? 'text-red-400' : 'text-red-600'

  // Loading holati
  if (clientsLoading && !selectedClient) {
    return (
      <div className={`min-h-screen flex justify-center items-center ${dark ? 'bg-gray-900' : ''}`}>
        <LoadingState />
      </div>
    )
  }

  // Xato holati
  if (clientsError) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${dark ? 'bg-gray-900' : ''}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`text-center p-8 rounded-2xl border max-w-md ${dark ? 'bg-gray-800 border-gray-700' : 'bg-red-50 border-red-200'
            }`}
        >
          <AlertCircle className='mx-auto text-red-500 mb-4' size={48} />
          <h3 className={`text-lg font-semibold mb-2 ${dark ? 'text-red-300' : 'text-red-800'
            }`}>
            Юклашда хатолик
          </h3>
          <p className={dark ? 'text-red-200' : 'text-red-600'}>
            Мижозлар маълумотларини юклашда хатолик юз берди. Илтимос, қайта уриниб кўринг.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgGradient} p-2 transition-colors duration-300`}>
      <div className='mx-auto space-y-6'>
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl shadow-lg p-6 border ${cardBg}`}
        >
          <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4'>
            <div className='flex items-center gap-4'>
              {selectedClient ? (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => {
                    setSelectedClient(null)
                    setOrderPage(1)
                    setHistoryPage(1)
                    setStatusFilter('all')
                    setOrderSearch('')
                    setSearchDate('')
                  }}
                  className={`flex fixed top-16 left-5 cursor-pointer z-50 items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${dark
                    ? 'text-blue-400 hover:text-blue-300 bg-blue-900 hover:bg-blue-800'
                    : 'text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100'
                    }`}
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
                <h1 className={`text-2xl md:text-3xl font-bold ${textColor}`}>
                  {selectedClient ? `${selectedClient.name} буюртмалари` : 'Буюртмалар'}
                </h1>
                <p className={`${textMuted} mt-1`}>
                  {selectedClient
                    ? `${orderPagination.total} та буюртма топилди`
                    : `${clientPagination.total} та мижоз топилди`}
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
        {!selectedClient && <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-2xl shadow-lg p-6 border ${cardBg}`}
        >
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div className='relative'>
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${dark ? 'text-gray-400' : 'text-gray-400'}`} size={20} />
              <input
                type='text'
                placeholder='Телефон рақам...'
                value={searchPhone}
                onChange={e => setSearchPhone(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 ${inputBg}`}
              />
            </div>

            <div className='relative'>
              <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${dark ? 'text-gray-400' : 'text-gray-400'}`} size={20} />
              <input
                type='text'
                placeholder='Мижоз Ф.И.Ш...'
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 ${inputBg}`}
              />
            </div>


          </div>
        </motion.div>}

        {/* Qarz to'lash section - FAQAT QARZ BO'LSA */}
        {selectedClient && hasDebt && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`rounded-2xl shadow-lg p-6 border ${cardBg}`}
          >
            <div className='flex items-center justify-between mb-4'>
              <h3 className={`text-lg font-semibold flex items-center gap-2 ${textColor}`}>
                <BadgeDollarSign size={20} className='text-purple-500' />
                Қарзни тўлаш
              </h3>
              <div className='flex items-center gap-2 text-sm'>
                {selectedClient.debtUZ > 0 && (
                  <span className={`px-2 py-1 rounded ${dark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-700'}`}>
                    UZS: {(selectedClient.debtUZ || 0).toLocaleString()} сўм
                  </span>
                )}
                {selectedClient.debtEN > 0 && (
                  <span className={`px-2 py-1 rounded ${dark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-700'}`}>
                    USD: {(selectedClient.debtEN || 0).toLocaleString()} $
                  </span>
                )}
              </div>
            </div>

            {/* Faqat UZS qarz bo'lsa */}
            {hasOnlyUZSDebt && (
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='md:col-span-2 space-y-3 relative'>
                  <input
                    type='text'
                    placeholder="Тўланаётган сумма (UZS)"
                    value={debt}
                    onChange={e => {
                      const value = e.target.value;
                      if (/^\d*\.?\d*$/.test(value)) {
                        setDebt(value);
                      }
                    }}
                    className={`w-full pl-2 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 ${inputBg}`}
                  />
                  {debt > 0 && (
                    <button
                      onClick={handlePayDebt}
                      disabled={debtL}
                      className={`absolute right-4 top-2.5 z-10 cursor-pointer rounded p-1 transition-colors duration-200 ${dark ? 'hover:bg-blue-600' : 'hover:bg-blue-500 hover:text-white'
                        }`}
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
                      : `${dark ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}`
                      }`}
                  >
                    <span>UZS</span>
                  </button>
                </div>
              </div>
            )}

            {/* Faqat USD qarz bo'lsa */}
            {hasOnlyUSDDebt && (
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='md:col-span-2 space-y-3 relative'>
                  <input
                    type='text'
                    placeholder="Тўланаётган сумма (USD)"
                    value={debt}
                    onChange={e => {
                      const value = e.target.value;
                      if (/^\d*\.?\d*$/.test(value)) {
                        setDebt(value);
                      }
                    }}
                    className={`w-full pl-2 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 ${inputBg}`}
                  />
                  {debt > 0 && (
                    <button
                      onClick={handlePayDebt}
                      disabled={debtL}
                      className={`absolute right-4 top-2.5 z-10 cursor-pointer rounded p-1 transition-colors duration-200 ${dark ? 'hover:bg-blue-600' : 'hover:bg-blue-500 hover:text-white'
                        }`}
                    >
                      {debtL ? <Loader2 className='animate-spin' size={20} /> : <Send size={20} />}
                    </button>
                  )}
                </div>

                <div className='flex gap-2'>
                  <button
                    onClick={() => setDebtType('en')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all duration-300 ${debtType === 'en'
                      ? 'bg-green-500 text-white border-green-500'
                      : `${dark ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}`
                      }`}
                  >
                    <DollarSign size={16} />
                    <span>USD</span>
                  </button>
                </div>
              </div>
            )}

            {/* Ikkala qarz ham bo'lsa */}
            {!hasOnlyUZSDebt && !hasOnlyUSDDebt && hasDebt && (
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='md:col-span-2 space-y-3 relative'>
                  <input
                    type='text'
                    placeholder={`Тўланаётган сумма (${debtType === 'uz' ? 'UZS' : 'USD'})`}
                    value={debt}
                    onChange={e => {
                      const value = e.target.value;
                      if (/^\d*\.?\d*$/.test(value)) {
                        setDebt(value);
                      }
                    }}
                    className={`w-full pl-2 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 ${inputBg}`}
                  />
                  {debt > 0 && (
                    <button
                      onClick={handlePayDebt}
                      disabled={debtL}
                      className={`absolute right-4 top-2.5 z-10 cursor-pointer rounded p-1 transition-colors duration-200 ${dark ? 'hover:bg-blue-600' : 'hover:bg-blue-500 hover:text-white'
                        }`}
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
                      : `${dark ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}`
                      }`}
                  >
                    <span>UZS</span>
                  </button>
                  <button
                    onClick={() => setDebtType('en')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all duration-300 ${debtType === 'en'
                      ? 'bg-green-500 text-white border-green-500'
                      : `${dark ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}`
                      }`}
                  >
                    <DollarSign size={16} />
                    <span>USD</span>
                  </button>
                </div>
              </div>
            )}

            {/* Qarz yo'q bo'lsa */}
            {!hasDebt && (
              <div className={`p-4 rounded-xl ${dark ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'} text-center`}>
                <CheckCircle className='mx-auto text-green-500 mb-2' size={24} />
                <p className={`font-medium ${dark ? 'text-green-300' : 'text-green-700'}`}>
                  Ҳеч қандай қарз мавжуд эмас ✅
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Loading state for orders */}
        {selectedClient && ordersLoading && (
          <div className='flex justify-center py-12'>
            <Loader2 className='animate-spin text-blue-500' size={32} />
          </div>
        )}

        {/* Clients List */}
        {!selectedClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {filteredClients.length === 0 ? (
              <div className={`rounded-2xl shadow-lg p-12 text-center border ${cardBg}`}>
                <User className={`mx-auto mb-4 ${dark ? 'text-gray-600' : 'text-gray-400'}`} size={64} />
                <h3 className={`text-xl font-semibold mb-2 ${textMuted}`}>
                  Мижозлар топилмади
                </h3>
                <p className={`${textMuted} mb-6`}>
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
              <>
                <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
                  {filteredClients.map((client, index) => {
                    const stats = calculateClientStats(client)
                    const debtUZ = client.debtUZ || 0
                    const debtEN = client.debtEN || 0
                    const hasClientDebt = debtUZ > 0 || debtEN > 0

                    return (
                      <motion.div
                        key={client._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => {
                          setSelectedClient(client)
                          setOrderPage(1)
                          setHistoryPage(1)
                          setStatusFilter('all')
                          setOrderSearch('')
                          setSearchDate('')
                        }}
                        className={`rounded-2xl shadow-lg p-6 border hover:shadow-xl transition-all duration-300 cursor-pointer group ${dark
                          ? 'bg-gray-800 border-gray-700 hover:border-blue-600'
                          : 'bg-white border-gray-200 hover:border-blue-300'
                          } ${hasClientDebt ? (dark ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-red-400') : ''}`}
                      >
                        <div className='flex items-start justify-between mb-4'>
                          <div className='flex items-center gap-3'>
                            <div className={`${hasClientDebt ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'} p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300`}>
                              <User className='text-white' size={24} />
                            </div>
                            {user.role == "admin" &&
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="flex">
                                <button
                                  onClick={() => handleDeleteClient(client._id)}
                                  className='p-2 bg-red-500 text-white rounded cursor-pointer hover:bg-red-600'
                                ><Trash2 /></button>
                              </div>}
                            <div>
                              <h3 className={`font-bold text-lg ${textColor}`}>{client.name || 'Номаълум'}</h3>
                              <p className={`text-sm ${textMuted}`}>{client.phoneNumber}</p>
                            </div>
                          </div>
                          <div className='text-right'>
                            <div className='flex items-center gap-1 text-green-600 font-semibold text-lg'>
                              <Package size={18} />
                              <span>{stats.totalOrders}</span>
                            </div>
                            <div className={`text-xs ${textMuted}`}>буюртма</div>
                          </div>
                        </div>

                        <div className='flex items-center gap-2 text-sm mb-3'>
                          <MapPin size={16} className={textMuted} />
                          <span className={`truncate ${textMuted}`}>{client.address || 'Манзил кўрсатилмаган'}</span>
                        </div>

                        <div className='space-y-2 mb-4'>
                          <div className='flex justify-between items-center'>
                            <span className={`text-sm ${textMuted}`}>Жами сумма (UZS):</span>
                            <span className='font-bold text-green-600'>{stats.totalAmountUZ.toLocaleString()} сўм</span>
                          </div>
                          {stats.totalAmountEN > 0 && (
                            <div className='flex justify-between items-center'>
                              <span className={`text-sm ${textMuted}`}>Жами сумма (USD):</span>
                              <span className='font-bold text-blue-600'>{stats.totalAmountEN.toLocaleString()} $</span>
                            </div>
                          )}
                          {stats.unpaidOrders > 0 && (
                            <div className='flex justify-between items-center'>
                              <span className={`text-sm ${textMuted}`}>Тўланмаган:</span>
                              <span className='font-bold text-red-600'>{stats.unpaidOrders} та</span>
                            </div>
                          )}
                        </div>

                        {/* Qarz ko'rsatish */}
                        {(debtUZ > 0 || debtEN > 0) && (
                          <div className='space-y-2 pt-4 border-t border-gray-100'>
                            {debtUZ > 0 && (
                              <div className='flex justify-between items-center'>
                                <span className={`text-sm ${textMuted}`}>Қарз (UZS):</span>
                                <span className={`font-bold text-red-500 text-lg`}>
                                  {debtUZ.toLocaleString()} сўм
                                </span>
                              </div>
                            )}
                            {debtEN > 0 && (
                              <div className='flex justify-between items-center'>
                                <span className={`text-sm ${textMuted}`}>Қарз (USD):</span>
                                <span className='font-bold text-red-500 text-lg'>
                                  {debtEN.toLocaleString()} $
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Qarz yo'q bo'lsa */}
                        {debtUZ === 0 && debtEN === 0 && (
                          <div className='pt-4 border-t border-gray-100'>
                            <div className='flex items-center justify-between'>
                              <span className={`text-sm ${textMuted}`}>Қарз ҳолати:</span>
                              <span className={`text-sm font-medium ${successColor}`}>
                                <CheckCircle size={14} className='inline mr-1' />
                                Тўланган
                              </span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>

                {/* Clients Pagination */}
                {clientPagination.totalPages > 1 && (
                  <div className={`mt-6 p-4 rounded-2xl shadow-lg border ${cardBg}`}>
                    <div className='flex items-center justify-between'>
                      <div className={`text-sm ${textMuted}`}>
                        Кўрсатилган: {((clientPagination.page - 1) * clientPagination.limit) + 1}-{Math.min(clientPagination.page * clientPagination.limit, clientPagination.total)}/{clientPagination.total}
                      </div>

                      <div className='flex items-center gap-2'>
                        <button
                          onClick={() => setClientPage(prev => Math.max(prev - 1, 1))}
                          disabled={clientPagination.page <= 1}
                          className={`flex items-center gap-1 px-3 py-1 rounded-lg ${clientPagination.page <= 1
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                            } ${textColor}`}
                        >
                          <ChevronLeft size={18} />
                          Олдинги
                        </button>

                        <div className='flex items-center gap-1'>
                          {Array.from({ length: Math.min(5, clientPagination.totalPages) }, (_, i) => {
                            let pageNum
                            if (clientPagination.totalPages <= 5) {
                              pageNum = i + 1
                            } else if (clientPagination.page <= 3) {
                              pageNum = i + 1
                            } else if (clientPagination.page >= clientPagination.totalPages - 2) {
                              pageNum = clientPagination.totalPages - 4 + i
                            } else {
                              pageNum = clientPagination.page - 2 + i
                            }

                            return (
                              <button
                                key={pageNum}
                                onClick={() => setClientPage(pageNum)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${clientPagination.page === pageNum
                                  ? 'bg-blue-500 text-white'
                                  : `hover:bg-gray-200 dark:hover:bg-gray-700 ${textColor}`
                                  }`}
                              >
                                {pageNum}
                              </button>
                            )
                          })}
                        </div>

                        <button
                          onClick={() => setClientPage(prev => Math.min(prev + 1, clientPagination.totalPages))}
                          disabled={clientPagination.page >= clientPagination.totalPages}
                          className={`flex items-center gap-1 px-3 py-1 rounded-lg ${clientPagination.page >= clientPagination.totalPages
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                            } ${textColor}`}
                        >
                          Кейинги
                          <ChevronRight size={18} />
                        </button>
                      </div>

                      <div className='flex items-center gap-2'>
                        <span className={`text-sm ${textMuted}`}>Саҳифа:</span>
                        <select
                          value={clientPage}
                          onChange={(e) => setClientPage(parseInt(e.target.value))}
                          className={`border ${dark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} rounded-lg px-3 py-1 outline-none`}
                        >
                          {Array.from({ length: clientPagination.totalPages }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {i + 1}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* Client Orders va History */}
        {selectedClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* Client Overview Section */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6'>
              {/* Client Info Card */}
              <div className={`rounded-2xl shadow-lg p-6 border ${cardBg}`}>
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center gap-3'>
                    <div className={`${hasDebt ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'} p-3 rounded-xl`}>
                      <User className='text-white' size={24} />
                    </div>
                    <div>
                      <h2 className={`text-xl font-bold ${textColor}`}>{selectedClient.name}</h2>
                      <p className={textMuted}>{selectedClient.phoneNumber}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      mutateOrders()
                      mutateHistory()
                      setLastUpdate(Date.now())
                    }}
                    className={`p-2 rounded-lg ${dark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                    title="Янгилаш"
                  >
                    <RefreshCw size={16} className={textColor} />
                  </button>
                </div>

                <div className='space-y-3'>
                  <div className={`flex items-center gap-2 text-sm ${textMuted}`}>
                    <MapPin size={16} />
                    <span>{selectedClient.address || 'Манзил кўрсатилмаган'}</span>
                  </div>

                  {/* Qarz ko'rsatish */}
                  {hasDebt && (
                    <div className='space-y-2'>
                      {selectedClient.debtUZ > 0 && (
                        <div className='flex items-center gap-2 text-sm text-red-600'>
                          <BadgeDollarSign size={16} />
                          <span>Қарз (UZS): {(selectedClient.debtUZ || 0).toLocaleString()} сўм</span>
                        </div>
                      )}
                      {selectedClient.debtEN > 0 && (
                        <div className='flex items-center gap-2 text-sm text-red-600'>
                          <DollarSign size={16} />
                          <span>Қарз (USD): {(selectedClient.debtEN || 0).toLocaleString()} $</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Qarz yo'q bo'lsa */}
                  {!hasDebt && (
                    <div className='flex items-center gap-2 text-sm text-green-600'>
                      <CheckCircle size={16} />
                      <span>Қарз мавжуд эмас</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistics Card */}
              <div className={`rounded-2xl shadow-lg p-6 border ${cardBg}`}>
                <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${textColor}`}>
                  <ScrollText size={20} className='text-blue-500' />
                  Статистика
                </h3>
                <div className='space-y-3'>
                  <div className='flex justify-between items-center'>
                    <span className={textMuted}>Жами буюртма:</span>
                    <span className='font-bold text-blue-600'>{orderPagination.total} та</span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className={textMuted}>Жами сумма (UZS):</span>
                    <span className='font-bold text-green-600'>{orders.reduce((sum, order) => sum + (order.totalUZ || 0), 0).toLocaleString()} сўм</span>
                  </div>
                  {orders.some(order => order.totalEN > 0) && (
                    <div className='flex justify-between items-center'>
                      <span className={textMuted}>Жами сумма (USD):</span>
                      <span className='font-bold text-blue-600'>{orders.reduce((sum, order) => sum + (order.totalEN || 0), 0).toLocaleString()} $</span>
                    </div>
                  )}
                  <div className='flex justify-between items-center'>
                    <span className={textMuted}>Тўланмаган:</span>
                    <span className='font-bold text-red-600'>{orders.filter(order => !order.paid).length} та</span>
                  </div>
                </div>
              </div>

              {/* History Stats Card */}
              <div className={`rounded-2xl shadow-lg p-6 border ${cardBg}`}>
                <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${textColor}`}>
                  <Clock size={20} className='text-purple-500' />
                  Тўлов тарихи
                </h3>
                <div className='space-y-3'>
                  <div className='flex justify-between items-center'>
                    <span className={textMuted}>Жами тўловлар:</span>
                    <span className='font-bold text-purple-600'>{historyPagination.total} та</span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className={textMuted}>Жорий саҳифа:</span>
                    <span className='font-bold text-gray-800'>{historyPage} / {historyPagination.totalPages}</span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className={textMuted}>Кўрсатилмоқда:</span>
                    <span className='font-bold text-green-600'>{clientHistory.length} та</span>
                  </div>
                </div>
              </div>
            </div>

            {/* History Section */}
            {clientHistory.length > 0 && (
              <div className={`rounded-2xl shadow-lg p-6 border mb-6 ${cardBg}`}>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className={`text-lg font-semibold flex items-center gap-2 ${textColor}`}>
                    <Clock className='text-purple-500' size={20} />
                    Тўловлар тарихи ({historyPagination.total} та)
                  </h3>
                  <button
                    onClick={() => mutateHistory()}
                    className='flex items-center gap-2 text-sm text-blue-500 hover:text-blue-700'
                  >
                    <RefreshCw size={14} />
                    Янгилаш
                  </button>
                </div>

                <div className='space-y-3 mb-4'>
                  {clientHistory.map((historyItem, index) => (
                    <motion.div
                      key={historyItem._id || index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex justify-between items-center p-3 rounded-lg border ${dark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                        }`}
                    >
                      <div className='flex items-center gap-3'>
                        <div className={`p-2 rounded-lg ${historyItem.type === 'uz'
                          ? (dark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-600')
                          : (dark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-600')
                          }`}>
                          {historyItem.type === 'uz' ? <BadgeDollarSign size={16} /> : <DollarSign size={16} />}
                        </div>
                        <div>
                          <p className={`font-medium ${textColor}`}>
                            {historyItem.type === 'uz' ? 'Сўм' : 'Доллар'} тўлови
                          </p>
                          <p className={`text-sm ${textMuted}`}>
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

                {/* History Pagination */}
                {historyPagination.totalPages > 1 && (
                  <div className='flex justify-center items-center gap-4'>
                    <button
                      onClick={() => setHistoryPage(prev => Math.max(prev - 1, 1))}
                      disabled={historyPage === 1}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${dark
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
                        } disabled:cursor-not-allowed`}
                    >
                      <ChevronLeftIcon size={16} />
                      Олдинги
                    </button>

                    <span className={`text-sm ${textMuted}`}>
                      Саҳифа {historyPage} / {historyPagination.totalPages}
                    </span>

                    <button
                      onClick={() => setHistoryPage(prev => Math.min(prev + 1, historyPagination.totalPages))}
                      disabled={historyPage === historyPagination.totalPages}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${dark
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
                        } disabled:cursor-not-allowed`}
                    >
                      Кейинги
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Orders Table */}
            {selectedClient.orders.length === 0 ? (
              <div className={`rounded-2xl shadow-lg p-12 text-center border ${cardBg}`}>
                <ScrollText className={`mx-auto mb-4 ${dark ? 'text-gray-600' : 'text-gray-400'}`} size={64} />
                <h3 className={`text-xl font-semibold mb-2 ${textMuted}`}>
                  Буюртмалар топилмади
                </h3>
                <p className={textMuted}>
                  Ушбу мижоз учун ҳеч қандай буюртма топилмади.
                </p>
              </div>
            ) : (
              <div className={`rounded-2xl shadow-lg border overflow-hidden ${cardBg}`}>
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead className={`bg-gradient-to-r ${tableHeaderBg}`}>
                      <tr>
                        <th className={`px-6 py-4 text-left text-sm font-semibold ${tableHeaderText}`}>Маҳсулотлар</th>
                        <th className={`px-6 py-4 text-left text-sm font-semibold ${tableHeaderText}`}>Ҳолат</th>
                        <th className={`px-6 py-4 text-left text-sm font-semibold ${tableHeaderText}`}>Умумий нарх</th>
                        <th className={`px-6 py-4 text-left text-sm font-semibold ${tableHeaderText}`}>Тўлов</th>
                        <th className={`px-6 py-4 text-left text-sm font-semibold ${tableHeaderText}`}>Сана</th>
                        <th className={`px-6 py-4 text-center text-sm font-semibold ${tableHeaderText}`}>Амалиёт</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${dark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      {selectedClient.orders.map((order, index) => {
                        const totalUZ = order.totalUZ || 0
                        const totalEN = order.totalEN || 0
                        const totalCombined = totalUZ + (totalEN * kurs)
                        const statusConfig = getStatusConfig(order.status)

                        return (
                          <motion.tr
                            key={order._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`${!order.paid ? (dark ? "bg-red-900 text-white" : "bg-red-300 text-white") : tableRowHover} transition-colors duration-200`}
                          >
                            <td className='px-6 py-4'>
                              <div className='space-y-1'>
                                {(order.products || []).slice(0, 3).map((item, i) => (
                                  <div key={i} className={`text-sm ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <span className='font-medium'>{item.product?.title || 'Мавжуд эмас'}</span>
                                    <span className={`ml-2 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
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
                              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                                {statusConfig.icon}
                                {statusConfig.text}
                              </div>
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
                                {totalCombined === 0 && (
                                  <div className='text-red-500 text-sm font-medium'>
                                    Нарх белгиланмаган
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className='px-6 py-4'>
                              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${order.paid
                                ? (dark ? 'bg-green-900 text-green-200 border-green-700' : 'bg-green-100 text-green-800 border-green-200')
                                : (dark ? 'bg-red-900 text-red-200 border-red-700' : 'bg-red-100 text-red-800 border-red-200')
                                }`}>
                                {order.paid ? 'Тўланган' : 'Тўланмаган'}
                              </div>
                            </td>

                            <td className={`px-6 py-4 text-sm ${textMuted}`}>
                              {new Date(order.orderDate || order.createdAt).toLocaleDateString()}
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

                {/* Orders Pagination */}
                {orderPagination.totalPages > 1 && (
                  <div className={`p-4 border-t ${dark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                    <div className='flex items-center justify-between'>
                      <div className={`text-sm ${textMuted}`}>
                        Кўрсатилган: {((orderPagination.page - 1) * orderPagination.limit) + 1}-{Math.min(orderPagination.page * orderPagination.limit, orderPagination.total)}/{orderPagination.total}
                      </div>

                      <div className='flex items-center gap-2'>
                        <button
                          onClick={() => setOrderPage(prev => Math.max(prev - 1, 1))}
                          disabled={orderPagination.page <= 1}
                          className={`flex items-center gap-1 px-3 py-1 rounded-lg ${orderPagination.page <= 1
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                            } ${textColor}`}
                        >
                          <ChevronLeft size={18} />
                          Олдинги
                        </button>

                        <div className='flex items-center gap-1'>
                          {Array.from({ length: Math.min(5, orderPagination.totalPages) }, (_, i) => {
                            let pageNum
                            if (orderPagination.totalPages <= 5) {
                              pageNum = i + 1
                            } else if (orderPagination.page <= 3) {
                              pageNum = i + 1
                            } else if (orderPagination.page >= orderPagination.totalPages - 2) {
                              pageNum = orderPagination.totalPages - 4 + i
                            } else {
                              pageNum = orderPagination.page - 2 + i
                            }

                            return (
                              <button
                                key={pageNum}
                                onClick={() => setOrderPage(pageNum)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${orderPagination.page === pageNum
                                  ? 'bg-blue-500 text-white'
                                  : `hover:bg-gray-200 dark:hover:bg-gray-700 ${textColor}`
                                  }`}
                              >
                                {pageNum}
                              </button>
                            )
                          })}
                        </div>

                        <button
                          onClick={() => setOrderPage(prev => Math.min(prev + 1, orderPagination.totalPages))}
                          disabled={orderPagination.page >= orderPagination.totalPages}
                          className={`flex items-center gap-1 px-3 py-1 rounded-lg ${orderPagination.page >= orderPagination.totalPages
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                            } ${textColor}`}
                        >
                          Кейинги
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailModal
            selectedOrder={selectedOrder}
            setSelectedOrder={setSelectedOrder}
            selectedClient={selectedClient}
            user={user}
            kurs={kurs}
            dark={dark}
            handleBulkPriceUpdate={handleBulkPriceUpdate}
            hideButton={hideButton}
            setHideButton={setHideButton}
            textColor={textColor}
            textMuted={textMuted}
            mutateOrders={mutateOrders}
            mutateClients={mutateClients}
          />
        )}
      </AnimatePresence>

      {isOpen && <AddNewOrder onClose={() => setIsOpen(false)} isOpen={isOpen} />}
    </div>
  )
}

// Order Detail Modal komponenti
const OrderDetailModal = ({
  selectedOrder,
  setSelectedOrder,
  selectedClient,
  user,
  kurs,
  dark,
  hideButton,
  setHideButton,
  textColor,
  textMuted,
  mutateOrders,
  mutateClients
}) => {
  const [localOrder, setLocalOrder] = useState(selectedOrder)

  const handlePriceChange = (index, field, value) => {
    const updatedProducts = [...localOrder.products]
    if (field === 'price') {
      const numericValue = value === '' ? 0 : Number(value)
      updatedProducts[index] = {
        ...updatedProducts[index],
        price: numericValue
      }
    } else if (field === 'priceType') {
      updatedProducts[index] = {
        ...updatedProducts[index],
        priceType: value
      }
    }
    setLocalOrder(prev => ({ ...prev, products: updatedProducts }))
  }

  const handleSave = async () => {
    try {
      setHideButton(true)

      // Calculate totals
      const totalUZ = localOrder.products.reduce((sum, product) => {
        if (product.priceType === 'uz') {
          return sum + ((product.price || 0) * (product.amount || 0))
        }
        return sum
      }, 0)

      const totalEN = localOrder.products.reduce((sum, product) => {
        if (product.priceType === 'en') {
          return sum + ((product.price || 0) * (product.amount || 0))
        }
        return sum
      }, 0)

      await Fetch.put(`/orders/${localOrder._id}`, {
        kurs: kurs,
        products: localOrder.products.map(p => ({
          product: p.product?._id || p.product,
          amount: p.amount,
          price: p.price,
          priceType: p.priceType,
          unit: p.unit
        })),
        totalUZ: totalUZ,
        totalEN: totalEN
      })

      // Mutate data
      mutateOrders()
      mutateClients()

      alert('✅ Нархлар муваффақиятли янгиланди')
      setSelectedOrder(null)
    } catch (err) {
      console.error('Update error:', err)
      alert('❌ Нархларни янгилашда хатолик юз берди')
    } finally {
      setHideButton(false)
    }
  }


  return (
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
        className={`w-full max-w-2xl rounded-3xl shadow-2xl relative max-h-[90vh] overflow-y-auto ${dark ? 'bg-gray-800' : 'bg-white'
          }`}
      >
        <button
          onClick={() => setSelectedOrder(null)}
          className={`absolute top-4 right-4 z-10 rounded-full p-2 shadow-lg transition-colors duration-200 ${dark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'
            }`}
        >
          <X size={20} className={textColor} />
        </button>

        <div className='p-8'>
          <div className='text-center mb-8'>
            <div className='bg-gradient-to-r from-blue-500 to-indigo-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg'>
              <ShoppingCart className='text-white' size={28} />
            </div>
            <h2 className={`text-2xl font-bold ${textColor}`}>Буюртма маълумотлари</h2>
          </div>

          {/* Mahsulotlar */}
          <div className='mb-8'>
            <div className='flex justify-between items-center mb-4'>
              <h3 className={`text-lg font-semibold flex items-center gap-2 ${textColor}`}>
                <Package className='text-indigo-600' size={20} />
                Маҳсулотлар ({localOrder.products?.length || 0})
              </h3>
              {user.role === 'admin' && localOrder.paid == false && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const updatedProducts = localOrder.products?.map(product => ({
                      ...product,
                      editing: !product.editing
                    }))
                    setLocalOrder(prev => ({ ...prev, products: updatedProducts }))
                  }}
                  className='flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200'
                >
                  <Edit size={16} />
                  Нархларни таҳрирлаш
                </motion.button>
              )}
            </div>

            <div className='space-y-3'>
              {localOrder.products?.map((product, index) => (
                <div key={index} className={`flex justify-between items-center p-3 rounded-lg border ${dark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                  }`}>
                  <div className='flex-1'>
                    <p className={`font-medium ${textColor}`}>{product.product?.title || ""}</p>
                    <p className={`text-sm ${textMuted}`}>{product.amount} {product.unit}</p>
                    {product.unit != "дона" && <p className={`text-sm ${textMuted}`}>{product.count} дона</p>}
                  </div>

                  {product.editing ? (
                    <div className='flex items-center gap-2'>
                      <input
                        type='number'
                        value={product.price || ''}
                        onChange={(e) => handlePriceChange(index, 'price', e.target.value)}
                        className={`w-24 border rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-right ${dark ? 'bg-gray-600 border-gray-500 text-white' : 'border-gray-300'
                          }`}
                        placeholder='0'
                      />

                      <select
                        value={product.priceType || 'uz'}
                        onChange={(e) => handlePriceChange(index, 'priceType', e.target.value)}
                        className={`border rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${dark ? 'bg-gray-600 border-gray-500 text-white' : 'border-gray-300'
                          }`}
                      >
                        <option value='uz'>сўм</option>
                        <option value='en'>$</option>
                      </select>
                    </div>
                  ) : (
                    <div className='text-right'>
                      <p className='font-semibold text-green-600'>
                        {((product.price || 0) * (product.amount || 0)).toLocaleString()} {product.priceType === 'en' ? '$' : 'сўм'}
                      </p>
                      <p className={`text-xs ${textMuted}`}>
                        {(product.price || 0).toLocaleString()} {product.priceType === 'en' ? '$' : 'сўм'} дан
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Save button */}
          {user.role === 'admin' && localOrder.products?.some(p => p.editing) && (
            <div className='mt-4 flex justify-end'>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={hideButton}
                className='flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200 disabled:opacity-50'
              >
                {hideButton ? (
                  <Loader2 className='animate-spin' size={16} />
                ) : (
                  <Save size={16} />
                )}
                {hideButton ? 'Сақланмоқда...' : 'Сақлаш'}
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}