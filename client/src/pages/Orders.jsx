import { useState, useContext } from 'react'
import useSWR from 'swr'
import { Plus, Loader2, Save, Trash2, ScrollText } from 'lucide-react'
import Fetch from '../middlewares/fetcher'
import { AddNewOrder } from '../mod/OrderModal'
import { ContextData } from '../contextData/Context'

export const ViewOrders = () => {
  const { user } = useContext(ContextData)
  const { data, error, isLoading, mutate } = useSWR('/orders', Fetch, {
    refreshInterval: 5000,
    refreshWhenHidden: false,
    refreshWhenOffline: false
  })

  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState({})
  const [loading, setLoading] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const orders = (data?.data?.data || []).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  )

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
      await Fetch.put(`/orders/${id}`, editing[id])
      setEditing(prev => {
        const copy = { ...prev }
        delete copy[id]
        return copy
      })
      mutate()
    } catch (err) {
      console.error('Update error:', err)
      alert('Сақлашда хатолик юз берди ❌')
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async id => {
    if (!confirm('Ростдан ҳам ушбу буюртмани ўчирмоқчимисиз?')) return
    try {
      setDeleting(id)
      await Fetch.delete(`/orders/${id}`)
      mutate()
    } catch (err) {
      console.error('Delete error:', err)
      alert('Ўчиришда хатолик юз берди ❌')
    } finally {
      setDeleting(null)
    }
  }

  if (isLoading)
    return <div className='text-center mt-10 text-gray-700'>Юкланмоқда...</div>

  if (error)
    return (
      <div className='text-center mt-10 text-red-500'>
        Буюртмаларни юклашда хатолик юз берди
      </div>
    )

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='w-full flex flex-col md:flex-row justify-between items-center gap-4 mb-6'>
        <h1 className='text-2xl font-bold flex items-center gap-2'>
          <ScrollText size={30} /> Буюртмалар
        </h1>
        <button
          onClick={() => setIsOpen(true)}
          className='flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600'
        >
          <Plus size={18} /> Янги буюртма
        </button>
      </div>

      {/* Table */}
      {orders.length === 0 ? (
        <div className='text-center mt-10 text-gray-600'>
          Ҳозирча буюртмалар мавжуд эмас.
        </div>
      ) : (
        <div className='overflow-x-auto rounded-xl shadow'>
          <table className='min-w-full bg-white border-collapse'>
            <thead className='bg-gray-100 text-left text-sm font-semibold'>
              <tr>
                <th className='px-4 py-3'>Мижоз</th>
                <th className='px-4 py-3'>Маҳсулотлар</th>
                <th className='px-4 py-3'>Ҳолат</th>
                <th className='px-4 py-3'>Тўлов тури</th>
                <th className='px-4 py-3'>Умумий нарх</th>
                <th className='px-4 py-3'>Сана</th>
                <th className='px-4 py-3 text-center'>Амалиёт</th>
              </tr>
            </thead>
            <tbody className='text-sm'>
              {orders.map(order => {
                const isEdited = Boolean(editing[order._id])
                return (
                  <tr key={order._id} className='border-b hover:bg-gray-50'>
                    <td className='px-4 py-3 font-medium'>
                      {order.customer?.firstName || '—'}{' '}
                      {order.customer?.lastName || ''}
                    </td>

                    <td className='px-4 py-3'>
                      {order.products.map((item, i) => (
                        <div key={i}>
                          {item.productName || 'Мавжуд эмас'} — {item.amount}{' '}
                          {item.unit} × {item.price.toLocaleString()} сўм
                        </div>
                      ))}
                    </td>

                    <td className='px-4 py-3'>{order.status || '—'}</td>
                    <td className='px-4 py-3'>{order.payType || '—'}</td>

                    {/* Admin uchun editable totalPrice */}
                    <td className='px-4 py-3'>
                      {user.role === 'admin' ? (
                        <div className='flex items-center gap-2'>
                          <input
                            type='number'
                            defaultValue={order.totalPrice}
                            onChange={e =>
                              handleChange(
                                order._id,
                                'totalPrice',
                                Number(e.target.value)
                              )
                            }
                            className='border rounded px-2 py-1 w-28'
                          />
                          <span className='text-gray-600'>сўм</span>
                        </div>
                      ) : (
                        <span>{order.totalPrice.toLocaleString()} сўм</span>
                      )}
                    </td>

                    <td className='px-4 py-3'>
                      {new Date(
                        order.createdAt || order.orderDate
                      ).toLocaleDateString()}
                    </td>

                    <td className='px-4 py-3 text-center flex gap-2 justify-center'>
                      {isEdited && (
                        <button
                          onClick={() => handleSave(order._id)}
                          disabled={loading === order._id}
                          className='flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:opacity-50'
                        >
                          {loading === order._id ? (
                            <Loader2 className='animate-spin' size={16} />
                          ) : (
                            <Save size={16} />
                          )}
                          Сақлаш
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(order._id)}
                        disabled={deleting === order._id}
                        className='flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 disabled:opacity-50'
                      >
                        {deleting === order._id ? (
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

      {/* Modal */}
      {isOpen && (
        <AddNewOrder onClose={() => setIsOpen(false)} isOpen={isOpen} />
      )}
    </div>
  )
}
