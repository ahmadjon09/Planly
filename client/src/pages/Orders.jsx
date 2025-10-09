import { useState, useContext, useMemo } from 'react'
import useSWR from 'swr'
import {
  Plus,
  Loader2,
  Save,
  Trash2,
  ScrollText,
  Eye,
  X,
  User,
  MapPin,
  ShoppingCart,
  CreditCard,
  Phone,
  Calendar,
  Search,
  BadgeDollarSign
} from 'lucide-react'
import Fetch from '../middlewares/fetcher'
import { AddNewOrder } from '../mod/OrderModal'
import { ContextData } from '../contextData/Context'
import { LoadingState } from '../components/loading-state'

export const ViewOrders = () => {
  const { data, error, isLoading, mutate } = useSWR('/orders', Fetch, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  })
  const { user } = useContext(ContextData)

  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState({})
  const [loading, setLoading] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)

  const [searchPhone, setSearchPhone] = useState('')
  const [searchName, setSearchName] = useState('')
  const [searchDate, setSearchDate] = useState('')

  const orders = data?.data?.data || []

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const phoneMatch = o.client?.phoneNumber
        ?.toLowerCase()
        .includes(searchPhone.toLowerCase())
      const nameMatch = o.client?.fullName
        ?.toLowerCase()
        .includes(searchName.toLowerCase())
      const dateMatch = searchDate
        ? new Date(o.orderDate).toLocaleDateString() ===
          new Date(searchDate).toLocaleDateString()
        : true
      return phoneMatch && nameMatch && dateMatch
    })
  }, [orders, searchPhone, searchName, searchDate])

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
      alert('✅ Маълумот сақланди')
    } catch (err) {
      console.error('Update error:', err)
      alert('❌ Сақлашда хатолик юз берди')
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
      alert('❌ Ўчиришда хатолик юз берди')
    } finally {
      setDeleting(null)
    }
  }

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-screen text-lg text-gray-600'>
        <LoadingState />
      </div>
    )
  }

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

      {/* 🔍 Search inputlar */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl shadow-sm'>
        <div className='flex items-center gap-2'>
          <Phone size={18} className='text-gray-500' />
          <input
            type='text'
            placeholder='Телефон рақам...'
            value={searchPhone}
            onChange={e => setSearchPhone(e.target.value)}
            className='w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400'
          />
        </div>
        <div className='flex items-center gap-2'>
          <User size={18} className='text-gray-500' />
          <input
            type='text'
            placeholder='Мижоз Ф.И.Ш...'
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            className='w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400'
          />
        </div>
        <div className='flex items-center gap-2'>
          <Calendar size={18} className='text-gray-500' />
          <input
            type='date'
            value={searchDate}
            onChange={e => setSearchDate(e.target.value)}
            className='w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400'
          />
        </div>
      </div>

      {/* Table */}
      {filteredOrders.length === 0 ? (
        <div className='text-center mt-10 text-gray-600'>
          Ҳеч қандай мувофиқ буюртма топилмади.
        </div>
      ) : (
        <div className='overflow-x-auto rounded-xl shadow'>
          <table className='min-w-full bg-white border-collapse'>
            <thead className='bg-gray-100 text-left text-sm font-semibold'>
              <tr>
                <th className='px-4 py-3'>Омборчи</th>
                <th className='px-4 py-3'>Маҳсулотлар</th>
                <th className='px-4 py-3'>Ҳолат</th>
                <th className='px-4 py-3'>Телефон</th>
                <th className='px-4 py-3'>Умумий нарх</th>
                <th className='px-4 py-3'>Сана</th>
                <th className='px-4 py-3 text-center'>Амалиёт</th>
              </tr>
            </thead>
            <tbody className='text-sm'>
              {filteredOrders.map(order => {
                const isEdited = Boolean(editing[order._id])
                return (
                  <tr key={order._id} className='border-b hover:bg-gray-50'>
                    <td className='px-4 py-3 font-medium'>
                      {order.customer?.firstName || '—'}{' '}
                      {order.customer?.lastName || ''}
                    </td>

                    <td className='px-4 py-3'>
                      {order.products.slice(0, 2).map((item, i) => (
                        <div key={i}>
                          {item.productName || 'Мавжуд эмас'} — {item.amount}{' '}
                          {item.unit} × {item.price.toLocaleString()} сўм
                        </div>
                      ))}
                      {order.products.length > 2 && <div>...</div>}
                    </td>

                    <td className='px-4 py-3'>{order.status || '—'}</td>
                    <td className='px-4 py-3'>
                      <a href={`tel:${order.client.phoneNumber}`}>
                        {order.client.phoneNumber || '—'}
                      </a>
                    </td>

                    <td className='px-4 py-3 flex gap-0.5 flex-wrap'>
                      {user.role === 'admin' ? (
                        <input
                          type='number'
                          value={
                            editing[order._id]?.totalPrice ??
                            order.totalPrice ??
                            ''
                          }
                          onChange={e =>
                            handleChange(
                              order._id,
                              'totalPrice',
                              e.target.value
                            )
                          }
                          className='border rounded px-2 py-1 w-28 text-right'
                        />
                      ) : (
                        <p>{order.totalPrice.toLocaleString()}</p>
                      )}
                      сўм
                    </td>

                    <td className='px-4 py-3'>
                      {new Date(
                        order.createdAt || order.orderDate
                      ).toLocaleDateString()}
                    </td>

                    <td className='px-4 py-3 text-center flex gap-2 justify-center'>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className='flex items-center gap-2 bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600'
                      >
                        <Eye size={16} /> Кўриш
                      </button>

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

      {selectedOrder && (
        <div
          onClick={() => setSelectedOrder(null)}
          className='fixed inset-0 bg-black/60 flex items-center justify-center z-99'
        >
          <div
            onClick={e => e.stopPropagation()}
            className='bg-white w-[95%] max-w-2xl rounded-2xl shadow-2xl p-6 md:p-8 relative overflow-y-auto max-h-[90vh]'
          >
            <button
              onClick={() => setSelectedOrder(null)}
              className='absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition'
            >
              <X size={24} />
            </button>
            <h2 className='text-2xl font-bold text-center text-gray-800 mb-6'>
              📦 Буюртма маълумотлари
            </h2>

            {/* Mijoz ma’lumotlari */}
            <div className='space-y-3 text-gray-700'>
              <div className='flex items-center gap-2'>
                <User className='text-blue-600' size={20} />
                <p>
                  <b>Мижоз:</b> {selectedOrder.client?.fullName || '—'}
                </p>
              </div>

              <div className='flex items-center gap-2'>
                <Phone className='text-green-600' size={20} />
                <p>
                  <b>Телефон:</b> {selectedOrder.client?.phoneNumber || '—'}
                </p>
              </div>

              <div className='flex items-center gap-2'>
                <MapPin className='text-red-600' size={20} />
                <p>
                  <b>Манзил:</b> {selectedOrder.client?.address || '—'}
                </p>
              </div>
            </div>

            {/* Mahsulotlar */}
            <div className='mt-6'>
              <div className='flex items-center gap-2 mb-3'>
                <ShoppingCart className='text-purple-600' size={20} />
                <h3 className='font-semibold text-lg'>Маҳсулотлар</h3>
              </div>
              <ul className='space-y-2 bg-gray-50 rounded-lg p-3 border border-gray-200'>
                {selectedOrder.products.map((p, i) => (
                  <li
                    key={i}
                    className='flex justify-between items-center border-b last:border-none pb-1 text-gray-700'
                  >
                    <span>{p.productName || 'Мавжуд эмас'}</span>
                    <span className='text-sm text-gray-500'>
                      {p.amount} {p.unit} × {p.price.toLocaleString()} сўм
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Qo‘shimcha ma’lumotlar */}
            <div className='mt-6 space-y-2 text-gray-700'>
              <p>
                <b>Ҳолат:</b> {selectedOrder.status}
              </p>
              <div className='flex items-center gap-2'>
                <CreditCard className='text-yellow-600' size={20} />
                <p>
                  <b>Тўлов тури:</b> {selectedOrder.payType}
                </p>
              </div>
              <div className='flex items-center gap-2'>
                <BadgeDollarSign className='text-green-600' size={20} />
                <p>
                  <b>Умумий нарх:</b>{' '}
                  {selectedOrder.totalPrice.toLocaleString()} сўм
                </p>
              </div>

              <div className='flex items-center gap-2'>
                <Calendar className='text-blue-600' size={20} />
                <p>
                  <b>Сана:</b>{' '}
                  {new Date(
                    selectedOrder.createdAt || selectedOrder.orderDate
                  ).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Tugma */}
            <div className='text-center mt-6'>
              <button
                onClick={() => setSelectedOrder(null)}
                className='bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg shadow-md transition'
              >
                Ёпиш
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Order Modal */}
      {isOpen && (
        <AddNewOrder onClose={() => setIsOpen(false)} isOpen={isOpen} />
      )}
    </div>
  )
}
