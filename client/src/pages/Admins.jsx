import { Plus } from 'lucide-react'
import useSWR from 'swr'
import Axios from '../middlewares/fetcher'
import '../assets/css/home.css'
import { AdminTable } from '../components/admin/admin-table'
import { LoadingState } from '../components/loading-state'
import { ErrorState } from '../components/error-state'
import { EmptyState } from '../components/admin/empty-state'
import { Link } from 'react-router-dom'
import { useContext } from 'react'
import { ContextData } from '../context/Context'

export const Admins = () => {
  const { user } = useContext(ContextData)
  const { data, isLoading, error, mutate } = useSWR('/users', Axios)
  const Admins = (data?.data?.data || []).filter(user => user.role === 'admin')

  const handleDelete = async id => {
    if (!window.confirm('Админни ўчиришга ишончингиз комилми?')) return
    try {
      await Axios.delete(`users/${id}`)
      mutate()
    } catch (error) {
      alert(error.response?.data?.message || 'Админни ўчириб бўлмади')
    }
  }

  return (
    <div className='container min-h-screen overflow-y-auto px-4'>
      <br />
      <br />
      <div className='w-full flex flex-col md:flex-row justify-between items-center gap-4 mb-6'>
        <h1 className='text-2xl font-bold text-gray-800 mb-2 md:mb-0'>
          Админлар рўйхати
        </h1>
        {user.owner ? (
          <Link
            to={'/user/add-admin'}
            className='w-full md:w-auto px-4 py-2 bg-blue-500 text-white rounded-md hover:cursor-pointer hover:bg-blue-600 transition-colors flex items-center justify-center gap-2'
          >
            <Plus className='h-4 w-4' />
            Янги aдмин
          </Link>
        ) : null}
      </div>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error.response?.data?.message} />
      ) : Admins.length > 0 ? (
        <AdminTable admins={Admins} handleDelete={handleDelete} />
      ) : (
        <EmptyState />
      )}
    </div>
  )
}
