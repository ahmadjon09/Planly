import { useState } from 'react'
import useSWR from 'swr'
import { Boxes, Loader2, Plus, Save } from 'lucide-react'
import Fetch from '../middlewares/fetcher'
import AddProductModal from '../components/AddProductModal'

export const ProductsPage = () => {
  const { data, error, isLoading, mutate } = useSWR('/products', Fetch)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState({})
  const [loading, setLoading] = useState(null)

  // Qidiruv inputlari
  const [searchID, setSearchID] = useState('')
  const [searchTitle, setSearchTitle] = useState('')
  const [searchDate, setSearchDate] = useState('')

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

  // Filterlangan mahsulotlar
  const filteredProducts =
    data?.data.data.filter(p => {
      let match = true

      // ID bo‘yicha (boshlanishiga qaraydi)
      if (searchID) {
        match =
          match &&
          p.ID?.toString().toLowerCase().startsWith(searchID.toLowerCase())
      }

      // Nomi bo‘yicha (boshlanishiga qaraydi)
      if (searchTitle) {
        match =
          match && p.title?.toLowerCase().startsWith(searchTitle.toLowerCase())
      }

      // Sana bo‘yicha (aniq kun)
      if (searchDate) {
        const createdDate = new Date(p.createdAt).toISOString().split('T')[0]
        match = match && createdDate === searchDate
      }

      return match
    }) || []

  return (
    <div className='p-6 space-y-6'>
      {/* Сарлавҳа */}
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

      {/* Qidiruv paneli */}
      <div className='flex flex-wrap gap-4 bg-gray-50 p-4 rounded-lg shadow'>
        <input
          type='text'
          placeholder='ID бўйича'
          value={searchID}
          onChange={e => setSearchID(e.target.value)}
          className='border rounded px-3 py-2'
        />
        <input
          type='text'
          placeholder='Номи бўйича'
          value={searchTitle}
          onChange={e => setSearchTitle(e.target.value)}
          className='border rounded px-3 py-2'
        />
        <input
          type='date'
          value={searchDate}
          onChange={e => setSearchDate(e.target.value)}
          className='border rounded px-3 py-2'
        />
      </div>

      {/* Kontent */}
      {isLoading ? (
        <div className='flex justify-center items-center h-64'>
          <Loader2 className='animate-spin' size={32} />
        </div>
      ) : error ? (
        error.response?.status === 404 ? (
          <div className='flex justify-center items-center h-64'>
            <p className='text-gray-500 text-lg font-medium'>
              ❌ Маҳсулот топилмади
            </p>
          </div>
        ) : (
          <div className='p-4 text-red-500'>
            Хатолик юз берди: {error.response?.data?.message || error.message}
          </div>
        )
      ) : (
        <div className='overflow-x-auto rounded-xl shadow'>
          <table className='w-full border-collapse'>
            <thead className='bg-gray-100 text-left text-sm font-semibold'>
              <tr>
                <th className='px-4 py-3'>ID</th>
                <th className='px-4 py-3'>Номи</th>
                <th className='px-4 py-3'>Нархи</th>
                <th className='px-4 py-3'>Сони</th>
                <th className='px-4 py-3'>Ўлчам</th>
                <th className='px-4 py-3'>Оғирлиги</th>
                <th className='px-4 py-3'>Яратилган сана</th>
                <th className='px-4 py-3'>Амалиёт</th>
              </tr>
            </thead>
            <tbody className='text-sm'>
              {filteredProducts.map(p => {
                const isEdited = Boolean(editing[p._id])

                return (
                  <tr key={p._id} className='border-b hover:bg-gray-50'>
                    <td className='px-4 py-3'>{p.ID}</td>
                    <td className='px-4 py-3'>{p.title}</td>

                    {/* price */}
                    <td className='px-4 py-3'>
                      <input
                        type='number'
                        defaultValue={p.price}
                        className='border rounded px-2 py-1 w-28'
                        onChange={e =>
                          handleChange(p._id, 'price', Number(e.target.value))
                        }
                      />
                    </td>

                    {/* stock */}
                    <td className='px-4 py-3'>
                      <input
                        type='number'
                        defaultValue={p.stock}
                        className='border rounded px-2 py-1 w-20'
                        onChange={e =>
                          handleChange(p._id, 'stock', Number(e.target.value))
                        }
                      />
                    </td>

                    {/* size */}
                    <td className='px-4 py-3'>
                      <input
                        type='text'
                        defaultValue={p.size || ''}
                        placeholder='--'
                        className='border rounded px-2 py-1 w-20'
                        onChange={e =>
                          handleChange(p._id, 'size', e.target.value)
                        }
                      />
                    </td>

                    {/* poundage */}
                    <td className='px-4 py-3'>
                      <input
                        type='text'
                        placeholder='--'
                        defaultValue={p.poundage || ''}
                        className='border rounded px-2 py-1 w-20'
                        onChange={e =>
                          handleChange(p._id, 'poundage', e.target.value)
                        }
                      />
                    </td>

                    <td className='px-4 py-3'>
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>

                    {/* Saqlash tugmasi */}
                    <td className='px-4 py-3'>
                      {isEdited && (
                        <button
                          onClick={() => handleSave(p._id)}
                          disabled={loading === p._id}
                          className='flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                          {loading === p._id ? (
                            <Loader2 className='animate-spin' size={16} />
                          ) : (
                            <Save size={16} />
                          )}
                          Сақлаш
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Модал */}
      <AddProductModal open={open} setOpen={setOpen} mutate={mutate} />
    </div>
  )
}
