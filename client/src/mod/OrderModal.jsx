import { useState, useEffect, useContext } from 'react'
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
  Filter
} from 'lucide-react'
import Fetch from '../middlewares/fetcher'
import { ContextData } from '../contextData/Context'
import { mutate } from 'swr'

export const AddNewOrder = ({ isOpen, onClose }) => {
  const { user } = useContext(ContextData)
  if (!isOpen) return null

  const [products, setProducts] = useState([])
  const [clients, setClients] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [customer, setCustomer] = useState(user._id)
  const [status, setStatus] = useState('Янги')
  const [payType, setPayType] = useState('Нақд')
  const [totalPrice, setTotalPrice] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [clientSearchQuery, setClientSearchQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(30)
  const [loading, setLoading] = useState(false)
  const [clientsLoading, setClientsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [showClientsList, setShowClientsList] = useState(false)
  const [productType, setProductType] = useState('ready') // 'ready' yoki 'raw'

  // Client ma'lumotlari
  const [clientData, setClientData] = useState({
    clientId: '',
    name: '',
    phoneNumber: '',
    address: ''
  })

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setClientsLoading(true)
      try {
        // Mahsulotlarni olish - tayyor va xomashyo alohida
        const productsRes = await Fetch.get(`/products/${productType}`)
        setProducts(productsRes.data?.data || [])

        // Clientlarni olish - products/clients endpointidan
        const clientsRes = await Fetch.get('/orders/clients')
        setClients((clientsRes.data?.data || []).filter(u => u.clietn === true))
      } catch (err) {
        console.error('❌ Маълумотларни олишда хатолик:', err)
        setMessage({ type: 'error', text: 'Маълумотларни юклашда хатолик!' })
      } finally {
        setLoading(false)
        setClientsLoading(false)
      }
    }
    fetchData()
  }, [productType])

  // Product type o'zgarganda mahsulotlarni qayta yuklash
  useEffect(() => {
    if (isOpen) {
      const fetchProducts = async () => {
        setLoading(true)
        try {
          const productsRes = await Fetch.get(`/products/${productType}`)
          setProducts(productsRes.data?.data || [])
        } catch (err) {
          console.error('❌ Маҳсулотларни олишда хатолик:', err)
          setMessage({ type: 'error', text: 'Маҳсулотларни юклашда хатолик!' })
        } finally {
          setLoading(false)
        }
      }
      fetchProducts()
    }
  }, [productType, isOpen])

  // Clientlarni filter qilish
  const filteredClients = clients.filter(client => {
    const q = clientSearchQuery.toLowerCase()
    return (
      q === '' ||
      client.name?.toLowerCase().includes(q) ||
      client.phoneNumber?.includes(q) ||
      client.address?.toLowerCase().includes(q)
    )
  })

  const filteredProducts = products?.filter(p => {
    const q = searchQuery.toLowerCase()
    return (
      q === '' ||
      p.ID.toString().includes(q) ||
      p.title.toLowerCase().includes(q)
    )
  })

  const visibleProducts = filteredProducts.slice(0, visibleCount)

  // Client tanlash funksiyasi
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

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 10, filteredProducts.length))
  }

  const handleAddProduct = product => {
    if (product.stock === 0) {
      setMessage({ type: 'error', text: 'Бу маҳсулот қолмаган!' })
      return
    }

    if (
      !selectedProducts.some(p => p._id === product._id) &&
      product.stock !== 0
    ) {
      setSelectedProducts(prev => [
        ...prev,
        {
          ...product,
          quantity: 1,
          price: product.price,
          unit: product.unit || 'дона',
          productType: productType // Mahsulot turini saqlaymiz
        }
      ])
    }
  }

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

  useEffect(() => {
    const total = selectedProducts.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
    setTotalPrice(total)
  }, [selectedProducts])

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

  const handleSubmit = async e => {
    e.preventDefault()
    if (selectedProducts.length === 0)
      return setMessage({
        type: 'error',
        text: 'Ҳеч қандай маҳсулот танланмаган!'
      })

    if (!clientData.name || !clientData.phoneNumber)
      return setMessage({
        type: 'error',
        text: 'Мижоз маълумотларини тўлиқ киритинг!'
      })

    setSubmitting(true)
    try {
      const orderData = {
        customer,
        products: selectedProducts.map(p => ({
          product: p._id,
          amount: p.quantity,
          unit: p.unit,
          price: p.price,
          productType: p.productType // Mahsulot turini serverga yuboramiz
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
      console.log(orderData);

      await Fetch.post('/orders/new', orderData)

      setMessage({ type: 'success', text: 'Буюртма муваффақиятли яратилди ✅' })
      mutate('/orders')
      mutate('/products')
      setSelectedProducts([])
      setStatus('Янги')
      setPayType('Нақд')
      setTotalPrice(0)
      setClientData({
        clientId: '',
        name: '',
        phoneNumber: '',
        address: ''
      })
      setSearchQuery('')
      setVisibleCount(30)
      setTimeout(() => onClose(), 1500)
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Буюртма яратишда хатолик ❌' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      onClick={onClose}
      className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'
    >
      <div
        onClick={e => e.stopPropagation()}
        className='bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[95vh] overflow-y-auto relative'
      >
        <button
          onClick={onClose}
          className='absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 bg-white rounded-full shadow-lg z-10'
        >
          <X size={24} />
        </button>

        <div className='p-6'>
          <div className='flex items-center gap-3 mb-6'>
            <div className='bg-blue-100 p-3 rounded-xl'>
              <Package size={28} className='text-blue-600' />
            </div>
            <div>
              <h2 className='text-2xl font-bold text-gray-800'>
                Янги буюртма яратиш
              </h2>
              <p className='text-gray-600 mt-1'>
                Мижоз ва маҳсулотларни танлаб буюртма яратинг
              </p>
            </div>
          </div>

          {message && (
            <div
              className={`flex items-center gap-2 mb-6 p-4 rounded-xl ${message.type === 'success'
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-red-100 text-red-700 border border-red-200'
                }`}
            >
              {message.type === 'success' ? (
                <CheckCircle size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
              <span className='font-medium'>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-8'>
            {/* 🧾 Mijoz ma'lumotlari */}
            <div className='bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border border-blue-200 p-6'>
              <div className='flex items-center justify-between mb-6'>
                <h3 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
                  <Users size={20} className='text-blue-600' />
                  Мижоз маълумотлари
                </h3>
                <button
                  type='button'
                  onClick={() => setShowClientsList(!showClientsList)}
                  className='flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all duration-200'
                >
                  <User size={16} />
                  {showClientsList ? 'Янги мижоз' : 'Мавжуд мижоз'}
                </button>
              </div>

              {showClientsList ? (
                <div className='space-y-4'>
                  <div className='relative'>
                    <input
                      type='text'
                      value={clientSearchQuery}
                      onChange={e => setClientSearchQuery(e.target.value)}
                      placeholder='Мижоз исми, телефон рақами ёки манзили бўйича қидириш...'
                      className='border border-gray-300 w-full p-4 rounded-xl pl-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white'
                    />
                    <Search
                      className='absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400'
                      size={20}
                    />
                  </div>

                  {clientsLoading ? (
                    <div className='flex justify-center py-8'>
                      <Loader2
                        className='animate-spin text-blue-500'
                        size={32}
                      />
                    </div>
                  ) : filteredClients.length > 0 ? (
                    <div className='grid grid-cols-1 md:grid-cols-4 gap-4 max-h-80 overflow-y-auto p-4 border border-gray-200 rounded-xl bg-white'>
                      {filteredClients.map((client, index) => (
                        <button
                          type='button'
                          key={client._id}
                          onClick={() => handleSelectClient(client)}
                          className='p-4 cursor-pointer bg-white border border-gray-200 rounded-xl hover:bg-green-50 hover:border-green-300 transition-all duration-200 text-left'
                        >
                          <div className='flex items-center justify-between mb-3'>
                            <div className='flex items-center gap-3'>
                              <div className='bg-blue-100 p-2 rounded-lg'>
                                <User size={16} className='text-blue-600' />
                              </div>
                              <span className='font-semibold text-gray-800'>
                                {client.name}
                              </span>
                            </div>
                            <span className='bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium'>
                              {client.totalOrders || 0} буюртма
                            </span>
                          </div>

                          <div className='flex items-center gap-2 text-sm text-gray-600 mb-2'>
                            <Phone size={14} />
                            <span>{client.phoneNumber}</span>
                          </div>

                          {client.address && (
                            <div className='flex items-center gap-2 text-sm text-gray-600 mb-2'>
                              <MapPin size={14} />
                              <span className='truncate'>{client.address}</span>
                            </div>
                          )}

                          {client.products && client.products.length > 0 && (
                            <div className='text-xs text-gray-500'>
                              {client.products.length} та маҳсулот мавжуд
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className='text-center py-8 text-gray-500 bg-white rounded-xl border border-gray-200'>
                      <User size={48} className='mx-auto mb-3 text-gray-400' />
                      <p className='font-medium'>Мижоз топилмади</p>
                      <p className='text-sm mt-1'>Қидирув шартларингизга мос келувчи мижоз мавжуд эмас</p>
                    </div>
                  )}
                </div>
              ) : clientData.clientId ? (
                // Tanlangan client ko'rinishi
                <div className='space-y-4'>
                  <div className='flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl'>
                    <div className='flex items-center gap-3'>
                      <div className='bg-green-100 p-2 rounded-lg'>
                        <User size={20} className='text-green-600' />
                      </div>
                      <div>
                        <h4 className='font-semibold text-gray-800'>{clientData.name}</h4>
                        <p className='text-sm text-gray-600'>{clientData.phoneNumber}</p>
                        {clientData.address && (
                          <p className='text-xs text-gray-500'>{clientData.address}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type='button'
                      onClick={handleClearClient}
                      className='flex items-center gap-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-all duration-200'
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
                    <label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
                      <User size={16} className='text-gray-500' />
                      Исм / Номи <span className='text-red-500'>*</span>
                    </label>
                    <input
                      type='text'
                      value={clientData.name}
                      onChange={e => handleClientChange('name', e.target.value)}
                      placeholder='Аҳмаджон'
                      className='border border-gray-300 w-full p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white'
                      required
                    />
                  </div>

                  <div className='space-y-2'>
                    <label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
                      <Phone size={16} className='text-gray-500' />
                      Телефон рақам <span className='text-red-500'>*</span>
                    </label>
                    <input
                      type='text'
                      value={clientData.phoneNumber}
                      onChange={e => handleClientChange('phoneNumber', e.target.value)}
                      placeholder='+998 90 123 45 67'
                      required
                      className='border border-gray-300 w-full p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white'
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Mahsulotlar qidiruv */}
            <div className='bg-white rounded-2xl border border-gray-200 p-6'>
              <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4'>
                <h3 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
                  <Package size={20} className='text-blue-600' />
                  Маҳсулотларни танлаш
                </h3>

                {/* Mahsulot turini tanlash */}
                <div className='flex items-center gap-3'>
                  <Filter size={18} className='text-gray-500' />
                  <div className='flex bg-gray-100 rounded-lg p-1'>
                    <button
                      type='button'
                      onClick={() => setProductType('ready')}
                      className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${productType === 'ready'
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                      Тайёр маҳсулотлар
                    </button>
                    <button
                      type='button'
                      onClick={() => setProductType('raw')}
                      className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${productType === 'raw'
                        ? 'bg-green-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                      Хом ашё
                    </button>
                  </div>
                </div>
              </div>

              <div className='relative mb-6'>
                <input
                  type='text'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder='Маҳсулот номи ёки ID си бўйича қидириш...'
                  className='border border-gray-300 w-full p-4 rounded-xl pl-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white'
                />
                <Search
                  className='absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400'
                  size={20}
                />
              </div>

              {/* Mahsulot turi indikatori */}
              <div className='mb-4'>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${productType === 'ready'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-green-100 text-green-700 border border-green-200'
                  }`}>
                  <div className={`w-2 h-2 rounded-full ${productType === 'ready' ? 'bg-blue-500' : 'bg-green-500'
                    }`}></div>
                  {productType === 'ready' ? 'Тайёр маҳсулотлар' : 'Хом ашё'}
                  ({filteredProducts.length} та мавжуд)
                </div>
              </div>

              {/* Mahsulotlar */}
              <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto p-4 border border-gray-200 rounded-xl bg-gray-50'>
                {loading ? (
                  <div className='flex h-48 items-center justify-center col-span-full'>
                    <Loader2 className='animate-spin text-blue-500' size={32} />
                  </div>
                ) : visibleProducts.length > 0 ? (
                  visibleProducts.map(product => (
                    <button
                      type='button'
                      key={product._id}
                      onClick={() => handleAddProduct(product)}
                      disabled={product.stock === 0}
                      className={`p-4 bg-white border rounded-xl transition-all duration-200 text-left relative ${product.stock === 0
                        ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-300'
                        : 'hover:bg-blue-50 hover:border-blue-300 border-gray-200 shadow-sm hover:shadow-md'
                        } ${productType === 'raw' ? 'border-l-4 border-l-green-400' : 'border-l-4 border-l-blue-400'
                        }`}
                    >
                      {/* Mahsulot turi indikatori */}
                      <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${productType === 'ready' ? 'bg-blue-400' : 'bg-green-400'
                        }`}></div>

                      <div className='space-y-2'>
                        <span className='font-medium text-gray-800 block'>
                          {product.title}
                        </span>
                        <p className='text-sm text-gray-500'>ID: {product.ID}</p>
                        <p
                          className={`text-sm font-medium ${product.stock === 0 ? 'text-red-500' : 'text-gray-600'
                            }`}
                        >
                          Қолдиқ: {product.stock} {product.unit || 'дона'}
                        </p>

                      </div>
                    </button>
                  ))
                ) : (
                  <div className='text-center py-8 col-span-full'>
                    <Package size={48} className='mx-auto mb-3 text-gray-400' />
                    <p className='text-gray-500 font-medium'>Маҳсулот топилмади</p>
                    <p className='text-sm text-gray-400 mt-1'>
                      {productType === 'ready'
                        ? 'Тайёр маҳсулотлар мавжуд эмас'
                        : 'Хом ашё мавжуд эмас'
                      }
                    </p>
                  </div>
                )}
              </div>

              {visibleCount < filteredProducts.length && (
                <div className='flex justify-center mt-4'>
                  <button
                    type='button'
                    onClick={handleLoadMore}
                    className='px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200 font-medium'
                  >
                    Яна 10 та юклаш
                  </button>
                </div>
              )}
            </div>

            {/* Tanlangan mahsulotlar */}
            {selectedProducts.length > 0 && (
              <div className='bg-white rounded-2xl border border-gray-200 p-6'>
                <h3 className='text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                  <CheckCircle size={20} className='text-green-600' />
                  Танланган маҳсулотлар ({selectedProducts.length})
                </h3>

                {/* Mahsulot turlari bo'yicha guruhlash */}
                <div className='space-y-4'>
                  {/* Tayyor mahsulotlar */}
                  {selectedProducts.filter(p => p.productType === 'ready').length > 0 && (
                    <div>
                      <h4 className='text-sm font-medium text-blue-700 mb-2 flex items-center gap-2'>
                        <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                        Тайёр маҳсулотлар
                      </h4>
                      <div className='space-y-3'>
                        {selectedProducts
                          .filter(p => p.productType === 'ready')
                          .map(item => (
                            <ProductItem
                              key={item._id}
                              item={item}
                              onQuantityChange={handleQuantityChange}
                              onInputQuantityChange={handleInputQuantityChange}
                              onRemove={() => setSelectedProducts(prev => prev.filter(p => p._id !== item._id))}
                              color="blue"
                            />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Xomashyo mahsulotlar */}
                  {selectedProducts.filter(p => p.productType === 'raw').length > 0 && (
                    <div>
                      <h4 className='text-sm font-medium text-green-700 mb-2 flex items-center gap-2'>
                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                        Хом ашё
                      </h4>
                      <div className='space-y-3'>
                        {selectedProducts
                          .filter(p => p.productType === 'raw')
                          .map(item => (
                            <ProductItem
                              key={item._id}
                              item={item}
                              onQuantityChange={handleQuantityChange}
                              onInputQuantityChange={handleInputQuantityChange}
                              onRemove={() => setSelectedProducts(prev => prev.filter(p => p._id !== item._id))}
                              color="green"
                            />
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Order details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Ҳолат</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="border border-gray-300 w-full p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  {["Янги", "Қабул қилинди", "Юборилди", "Бажарилди"].map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

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
                className='flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto'
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
      </div>
    </div>
  )
}

// Alohida ProductItem komponenti
const ProductItem = ({ item, onQuantityChange, onInputQuantityChange, onRemove, color }) => {
  const colorClasses = {
    blue: 'border-l-blue-400 hover:bg-blue-50',
    green: 'border-l-green-400 hover:bg-green-50'
  }

  return (
    <div
      className={`flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50 transition-all duration-200 border-l-4 ${colorClasses[color]}`}
    >
      <div className='flex-1 min-w-0'>
        <div className='font-medium text-gray-800 mb-1'>{item.title}</div>
        <div className='text-sm text-gray-600'>ID: {item.ID}</div>

      </div>

      <div className='flex items-center gap-4'>
        <div className='flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-300'>
          <button
            type='button'
            onClick={() => onQuantityChange(item._id, -1)}
            className='p-1 bg-gray-100 rounded-full hover:bg-gray-200 transition'
          >
            <Minus size={16} />
          </button>
          <input
            type='number'
            min='1'
            max={item.stock}
            value={item.quantity}
            onChange={e => onInputQuantityChange(item._id, e.target.value)}
            className='w-12 text-center border-0 bg-transparent outline-none'
          />
          <button
            type='button'
            onClick={() => onQuantityChange(item._id, 1)}
            className='p-1 bg-gray-100 rounded-full hover:bg-gray-200 transition'
          >
            <Plus size={16} />
          </button>
        </div>

        <span className='text-gray-700 font-medium w-20 text-center'>
          {item.unit || 'дона'}
        </span>
        <button
          type='button'
          onClick={onRemove}
          className='p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition'
          title='Маҳсулотни ўчириш'
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}