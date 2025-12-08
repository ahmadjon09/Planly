import {
  X,
  Loader2,
  Trash2,
  CheckCircle,
  Plus,
  Package,
  DollarSign,
  Ruler,
  User,
  Phone,
  Search,
  Hash,
} from 'lucide-react'
import { useState, useContext, useEffect } from 'react'
import Fetch from '../middlewares/fetcher'
import { ContextData } from '../contextData/Context'

export default function AddProductModal({ open, setOpen, mutate, type }) {
  const { user, dark } = useContext(ContextData)
  const productType = type

  const [products, setProducts] = useState([
    {
      title: '',
      price: '',
      stock: '',
      unit: 'дона',
      ready: productType === 'ready',
      priceType: 'en', // Default 'en' (dollar)
      count: '' // Faqat unit "дона" bo'lmaganda ishlatiladi
    }
  ])

  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)

  // Client ma'lumotlari
  const [clientData, setClientData] = useState({
    clientId: '',
    name: '',
    phoneNumber: ''
  })

  const availableUnits = [
    'дона',
    'кг',
    'метр',
    'литр',
    'м²',
    'м³',
    'сет',
    'упаковка',
    'пакет',
    'коробка'
  ]

  // 🔍 Clientlarni yuklash
  useEffect(() => {
    if (open) {
      fetchClients()
    }
  }, [open])

  // URL'dan type parametrini o'qish
  useEffect(() => {
    if (productType === 'ready') {
      setProducts(prev => prev.map(p => ({
        ...p,
        ready: true,
        priceType: 'en'
      })))
    }
  }, [productType, open])

  const fetchClients = async () => {
    try {
      const response = await Fetch.get('/products/clients')
      setClients((response.data?.data || []).filter(c => c.clietn === false));
    } catch (error) {
      console.error('Clientlarni yuklashda xatolik:', error)
      try {
        const backupResponse = await Fetch.get('/clients')
        setClients(backupResponse.data || [])
      } catch (backupError) {
        console.error('Backup client yuklashda xatolik:', backupError)
      }
    }
  }

  // 🔄 Number filter function
  const filterNumbers = (value) => {
    return value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')
  }

  // 🔄 Product input change handler
  const handleChange = (i, field, value) => {
    const newProducts = [...products]

    // Agar number field bo'lsa, faqat raqamlarga filter qo'llaymiz
    if (field === 'price' || field === 'stock' || field === 'count') {
      newProducts[i][field] = filterNumbers(value)
    } else {
      newProducts[i][field] = value
    }

    // Agar unit "дона" ga o'zgarsa, count ni tozalash
    if (field === 'unit') {
      if (value === 'дона') {
        newProducts[i].count = ''
      }
    }

    setProducts(newProducts)
  }

  // 🔄 Client ma'lumotlarini o'zgartirish
  const handleClientChange = (field, value) => {
    setClientData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 🔍 Client tanlash
  const handleClientSelect = (client) => {
    setSelectedClient(client)
    setClientData({
      clientId: client._id,
      name: client.name,
      phoneNumber: client.phoneNumber
    })
    setShowClientDropdown(false)
    setSearchTerm('')
  }

  // Client tanlovini bekor qilish
  const handleClearClient = () => {
    setSelectedClient(null)
    setClientData({
      clientId: '',
      name: '',
      phoneNumber: ''
    })
    setSearchTerm('')
  }

  // ➕ Yangi product qator qo'shish
  const addRow = () =>
    setProducts([
      ...products,
      {
        title: '',
        price: '',
        stock: '',
        unit: 'дона',
        ready: productType === 'ready' ? true : false,
        priceType: 'en',
        count: ''
      }
    ])

  // ❌ Product qatorini o'chirish
  const removeRow = i => setProducts(products.filter((_, idx) => idx !== i))

  // ✅ Form validation
  const validateForm = () => {
    // Client validation
    if (!clientData.name.trim() || !clientData.phoneNumber.trim()) {
      alert('❌ Клиент исми ва телефон рақамини киритинг')
      return false
    }

    // Products validation
    for (let i = 0; i < products.length; i++) {
      const p = products[i]

      // Title required
      if (!p.title.trim()) {
        alert(`❌ ${i + 1}-маҳсулот учун номини киритинг`)
        return false
      }

      // Price majburiy
      if (!p.price || Number(p.price) <= 0) {
        alert(`❌ ${i + 1}-маҳсулот учун нархини тўғри киритинг`)
        return false
      }

      // Stock required
      if (!p.stock || Number(p.stock) <= 0) {
        alert(`❌ ${i + 1}-маҳсулот учун миқдорни киритинг`)
        return false
      }

      // Agar unit "дона" bo'lmasa, count required
      if (p.unit !== 'дона' && (!p.count || Number(p.count) <= 0)) {
        alert(`❌ ${i + 1}-маҳсулот учун дона сонини киритинг (${p.unit})`)
        return false
      }
    }

    return true
  }

  // 💾 Formani yuborish
  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      // Payload tayyorlash - count faqat unit "дона" bo'lmaganda yuboriladi
      const payload = {
        ...(clientData.clientId ? { clientId: clientData.clientId } : {
          client: {
            name: clientData.name,
            phoneNumber: clientData.phoneNumber
          }
        }),
        products: products.map(p => {
          // Asosiy product ma'lumotlari
          const baseProduct = {
            title: p.title,
            price: p.price ? Number(p.price) : 0,
            stock: p.stock ? Number(p.stock) : 1,
            unit: p.unit,
            ready: p.ready,
            priceType: p.priceType
          }

          // Agar unit "дона" bo'lmaganda, faqat count ni yuboramiz
          if (p.unit !== 'дона' && p.count) {
            return {
              ...baseProduct,
              count: Number(p.count)
            }
          }

          return baseProduct
        })
      }

      console.log('Payload:', payload)

      const response = await Fetch.post('/products/create', payload)

      // Muvaffaqiyatli
      mutate()
      setOpen(false)
      resetForm()

      alert(`✅ ${products.length} та маҳсулот муваффақиятли қўшилди`)

    } catch (err) {
      console.error('Xatolik:', err)
      const errorMsg = err.response?.data?.message ||
        err.message ||
        '❌ Маҳсулот қўшишда хатолик юз берди'
      alert(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // 🔄 Formani tozalash
  const resetForm = () => {
    setProducts([
      {
        title: '',
        price: '',
        stock: '',
        unit: 'дона',
        ready: productType === 'ready' ? true : false,
        priceType: 'en',
        count: ''
      }
    ])
    setClientData({
      clientId: '',
      name: '',
      phoneNumber: ''
    })
    setSelectedClient(null)
    setSearchTerm('')
  }

  // 🔍 Filtered clients
  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phoneNumber?.includes(searchTerm)
  )

  // Dark mode styles
  const modalBg = dark ? 'bg-gray-900' : 'bg-white'
  const textColor = dark ? 'text-white' : 'text-gray-800'
  const textMuted = dark ? 'text-gray-300' : 'text-gray-600'
  const borderColor = dark ? 'border-gray-700' : 'border-gray-200'
  const inputBg = dark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
  const cardBg = dark ? 'bg-gray-800 border-gray-700' : 'bg-gradient-to-br from-gray-50 to-white'
  const clientCardBg = dark ? 'bg-gray-800 border-gray-600' : 'bg-gradient-to-br from-gray-50 to-blue-50 border-blue-200'
  const dropdownBg = dark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
  const dropdownItemHover = dark ? 'hover:bg-gray-700' : 'hover:bg-blue-50'
  const buttonSecondary = dark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'

  if (!open) return null

  return (
    <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-[99] px-3 sm:px-6 py-6'>
      <div className={`${modalBg} w-full max-w-6xl rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 relative max-h-[95vh] overflow-y-auto ${borderColor}`}>
        {/* Header */}
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b ${borderColor}`}>
          <div className='flex items-center gap-3'>
            <div className={dark ? 'bg-blue-900 p-2 rounded-xl' : 'bg-blue-100 p-2 rounded-xl'}>
              <Plus size={24} className='text-blue-600' />
            </div>
            <div>
              <h2 className={`text-xl sm:text-2xl font-bold ${textColor}`}>
                Янги маҳсулот(лар) қўшиш
              </h2>
              <p className={`text-sm ${textMuted} mt-1`}>
                Бир нечта маҳсулотни бир вақтниң ўзида қўшиш имкони
                {productType === 'ready' && ' 🟢 Тайёр маҳсулот'}
                {productType === 'raw' && ' 🟡 Хом ашё'}
              </p>
            </div>
          </div>

          {/* ❌ Close button */}
          <button
            onClick={() => setOpen(false)}
            className={`p-2 rounded-xl transition-colors ${dark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
          >
            <X size={24} />
          </button>
        </div>

        {/* 📋 CLIENT маълумотлари */}
        <div className={`rounded-2xl border p-6 ${clientCardBg}`}>
          <div className='flex items-center gap-3 mb-6'>
            <div className={dark ? 'bg-indigo-900 p-2 rounded-lg' : 'bg-indigo-100 p-2 rounded-lg'}>
              <User size={20} className='text-indigo-600' />
            </div>
            <div>
              <h3 className={`font-semibold text-lg ${textColor}`}>
                Таминотчи ҳақида маълумот
              </h3>
              <p className={`text-sm ${textMuted}`}>
                Барча маҳсулотлар учун бир Таминотчи
              </p>
            </div>
          </div>

          {selectedClient ? (
            // Selected client view
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className={dark ? 'bg-green-900 p-2 rounded-lg' : 'bg-green-100 p-2 rounded-lg'}>
                    <User size={20} className='text-green-600' />
                  </div>
                  <div>
                    <h4 className={`font-semibold ${textColor}`}>{selectedClient.name}</h4>
                    <p className={`text-sm ${textMuted}`}>{selectedClient.phoneNumber}</p>
                  </div>
                </div>
                <button
                  onClick={handleClearClient}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${dark
                    ? 'text-red-400 hover:text-red-300 bg-red-900 hover:bg-red-800'
                    : 'text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100'
                    }`}
                >
                  <X size={16} />
                  Ўзгартириш
                </button>
              </div>

              {selectedClient.products && selectedClient.products.length > 0 && (
                <div className={`border rounded-xl p-4 ${dark ? 'bg-yellow-900 border-yellow-700' : 'bg-yellow-50 border-yellow-200'
                  }`}>
                  <h5 className={`font-medium mb-2 flex items-center gap-2 ${dark ? 'text-yellow-200' : 'text-yellow-800'
                    }`}>
                    <Package size={16} />
                    Мавжуд маҳсулотлар: {selectedClient.products.length} та
                  </h5>
                  <div className={`text-sm ${dark ? 'text-yellow-300' : 'text-yellow-700'
                    }`}>
                    Ушбу Таминотчида {selectedClient.products.length} та маҳсулот мавжуд
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Client search and selection
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* 🔍 Mavjud clientlarni qidirish */}
              <div className='space-y-2'>
                <label className={`text-sm font-semibold flex items-center gap-2 ${textColor}`}>
                  <Search size={16} className='text-blue-500' />
                  Таминотчи танлаш
                </label>
                <div className='relative'>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setShowClientDropdown(true)
                    }}
                    onFocus={() => setShowClientDropdown(true)}
                    onBlur={() => {
                      setTimeout(() => {
                        setShowClientDropdown(false)
                      }, 100)
                    }}
                    className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all ${inputBg}`}
                    placeholder="Клиент исми ёки телефони бўйича излаш..."
                  />

                  <Search size={18} className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${dark ? 'text-gray-400' : 'text-gray-400'
                    }`} />

                  {showClientDropdown && filteredClients.length > 0 && (
                    <div
                      className={`absolute z-10 w-full mt-1 border rounded-xl shadow-lg max-h-60 overflow-y-auto ${dropdownBg}`}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {filteredClients.map(client => (
                        <div
                          key={client._id}
                          onClick={() => handleClientSelect(client)}
                          className={`p-3 cursor-pointer border-b ${dark
                            ? `${dropdownItemHover} border-gray-700`
                            : `${dropdownItemHover} border-gray-100`
                            } last:border-b-0`}
                        >
                          <div className='flex justify-between items-start'>
                            <div>
                              <div className={`font-medium ${dark ? 'text-white' : 'text-gray-800'}`}>{client.name}</div>
                              <div className={`text-sm ${dark ? 'text-gray-300' : 'text-gray-600'}`}>{client.phoneNumber}</div>
                            </div>
                            {client.products && (
                              <div className={`text-xs px-2 py-1 rounded-full ${dark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                                }`}>
                                {client.products.length} маҳсулот
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className='space-y-4'>
                <div className={`text-center py-4 border-2 border-dashed rounded-xl ${dark ? 'text-gray-400 border-gray-600' : 'text-gray-500 border-gray-300'
                  }`}>
                  <User size={32} className='mx-auto mb-2 text-gray-400' />
                  <p className='text-sm'>Ёки янги клиент қўшинг</p>
                </div>
              </div>

              {/* Yangi client ma'lumotlari */}
              <div className='lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200'>
                <div className='space-y-2'>
                  <label className={`text-sm font-semibold flex items-center gap-2 ${textColor}`}>
                    <User size={16} className={dark ? 'text-gray-400' : 'text-gray-500'} />
                    Исм / Номи <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={clientData.name}
                    onChange={e => handleClientChange('name', e.target.value)}
                    className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all ${inputBg}`}
                    placeholder='Аҳмаджон'
                    required
                  />
                </div>

                <div className='space-y-2'>
                  <label className={`text-sm font-semibold flex items-center gap-2 ${textColor}`}>
                    <Phone size={16} className={dark ? 'text-gray-400' : 'text-gray-500'} />
                    Телефон рақам <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={clientData.phoneNumber}
                    onChange={e => handleClientChange('phoneNumber', e.target.value)}
                    className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all ${inputBg}`}
                    placeholder='+998 90 123 45 67'
                    required
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 🔽 Product rows */}
        <div className='space-y-6'>
          {products.map((p, i) => (
            <div
              key={i}
              className={`rounded-2xl border p-6 space-y-6 relative ${cardBg} ${borderColor}`}
            >
              {/* Row header */}
              <div className={`flex justify-between items-center pb-4 border-b ${borderColor}`}>
                <div className='flex items-center gap-3'>
                  <div className='bg-blue-500 text-white p-2 rounded-lg'>
                    <Package size={18} />
                  </div>
                  <h3 className={`font-semibold ${textColor}`}>
                    Маҳсулот #{i + 1}
                    <span className={`ml-2 text-sm ${p.ready ? 'text-green-500' : 'text-yellow-500'}`}>
                      {p.ready ? '🟢 Тайёр' : '🟡 Хом ашё'}
                    </span>
                  </h3>
                </div>

                {products.length > 1 && (
                  <button
                    onClick={() => removeRow(i)}
                    className={`flex items-center gap-2 transition-all px-3 py-2 rounded-lg text-sm font-medium ${dark
                      ? 'text-red-400 hover:bg-red-900'
                      : 'text-red-600 hover:bg-red-50'
                      }`}
                  >
                    <Trash2 size={16} /> Ўчириш
                  </button>
                )}
              </div>

              {/* Asosiy maydonlar - 4 ustunli */}
              <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4'>
                {/* 🔹 Номи */}
                <div className='space-y-2'>
                  <label className={`text-sm font-semibold flex items-center gap-2 ${textColor}`}>
                    <Package size={16} className='text-blue-500' />
                    Номи <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={p.title}
                    onChange={e => handleChange(i, 'title', e.target.value)}
                    className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all ${inputBg}`}
                    placeholder='Маҳсулот номини киритинг...'
                    required
                  />
                </div>

                {/* 💰 Нархи */}
                <div className='space-y-2'>
                  <label className={`text-sm font-semibold flex items-center gap-2 ${textColor}`}>
                    <DollarSign size={16} className='text-green-500' />
                    Нархи <span className='text-red-500'>*</span>
                  </label>
                  <div className='relative'>
                    <input
                      type='text'
                      value={p.price}
                      onChange={e => handleChange(i, 'price', e.target.value)}
                      className={`w-full border rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all ${inputBg}`}
                      placeholder='0'
                      required
                    />
                    <span className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-sm ${dark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                      {p.priceType === "uz" ? "сўм" : "$"}
                    </span>
                  </div>
                </div>

                {/* 📦 Миқдор (Stock) */}
                <div className='space-y-2'>
                  <label className={`text-sm font-semibold flex items-center gap-2 ${textColor}`}>
                    <Package size={16} className='text-purple-500' />
                    Миқдор ({p.unit}) <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={p.stock}
                    onChange={e => handleChange(i, 'stock', e.target.value)}
                    className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all ${inputBg}`}
                    placeholder='1'
                    required
                  />
                  <p className={`text-xs ${textMuted}`}>
                    {p.unit} сони (умумий миқдор)
                  </p>
                </div>

                {/* ⚖️ Бирлик */}
                <div className='space-y-2'>
                  <label className={`text-sm font-semibold flex items-center gap-2 ${textColor}`}>
                    <Ruler size={16} className='text-orange-500' />
                    Бирлик
                  </label>
                  <select
                    value={p.unit}
                    onChange={e => handleChange(i, 'unit', e.target.value)}
                    className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all appearance-none ${inputBg}`}
                  >
                    {availableUnits.map(u => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Count input - faqat unit "дона" bo'lmaganda */}
              {p.unit !== 'дона' && (
                <div className='space-y-2'>
                  <label className={`text-sm font-semibold flex items-center gap-2 ${textColor}`}>
                    <Hash size={16} className='text-indigo-500' />
                    Умумий миқдори<span className='text-red-500'>*</span>
                  </label>
                  <div className='relative'>
                    <input
                      type='text'
                      value={p.count}
                      onChange={e => handleChange(i, 'count', e.target.value)}
                      className={`w-full border rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all ${inputBg}`}
                      placeholder='Умумий миқдори...'
                      required
                    />
                    <span className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-sm ${dark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                      дона
                    </span>
                  </div>
                  {/* <p className={`text-xs ${textMuted}`}>
                    1 {p.unit} = {p.count || '?'} дона
                  </p> */}
                </div>
              )}

              {/* Narx turi va Ready checkbox */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* 💵 Narx turi */}
                <div className='space-y-2'>
                  <label className={`text-sm font-semibold ${textColor}`}>
                    Нарх тури
                  </label>
                  <div className='flex gap-4'>
                    <label className='flex items-center gap-2 cursor-pointer'>
                      <input
                        type='radio'
                        value='uz'
                        checked={p.priceType === 'uz'}
                        onChange={e => handleChange(i, 'priceType', e.target.value)}
                        className='w-4 h-4 text-blue-600'
                      />
                      <span className={`text-sm ${textColor}`}>Сўм (UZS)</span>
                    </label>
                    <label className='flex items-center gap-2 cursor-pointer'>
                      <input
                        type='radio'
                        value='en'
                        checked={p.priceType === 'en'}
                        onChange={e => handleChange(i, 'priceType', e.target.value)}
                        className='w-4 h-4 text-blue-600'
                      />
                      <span className={`text-sm ${textColor}`}>Доллар ($)</span>
                    </label>
                  </div>
                </div>

                {/* ✅ Тайёрлиги (ready) */}
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${dark ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-200'
                  }`}>
                  <div
                    className={`p-1 rounded-lg ${p.ready ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                  >
                    <CheckCircle size={16} className='text-white' />
                  </div>
                  <div className='flex-1'>
                    <label className={`text-sm font-semibold cursor-pointer ${textColor}`}>
                      Маҳсулот тайёр
                      {productType === 'ready' && <span className='ml-2 text-xs text-green-500'> (Default ready)</span>}
                      {productType === 'raw' && <span className='ml-2 text-xs text-yellow-500'> (Default raw)</span>}
                    </label>
                    <p className={`text-xs ${textMuted}`}>
                      Белгиланса, маҳсулот тайёр деб ҳисобланади
                    </p>
                  </div>
                  <input
                    type='checkbox'
                    checked={p.ready}
                    onChange={e => handleChange(i, 'ready', e.target.checked)}
                    className={`w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer ${dark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                      }`}
                  />
                </div>
              </div>


            </div>
          ))}
        </div>

        {/* 🚀 Submit section */}
        <div className={`flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t ${borderColor}`}>
          <button
            onClick={addRow}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all font-medium w-full sm:w-auto ${dark
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
          >
            <Plus size={18} />
            Яна маҳсулот қўшиш
          </button>

          <div className='flex flex-col sm:flex-row gap-3 w-full sm:w-auto'>
            <button
              onClick={() => setOpen(false)}
              className={`px-6 py-3 rounded-xl border transition-all font-medium w-full sm:w-auto ${dark
                ? 'border-gray-600 hover:bg-gray-700 text-white'
                : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                }`}
            >
              Бекор қилиш
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className='flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium w-full sm:w-auto'
            >
              {loading ? (
                <>
                  <Loader2 className='animate-spin' size={18} />
                  Сақланимоқда...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Сақлаш ({products.length})
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className={`text-center text-sm pt-2 ${textMuted}`}>
          <div className={`p-3 rounded-lg ${dark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
            <p className='font-semibold mb-1'>📝 Эслатма:</p>
            <ul className='text-xs space-y-1 text-left'>
              <li>• Барча майдонлар мажбурий ёки рўйхатга олинади</li>
              <li>• <span className='font-semibold'>Нарх киритиш ҳамма учун мажбурий</span></li>
              <li>• <span className='font-semibold'>Бирлик "дона" бўлмаган ҳолда</span>, ҳар бир бўлим учун дона сони киритиш мажбурий</li>
              <li>• Default нарх тури: <span className='font-bold'>Доллар ($)</span></li>
              <li>• Default тайёрлик:
                <span className={`font-bold ${productType === 'ready' ? 'text-green-500' : 'text-yellow-500'}`}>
                  {productType === 'ready' ? ' Тайёр' : ' Хом ашё'}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}