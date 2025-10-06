import { X, Loader2, Trash2 } from 'lucide-react'
import { useState, useContext } from 'react'
import Fetch from '../middlewares/fetcher'
import { ContextData } from '../contextData/Context'

export default function AddProductModal ({ open, setOpen, mutate }) {
  const { setOpenX, user } = useContext(ContextData)
  const [products, setProducts] = useState([
    { title: '', price: 0, stock: 1, unit: 'дона' }
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

  const handleChange = (i, field, value) => {
    const newProducts = [...products]
    newProducts[i][field] = value
    setProducts(newProducts)
  }

  const addRow = () =>
    setProducts([...products, { title: '', price: '', stock: 1, unit: 'дона' }])

  const removeRow = i => setProducts(products.filter((_, idx) => idx !== i))

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await Fetch.post('/products/create', products)
      mutate()
      setOpen(false)
      setProducts([{ title: '', price: 0, stock: 1, unit: 'дона' }])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-[99] px-3 sm:px-6'>
      <div className='bg-white w-full max-w-4xl rounded-2xl shadow-lg p-5 sm:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto'>
        <button
          onClick={() => setOpen(false)}
          className='absolute right-4 top-4 text-gray-600 hover:text-black transition'
        >
          <X size={22} />
        </button>

        <h2 className='text-lg sm:text-xl font-bold text-center sm:text-left'>
          🆕 Янги маҳсулот(лар) қўшиш
        </h2>

        <div className='space-y-4'>
          {products.map((p, i) => (
            <div
              key={i}
              className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 border-b pb-3'
            >
              {/* Номи */}
              <div>
                <label className='text-sm font-medium'>
                  Номи{' '}
                  <button
                    type='button'
                    onClick={() => setOpenX(true)}
                    className='text-red-500 font-bold'
                  >
                    *
                  </button>
                </label>
                <input
                  type='text'
                  value={p.title}
                  onChange={e => handleChange(i, 'title', e.target.value)}
                  className='border rounded px-3 py-2 w-full text-sm sm:text-base'
                  required
                />
              </div>

              {/* Нархи */}
              {user.role === 'admin' && (
                <div>
                  <label className='text-sm font-medium'>
                    Нархи{' '}
                    <button
                      type='button'
                      onClick={() => setOpenX(true)}
                      className='text-red-500 font-bold'
                    >
                      *
                    </button>
                  </label>
                  <input
                    type='number'
                    value={p.price}
                    onChange={e => handleChange(i, 'price', e.target.value)}
                    className='border rounded px-3 py-2 w-full text-sm sm:text-base'
                    required
                  />
                </div>
              )}

              {/* Миқдор */}
              <div>
                <label className='text-sm font-medium'>Миқдор</label>
                <input
                  type='number'
                  value={p.stock}
                  onChange={e => handleChange(i, 'stock', e.target.value)}
                  className='border rounded px-3 py-2 w-full text-sm sm:text-base'
                />
              </div>

              {/* Бирлик */}
              <div className='md:col-span-1'>
                <label className='text-sm font-medium'>Бирлик</label>
                <select
                  value={p.unit}
                  onChange={e => handleChange(i, 'unit', e.target.value)}
                  className='border rounded px-3 py-2 w-full text-sm sm:text-base'
                >
                  {availableUnits.map(u => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ўчириш tugmasi */}
              <div className='flex sm:col-span-2 md:col-span-3 mt-1'>
                {products.length > 1 && (
                  <button
                    onClick={() => removeRow(i)}
                    className='text-red-600 hover:bg-red-100 transition p-1 rounded text-sm ml-auto flex items-center gap-1'
                  >
                    <Trash2 size={15} /> Ўчириш
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Tugmalar */}
        <div className='flex flex-col sm:flex-row justify-between gap-3'>
          <button
            onClick={addRow}
            className='w-full sm:w-auto px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition'
          >
            ➕ Яна қўшиш
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className='w-full sm:w-auto px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition flex items-center justify-center gap-2'
          >
            {loading && <Loader2 className='animate-spin' size={18} />}
            Сақлаш
          </button>
        </div>
      </div>
    </div>
  )
}
