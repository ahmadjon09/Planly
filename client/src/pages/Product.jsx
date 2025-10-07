import { useState, useContext } from 'react'
import useSWR from 'swr'
import { Boxes, Loader2, Plus, Save, Search, Trash2 } from 'lucide-react'
import Fetch from '../middlewares/fetcher'
import AddProductModal from '../components/AddProductModal'
import { ContextData } from '../contextData/Context'

export const ProductsPage = () => {
  const { user } = useContext(ContextData)
  const { data, error, isLoading, mutate } = useSWR('/products', Fetch, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  })

  const [open, setOpen] = useState(false)
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

  // 🧹 Delete product
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
          <Loader2 className='animate-spin' size={32} />
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
    </div>
  )
}
