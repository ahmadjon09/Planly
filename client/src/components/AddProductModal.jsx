import { X, Loader2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import Fetch from '../middlewares/fetcher'
import { useContext } from 'react'
import { ContextData } from '../Context/Context'

export default function AddProductModal ({ open, setOpen, mutate }) {
  const { setOpenX } = useContext(ContextData)
  const [products, setProducts] = useState([
    { title: '', price: '', stock: 1, size: '', poundage: '' }
  ])
  const [loading, setLoading] = useState(false)

  const handleChange = (i, field, value) => {
    const newProducts = [...products]
    newProducts[i][field] = value
    setProducts(newProducts)
  }

  const addRow = () =>
    setProducts([
      ...products,
      { title: '', price: '', stock: 1, size: '', poundage: '' }
    ])
  const removeRow = i => setProducts(products.filter((_, idx) => idx !== i))

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await Fetch.post('/products/create', products)
      mutate()
      setOpen(false)
      setProducts([{ title: '', price: '', stock: 1, size: '', poundage: '' }])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className='fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-99'>
      <div className='bg-white w-full max-w-4xl rounded-2xl shadow-lg p-6 space-y-6 relative'>
        <button
          onClick={() => setOpen(false)}
          className='absolute right-4 top-4'
        >
          <X size={22} />
        </button>
        <h2 className='text-xl font-bold'>🆕 Янги маҳсулот(лар) қўшиш</h2>

        <div className='space-y-4 max-h-[60vh] overflow-y-auto'>
          {products.map((p, i) => (
            <div
              key={i}
              className='grid grid-cols-5 gap-3 items-end border-b pb-3'
            >
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
                  className='border rounded px-3 py-2 w-full'
                  required
                />
              </div>
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
                  className='border rounded px-3 py-2 w-full'
                  required
                />
              </div>
              <div>
                <label className='text-sm font-medium'>Сони</label>
                <input
                  type='number'
                  value={p.stock}
                  onChange={e => handleChange(i, 'stock', e.target.value)}
                  className='border rounded px-3 py-2 w-full'
                />
              </div>
              <div>
                <label className='text-sm font-medium'>Ўлчам</label>
                <input
                  type='text'
                  value={p.size}
                  onChange={e => handleChange(i, 'size', e.target.value)}
                  className='border rounded px-3 py-2 w-full'
                />
              </div>
              <div>
                <label className='text-sm font-medium'>Оғирлиги</label>
                <input
                  type='text'
                  value={p.poundage}
                  onChange={e => handleChange(i, 'poundage', e.target.value)}
                  className='border rounded px-3 py-2 w-full'
                />
              </div>
              {products.length > 1 && (
                <button
                  onClick={() => removeRow(i)}
                  className='text-red-600 text-sm col-span-5 text-right'
                >
                  <p className='flex items-center gap-1'>
                    <Trash2 size={15} /> Ўчириш
                  </p>
                </button>
              )}
            </div>
          ))}
        </div>

        <div className='flex justify-between'>
          <button
            onClick={addRow}
            className='px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300'
          >
            ➕ Яна қўшиш
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className='px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2'
          >
            {loading && <Loader2 className='animate-spin' size={18} />}
            Сақлаш
          </button>
        </div>
      </div>
    </div>
  )
}
