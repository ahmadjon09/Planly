import { Plus, Trash2, ShieldBan, AlertTriangleIcon } from 'lucide-react'
import useSWR, { mutate } from 'swr'
import Axios from '../middlewares/fetcher'
import '../assets/css/home.css'
import { LoadingState } from '../components/loading-state'
import { ErrorState } from '../components/error-state'
import { Link } from 'react-router-dom'
import { useContext } from 'react'
import { ContextData } from '../contextData/Context'

export const Workers = () => {
  const { data, isLoading, error } = useSWR('/users', Axios)
  const { user } = useContext(ContextData)

  const workers = (data?.data?.data || []).filter(u => u.role === 'worker')
  const isBoss = user._id

  const handleDelete = async id => {
    if (!window.confirm('Ходимни ўчиришга ишончингиз комилми?')) return
    try {
      await Axios.delete(`worker/${id}`)
      mutate('/users')
    } catch (error) {
      alert(error.response?.data?.message || 'Ходимни ўчириб бўлмади')
    }
  }

  return (
    <div className='container min-h-screen overflow-y-auto px-4'>
      <br />
      <br />
      <div className='w-full flex flex-col md:flex-row justify-between items-center gap-4 mb-6'>
        <h1 className='text-2xl font-bold text-gray-800 mb-2 md:mb-0'>
          Ходимлар рўйхати
        </h1>

        {user.role === 'admin' ? (
          <Link
            to={'/user'}
            className='w-full md:w-auto px-4 py-2 bg-blue-500 text-white rounded-md hover:cursor-pointer hover:bg-blue-600 transition-colors flex items-center justify-center gap-2'
          >
            <Plus className='h-4 w-4' />
            Янги ходим
          </Link>
        ) : null}
      </div>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error.response?.data?.message} />
      ) : workers.length > 0 ? (
        <div className='bg-white rounded-lg shadow-md overflow-hidden'>
          <div className='h-full w-full pb-5 overflow-x-auto'>
            <table className='w-full text-sm sm:text-base'>
              <thead className='bg-blue-700 text-white'>
                <tr>
                  <th className='py-3 px-2 sm:px-6 text-left'>Исм</th>
                  <th className='py-3 px-2 sm:px-6 text-left'>Фамилия</th>
                  <th className='py-3 px-2 sm:px-6 text-left'>Телефон рақам</th>
                  {user.owner ? (
                    <th className='py-3 px-2 sm:px-4 text-center'>Амаллар</th>
                  ) : null}
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200'>
                {workers.map(worker => (
                  <tr
                    key={worker._id}
                    className={`transition-colors ${
                      worker._id === isBoss
                        ? 'bg-amber-100'
                        : 'hover:bg-blue-50'
                    }`}
                  >
                    <td className='py-3 px-2 sm:px-6 text-gray-600'>
                      {worker.firstName || '-'}
                    </td>
                    <td className='py-3 px-2 sm:px-6 text-gray-600'>
                      {worker.lastName || '-'}
                    </td>
                    <td className='py-3 px-2 sm:px-6 font-medium text-blue-600 hover:underline'>
                      <a href={`tel:${worker.phoneNumber}`}>
                        {worker.phoneNumber}
                      </a>
                    </td>
                    {user.owner ? (
                      <td className='py-3 px-2 sm:px-4 text-center'>
                        {!worker.owner ? (
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              handleDelete(worker._id)
                            }}
                            className='bg-red-500 cursor-pointer text-white rounded-md p-1.5 hover:bg-red-600 transition-colors'
                          >
                            <Trash2 className='text-white w-4 h-4' />
                          </button>
                        ) : (
                          <button
                            disabled={true}
                            className='cursor-not-allowed'
                          >
                            <AlertTriangleIcon />
                          </button>
                        )}
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className='bg-gray-50 border border-gray-200 rounded-lg p-12 text-center'>
          <ShieldBan className='h-12 w-12 text-gray-400 mx-auto mb-4' />
          <p className='text-gray-600 text-center text-lg'>
            Ходимлар топилмади.
          </p>
        </div>
      )}
    </div>
  )
}
