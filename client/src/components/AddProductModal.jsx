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
  MapPin
} from 'lucide-react'
import { useState, useContext } from 'react'
import Fetch from '../middlewares/fetcher'
import { ContextData } from '../contextData/Context'

export default function AddProductModal ({ open, setOpen, mutate }) {
  const { user } = useContext(ContextData)
  const [products, setProducts] = useState([
    {
      title: '',
      price: null,
      stock: 1,
      unit: 'дона',
      ready: false,
      ID: '',
      from: { phoneNumber: '', address: '', name: '' }
    }
  ])
  const [loading, setLoading] = useState(false)

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

  // 🔄 Input change handler
  const handleChange = (i, field, value) => {
    const newProducts = [...products]
    newProducts[i][field] = value
    setProducts(newProducts)
  }

  const handleFromChange = (i, field, value) => {
    const newProducts = [...products]
    newProducts[i].from[field] = value
    setProducts(newProducts)
  }

  // ➕ Add/remove rows
  const addRow = () =>
    setProducts([
      ...products,
      {
        title: '',
        price: null,
        stock: 1,
        unit: 'дона',
        ready: false,
        ID: '',
        from: { phoneNumber: '', address: '', name: '' }
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
      if (user.role === 'admin' && (!p.price || p.price <= 0)) {
        alert(`❌ ${i + 1}-маҳсулот учун нархини тўғри киритинг`)
        return
      }
    }

    setLoading(true)
    try {
      await Fetch.post('/products/create', products)
      mutate()
      setOpen(false)
      setProducts([
        {
          title: '',
          price: 0,
          stock: 1,
          unit: 'дона',
          ready: false,
          ID: '',
          from: { phoneNumber: '', address: '', name: '' }
        }
      ])
      alert('✅ Маҳсулот(лар) муваффақиятли қўшилди!')
    } catch (err) {
      console.error(err)
      alert('❌ Маҳсулот қўшишда хатолик юз берди')
    } finally {
      setLoading(false)
    }
  }

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
                Бир нечта маҳсулотни бир вақтнинг ўзида қўшиш имкони
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
                        type='number'
                        value={p.price}
                        onChange={e =>
                          handleChange(i, 'price', +e.target.value)
                        }
                        className='w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all bg-white'
                        placeholder='0'
                        min='0'
                        required
                      />
                      <span className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm'>
                        сўм
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
                    type='number'
                    value={p.stock}
                    onChange={e => handleChange(i, 'stock', +e.target.value)}
                    className='w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all bg-white'
                    min='0'
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

              {/* ✅ Тайёрлиги (ready) */}
              <div className='flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200'>
                <div
                  className={`p-1 rounded-lg ${
                    p.ready ? 'bg-green-500' : 'bg-gray-400'
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

              {/* 📋 FROM маълумотлари */}
              <div className='bg-gray-50 rounded-xl p-5 border border-gray-200'>
                <div className='flex items-center gap-3 mb-4'>
                  <div className='bg-indigo-100 p-2 rounded-lg'>
                    <User size={18} className='text-indigo-600' />
                  </div>
                  <h3 className='font-semibold text-gray-800'>
                    Келган жой ҳақида маълумот
                  </h3>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-700 flex items-center gap-2'>
                      <User size={14} className='text-gray-500' />
                      Исм / Номи
                    </label>
                    <input
                      type='text'
                      value={p.from.name}
                      onChange={e =>
                        handleFromChange(i, 'name', e.target.value)
                      }
                      className='w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all bg-white'
                      placeholder='Аҳмаджон'
                    />
                  </div>

                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-700 flex items-center gap-2'>
                      <Phone size={14} className='text-gray-500' />
                      Телефон рақам
                    </label>
                    <input
                      type='text'
                      value={p.from.phoneNumber}
                      onChange={e =>
                        handleFromChange(i, 'phoneNumber', e.target.value)
                      }
                      className='w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all bg-white'
                      placeholder='+998 90 123 45 67'
                    />
                  </div>

                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-700 flex items-center gap-2'>
                      <MapPin size={14} className='text-gray-500' />
                      Манзил
                    </label>
                    <input
                      type='text'
                      value={p.from.address}
                      onChange={e =>
                        handleFromChange(i, 'address', e.target.value)
                      }
                      className='w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all bg-white'
                      placeholder='Наманган, Юнусобод...'
                    />
                  </div>
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
