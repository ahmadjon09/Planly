import { useState, useEffect, useContext, useCallback } from 'react'
import {
  Plus,
  Minus,
  Save,
  Search,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  User,
  Phone,
  MapPin,
  Users,
  Package,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Hash,
  Tag,
  DollarSign
} from 'lucide-react'
import Fetch from '../middlewares/fetcher'
import { ContextData } from '../contextData/Context'
import { mutate } from 'swr'
import { motion, AnimatePresence } from 'framer-motion'

export const AddNewOrder = ({ isOpen, onClose }) => {
  const { user, dark } = useContext(ContextData)
  if (!isOpen) return null

  // State variables
  const [products, setProducts] = useState([])
  const [clients, setClients] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [status, setStatus] = useState('Юборилди')
  const [payType, setPayType] = useState('Нақд')
  const [totalPrice, setTotalPrice] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [clientSearchQuery, setClientSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [clientsLoading, setClientsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [showClientsList, setShowClientsList] = useState(false)
  const [productType, setProductType] = useState('ready')
  const [selectedClientPage, setSelectedClientPage] = useState(1)
  const [selectedProductPage, setSelectedProductPage] = useState(1)

  // Pagination states
  const [clientPagination, setClientPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  const [productPagination, setProductPagination] = useState({
    page: 1,
    limit: 30,
    total: 0,
    totalPages: 0
  })

  // Client data
  const [clientData, setClientData] = useState({
    clientId: '',
    name: '',
    phoneNumber: '',
    address: ''
  })

  // Dark mode classes
  const darkModeClasses = {
    bg: {
      primary: dark ? 'bg-gray-900' : 'bg-white',
      secondary: dark ? 'bg-gray-800' : 'bg-gray-50',
      overlay: dark ? 'bg-black/70' : 'bg-black/50',
      card: dark ? 'bg-gray-800' : 'bg-white',
      input: dark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900',
      gradient: dark ? 'from-gray-800 to-gray-700 border-gray-600' : 'from-gray-50 to-blue-50 border-blue-200'
    },
    text: {
      primary: dark ? 'text-white' : 'text-gray-800',
      secondary: dark ? 'text-gray-300' : 'text-gray-600',
      muted: dark ? 'text-gray-400' : 'text-gray-500'
    },
    border: {
      primary: dark ? 'border-gray-600' : 'border-gray-200',
      secondary: dark ? 'border-gray-700' : 'border-gray-300'
    }
  }

  // Debounce function
  const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedValue(value)
      }, delay)

      return () => clearTimeout(timer)
    }, [value, delay])

    return debouncedValue
  }

  // Debounced search queries
  const debouncedSearchQuery = useDebounce(searchQuery, 500)
  const debouncedClientSearchQuery = useDebounce(clientSearchQuery, 500)

  // Fetch clients with pagination
  const fetchClients = useCallback(async (page = 1, search = '') => {
    setClientsLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', page)
      params.append('limit', 20)
      if (search) {
        params.append('search', search)
      }

      const response = await Fetch.get(`/orders/clients?${params.toString()}`)
      setClients(response.data?.data || [])
      setClientPagination(response.data?.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      })
    } catch (err) {
      console.error('❌ Мижозларни олишда хатолик:', err)
      setMessage({ type: 'error', text: 'Мижозларни юклашда хатолик!' })
    } finally {
      setClientsLoading(false)
    }
  }, [])

  // Fetch products with pagination
  const fetchProducts = useCallback(async (page = 1, search = '', type = productType) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', page)
      params.append('limit', 30)
      params.append('type', type)
      if (search) {
        params.append('search', search)
        params.append('searchField', 'title')
      }

      const response = await Fetch.get(`/products/ready?${params.toString()}`)
      setProducts(response.data?.data || [])
      setProductPagination(response.data?.pagination || {
        page: 1,
        limit: 30,
        total: 0,
        totalPages: 0
      })
    } catch (err) {
      console.error('❌ Маҳсулотларни олишда хатолик:', err)
      setMessage({ type: 'error', text: 'Маҳсулотларни юклашда хатолик!' })
    } finally {
      setLoading(false)
    }
  }, [productType])

  // Fetch data on mount and search changes
  useEffect(() => {
    if (isOpen) {
      fetchClients(1, debouncedClientSearchQuery)
      fetchProducts(1, debouncedSearchQuery)
    }
  }, [isOpen, debouncedClientSearchQuery, debouncedSearchQuery, fetchClients, fetchProducts])

  // Product type o'zgarganda mahsulotlarni yangilash
  useEffect(() => {
    if (isOpen) {
      fetchProducts(1, debouncedSearchQuery, productType)
    }
  }, [productType, isOpen, fetchProducts, debouncedSearchQuery])

  // Client search changes
  useEffect(() => {
    setSelectedClientPage(1)
  }, [clientSearchQuery])

  // Product search changes
  useEffect(() => {
    setSelectedProductPage(1)
  }, [searchQuery])

  // Client tanlash
  const handleSelectClient = client => {
    setClientData({
      clientId: client._id,
      name: client.name,
      phoneNumber: client.phoneNumber,
      address: client.address || ''
    })
    setShowClientsList(false)
    setClientSearchQuery('')
  }

  // Client ma'lumotlarini o'zgartirish
  const handleClientChange = (field, value) => {
    setClientData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Client tanlovini bekor qilish
  const handleClearClient = () => {
    setClientData({
      clientId: '',
      name: '',
      phoneNumber: '',
      address: ''
    })
    setClientSearchQuery('')
  }

  // Mahsulot qo'shish
  const handleAddProduct = product => {
    if (product.stock === 0) {
      setMessage({ type: 'error', text: 'Бу маҳсулот қолмаган!' })
      return
    }

    if (!selectedProducts.some(p => p._id === product._id) && product.stock !== 0) {
      setSelectedProducts(prev => [
        ...prev,
        {
          ...product,
          quantity: 1,
          count: product.count || 0, // count ни ҳам қўшамиз
          price: product.price,
          unit: product.unit || 'дона',
          productType: productType,
          originalCount: product.count || 0 // original count ni saqlaymiz
        }
      ])
    }
  }

  // Miqdor o'zgartirish - quantity учун
  const handleQuantityChange = (id, delta) => {
    setSelectedProducts(prev =>
      prev.map(p =>
        p._id === id
          ? {
            ...p,
            quantity: Math.max(1, Math.min(p.stock, p.quantity + delta))
          }
          : p
      )
    )
  }

  // Count o'zgartirish - dona учун (originalCount дан ошиб кетмаслиги керак)
  const handleCountChange = (id, delta) => {
    setSelectedProducts(prev =>
      prev.map(p => {
        if (p._id === id) {
          const maxCount = p.originalCount || p.count || 0;
          const newCount = (p.count || 0) + delta;
          // 0 ва максимал count орасида чегаралаш
          const validCount = Math.max(0, Math.min(maxCount, newCount));
          return { ...p, count: validCount }
        }
        return p
      })
    )
  }

  // Umumiy narxni hisoblash
  useEffect(() => {
    const total = selectedProducts.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
    setTotalPrice(total)
  }, [selectedProducts])

  // Input orqali miqdor o'zgartirish - quantity учун
  const handleInputQuantityChange = (id, value) => {
    setSelectedProducts(prev =>
      prev.map(p => {
        if (p._id === id) {
          const num = Number(value)
          const valid = Math.max(1, Math.min(p.stock, num || 1))
          return { ...p, quantity: valid }
        }
        return p
      })
    )
  }

  // Input orqali count o'zgartirish - dona учун (originalCount дан ошиб кетмаслиги керак)
  const handleInputCountChange = (id, value) => {
    setSelectedProducts(prev =>
      prev.map(p => {
        if (p._id === id) {
          const num = Number(value);
          const maxCount = p.originalCount || p.count || 0;
          // 0 ва максимал count орасида чегаралаш
          const validCount = Math.max(0, Math.min(maxCount, num || 0));
          return { ...p, count: validCount }
        }
        return p
      })
    )
  }

  // Mahsulotni o'chirish
  const handleRemoveProduct = (id) => {
    setSelectedProducts(prev => prev.filter(p => p._id !== id))
  }

  // Buyurtma yaratish
  const handleSubmit = async e => {
    e.preventDefault()

    // Validatsiya
    if (selectedProducts.length === 0) {
      return setMessage({
        type: 'error',
        text: 'Ҳеч қандай маҳсулот танланмаган!'
      })
    }

    if (!clientData.name || !clientData.phoneNumber) {
      return setMessage({
        type: 'error',
        text: 'Мижоз маълумотларини тўлиқ киритинг!'
      })
    }

    setSubmitting(true)
    try {
      const orderData = {
        customer: user._id,
        products: selectedProducts.map(p => ({
          product: p._id,
          amount: p.quantity,
          count: p.count || 0,
          unit: p.unit,
          price: p.price,
          productType: p.productType
        })),
        ...(clientData.clientId ? { clientId: clientData.clientId } : {
          client: {
            name: clientData.name,
            phoneNumber: clientData.phoneNumber,
            address: clientData.address || '--'
          }
        }),
        status,
        payType,
        totalPrice: Number(totalPrice) || 0,
        orderDate: new Date()
      }

      await Fetch.post('/orders/new', orderData)

      setMessage({ type: 'success', text: 'Буюртма муваффақиятли яратилди ✅' })

      // SWR cache yangilash
      mutate('/orders')
      mutate('/products')
      mutate('/reports/daily')
      mutate('/reports/weekly')

      // Formani tozalash
      setSelectedProducts([])
      setStatus('Юборилди')
      setPayType('Нақд')
      setTotalPrice(0)
      setClientData({
        clientId: '',
        name: '',
        phoneNumber: '',
        address: ''
      })
      setSearchQuery('')

      // 1.5 soniyadan keyin modalni yopish
      setTimeout(() => onClose(), 1500)
    } catch (err) {
      console.error('Buyurtma yaratish xatosi:', err)
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Буюртма яратишда хатолик ❌'
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Client sahifasini o'zgartirish
  const handleClientPageChange = (newPage) => {
    setSelectedClientPage(newPage)
    fetchClients(newPage, debouncedClientSearchQuery)
  }

  // Mahsulot sahifasini o'zgartirish
  const handleProductPageChange = (newPage) => {
    setSelectedProductPage(newPage)
    fetchProducts(newPage, debouncedSearchQuery)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className={`fixed inset-0 ${darkModeClasses.bg.overlay} flex items-center justify-center z-50 p-4`}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={e => e.stopPropagation()}
            className={`${darkModeClasses.bg.card} rounded-2xl shadow-xl w-full max-w-6xl max-h-[95vh] overflow-y-auto relative`}
          >
            <button
              onClick={onClose}
              className={`absolute top-4 right-4 p-2 ${dark ? 'text-gray-400 hover:text-white bg-gray-700' : 'text-gray-500 hover:text-gray-700 bg-white'} rounded-full shadow-lg z-10`}
            >
              <X size={24} />
            </button>

            <div className='p-6'>
              <div className='flex items-center gap-3 mb-6'>
                <div className={`${dark ? 'bg-blue-900' : 'bg-blue-100'} p-3 rounded-xl`}>
                  <Package size={28} className='text-blue-600' />
                </div>
                <div>
                  <h2 className={`text-2xl font-bold ${darkModeClasses.text.primary}`}>
                    Янги буюртма яратиш
                  </h2>
                  <p className={darkModeClasses.text.secondary}>
                    Мижоз ва маҳсулотларни танлаб буюртма яратинг
                  </p>
                </div>
              </div>

              {/* Xabar ko'rsatish */}
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center gap-2 mb-6 p-4 rounded-xl border ${message.type === 'success'
                    ? dark
                      ? 'bg-green-900/50 text-green-300 border-green-700'
                      : 'bg-green-100 text-green-700 border-green-200'
                    : dark
                      ? 'bg-red-900/50 text-red-300 border-red-700'
                      : 'bg-red-100 text-red-700 border-red-200'
                    }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle size={20} />
                  ) : (
                    <AlertCircle size={20} />
                  )}
                  <span className='font-medium'>{message.text}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className='space-y-8'>
                {/* Mijoz ma'lumotlari */}
                <div className={`bg-gradient-to-br ${darkModeClasses.bg.gradient} rounded-2xl border ${dark ? 'border-gray-600' : 'border-blue-200'} p-6`}>
                  <div className='flex items-center justify-between mb-6'>
                    <h3 className={`text-lg font-semibold ${darkModeClasses.text.primary} flex items-center gap-2`}>
                      <Users size={20} className='text-blue-600' />
                      Мижоз маълумотлари
                    </h3>
                    <button
                      type='button'
                      onClick={() => setShowClientsList(!showClientsList)}
                      className={`flex items-center gap-2 px-4 py-2 ${dark ? 'bg-blue-800 text-blue-200 hover:bg-blue-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        } rounded-xl transition-all duration-200`}
                    >
                      <User size={16} />
                      {showClientsList ? 'Янги мижоз' : 'Мавжуд мижоз'}
                    </button>
                  </div>

                  {showClientsList ? (
                    <div className='space-y-4'>
                      {/* Client search */}
                      <div className='relative'>
                        <input
                          type='text'
                          value={clientSearchQuery}
                          onChange={e => setClientSearchQuery(e.target.value)}
                          placeholder='Мижоз исми, телефон рақами ёки манзили бўйича қидириш...'
                          className={`border ${darkModeClasses.bg.input} w-full p-4 rounded-xl pl-12 focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
                        />
                        <Search
                          className='absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400'
                          size={20}
                        />
                      </div>

                      {/* Clients list */}
                      {clientsLoading ? (
                        <div className='flex justify-center py-8'>
                          <Loader2 className='animate-spin text-blue-500' size={32} />
                        </div>
                      ) : clients.length > 0 ? (
                        <>
                          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-80 overflow-y-auto p-4 border ${darkModeClasses.border.primary} rounded-xl ${darkModeClasses.bg.input}`}>
                            {clients.map((client, index) => (
                              <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                type='button'
                                key={client._id}
                                onClick={() => handleSelectClient(client)}
                                className={`p-4 cursor-pointer ${darkModeClasses.bg.input} border ${darkModeClasses.border.primary} rounded-xl ${dark ? 'hover:bg-green-900/50 hover:border-green-600' : 'hover:bg-green-50 hover:border-green-300'
                                  } transition-all duration-200 text-left`}
                              >
                                <div className='flex items-center justify-between mb-3'>
                                  <div className='flex items-center gap-3'>
                                    <div className={`${dark ? 'bg-blue-800' : 'bg-blue-100'} p-2 rounded-lg`}>
                                      <User size={16} className='text-blue-600' />
                                    </div>
                                    <span className={`font-semibold ${darkModeClasses.text.primary}`}>
                                      {client.name}
                                    </span>
                                  </div>
                                  <span className={`${dark ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-700'} text-xs px-2 py-1 rounded-full font-medium`}>
                                    {client.totalOrders || 0} буюртма
                                  </span>
                                </div>

                                <div className='flex items-center gap-2 text-sm text-gray-600 mb-2'>
                                  <Phone size={14} />
                                  <span>{client.phoneNumber}</span>
                                </div>
                              </motion.button>
                            ))}
                          </div>

                          {/* Client pagination */}
                          {clientPagination.totalPages > 1 && (
                            <div className='flex items-center justify-between pt-4 border-t border-gray-200'>
                              <div className={`text-sm ${darkModeClasses.text.muted}`}>
                                Кўрсатилган: {((clientPagination.page - 1) * clientPagination.limit) + 1}-{Math.min(clientPagination.page * clientPagination.limit, clientPagination.total)}/{clientPagination.total}
                              </div>

                              <div className='flex items-center gap-2'>
                                <button
                                  onClick={() => handleClientPageChange(clientPagination.page - 1)}
                                  disabled={clientPagination.page <= 1}
                                  className={`flex items-center gap-1 px-3 py-1 rounded-lg ${clientPagination.page <= 1
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                                    } ${darkModeClasses.text.primary}`}
                                >
                                  <ChevronLeft size={18} />
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
                                        onClick={() => handleClientPageChange(pageNum)}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${clientPagination.page === pageNum
                                          ? 'bg-blue-500 text-white'
                                          : `hover:bg-gray-200 dark:hover:bg-gray-700 ${darkModeClasses.text.primary}`
                                          }`}
                                      >
                                        {pageNum}
                                      </button>
                                    )
                                  })}
                                </div>

                                <button
                                  onClick={() => handleClientPageChange(clientPagination.page + 1)}
                                  disabled={clientPagination.page >= clientPagination.totalPages}
                                  className={`flex items-center gap-1 px-3 py-1 rounded-lg ${clientPagination.page >= clientPagination.totalPages
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                                    } ${darkModeClasses.text.primary}`}
                                >
                                  <ChevronRight size={18} />
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className={`text-center py-8 ${darkModeClasses.text.muted} ${darkModeClasses.bg.input} rounded-xl border ${darkModeClasses.border.primary}`}>
                          <User size={48} className='mx-auto mb-3 text-gray-400' />
                          <p className='font-medium'>Мижоз топилмади</p>
                          <p className='text-sm mt-1'>Қидирув шартларингизга мос келувчи мижоз мавжуд эмас</p>
                        </div>
                      )}
                    </div>
                  ) : clientData.clientId ? (
                    // Tanlangan client ko'rinishi
                    <div className='space-y-4'>
                      <div className={`flex items-center justify-between p-4 ${dark ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'
                        } border rounded-xl`}>
                        <div className='flex items-center gap-3'>
                          <div className={`${dark ? 'bg-green-800' : 'bg-green-100'} p-2 rounded-lg`}>
                            <User size={20} className='text-green-600' />
                          </div>
                          <div>
                            <h4 className={`font-semibold ${darkModeClasses.text.primary}`}>{clientData.name}</h4>
                            <p className={darkModeClasses.text.secondary}>{clientData.phoneNumber}</p>
                            {clientData.address && (
                              <p className={darkModeClasses.text.muted}>{clientData.address}</p>
                            )}
                          </div>
                        </div>
                        <button
                          type='button'
                          onClick={handleClearClient}
                          className={`flex items-center gap-2 ${dark ? 'text-red-400 hover:text-red-300 bg-red-900/50 hover:bg-red-800/50' : 'text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100'
                            } px-3 py-2 rounded-lg transition-all duration-200`}
                        >
                          <X size={16} />
                          Ўзгартириш
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Yangi mijoz formasi
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                      <div className='space-y-2'>
                        <label className={`text-sm font-semibold ${darkModeClasses.text.primary} flex items-center gap-2`}>
                          <User size={16} className={darkModeClasses.text.muted} />
                          Исм / Номи <span className='text-red-500'>*</span>
                        </label>
                        <input
                          type='text'
                          value={clientData.name}
                          onChange={e => handleClientChange('name', e.target.value)}
                          placeholder='Аҳмаджон'
                          className={`border ${darkModeClasses.bg.input} w-full p-4 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
                          required
                        />
                      </div>

                      <div className='space-y-2'>
                        <label className={`text-sm font-semibold ${darkModeClasses.text.primary} flex items-center gap-2`}>
                          <Phone size={16} className={darkModeClasses.text.muted} />
                          Телефон рақам <span className='text-red-500'>*</span>
                        </label>
                        <input
                          type='text'
                          value={clientData.phoneNumber}
                          onChange={e => handleClientChange('phoneNumber', e.target.value)}
                          placeholder='+998 90 123 45 67'
                          required
                          className={`border ${darkModeClasses.bg.input} w-full p-4 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Mahsulotlar qidiruv */}
                <div className={`${darkModeClasses.bg.card} rounded-2xl border ${darkModeClasses.border.primary} p-6`}>
                  <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4'>
                    <h3 className={`text-lg font-semibold ${darkModeClasses.text.primary} flex items-center gap-2`}>
                      <Package size={20} className='text-blue-600' />
                      Маҳсулотларни танлаш
                    </h3>

                    {/* Mahsulot turini tanlash */}
                    <div className='flex items-center gap-3'>
                      <Filter size={18} className={darkModeClasses.text.muted} />
                      <div className={`flex ${dark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-1`}>
                        <button
                          type='button'
                          onClick={() => setProductType('ready')}
                          className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${productType === 'ready'
                            ? dark
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-blue-500 text-white shadow-sm'
                            : dark
                              ? 'text-gray-300 hover:text-white'
                              : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                          Тайёр маҳсулотлар
                        </button>
                        <button
                          type='button'
                          onClick={() => setProductType('raw')}
                          className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${productType === 'raw'
                            ? dark
                              ? 'bg-green-600 text-white shadow-sm'
                              : 'bg-green-500 text-white shadow-sm'
                            : dark
                              ? 'text-gray-300 hover:text-white'
                              : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                          Хом ашё
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Qidiruv */}
                  <div className='relative mb-6'>
                    <input
                      type='text'
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder='Маҳсулот номи ёки ID си бўйича қидириш...'
                      className={`border ${darkModeClasses.bg.input} w-full p-4 rounded-xl pl-12 focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
                    />
                    <Search
                      className='absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400'
                      size={20}
                    />
                  </div>

                  {/* Mahsulot turi indikatori */}
                  <div className='mb-4'>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${productType === 'ready'
                      ? dark
                        ? 'bg-blue-900/50 text-blue-300 border border-blue-700'
                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                      : dark
                        ? 'bg-green-900/50 text-green-300 border border-green-700'
                        : 'bg-green-100 text-green-700 border border-green-200'
                      }`}>
                      <div className={`w-2 h-2 rounded-full ${productType === 'ready'
                        ? dark ? 'bg-blue-400' : 'bg-blue-500'
                        : dark ? 'bg-green-400' : 'bg-green-500'
                        }`}></div>
                      {productType === 'ready' ? 'Тайёр маҳсулотлар' : 'Хом ашё'}
                      ({productPagination.total} та мавжуд)
                    </div>
                  </div>

                  {/* Mahsulotlar ro'yxati */}
                  {loading ? (
                    <div className='flex h-48 items-center justify-center'>
                      <Loader2 className='animate-spin text-blue-500' size={32} />
                    </div>
                  ) : products.length > 0 ? (
                    <>
                      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto p-4 border ${darkModeClasses.border.primary} rounded-xl ${dark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        {products.map((product, index) => (
                          <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            type='button'
                            key={product._id}
                            onClick={() => handleAddProduct(product)}
                            disabled={product.stock === 0}
                            className={`p-4 ${darkModeClasses.bg.input} border rounded-xl transition-all duration-200 text-left relative ${product.stock === 0
                              ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-300'
                              : dark
                                ? 'hover:bg-blue-900/50 hover:border-blue-600'
                                : 'hover:bg-blue-50 hover:border-blue-300'
                              } border-l-4 ${productType === 'raw'
                                ? dark ? 'border-l-green-500' : 'border-l-green-400'
                                : dark ? 'border-l-blue-500' : 'border-l-blue-400'
                              }`}
                          >
                            {/* Mahsulot turi indikatori */}
                            <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${productType === 'ready'
                              ? dark ? 'bg-blue-400' : 'bg-blue-400'
                              : dark ? 'bg-green-400' : 'bg-green-400'
                              }`}></div>

                            <div className='space-y-2'>
                              <span className={`font-medium ${darkModeClasses.text.primary} block`}>
                                {product.title}
                              </span>
                              <p className={darkModeClasses.text.muted}>ID: {product.ID}</p>
                              <div className='flex items-center justify-between'>
                                <div>
                                  <p className={`text-sm font-medium ${product.stock === 0
                                    ? 'text-red-500'
                                    : darkModeClasses.text.secondary
                                    }`}>
                                    Қолдиқ: {product.stock} {product.unit || 'дона'}
                                  </p>
                                  {product.unit !== "дона" && product.count > 0 && (
                                    <p className={`text-sm ${darkModeClasses.text.muted}`}>
                                      ({product.count} дона)
                                    </p>
                                  )}
                                </div>
                                <p className={`text-sm font-bold ${dark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                                  {product.price?.toLocaleString()} {product.priceType === 'uz' ? 'сўм' : '$'}
                                </p>
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>

                      {/* Mahsulot pagination */}
                      {productPagination.totalPages > 1 && (
                        <div className='flex items-center justify-between pt-4 border-t border-gray-200 mt-4'>
                          <div className={`text-sm ${darkModeClasses.text.muted}`}>
                            Кўрсатилган: {((productPagination.page - 1) * productPagination.limit) + 1}-{Math.min(productPagination.page * productPagination.limit, productPagination.total)}/{productPagination.total}
                          </div>

                          <div className='flex items-center gap-2'>
                            <button
                              onClick={() => handleProductPageChange(productPagination.page - 1)}
                              disabled={productPagination.page <= 1}
                              className={`flex items-center gap-1 px-3 py-1 rounded-lg ${productPagination.page <= 1
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                                } ${darkModeClasses.text.primary}`}
                            >
                              <ChevronLeft size={18} />
                            </button>

                            <div className='flex items-center gap-1'>
                              {Array.from({ length: Math.min(5, productPagination.totalPages) }, (_, i) => {
                                let pageNum
                                if (productPagination.totalPages <= 5) {
                                  pageNum = i + 1
                                } else if (productPagination.page <= 3) {
                                  pageNum = i + 1
                                } else if (productPagination.page >= productPagination.totalPages - 2) {
                                  pageNum = productPagination.totalPages - 4 + i
                                } else {
                                  pageNum = productPagination.page - 2 + i
                                }

                                return (
                                  <button
                                    key={pageNum}
                                    onClick={() => handleProductPageChange(pageNum)}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${productPagination.page === pageNum
                                      ? 'bg-blue-500 text-white'
                                      : `hover:bg-gray-200 dark:hover:bg-gray-700 ${darkModeClasses.text.primary}`
                                      }`}
                                  >
                                    {pageNum}
                                  </button>
                                )
                              })}
                            </div>

                            <button
                              onClick={() => handleProductPageChange(productPagination.page + 1)}
                              disabled={productPagination.page >= productPagination.totalPages}
                              className={`flex items-center gap-1 px-3 py-1 rounded-lg ${productPagination.page >= productPagination.totalPages
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                                } ${darkModeClasses.text.primary}`}
                            >
                              <ChevronRight size={18} />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className='text-center py-8 col-span-full'>
                      <Package size={48} className='mx-auto mb-3 text-gray-400' />
                      <p className={darkModeClasses.text.secondary}>Маҳсулот топилмади</p>
                      <p className={`text-sm ${darkModeClasses.text.muted} mt-1`}>
                        {productType === 'ready'
                          ? 'Тайёр маҳсулотлар мавжуд эмас'
                          : 'Хом ашё мавжуд эмас'
                        }
                      </p>
                    </div>
                  )}
                </div>

                {/* Tanlangan mahsulotlar */}
                {selectedProducts.length > 0 && (
                  <div className={`${darkModeClasses.bg.card} rounded-2xl border ${darkModeClasses.border.primary} p-6`}>
                    <h3 className={`text-lg font-semibold ${darkModeClasses.text.primary} mb-4 flex items-center gap-2`}>
                      <CheckCircle size={20} className='text-green-600' />
                      Танланган маҳсулотлар ({selectedProducts.length})
                    </h3>

                    {/* Mahsulot turlari bo'yicha guruhlash */}
                    <div className='space-y-4'>
                      {/* Tayyor mahsulotlar */}
                      {selectedProducts.filter(p => p.productType === 'ready').length > 0 && (
                        <div>
                          <h4 className={`text-sm font-medium ${dark ? 'text-blue-300' : 'text-blue-700'
                            } mb-2 flex items-center gap-2`}>
                            <div className={`w-2 h-2 rounded-full ${dark ? 'bg-blue-400' : 'bg-blue-500'
                              }`}></div>
                            Тайёр маҳсулотлар
                          </h4>
                          <div className='space-y-3'>
                            {selectedProducts
                              .filter(p => p.productType === 'ready')
                              .map((item, index) => (
                                <ProductItem
                                  key={`ready-${item._id}-${index}`}
                                  item={item}
                                  onQuantityChange={handleQuantityChange}
                                  onInputQuantityChange={handleInputQuantityChange}
                                  onCountChange={handleCountChange}
                                  onInputCountChange={handleInputCountChange}
                                  onRemove={handleRemoveProduct}
                                  color="blue"
                                  dark={dark}
                                  darkModeClasses={darkModeClasses}
                                />
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Xomashyo mahsulotlar */}
                      {selectedProducts.filter(p => p.productType === 'raw').length > 0 && (
                        <div>
                          <h4 className={`text-sm font-medium ${dark ? 'text-green-300' : 'text-green-700'
                            } mb-2 flex items-center gap-2`}>
                            <div className={`w-2 h-2 rounded-full ${dark ? 'bg-green-400' : 'bg-green-500'
                              }`}></div>
                            Хом ашё
                          </h4>
                          <div className='space-y-3'>
                            {selectedProducts
                              .filter(p => p.productType === 'raw')
                              .map((item, index) => (
                                <ProductItem
                                  key={`raw-${item._id}-${index}`}
                                  item={item}
                                  onQuantityChange={handleQuantityChange}
                                  onInputQuantityChange={handleInputQuantityChange}
                                  onCountChange={handleCountChange}
                                  onInputCountChange={handleInputCountChange}
                                  onRemove={handleRemoveProduct}
                                  color="green"
                                  dark={dark}
                                  darkModeClasses={darkModeClasses}
                                />
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit buttons */}
                <div className='flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200'>
                  <button
                    type='button'
                    onClick={onClose}
                    className='flex items-center justify-center gap-2 px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all duration-200 w-full sm:w-auto'
                  >
                    <X size={20} />
                    Бекор қилиш
                  </button>

                  <button
                    type='submit'
                    disabled={submitting || selectedProducts.length === 0}
                    className='flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto flex-1'
                  >
                    {submitting ? (
                      <Loader2 className='animate-spin' size={20} />
                    ) : (
                      <Save size={20} />
                    )}
                    {submitting ? 'Сақланмоқда...' : 'Буюртмани сақлаш'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Alohida ProductItem komponenti - updated version
const ProductItem = ({
  item,
  onQuantityChange,
  onInputQuantityChange,
  onCountChange,
  onInputCountChange,
  onRemove,
  color,
  dark,
  darkModeClasses
}) => {
  const colorClasses = {
    blue: dark
      ? 'border-l-blue-500 hover:bg-blue-900/30'
      : 'border-l-blue-400 hover:bg-blue-50',
    green: dark
      ? 'border-l-green-500 hover:bg-green-900/30'
      : 'border-l-green-400 hover:bg-green-50'
  }

  const bgClass = dark ? 'bg-gray-700' : 'bg-gray-50'
  const textClass = dark ? 'text-white' : 'text-gray-800'
  const mutedTextClass = dark ? 'text-gray-300' : 'text-gray-600'
  const inputBgClass = dark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
  const totalPrice = item.price * item.quantity

  // count учун максимал қиймат
  const maxCount = item.originalCount || item.count || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center justify-between p-4 border ${dark ? 'border-gray-600' : 'border-gray-200'} rounded-xl ${bgClass} transition-all duration-200 border-l-4 ${colorClasses[color]}`}
    >
      <div className='flex-1 min-w-0'>
        <div className='flex items-center justify-between mb-2'>
          <div className={`font-medium ${textClass} truncate mr-2`}>
            {item.title}
          </div>
          <span className={`text-sm ${mutedTextClass}`}>
            ID: {item.ID}
          </span>
        </div>

        <div className='flex items-center justify-between mb-3'>
          <div className='text-sm'>
            <span className={mutedTextClass}>Нарх: </span>
            <span className={`font-semibold ${dark ? 'text-yellow-400' : 'text-yellow-600'}`}>
              {item.price?.toLocaleString()} {item.priceType === 'uz' ? 'сўм' : '$'}
            </span>
          </div>

          <div className='text-sm text-right'>
            <div>
              <span className={mutedTextClass}>Жами: </span>
              <span className={`${dark ? 'text-green-400' : 'text-green-600'}`}>
                {item.stock} {item.unit}
              </span>
            </div>
            {item.unit !== "дона" && maxCount > 0 && (
              <div>
                <span className={mutedTextClass}>Дона: </span>
                <span className={`${dark ? 'text-green-400' : 'text-green-600'}`}>
                  {maxCount} дона
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className='flex items-center gap-4 ml-4'>
        {/* Unit (asosiy o'lchov) uchun input */}
        <div className="flex flex-col gap-2">
          <div className={`flex items-center gap-2 ${inputBgClass} px-3 py-2 rounded-lg border`}>
            <button
              type='button'
              onClick={() => onQuantityChange(item._id, -1)}
              className={`p-1 ${dark ? 'bg-gray-500 hover:bg-gray-400' : 'bg-gray-100 hover:bg-gray-200'} rounded-full transition`}
            >
              <Minus size={16} />
            </button>
            <input
              type='number'
              min='1'
              max={item.stock}
              step='any'
              value={item.quantity}
              onChange={e => onInputQuantityChange(item._id, e.target.value)}
              className={`w-16 text-center border-0 bg-transparent outline-none ${textClass}`}
            />
            <button
              type='button'
              onClick={() => onQuantityChange(item._id, 1)}
              className={`p-1 ${dark ? 'bg-gray-500 hover:bg-gray-400' : 'bg-gray-100 hover:bg-gray-200'} rounded-full transition`}
            >
              <Plus size={16} />
            </button>
            <span className={`text-sm ${mutedTextClass} whitespace-nowrap`}>
              {item.unit}
            </span>
          </div>

          {/* Agar unit "дона" emas bo'lsa, count uchun ham input qo'shamiz */}
          {item.unit !== "дона" && maxCount > 0 && (
            <div className={`flex items-center gap-2 ${inputBgClass} px-3 py-2 rounded-lg border`}>
              <button
                type='button'
                onClick={() => onCountChange(item._id, -1)}
                disabled={(item.count || 0) <= 0}
                className={`p-1 ${(item.count || 0) <= 0 ? 'opacity-50 cursor-not-allowed' : ''} ${dark ? 'bg-gray-500 hover:bg-gray-400' : 'bg-gray-100 hover:bg-gray-200'} rounded-full transition`}
              >
                <Minus size={16} />
              </button>
              <input
                type='number'
                min='0'
                max={maxCount}
                value={item.count || 0}
                onChange={e => onInputCountChange(item._id, e.target.value)}
                className={`w-16 text-center border-0 bg-transparent outline-none ${textClass}`}
                placeholder='0'
              />
              <button
                type='button'
                onClick={() => onCountChange(item._id, 1)}
                disabled={(item.count || 0) >= maxCount}
                className={`p-1 ${(item.count || 0) >= maxCount ? 'opacity-50 cursor-not-allowed' : ''} ${dark ? 'bg-gray-500 hover:bg-gray-400' : 'bg-gray-100 hover:bg-gray-200'} rounded-full transition`}
              >
                <Plus size={16} />
              </button>
              <span className={`text-sm ${mutedTextClass} whitespace-nowrap`}>
                дона
              </span>
            </div>
          )}
        </div>

        <button
          type='button'
          onClick={() => onRemove(item._id)}
          className={`p-2 text-red-600 hover:text-red-800 ${dark ? 'hover:bg-red-900/50' : 'hover:bg-red-50'
            } rounded-lg transition`}
          title='Маҳсулотни ўчириш'
        >
          <X size={18} />
        </button>
      </div>
    </motion.div>
  )
}