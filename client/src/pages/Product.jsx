import { useState, useContext } from 'react'
import useSWR from 'swr'
import {
  Boxes,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  Eye,
  Hash,
  Tag,
  DollarSign,
  Package,
  Ruler,
  Calendar,
  MapPin,
  Phone,
  User
} from 'lucide-react'
import Fetch from '../middlewares/fetcher'
import AddProductModal from '../components/AddProductModal'
import { ContextData } from '../contextData/Context'
import { LoadingState } from '../components/loading-state'

export const ProductsPage = () => {
  const { user } = useContext(ContextData)
  const { data, error, isLoading, mutate } = useSWR('/products', Fetch, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  })

  const [open, setOpen] = useState(false)
  const [viewData, setViewData] = useState(null)
  const [editing, setEditing] = useState({})
  const [loading, setLoading] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const [searchID, setSearchID] = useState('')
  const [searchTitle, setSearchTitle] = useState('')
  const [searchDate, setSearchDate] = useState('')

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

  const handleChange = (id, field, value) => {
    setEditing(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }))
  }

  const handleSave = async id => {
    try {
      setLoading(id)
      await Fetch.put(`/products/${id}`, editing[id])
      setEditing(prev => {
        const copy = { ...prev }
        delete copy[id]
        return copy
      })
      mutate()
    } catch (err) {
      console.error('Update error:', err)
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async id => {
    if (!confirm('Ростдан ҳам ушбу маҳсулотни ўчирмоқчимисиз?')) return
    try {
      setDeleting(id)
      await Fetch.delete(`/products/${id}`)
      mutate()
    } catch (err) {
      console.error('Delete error:', err)
      alert('Ўчиришда хатолик юз берди ❌')
    } finally {
      setDeleting(null)
    }
  }

  const filteredProducts =
    data?.data.data.filter(p => {
      let match = true
      if (searchID) {
        match =
          match &&
          p.ID?.toString().toLowerCase().startsWith(searchID.toLowerCase())
      }
      if (searchTitle) {
        match =
          match && p.title?.toLowerCase().startsWith(searchTitle.toLowerCase())
      }
      if (searchDate) {
        const createdDate = new Date(p.createdAt).toISOString().split('T')[0]
        match = match && createdDate === searchDate
      }
      return match
    }) || []

  return (
    <div className='p-6 space-y-6'>
      <div className='w-full flex flex-col md:flex-row justify-between items-center gap-4 mb-6'>
        <h1 className='text-2xl font-bold flex items-center gap-2'>
          <Boxes size={30} /> Маҳсулотлар
        </h1>
        <button
          onClick={() => setOpen(true)}
          className='flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600'
        >
          <Plus size={18} /> Янги маҳсулот
        </button>
      </div>

      <div className='flex flex-wrap items-center gap-4 bg-gray-50 p-4 rounded-lg shadow'>
        <span className='text-gray-600 font-medium flex items-center gap-2'>
          <Search /> <span>Қидирув:</span>
        </span>
        <input
          type='number'
          placeholder='ID бўйича'
          value={searchID}
          onChange={e => setSearchID(e.target.value)}
          className='border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none'
        />
        <input
          type='text'
          placeholder='Номи бўйича'
          value={searchTitle}
          onChange={e => setSearchTitle(e.target.value)}
          className='border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none'
        />
        <input
          type='date'
          value={searchDate}
          onChange={e => setSearchDate(e.target.value)}
          className='border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none'
        />
      </div>

      {isLoading ? (
        <div className='flex justify-center items-center h-64'>
          <LoadingState />
        </div>
      ) : error ? (
        <div className='p-4 text-red-500'>
          Хатолик юз берди: {error.response?.data?.message || error.message}
        </div>
      ) : (
        <div className='overflow-x-auto rounded-xl shadow'>
          <table className='w-full border-collapse'>
            <thead className='bg-gray-100 text-left text-sm font-semibold'>
              <tr>
                <th className='px-4 py-3'>ID</th>
                <th className='px-4 py-3'>Номи</th>
                <th className='px-4 py-3'>Нархи</th>
                <th className='px-4 py-3'>Миқдори</th>
                <th className='px-4 py-3'>Бирлик</th>
                <th className='px-4 py-3'>Яратилган сана</th>
                <th className='px-4 py-3 text-center'>Амалиёт</th>
              </tr>
            </thead>
            <tbody className='text-sm'>
              {filteredProducts.map(p => {
                const isEdited = Boolean(editing[p._id])
                return (
                  <tr key={p._id} className='border-b hover:bg-gray-50'>
                    <td className='px-4 py-3'>{p.ID}</td>
                    <td className='px-4 py-3 font-bold'>{p.title}</td>
                    {user.role === 'admin' ? (
                      <td className='px-4 py-3'>
                        <input
                          type='number'
                          defaultValue={p.price}
                          className='border rounded px-2 py-1 w-28'
                          onChange={e =>
                            handleChange(p._id, 'price', Number(e.target.value))
                          }
                        />
                        <span className='ml-1 text-gray-600'>сўм</span>
                      </td>
                    ) : (
                      <td className='px-4 py-3'>
                        {p.price.toLocaleString()} сўм
                      </td>
                    )}
                    <td className='px-4 py-3'>
                      <input
                        type='number'
                        defaultValue={p.stock}
                        className='border rounded px-2 py-1 w-24'
                        onChange={e =>
                          handleChange(p._id, 'stock', Number(e.target.value))
                        }
                      />
                    </td>
                    <td className='px-4 py-3'>
                      <select
                        defaultValue={p.unit || 'дона'}
                        onChange={e =>
                          handleChange(p._id, 'unit', e.target.value)
                        }
                        className='border rounded px-2 py-1 w-28'
                      >
                        {availableUnits.map(u => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className='px-4 py-3'>
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className='px-4 py-3 flex items-center gap-2 justify-center'>
                      {/* 👁️ View */}
                      <button
                        onClick={() => setViewData(p)}
                        className='flex items-center gap-2 bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600'
                      >
                        <Eye size={16} />
                        Кўриш
                      </button>

                      {isEdited && (
                        <button
                          onClick={() => handleSave(p._id)}
                          disabled={loading === p._id}
                          className='flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:opacity-50'
                        >
                          {loading === p._id ? (
                            <Loader2 className='animate-spin' size={16} />
                          ) : (
                            <Save size={16} />
                          )}
                          Сақлаш
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(p._id)}
                        disabled={deleting === p._id}
                        className='flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 disabled:opacity-50'
                      >
                        {deleting === p._id ? (
                          <Loader2 className='animate-spin' size={16} />
                        ) : (
                          <Trash2 size={16} />
                        )}
                        Ўчириш
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <AddProductModal open={open} setOpen={setOpen} mutate={mutate} />

      {/* 🪟 VIEW MODAL */}
      {viewData && (
        <div
          onClick={() => setViewData(null)}
          className='fixed inset-0 bg-black/70 flex justify-center items-center z-[100] p-3'
        >
          <div
            onClick={e => e.stopPropagation()}
            className='bg-gradient-to-br from-white to-gray-100 rounded-2xl shadow-2xl w-full max-w-lg p-6 relative animate-fadeIn'
          >
            <button
              onClick={() => setViewData(null)}
              className='absolute right-4 top-4 text-gray-600 hover:text-black transition'
            >
              ✖
            </button>

            <h2 className='text-xl font-bold mb-4 flex items-center gap-2 text-indigo-600'>
              <Tag size={22} /> Маҳсулот маълумотлари
            </h2>

            <div className='space-y-3 text-sm'>
              <p className='flex items-center gap-2'>
                <Hash size={16} className='text-gray-500' /> <b>ID:</b>{' '}
                {viewData.ID}
              </p>
              <p className='flex items-center gap-2'>
                <Boxes size={16} className='text-gray-500' /> <b>Номи:</b>{' '}
                {viewData.title}
              </p>
              <p className='flex items-center gap-2'>
                <DollarSign size={16} className='text-gray-500' /> <b>Нархи:</b>{' '}
                {viewData.price?.toLocaleString()} сўм
              </p>
              <p className='flex items-center gap-2'>
                <Package size={16} className='text-gray-500' /> <b>Миқдори:</b>{' '}
                {viewData.stock}
              </p>
              <p className='flex items-center gap-2'>
                <Ruler size={16} className='text-gray-500' /> <b>Бирлик:</b>{' '}
                {viewData.unit}
              </p>

              <div className='border-t pt-2 mt-3'>
                <p className='font-semibold text-gray-700 mb-1'>
                  📦 Келган жой ҳақида:
                </p>
                <p className='flex items-center gap-2'>
                  <User size={16} className='text-gray-500' />{' '}
                  {viewData.from?.name || '-'}
                </p>
                <p className='flex items-center gap-2'>
                  <Phone size={16} className='text-gray-500' />{' '}
                  {viewData.from?.phoneNumber || '-'}
                </p>
                <p className='flex items-center gap-2'>
                  <MapPin size={16} className='text-gray-500' />{' '}
                  {viewData.from?.address || '-'}
                </p>
              </div>

              <div className='border-t pt-2 mt-3'>
                <p className='flex items-center gap-2 text-gray-600'>
                  <Calendar size={16} /> <b>Яратилган:</b>{' '}
                  {new Date(viewData.createdAt).toLocaleString()}
                </p>
                <p className='flex items-center gap-2 text-gray-600'>
                  <Calendar size={16} /> <b>Янгилланган:</b>{' '}
                  {new Date(viewData.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
