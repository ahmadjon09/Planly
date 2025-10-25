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
  User,
  Shield,
  CheckCircle,
  XCircle,
  Filter,
  Edit3,
  ChevronDown,
  MoreVertical,
  Calculator
} from 'lucide-react'
import Fetch from '../middlewares/fetcher'
import AddProductModal from '../components/AddProductModal'
import { ContextData } from '../contextData/Context'
import { LoadingState } from '../components/loading-state'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [activeMenu, setActiveMenu] = useState(null)

  const [searchID, setSearchID] = useState('')
  const [searchTitle, setSearchTitle] = useState('')
  const [searchDate, setSearchDate] = useState('')
  const [readyFilter, setReadyFilter] = useState('all')

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
      alert('❌ Сақлашда хатолик юз берди')
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async (id, title) => {
    const confirmMessage = `🗑️ Сиз ростдан ҳам "${title}" маҳсулотини ўчирмоқчимисиз?\n\nБу амални кейин тиклаб бўлмайди. Давом этасизми?`
    const confirmed = window.confirm(confirmMessage)
    if (!confirmed) return

    try {
      setDeleting(id)
      await Fetch.delete(`/products/${id}`)
      mutate()
    } catch (err) {
      console.error('Delete error:', err)
      alert('❌ Ўчириш жараёнида хатолик юз берди.')
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
          match && p.title?.toLowerCase().includes(searchTitle.toLowerCase())
      }
      if (searchDate) {
        const createdDate = new Date(p.createdAt).toISOString().split('T')[0]
        match = match && createdDate === searchDate
      }
      if (readyFilter === 'ready') {
        match = match && p.ready === true
      } else if (readyFilter === 'not-ready') {
        match = match && p.ready === false
      }
      return match
    }) || []

  const getStatusColor = ready => {
    return ready
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200'
  }

  const getStatusIcon = ready => {
    return ready ? (
      <CheckCircle className='h-4 w-4 text-green-600' />
    ) : (
      <XCircle className='h-4 w-4 text-red-600' />
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6'>
      <div className='mx-auto space-y-6'>
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-white rounded-2xl shadow-xl p-8 border border-gray-200'
        >
          <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6'>
            <div className='flex items-center gap-4'>
              <div className='bg-gradient-to-r from-blue-500 to-indigo-500 p-4 rounded-2xl shadow-lg'>
                <Boxes className='h-8 w-8 text-white' />
              </div>
              <div>
                <h1 className='text-3xl font-bold text-gray-800'>
                  Маҳсулотлар бошқаруви
                </h1>
                <p className='text-gray-600 mt-2'>
                  Барча маҳсулотлар ҳақида маълумот
                </p>
              </div>
            </div>

            <div className='flex flex-col sm:flex-row gap-4 w-full lg:w-auto'>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setOpen(true)}
                className='flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 justify-center'
              >
                <Plus size={20} />
                <span className='font-semibold'>Янги маҳсулот</span>
              </motion.button>
            </div>
          </div>

          {user.role !== 'admin' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className='mt-4 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 w-fit'
            >
              <Shield size={16} className='text-blue-600' />
              <span className='text-blue-700 text-sm font-medium'>
                Фақат кўриш
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Search and Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='bg-white rounded-2xl shadow-xl p-6 border border-gray-200'
        >
          <div className='flex flex-col md:flex-row gap-6'>
            <div className='flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
              <div className='relative'>
                <Hash className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5' />
                <input
                  type='number'
                  placeholder='ID бўйича'
                  value={searchID}
                  onChange={e => setSearchID(e.target.value)}
                  className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 bg-gray-50'
                />
              </div>

              <div className='relative'>
                <Tag className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5' />
                <input
                  type='text'
                  placeholder='Номи бўйича'
                  value={searchTitle}
                  onChange={e => setSearchTitle(e.target.value)}
                  className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 bg-gray-50'
                />
              </div>

              <div className='relative'>
                <Calendar className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5' />
                <input
                  type='date'
                  value={searchDate}
                  onChange={e => setSearchDate(e.target.value)}
                  className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 bg-gray-50'
                />
              </div>

              <div className='relative'>
                <Filter className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5' />
                <select
                  value={readyFilter}
                  onChange={e => setReadyFilter(e.target.value)}
                  className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 bg-gray-50 appearance-none'
                >
                  <option value='all'>Ҳамма маҳсулотлар</option>
                  <option value='ready'>Тайёр маҳсулотлар</option>
                  <option value='not-ready'>Тайёр бўлмаган</option>
                </select>
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
            <div className='text-center text-red-500'>
              <XCircle className='h-12 w-12 mx-auto mb-4 text-red-400' />
              <h3 className='text-lg font-semibold mb-2'>Хатолик юз берди</h3>
              <p>{error.response?.data?.message || error.message}</p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className='bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200'
          >
            {/* Table Header */}
            <div className='px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50'>
              <div className='flex items-center justify-between'>
                <h3 className='text-xl font-semibold text-gray-800'>
                  Маҳсулотлар рўйхати ({filteredProducts.length})
                </h3>
                {(searchID ||
                  searchTitle ||
                  searchDate ||
                  readyFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchID('')
                      setSearchTitle('')
                      setSearchDate('')
                      setReadyFilter('all')
                    }}
                    className='text-blue-500 hover:text-blue-700 font-medium text-sm'
                  >
                    Филтрни тозалаш
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-gradient-to-r from-gray-50 to-gray-100'>
                  <tr>
                    <th className='px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider'>
                      Маҳсулот
                    </th>
                    <th className='px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider'>
                      Нарх ва Миқдор
                    </th>
                    <th className='px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider'>
                      Бирлик
                    </th>
                    <th className='px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider'>
                      Ҳолати
                    </th>
                    <th className='px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider'>
                      Сана
                    </th>
                    <th className='px-8 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider'>
                      Амаллар
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200'>
                  {filteredProducts.map((product, index) => {
                    const isEdited = Boolean(editing[product._id])
                    return (
                      <motion.tr
                        key={product._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className='hover:bg-blue-50 transition-all duration-200 group'
                      >
                        {/* Product Info */}
                        <td className='px-8 py-4'>
                          <div className='flex items-center gap-4'>
                            <div className='bg-blue-100 p-3 rounded-xl'>
                              <Package className='h-6 w-6 text-blue-600' />
                            </div>
                            <div>
                              <p className='font-bold text-gray-800 text-lg'>
                                {product.title}
                              </p>
                              <p className='text-gray-600 text-sm'>
                                ID: {product.ID}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Price and Stock */}
                        <td className='px-8 py-4'>
                          <div className='space-y-2'>
                            <div className='flex items-center gap-2'>
                              <DollarSign className='h-4 w-4 text-green-500' />
                              {user.role === 'admin' ? (
                                <input
                                  type='number'
                                  defaultValue={product.price}
                                  className='border border-gray-300 rounded-lg px-3 py-2 w-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all'
                                  onChange={e =>
                                    handleChange(
                                      product._id,
                                      'price',
                                      Number(e.target.value)
                                    )
                                  }
                                />
                              ) : (
                                <span className='font-semibold text-green-600'>
                                  {product.price?.toLocaleString()} сўм
                                </span>
                              )}
                            </div>
                            <div className='flex items-center gap-2'>
                              <Calculator className='h-4 w-4 text-blue-500' />
                              <input
                                type='number'
                                defaultValue={product.stock}
                                className='border border-gray-300 rounded-lg px-3 py-2 w-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all'
                                onChange={e =>
                                  handleChange(
                                    product._id,
                                    'stock',
                                    Number(e.target.value)
                                  )
                                }
                              />
                            </div>
                          </div>
                        </td>

                        {/* Unit */}
                        <td className='px-8 py-4'>
                          <select
                            defaultValue={product.unit || 'дона'}
                            onChange={e =>
                              handleChange(product._id, 'unit', e.target.value)
                            }
                            className='border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all'
                          >
                            {availableUnits.map(u => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Status */}
                        <td className='px-8 py-4'>
                          {user.role === 'admin' ? (
                            <select
                              defaultValue={product.ready ? 'true' : 'false'}
                              onChange={e =>
                                handleChange(
                                  product._id,
                                  'ready',
                                  e.target.value === 'true'
                                )
                              }
                              className='border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all'
                            >
                              <option value='true'>Тайёр</option>
                              <option value='false'>Тайёр эмас</option>
                            </select>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                                product.ready
                              )}`}
                            >
                              {getStatusIcon(product.ready)}
                              {product.ready ? 'Тайёр' : 'Тайёр эмас'}
                            </span>
                          )}
                        </td>

                        {/* Date */}
                        <td className='px-8 py-4 text-gray-600'>
                          {new Date(product.createdAt).toLocaleDateString()}
                        </td>

                        {/* Actions */}
                        <td className='px-8 py-4'>
                          <div className='flex items-center justify-center gap-2'>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setViewData(product)}
                              className='flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors'
                            >
                              <Eye size={16} />
                              Кўриш
                            </motion.button>

                            {isEdited && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSave(product._id)}
                                disabled={loading === product._id}
                                className='flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors'
                              >
                                {loading === product._id ? (
                                  <Loader2 className='animate-spin' size={16} />
                                ) : (
                                  <Save size={16} />
                                )}
                                Сақлаш
                              </motion.button>
                            )}

                            {user.role === 'admin' && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() =>
                                  handleDelete(product._id, product.title)
                                }
                                disabled={deleting === product._id}
                                className='flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors'
                              >
                                {deleting === product._id ? (
                                  <Loader2 className='animate-spin' size={16} />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                                Ўчириш
                              </motion.button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {filteredProducts.length === 0 && (
              <div className='text-center py-16'>
                <Boxes size={64} className='mx-auto mb-4 text-gray-300' />
                <h3 className='text-xl font-semibold text-gray-600 mb-2'>
                  Маҳсулотлар топилмади
                </h3>
                <p className='text-gray-500 mb-6'>
                  {searchID ||
                  searchTitle ||
                  searchDate ||
                  readyFilter !== 'all'
                    ? 'Қидирув шартларингизга мос келувчи маҳсулотлар топилмади'
                    : 'Ҳали бирор маҳсулот қўшилмаган'}
                </p>
                {(searchID ||
                  searchTitle ||
                  searchDate ||
                  readyFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchID('')
                      setSearchTitle('')
                      setSearchDate('')
                      setReadyFilter('all')
                    }}
                    className='text-blue-500 hover:text-blue-700 font-semibold'
                  >
                    Филтрни тозалаш
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}

        <AddProductModal open={open} setOpen={setOpen} mutate={mutate} />

        {/* Product Detail Modal */}
        <AnimatePresence>
          {viewData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewData(null)}
              className='fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-4'
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={e => e.stopPropagation()}
                className='bg-white w-full max-w-4xl rounded-3xl shadow-2xl relative max-h-[90vh] overflow-y-auto'
              >
                {/* Modal content remains the same as your original */}
                {viewData && (
                  <div
                    onClick={() => setViewData(null)}
                    className='fixed inset-0 bg-black/70 flex justify-center items-center z-[100] p-3 md:p-6'
                  >
                    <div
                      onClick={e => e.stopPropagation()}
                      className='bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'
                    >
                      <div className='sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex justify-between items-center'>
                        <h2 className='text-xl font-bold flex items-center gap-2 text-gray-800'>
                          <Tag size={22} className='text-blue-600' />
                          Маҳсулот маълумотлари
                        </h2>
                        <button
                          onClick={() => setViewData(null)}
                          className='text-gray-500 hover:text-black transition p-1 rounded-full hover:bg-gray-100'
                        >
                          ✖
                        </button>
                      </div>

                      <div className='p-6 space-y-4'>
                        {/* Asosiy ma'lumotlar */}
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          <div className='space-y-4'>
                            <div className='flex items-center gap-3'>
                              <div className='bg-blue-100 p-2 rounded-lg'>
                                <Hash size={18} className='text-blue-600' />
                              </div>
                              <div>
                                <p className='text-sm text-gray-500'>ID</p>
                                <p className='font-medium'>{viewData.ID}</p>
                              </div>
                            </div>

                            <div className='flex items-center gap-3'>
                              <div className='bg-blue-100 p-2 rounded-lg'>
                                <Boxes size={18} className='text-blue-600' />
                              </div>
                              <div>
                                <p className='text-sm text-gray-500'>Номи</p>
                                <p className='font-medium'>{viewData.title}</p>
                              </div>
                            </div>

                            <div className='flex items-center gap-3'>
                              <div className='bg-blue-100 p-2 rounded-lg'>
                                <DollarSign
                                  size={18}
                                  className='text-blue-600'
                                />
                              </div>
                              <div className='flex-1'>
                                <p className='text-sm text-gray-500'>Нархи</p>
                                {user.role === 'admin' ? (
                                  <div className='flex items-center gap-2'>
                                    <input
                                      type='number'
                                      defaultValue={viewData.price}
                                      className='border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all'
                                      onChange={e =>
                                        handleChange(
                                          viewData._id,
                                          'price',
                                          Number(e.target.value)
                                        )
                                      }
                                    />
                                    <span className='text-gray-600 whitespace-nowrap'>
                                      сўм
                                    </span>
                                  </div>
                                ) : (
                                  <p className='font-medium'>
                                    {viewData.price?.toLocaleString()} сўм
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className='space-y-4'>
                            <div className='flex items-center gap-3'>
                              <div className='bg-blue-100 p-2 rounded-lg'>
                                <Package size={18} className='text-blue-600' />
                              </div>
                              <div className='flex-1'>
                                <p className='text-sm text-gray-500'>Миқдори</p>
                                {user.role === 'admin' ? (
                                  <input
                                    type='number'
                                    defaultValue={viewData.stock}
                                    className='border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all'
                                    onChange={e =>
                                      handleChange(
                                        viewData._id,
                                        'stock',
                                        Number(e.target.value)
                                      )
                                    }
                                  />
                                ) : (
                                  <p className='font-medium'>
                                    {viewData.stock}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className='flex items-center gap-3'>
                              <div className='bg-blue-100 p-2 rounded-lg'>
                                <Ruler size={18} className='text-blue-600' />
                              </div>
                              <div className='flex-1'>
                                <p className='text-sm text-gray-500'>Бирлик</p>
                                {user.role === 'admin' ? (
                                  <select
                                    defaultValue={viewData.unit || 'дона'}
                                    onChange={e =>
                                      handleChange(
                                        viewData._id,
                                        'unit',
                                        e.target.value
                                      )
                                    }
                                    className='border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all'
                                  >
                                    {availableUnits.map(u => (
                                      <option key={u} value={u}>
                                        {u}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <p className='font-medium'>
                                    {viewData.unit || 'дона'}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className='flex items-center gap-3'>
                              <div className='bg-blue-100 p-2 rounded-lg'>
                                {viewData.ready ? (
                                  <CheckCircle
                                    size={18}
                                    className='text-green-600'
                                  />
                                ) : (
                                  <XCircle size={18} className='text-red-600' />
                                )}
                              </div>
                              <div className='flex-1'>
                                <p className='text-sm text-gray-500'>Ҳолати</p>
                                {user.role === 'admin' ? (
                                  <select
                                    defaultValue={
                                      viewData.ready ? 'true' : 'false'
                                    }
                                    onChange={e =>
                                      handleChange(
                                        viewData._id,
                                        'ready',
                                        e.target.value === 'true'
                                      )
                                    }
                                    className='border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all'
                                  >
                                    <option value='true'>Тайёр</option>
                                    <option value='false'>Тайёр эмас</option>
                                  </select>
                                ) : (
                                  <p
                                    className={`font-medium ${
                                      viewData.ready
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                    }`}
                                  >
                                    {viewData.ready ? 'Тайёр' : 'Тайёр эмас'}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className='bg-gray-50 rounded-xl p-4 mt-4'>
                          <h3 className='font-semibold text-gray-700 mb-3 flex items-center gap-2'>
                            📦 Келган жой ҳақида
                          </h3>

                          <div className='space-y-3'>
                            <div className='flex items-center gap-3'>
                              <User
                                size={16}
                                className='text-gray-500 flex-shrink-0'
                              />
                              <div className='flex-1'>
                                <p className='text-sm text-gray-500'>Номи</p>
                                {user.role === 'admin' ? (
                                  <input
                                    type='text'
                                    defaultValue={viewData.from?.name || ''}
                                    placeholder='Номи'
                                    className='border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all'
                                    onChange={e =>
                                      handleChange(viewData._id, 'from', {
                                        ...(editing[viewData._id]?.from ||
                                          viewData.from ||
                                          {}),
                                        name: e.target.value
                                      })
                                    }
                                  />
                                ) : (
                                  <p className='font-medium'>
                                    {viewData.from?.name || '—'}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className='flex items-center gap-3'>
                              <Phone
                                size={16}
                                className='text-gray-500 flex-shrink-0'
                              />
                              <div className='flex-1'>
                                <p className='text-sm text-gray-500'>Телефон</p>
                                {user.role === 'admin' ? (
                                  <input
                                    type='text'
                                    defaultValue={
                                      viewData.from?.phoneNumber || ''
                                    }
                                    placeholder='Телефон рақами'
                                    className='border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all'
                                    onChange={e =>
                                      handleChange(viewData._id, 'from', {
                                        ...(editing[viewData._id]?.from ||
                                          viewData.from ||
                                          {}),
                                        phoneNumber: e.target.value
                                      })
                                    }
                                  />
                                ) : (
                                  <p className='font-medium'>
                                    {viewData.from?.phoneNumber || '—'}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className='flex items-center gap-3'>
                              <MapPin
                                size={16}
                                className='text-gray-500 flex-shrink-0'
                              />
                              <div className='flex-1'>
                                <p className='text-sm text-gray-500'>Манзил</p>
                                {user.role === 'admin' ? (
                                  <input
                                    type='text'
                                    defaultValue={viewData.from?.address || ''}
                                    placeholder='Манзил'
                                    className='border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all'
                                    onChange={e =>
                                      handleChange(viewData._id, 'from', {
                                        ...(editing[viewData._id]?.from ||
                                          viewData.from ||
                                          {}),
                                        address: e.target.value
                                      })
                                    }
                                  />
                                ) : (
                                  <p className='font-medium'>
                                    {viewData.from?.address || '—'}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Vaqt ma'lumotlari */}
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200'>
                          <div className='flex items-center gap-3'>
                            <Calendar
                              size={16}
                              className='text-gray-500 flex-shrink-0'
                            />
                            <div>
                              <p className='text-sm text-gray-500'>Яратилган</p>
                              <p className='font-medium'>
                                {new Date(viewData.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <div className='flex items-center gap-3'>
                            <Calendar
                              size={16}
                              className='text-gray-500 flex-shrink-0'
                            />
                            <div>
                              <p className='text-sm text-gray-500'>
                                Янгилланган
                              </p>
                              <p className='font-medium'>
                                {new Date(viewData.updatedAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {editing[viewData._id] && (
                        <div className='sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl flex justify-end'>
                          <button
                            onClick={() => handleSave(viewData._id)}
                            disabled={loading === viewData._id}
                            className='flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors shadow-sm'
                          >
                            {loading === viewData._id ? (
                              <Loader2 className='animate-spin' size={18} />
                            ) : (
                              <Save size={18} />
                            )}
                            Сақлаш
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
