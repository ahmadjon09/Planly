import {
  Plus,
  Trash2,
  ShieldBan,
  User,
  Phone,
  Mail,
  Shield,
  Crown,
  Users,
  Search
} from 'lucide-react'
import useSWR, { mutate } from 'swr'
import Axios from '../middlewares/fetcher'
import '../assets/css/home.css'
import { LoadingState } from '../components/loading-state'
import { ErrorState } from '../components/error-state'
import { Link } from 'react-router-dom'
import { useContext, useState, useMemo } from 'react'
import { ContextData } from '../contextData/Context'
import { motion, AnimatePresence } from 'framer-motion'

export const Workers = () => {
  const { data, isLoading, error } = useSWR('/users', Axios, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  })
  const { user } = useContext(ContextData)

  const [searchTerm, setSearchTerm] = useState('')

  const workers = (data?.data?.data || []).filter(u => u.role === 'worker')
  const isBoss = user._id

  // Filter workers based on search
  const filteredWorkers = useMemo(() => {
    return workers.filter(
      worker =>
        searchTerm === '' ||
        worker.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.phoneNumber?.includes(searchTerm) ||
        worker.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [workers, searchTerm])

  const handleDelete = async id => {
    const workerToDelete = workers.find(w => w._id === id)
    const confirmMessage = `🗑️ Сиз ростдан ҳам "${workerToDelete?.firstName} ${workerToDelete?.lastName}" ходимини ўчирмоқчимисиз?\n\nБу амални кейин бекор қилиб бўлмайди. Ишончингиз комилми?`

    if (!window.confirm(confirmMessage)) return

    try {
      await Axios.delete(`users/${id}`)
      mutate('/users')
    } catch (error) {
      alert(
        error.response?.data?.message || 'Ходимни ўчиришда хатолик юз берди'
      )
    }
  }

  const getRoleColor = worker => {
    if (worker._id === isBoss)
      return 'bg-amber-100 text-amber-800 border-amber-200'
    if (worker.role === 'admin')
      return 'bg-purple-100 text-purple-800 border-purple-200'
    return 'bg-blue-100 text-blue-800 border-blue-200'
  }

  const getRoleIcon = worker => {
    if (worker._id === isBoss) return <Crown className='h-4 w-4' />
    if (worker.role === 'admin') return <Shield className='h-4 w-4' />
    return <User className='h-4 w-4' />
  }

  const getRoleText = worker => {
    if (worker._id === isBoss) return 'Cиз'
    if (worker.role === 'admin') return 'Админ'
    return 'Ходим'
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-white rounded-2xl shadow-xl p-8 border border-gray-200 mb-8'
        >
          <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6'>
            <div className='flex items-center gap-4'>
              <div className='bg-gradient-to-r from-blue-500 to-indigo-500 p-4 rounded-2xl shadow-lg'>
                <Users className='h-8 w-8 text-white' />
              </div>
              <div>
                <h1 className='text-3xl font-bold text-gray-800'>
                  Ходимлар рўйхати
                </h1>
                <p className='text-gray-600 mt-2'>
                  Барча фаол ходимлар ҳақида маълумот
                </p>
              </div>
            </div>

            <div className='flex flex-col sm:flex-row gap-4 w-full lg:w-auto'>
              <div className='relative flex-1 lg:flex-none lg:w-80'>
                <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5' />
                <input
                  type='text'
                  placeholder='Ходимни излаш...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 bg-white shadow-sm'
                />
              </div>

              {user.role === 'admin' && (
                <Link
                  to={'/user'}
                  className='flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 justify-center'
                >
                  <Plus className='h-5 w-5' />
                  <span className='font-semibold'>Янги ходим</span>
                </Link>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'
        >
          <div className='bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-gray-600 text-sm font-medium'>
                  Жами ходимлар
                </p>
                <p className='text-3xl font-bold text-gray-800 mt-2'>
                  {workers.length}
                </p>
              </div>
              <div className='bg-blue-100 p-3 rounded-xl'>
                <Users className='h-7 w-7 text-blue-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-gray-600 text-sm font-medium'>
                  Фаол ходимлар
                </p>
                <p className='text-3xl font-bold text-gray-800 mt-2'>
                  {workers.length}
                </p>
              </div>
              <div className='bg-green-100 p-3 rounded-xl'>
                <User className='h-7 w-7 text-green-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-gray-600 text-sm font-medium'>Ҳолат</p>
                <p className='text-2xl font-bold text-green-600 mt-2'>Фаол</p>
              </div>
              <div className='bg-green-100 p-3 rounded-xl'>
                <Shield className='h-7 w-7 text-green-600' />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        {isLoading ? (
          <div className='bg-white rounded-2xl shadow-xl p-12'>
            <LoadingState />
          </div>
        ) : error ? (
          <div className='bg-white rounded-2xl shadow-xl p-8'>
            <ErrorState message={error.response?.data?.message} />
          </div>
        ) : filteredWorkers.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className='bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200'
          >
            {/* Table Header */}
            <div className='px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100'>
              <div className='flex items-center justify-between'>
                <h3 className='text-xl font-semibold text-gray-800'>
                  Ходимлар рўйхати ({filteredWorkers.length})
                </h3>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className='text-blue-500 hover:text-blue-700 font-medium text-sm'
                  >
                    Филтрни тозалаш
                  </button>
                )}
              </div>
            </div>

            {/* Beautiful Table */}
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-gradient-to-r from-blue-50 to-indigo-50'>
                  <tr>
                    <th className='py-5 px-8 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider'>
                      Ходим
                    </th>
                    <th className='py-5 px-8 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider'>
                      Алоқа
                    </th>
                    <th className='py-5 px-8 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider'>
                      Лавозим
                    </th>
                    {user.owner && (
                      <th className='py-5 px-8 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider'>
                        Амаллар
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200'>
                  {filteredWorkers.map((worker, index) => (
                    <motion.tr
                      key={worker._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`hover:bg-blue-50 transition-all duration-200 group ${
                        worker._id === isBoss
                          ? 'bg-amber-50 hover:bg-amber-100'
                          : ''
                      }`}
                    >
                      {/* Worker Info */}
                      <td className='py-5 px-8'>
                        <div className='flex items-center gap-4'>
                          <div
                            className={`p-3 rounded-xl shadow-sm ${
                              worker._id === isBoss
                                ? 'bg-amber-100 text-amber-600'
                                : 'bg-blue-100 text-blue-600'
                            }`}
                          >
                            <User className='h-6 w-6' />
                          </div>
                          <div>
                            <p className='font-bold text-lg text-gray-800 group-hover:text-blue-600 transition-colors'>
                              {worker.firstName} {worker.lastName}
                            </p>
                            <p className='text-gray-600 text-sm mt-1'>
                              {worker.email || 'Емаил мавжуд эмас'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className='py-5 px-8'>
                        <div className='space-y-2'>
                          <a
                            href={`tel:${worker.phoneNumber}`}
                            className='flex items-center gap-3 text-blue-600 hover:text-blue-700 transition-colors font-semibold group'
                          >
                            <div className='bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200 transition-colors'>
                              <Phone className='h-4 w-4' />
                            </div>
                            <span className='group-hover:underline'>
                              {worker.phoneNumber}
                            </span>
                          </a>
                          {worker.email && (
                            <a
                              href={`mailto:${worker.email}`}
                              className='flex items-center gap-3 text-gray-600 hover:text-gray-700 transition-colors text-sm group'
                            >
                              <div className='bg-gray-100 p-2 rounded-lg group-hover:bg-gray-200 transition-colors'>
                                <Mail className='h-4 w-4' />
                              </div>
                              <span className='group-hover:underline'>
                                {worker.email}
                              </span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Role */}
                      <td className='py-5 px-8'>
                        <span
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border-2 ${getRoleColor(
                            worker
                          )}`}
                        >
                          {getRoleIcon(worker)}
                          {getRoleText(worker)}
                        </span>
                      </td>

                      {/* Actions */}
                      {user.owner && (
                        <td className='py-5 px-8 text-center'>
                          {!worker.owner ? (
                            <button
                              onClick={() => handleDelete(worker._id)}
                              className='inline-flex items-center gap-2 bg-red-500 text-white hover:bg-red-600 transition-all duration-200 px-6 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105'
                            >
                              <Trash2 className='h-5 w-5' />
                              Ўчириш
                            </button>
                          ) : (
                            <div className='flex items-center justify-center gap-2 text-amber-600'>
                              <Crown className='h-5 w-5' />
                              <span className='font-semibold'>Асосий</span>
                            </div>
                          )}
                        </td>
                      )}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className='bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-200'
          >
            <div className='max-w-md mx-auto'>
              <div className='bg-gradient-to-r from-gray-100 to-gray-200 p-6 rounded-2xl inline-flex mb-6'>
                <ShieldBan className='h-16 w-16 text-gray-400' />
              </div>
              <h3 className='text-2xl font-semibold text-gray-800 mb-3'>
                Ходимлар топилмади
              </h3>
              <p className='text-gray-600 mb-8 text-lg'>
                {searchTerm
                  ? 'Қидирув шартларингизга мос келувчи ходимлар топилмади'
                  : 'Ҳали бирор ходим қўшилмаган. Янги ходим қўшиш учун тугмани босинг.'}
              </p>
              <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className='px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold'
                  >
                    Филтрни тозалаш
                  </button>
                )}
                {user.role === 'admin' && (
                  <Link
                    to={'/user'}
                    className='inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:shadow-xl transition-all duration-300 font-semibold'
                  >
                    <Plus className='h-5 w-5' />
                    Янги ходим қўшиш
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
