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
  MapPin,
  Search,
  ChevronLeft
} from 'lucide-react'
import { useState, useContext, useEffect } from 'react'
import Fetch from '../middlewares/fetcher'
import { ContextData } from '../contextData/Context'

export default function AddProductModal({ open, setOpen, mutate }) {
  const { user } = useContext(ContextData)
  const [products, setProducts] = useState([
    {
      title: '',
      price: '',
      stock: '',
      unit: 'дона',
      ready: false,
      ID: '',
      priceType: 'uz'
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
    phoneNumber: '',
    address: ''
  })

  const availableUnits = [
    'дона',
    'кг',
    'метр',
    'литр',
    'м²',
    'м³',
    'сет',
    'упаковка'
  ]

  // 🔍 Clientlarni yuklash - products/clients endpointidan
  useEffect(() => {
    if (open) {
      fetchClients()
    }
  }, [open])

  const fetchClients = async () => {
    try {
      const response = await Fetch.get('/products/clients')
      setClients((response.data?.data || []).filter(c => c.clietn === false));
    } catch (error) {
      console.error('Clientlarni yuklashda xatolik:', error)
      // Agar products/clients ishlamasa, oddiy clients endpointiga murojaat qilamiz
      try {
        const backupResponse = await Fetch.get('/clients')
        setClients(backupResponse.data || [])
      } catch (backupError) {
        console.error('Backup client yuklashda xatolik:', backupError)
      }
    }
  }

  // 🔄 Number filter function - faqat raqamlar va nuqta/rulon
  const filterNumbers = (value) => {
    return value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')
  }

  // 🔄 Product input change handler
  const handleChange = (i, field, value) => {
    const newProducts = [...products]

    // Agar number field bo'lsa, faqat raqamlarga filter qo'llaymiz
    if (field === 'price' || field === 'stock') {
      newProducts[i][field] = filterNumbers(value)
    } else {
      newProducts[i][field] = value
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
      phoneNumber: client.phoneNumber,
      address: client.address || ''
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
      phoneNumber: '',
      address: ''
    })
    setSearchTerm('')
  }

  // ➕ Add/remove rows
  const addRow = () =>
    setProducts([
      ...products,
      {
        title: '',
        price: '',
        stock: '',
        unit: 'дона',
        ready: false,
        ID: '',
        priceType: 'uz'
      }
    ])

  const removeRow = i => setProducts(products.filter((_, idx) => idx !== i))

  // 💾 Submit
  const handleSubmit = async () => {
    // Validate required fields
    for (let i = 0; i < products.length; i++) {
      const p = products[i]
      if (!p.title.trim()) {
        alert(`❌ ${i + 1}-маҳсулот учун номини киритинг`)
        return
      }
      if (user.role === 'admin') {
        if (!p.price || p.price === '' || Number(p.price) <= 0) {
          alert(`❌ ${i + 1}-маҳсулот учун нархини тўғри киритинг`)
          return
        }
      }
    }

    // Validate client fields
    if (!clientData.name.trim() || !clientData.phoneNumber.trim()) {
      alert('❌ Клиент исми ва телефон рақамини киритинг')
      return
    }

    setLoading(true)
    try {
      // Payload tayyorlash - number fieldlarni convert qilamiz
      const payload = {
        ...(clientData.clientId ? { clientId: clientData.clientId } : {
          client: {
            name: clientData.name,
            phoneNumber: clientData.phoneNumber,
            address: clientData.address
          }
        }),
        products: products.map(p => ({
          title: p.title,
          price: p.price ? Number(p.price) : 0,
          stock: p.stock ? Number(p.stock) : 1,
          unit: p.unit,
          ready: p.ready,
          priceType: p.priceType
        }))
      }

      console.log('Payload:', payload)

      await Fetch.post('/products/create', payload)
      mutate()
      setOpen(false)
      resetForm()
    } catch (err) {
      console.error(err)
      alert('❌ Маҳсулот қўшишда хатолик юз берди')
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
        ready: false,
        ID: '',
        priceType: 'uz'
      }
    ])
    setClientData({
      clientId: '',
      name: '',
      phoneNumber: '',
      address: ''
    })
    setSelectedClient(null)
    setSearchTerm('')
  }

  // 🔍 Filtered clients
  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phoneNumber?.includes(searchTerm)
  )

  if (!open) return null

  return (
    <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-[99] px-3 sm:px-6 py-6'>
      <div className='bg-white w-full max-w-6xl rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 relative max-h-[95vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200'>
          <div className='flex items-center gap-3'>
            <div className='bg-blue-100 p-2 rounded-xl'>
              <Plus size={24} className='text-blue-600' />
            </div>
            <div>
              <h2 className='text-xl sm:text-2xl font-bold text-gray-800'>
                Янги маҳсулот(лар) қўшиш
              </h2>
              <p className='text-sm text-gray-600 mt-1'>
                Бир нечта маҳсулотни бир вақтниң ўзида қўшиш имкони
              </p>
            </div>
          </div>

          {/* ❌ Close button */}
          <button
            onClick={() => setOpen(false)}
            className='p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-700'
          >
            <X size={24} />
          </button>
        </div>

        {/* 📋 CLIENT маълумотлари */}
        <div className='bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border border-blue-200 p-6'>
          <div className='flex items-center gap-3 mb-6'>
            <div className='bg-indigo-100 p-2 rounded-lg'>
              <User size={20} className='text-indigo-600' />
            </div>
            <div>
              <h3 className='font-semibold text-gray-800 text-lg'>
                Таминотчи ҳақида маълумот
              </h3>
              <p className='text-sm text-gray-600'>
                Барча маҳсулотлар учун бир Таминотчи
              </p>
            </div>
          </div>

          {selectedClient ? (
            // Selected client view
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='bg-green-100 p-2 rounded-lg'>
                    <User size={20} className='text-green-600' />
                  </div>
                  <div>
                    <h4 className='font-semibold text-gray-800'>{selectedClient.name}</h4>
                    <p className='text-sm text-gray-600'>{selectedClient.phoneNumber}</p>
                    {selectedClient.address && (
                      <p className='text-xs text-gray-500'>{selectedClient.address}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleClearClient}
                  className='flex items-center gap-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-all duration-200'
                >
                  <X size={16} />
                  Ўзгартириш
                </button>
              </div>

              {selectedClient.products && selectedClient.products.length > 0 && (
                <div className='bg-yellow-50 border border-yellow-200 rounded-xl p-4'>
                  <h5 className='font-medium text-yellow-800 mb-2 flex items-center gap-2'>
                    <Package size={16} />
                    Мавжуд маҳсулотлар: {selectedClient.products.length} та
                  </h5>
                  <div className='text-sm text-yellow-700'>
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
                <label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
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
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all bg-white"
                    placeholder="Клиент исми ёки телефони бўйича излаш..."
                  />

                  <Search size={18} className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400' />

                  {showClientDropdown && filteredClients.length > 0 && (
                    <div
                      className='absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto'
                      onMouseDown={(e) => e.preventDefault()} // 👈 dropdown bosilganda blur bo‘lmasin
                    >
                      {filteredClients.map(client => (
                        <div
                          key={client._id}
                          onClick={() => handleClientSelect(client)}
                          className='p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0'
                        >
                          <div className='flex justify-between items-start'>
                            <div>
                              <div className='font-medium text-gray-800'>{client.name}</div>
                              <div className='text-sm text-gray-600'>{client.phoneNumber}</div>
                              {client.address && (
                                <div className='text-xs text-gray-500'>{client.address}</div>
                              )}
                            </div>
                            {client.products && (
                              <div className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full'>
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
                <div className='text-center text-gray-500 py-4 border-2 border-dashed border-gray-300 rounded-xl'>
                  <User size={32} className='mx-auto mb-2 text-gray-400' />
                  <p className='text-sm'>Ёки янги клиент қўшинг</p>
                </div>
              </div>

              {/* Yangi client ma'lumotlari */}
              <div className='lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200'>
                <div className='space-y-2'>
                  <label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
                    <User size={16} className='text-gray-500' />
                    Исм / Номи <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={clientData.name}
                    onChange={e => handleClientChange('name', e.target.value)}
                    className='w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all bg-white'
                    placeholder='Аҳмаджон'
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
                    className='w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all bg-white'
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
              className='bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 p-6 space-y-6 relative'
            >
              {/* Row header */}
              <div className='flex justify-between items-center pb-4 border-b border-gray-200'>
                <div className='flex items-center gap-3'>
                  <div className='bg-blue-500 text-white p-2 rounded-lg'>
                    <Package size={18} />
                  </div>
                  <h3 className='font-semibold text-gray-800'>
                    Маҳсулот #{i + 1}
                  </h3>
                </div>

                {products.length > 1 && (
                  <button
                    onClick={() => removeRow(i)}
                    className='flex items-center gap-2 text-red-600 hover:bg-red-50 transition-all px-3 py-2 rounded-lg text-sm font-medium'
                  >
                    <Trash2 size={16} /> Ўчириш
                  </button>
                )}
              </div>

              {/* Asosiy maydonlar */}
              <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4'>
                {/* 🔹 Номи */}
                <div className='space-y-2'>
                  <label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
                    <Package size={16} className='text-blue-500' />
                    Номи <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={p.title}
                    onChange={e => handleChange(i, 'title', e.target.value)}
                    className='w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all bg-white'
                    placeholder='Маҳсулот номини киритинг...'
                    required
                  />
                </div>

                {/* 💰 Нархи */}
                {user.role === 'admin' && (
                  <div className='space-y-2'>
                    <label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
                      <DollarSign size={16} className='text-green-500' />
                      Нархи <span className='text-red-500'>*</span>
                    </label>
                    <div className='relative'>
                      <input
                        type='text'
                        value={p.price}
                        onChange={e =>
                          handleChange(i, 'price', e.target.value)
                        }
                        className='w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all bg-white'
                        placeholder='0'
                        required
                      />
                      <span className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm'>
                        {p.priceType == "uz" ? "сўм" : "$"}
                      </span>
                    </div>
                  </div>
                )}

                {/* 📦 Миқдор */}
                <div className='space-y-2'>
                  <label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
                    <Package size={16} className='text-purple-500' />
                    Миқдор
                  </label>
                  <input
                    type='text'
                    value={p.stock}
                    onChange={e => handleChange(i, 'stock', e.target.value)}
                    className='w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all bg-white'
                    placeholder='1'
                  />
                </div>

                {/* ⚖️ Бирлик */}
                <div className='space-y-2'>
                  <label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
                    <Ruler size={16} className='text-orange-500' />
                    Бирлик
                  </label>
                  <select
                    value={p.unit}
                    onChange={e => handleChange(i, 'unit', e.target.value)}
                    className='w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all bg-white appearance-none'
                  >
                    {availableUnits.map(u => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Narx turi va ready status */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* 💵 Narx turi */}
                <div className='space-y-2'>
                  <label className='text-sm font-semibold text-gray-700'>
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
                      <span className='text-sm'>Сўм (UZS)</span>
                    </label>
                    <label className='flex items-center gap-2 cursor-pointer'>
                      <input
                        type='radio'
                        value='en'
                        checked={p.priceType === 'en'}
                        onChange={e => handleChange(i, 'priceType', e.target.value)}
                        className='w-4 h-4 text-blue-600'
                      />
                      <span className='text-sm'>Доллар ($)</span>
                    </label>
                  </div>
                </div>

                {/* ✅ Тайёрлиги (ready) */}
                <div className='flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200'>
                  <div
                    className={`p-1 rounded-lg ${p.ready ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                  >
                    <CheckCircle size={16} className='text-white' />
                  </div>
                  <div className='flex-1'>
                    <label className='text-sm font-semibold text-gray-700 cursor-pointer'>
                      Маҳсулот тайёр
                    </label>
                    <p className='text-xs text-gray-600'>
                      Белгиланса, маҳсулот тайёр деб ҳисобланади
                    </p>
                  </div>
                  <input
                    type='checkbox'
                    checked={p.ready}
                    onChange={e => handleChange(i, 'ready', e.target.checked)}
                    className='w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer'
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 🚀 Submit section */}
        <div className='flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t border-gray-200'>
          <button
            onClick={addRow}
            className='flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all text-gray-700 font-medium w-full sm:w-auto'
          >
            <Plus size={18} />
            Яна маҳсулот қўшиш
          </button>

          <div className='flex flex-col sm:flex-row gap-3 w-full sm:w-auto'>
            <button
              onClick={() => setOpen(false)}
              className='px-6 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 transition-all text-gray-700 font-medium w-full sm:w-auto'
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
        <div className='text-center text-sm text-gray-500 pt-2'>
          <p>
            Ҳар бир маҳсулот учун номи мажбурий.{' '}
            {user.role === 'admin' && 'Нархи ҳам мажбурий.'}
          </p>
        </div>
      </div>
    </div>
  )
}