import { useState } from 'react'
import Fetch from '../middlewares/fetcher'
import useSWR from 'swr'
import { Plus, Boxes, ScrollText } from 'lucide-react'
import { AddNewOrder } from '../mod/OrderModal'

export const ViewOrders = () => {
  const { data, error, isLoading } = useSWR('/orders', Fetch)
  const [isOpen, setIsOpen] = useState(false)

  // Buyurtmalarni sanaga ko‘ra yangi birinchi qilib tartiblash
  const orders = (data?.data?.data || []).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  )

  if (isLoading)
    return <div className='text-center mt-10 text-gray-700'>Юкланмоқда...</div>

  if (error)
    return (
      <div className='text-center mt-10 text-red-500'>
        Буюртмаларни юклашда хатолик юз берди
      </div>
    )

  return (
    <div className='container mx-auto p-6'>
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

      {/* Jadval yoki bo‘sh xabar */}
      {orders.length === 0 ? (
        <div className='text-center mt-10 text-gray-600'>
          Ҳозирча буюртмалар мавжуд эмас.
        </div>
      ) : (
        <div className='overflow-x-auto shadow-md rounded-lg border border-gray-200'>
          <table className='min-w-full bg-white'>
            <thead>
              <tr className='bg-gray-100 text-left'>
                <th className='py-2 px-4 border-b'>Буюртма ID</th>
                <th className='py-2 px-4 border-b'>Мижоз</th>
                <th className='py-2 px-4 border-b'>Маҳсулотлар</th>
                <th className='py-2 px-4 border-b'>Ҳолат</th>
                <th className='py-2 px-4 border-b'>Тўлов тури</th>
                <th className='py-2 px-4 border-b'>Умумий нарх</th>
                <th className='py-2 px-4 border-b'>Буюртма санаси</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr
                  key={order._id}
                  className='hover:bg-gray-50 transition-colors duration-150'
                >
                  <td className='py-2 px-4 border-b text-gray-700'>
                    {order._id}
                  </td>
                  <td className='py-2 px-4 border-b text-gray-700'>
                    {order.customer?.name || 'Мавжуд эмас'}
                  </td>
                  <td className='py-2 px-4 border-b text-gray-700'>
                    {order.products.map((item, index) => (
                      <div key={index} className='mb-1'>
                        {item.product?.name || 'Мавжуд эмас'} (
                        <span className='font-semibold'>Сони:</span>{' '}
                        {item.quantity},{' '}
                        <span className='font-semibold'>Нарх:</span>{' '}
                        {item.price || item.product?.price || 0} сўм)
                      </div>
                    ))}
                  </td>
                  <td className='py-2 px-4 border-b text-gray-700'>
                    {order.status || 'Аниқланмаган'}
                  </td>
                  <td className='py-2 px-4 border-b text-gray-700'>
                    {order.payType || '—'}
                  </td>
                  <td className='py-2 px-4 border-b text-gray-700'>
                    {order.totalPrice?.toLocaleString('uz-UZ')} сўм
                  </td>
                  <td className='py-2 px-4 border-b text-gray-700'>
                    {new Date(
                      order.createdAt || order.orderDate
                    ).toLocaleDateString('uz-UZ', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal ochilsa */}
      {isOpen && (
        <AddNewOrder onClose={() => setIsOpen(false)} isOpen={isOpen} />
      )}
    </div>
  )
}
