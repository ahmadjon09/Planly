import {
  Plus,
  Trash2,
  Shield,
  Crown,
  Users,
  UserCheck,
  Phone,
  Mail,
  Search
} from 'lucide-react'
import useSWR from 'swr'
import Axios from '../middlewares/fetcher'
import '../assets/css/home.css'
import { LoadingState } from '../components/loading-state'
import { ErrorState } from '../components/error-state'
import { Link } from 'react-router-dom'
import { useContext, useState, useMemo } from 'react'
import { ContextData } from '../contextData/Context'
import { motion, AnimatePresence } from 'framer-motion'

export const Admins = () => {
  const { user } = useContext(ContextData)
  const { data, isLoading, error, mutate } = useSWR('/users', Axios, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  })

  const [searchTerm, setSearchTerm] = useState('')

  const admins = (data?.data?.data || []).filter(user => user.role === 'admin')
  const isCurrentUser = user._id

  // Filter admins based on search
  const filteredAdmins = useMemo(() => {
    return admins.filter(
      admin =>
        searchTerm === '' ||
        admin.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.phoneNumber?.includes(searchTerm) ||
        admin.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [admins, searchTerm])

  const handleDelete = async id => {
    const adminToDelete = admins.find(admin => admin._id === id)
    const confirmMessage = `🗑️ Сиз ростдан ҳам "${adminToDelete?.firstName} ${adminToDelete?.lastName}" администраторни ўчирмоқчимисиз?\n\nБу амални кейин бекор қилиб бўлмайди. Ишончингиз комилми?`

    if (!window.confirm(confirmMessage)) return

    try {
      await Axios.delete(`users/${id}`)
      mutate()
    } catch (error) {
      alert(
        error.response?.data?.message ||
          'Администраторни ўчиришда хатолик юз берди'
      )
    }
  }

  const getRoleColor = admin => {
    if (admin.owner) return 'bg-red-100 text-red-800 border-red-200'
    if (admin._id === isCurrentUser)
      return 'bg-amber-100 text-amber-800 border-amber-200'
    return 'bg-purple-100 text-purple-800 border-purple-200'
  }

  const getRoleIcon = admin => {
    if (admin.owner) return <Crown className='h-4 w-4' />
    if (admin._id === isCurrentUser) return <UserCheck className='h-4 w-4' />
    return <Shield className='h-4 w-4' />
  }

  const getRoleText = admin => {
    if (admin.owner) return 'Асосий Админ'
    if (admin._id === isCurrentUser) return 'Жорий Админ'
    return 'Администратор'
  }

  const getAdminIconColor = admin => {
    if (admin.owner) return 'bg-red-100 text-red-600'
    if (admin._id === isCurrentUser) return 'bg-amber-100 text-amber-600'
    return 'bg-purple-100 text-purple-600'
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-white rounded-2xl shadow-xl p-8 border border-gray-200 mb-8'
        >
          <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6'>
            <div className='flex items-center gap-4'>
              <div className='bg-gradient-to-r from-purple-500 to-indigo-500 p-4 rounded-2xl shadow-lg'>
                <Shield className='h-8 w-8 text-white' />
              </div>
              <div>
                <h1 className='text-3xl font-bold text-gray-800'>
                  Админлар рўйхати
                </h1>
                <p className='text-gray-600 mt-2'>
                  Барча администраторлар ҳақида маълумот
                </p>
              </div>
            </div>

            <div className='flex flex-col sm:flex-row gap-4 w-full lg:w-auto'>
              <div className='relative flex-1 lg:flex-none lg:w-80'>
                <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5' />
                <input
                  type='text'
                  placeholder='Админни излаш...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-300 bg-white shadow-sm'
                />
              </div>

              {user.owner && (
                <Link
                  to={'/user/add-admin'}
                  className='flex items-center gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 justify-center'
                >
                  <Plus className='h-5 w-5' />
                  <span className='font-semibold'>Янги админ</span>
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
                  Жами админлар
                </p>
                <p className='text-3xl font-bold text-gray-800 mt-2'>
                  {admins.length}
                </p>
              </div>
              <div className='bg-purple-100 p-3 rounded-xl'>
                <Shield className='h-7 w-7 text-purple-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-gray-600 text-sm font-medium'>
                  Фаол админлар
                </p>
                <p className='text-3xl font-bold text-gray-800 mt-2'>
                  {admins.length}
                </p>
              </div>
              <div className='bg-green-100 p-3 rounded-xl'>
                <UserCheck className='h-7 w-7 text-green-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-gray-600 text-sm font-medium'>Ҳолат</p>
                <p className='text-2xl font-bold text-green-600 mt-2'>Фаол</p>
              </div>
              <div className='bg-blue-100 p-3 rounded-xl'>
                <Users className='h-7 w-7 text-blue-600' />
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
        ) : filteredAdmins.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className='bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200'
          >
            {/* Table Header */}
            <div className='px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50'>
              <div className='flex items-center justify-between'>
                <h3 className='text-xl font-semibold text-gray-800'>
                  Админлар рўйхати ({filteredAdmins.length})
                </h3>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className='text-purple-500 hover:text-purple-700 font-medium text-sm'
                  >
                    Филтрни тозалаш
                  </button>
                )}
              </div>
            </div>

            {/* Beautiful Table */}
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-gradient-to-r from-purple-50 to-indigo-50'>
                  <tr>
                    <th className='py-5 px-8 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider'>
                      Администратор
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
                  {filteredAdmins.map((admin, index) => (
                    <motion.tr
                      key={admin._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`hover:bg-purple-50 transition-all duration-200 group ${
                        admin._id === isCurrentUser
                          ? 'bg-amber-50 hover:bg-amber-100'
                          : admin.owner
                          ? 'bg-red-50 hover:bg-red-100'
                          : ''
                      }`}
                    >
                      {/* Admin Info */}
                      <td className='py-5 px-8'>
                        <div className='flex items-center gap-4'>
                          <div
                            className={`p-3 rounded-xl shadow-sm ${getAdminIconColor(
                              admin
                            )}`}
                          >
                            {admin.owner ? (
                              <Crown className='h-6 w-6' />
                            ) : (
                              <Shield className='h-6 w-6' />
                            )}
                          </div>
                          <div>
                            <p className='font-bold text-lg text-gray-800 group-hover:text-purple-600 transition-colors'>
                              {admin.firstName} {admin.lastName}
                            </p>
                            <p className='text-gray-600 text-sm mt-1'>
                              {admin.email || 'Емаил мавжуд эмас'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className='py-5 px-8'>
                        <div className='space-y-2'>
                          <a
                            href={`tel:${admin.phoneNumber}`}
                            className='flex items-center gap-3 text-blue-600 hover:text-blue-700 transition-colors font-semibold group'
                          >
                            <div className='bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200 transition-colors'>
                              <Phone className='h-4 w-4' />
                            </div>
                            <span className='group-hover:underline'>
                              {admin.phoneNumber}
                            </span>
                          </a>
                          {admin.email && (
                            <a
                              href={`mailto:${admin.email}`}
                              className='flex items-center gap-3 text-gray-600 hover:text-gray-700 transition-colors text-sm group'
                            >
                              <div className='bg-gray-100 p-2 rounded-lg group-hover:bg-gray-200 transition-colors'>
                                <Mail className='h-4 w-4' />
                              </div>
                              <span className='group-hover:underline'>
                                {admin.email}
                              </span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Role */}
                      <td className='py-5 px-8'>
                        <span
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border-2 ${getRoleColor(
                            admin
                          )}`}
                        >
                          {getRoleIcon(admin)}
                          {getRoleText(admin)}
                        </span>
                      </td>

                      {/* Actions */}
                      {user.owner && (
                        <td className='py-5 px-8 text-center'>
                          {!admin.owner ? (
                            <button
                              onClick={() => handleDelete(admin._id)}
                              className='inline-flex items-center gap-2 bg-red-500 text-white hover:bg-red-600 transition-all duration-200 px-6 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105'
                            >
                              <Trash2 className='h-5 w-5' />
                              Ўчириш
                            </button>
                          ) : (
                            <div className='flex items-center justify-center gap-2 text-red-600'>
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
              <div className='bg-gradient-to-r from-purple-100 to-indigo-100 p-6 rounded-2xl inline-flex mb-6'>
                <Shield className='h-16 w-16 text-purple-400' />
              </div>
              <h3 className='text-2xl font-semibold text-gray-800 mb-3'>
                Админлар топилмади
              </h3>
              <p className='text-gray-600 mb-8 text-lg'>
                {searchTerm
                  ? 'Қидирув шартларингизга мос келувчи админлар топилмади'
                  : 'Ҳали бирор администратор қўшилмаган. Янги админ қўшиш учун тугмани босинг.'}
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
                {user.owner && (
                  <Link
                    to={'/user/add-admin'}
                    className='inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:shadow-xl transition-all duration-300 font-semibold'
                  >
                    <Plus className='h-5 w-5' />
                    Янги админ қўшиш
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
