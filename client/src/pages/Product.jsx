import { useState, useContext } from 'react'
import { useParams } from 'react-router-dom'
import useSWR from 'swr'
import {
  Boxes,
  Loader2,
  Plus,
  Save,
  Eye,
  Hash,
  Tag,
  DollarSign,
  Package,
  Ruler,
  Calendar,
  CheckCircle,
  XCircle,
  Circle
} from 'lucide-react'
import Fetch from '../middlewares/fetcher'
import AddProductModal from '../components/AddProductModal'
import { ContextData } from '../contextData/Context'
import { LoadingState } from '../components/loading-state'
import { motion, AnimatePresence } from 'framer-motion'

export const ProductsPage = () => {
  const { user } = useContext(ContextData)
  const { type } = useParams()

  const apiEndpoint = type === 'ready' ? '/products/ready' : '/products/raw'

  const { data, error, isLoading, mutate } = useSWR(apiEndpoint, Fetch, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  })

  const [open, setOpen] = useState(false)
  const [viewData, setViewData] = useState(null)
  const [editing, setEditing] = useState({})
  const [loading, setLoading] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const [searchID, setSearchID] = useState('')
  const [searchTitle, setSearchTitle] = useState('')
  const [searchDate, setSearchDate] = useState('')

  // Format number with thousand separators
  const formatNumber = (num) => {
    if (num === undefined || num === null) return ''
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  // Parse formatted number back to raw number
  const parseNumber = (str) => {
    return Number(str.replace(/,/g, ''))
  }

  // Handle number input with formatting
  const handleNumberChange = (id, field, value) => {
    // Allow only numbers and dots
    const cleanedValue = value.replace(/[^\d.]/g, '')

    // Ensure only one dot
    const parts = cleanedValue.split('.')
    const formattedValue = parts.length > 2
      ? parts[0] + '.' + parts.slice(1).join('')
      : cleanedValue

    setEditing(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: formattedValue
      }
    }))
  }

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
      // Parse the formatted price back to number
      const rawPrice = editing[id].price ? parseNumber(editing[id].price) : 0

      const updateData = {
        price: rawPrice,
        priceType: editing[id].priceType
      }
      await Fetch.put(`/products/${id}`, updateData)
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
      return match
    }) || []

  const getPageTitle = () => {
    switch (type) {
      case 'ready': return 'Тайёр маҳсулотлар'
      case 'raw': return 'Хом ашё маҳсулотлар'
      default: return 'Хом ашё маҳсулотлар'
    }
  }

  const getPageDescription = () => {
    switch (type) {
      case 'ready': return 'Тайёр бўлган маҳсулотлар рўйхати'
      case 'raw': return 'Хом ашё маҳсулотлар рўйхати'
      default: return 'Хом ашё маҳсулотлар'
    }
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
                  {getPageTitle()}
                </h1>
                <p className='text-gray-600 mt-2'>
                  {getPageDescription()}
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
        </motion.div>

        {/* Search and Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='bg-white rounded-2xl shadow-xl p-6 border border-gray-200'
        >
          <div className='flex flex-col md:flex-row gap-6'>
            <div className='flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              <div className='relative'>
                <Hash className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5' />
                <input
                  type='text'
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
                <h3 className='text-xl font-semibold text-gray-800 flex gap-1 items-center'>
                  <Circle size={18} color='green' /> {getPageTitle()} ({filteredProducts.length})
                </h3>
                {(searchID || searchTitle || searchDate) && (
                  <button
                    onClick={() => {
                      setSearchID('')
                      setSearchTitle('')
                      setSearchDate('')
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
                      Нарх
                    </th>
                    <th className='px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider'>
                      Миқдор
                    </th>
                    <th className='px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider'>
                      Бирлик
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
                        className={`${product.stock == 0 ? "bg-red-300" : "bg-green-300"} transition-all duration-200 group`}
                      >
                        {/* Product Info */}
                        <td className='px-8 py-4'>
                          <div className='flex items-center gap-4'>
                            <div className={`bg-${product.ready ? "blue" : "red"}-100 p-3 rounded-xl`}>
                              <Circle className={`h-6 w-6 text-${product.ready ? "blue" : "red"}-600`} />
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

                        {/* Price */}
                        <td className='px-8 py-4'>
                          <div className='space-y-2'>
                            {user.role === 'admin' ? (
                              <div className='flex items-center gap-2'>
                                <select
                                  value={editing[product._id]?.priceType || product.priceType}
                                  onChange={e => handleChange(product._id, 'priceType', e.target.value)}
                                  className='border border-gray-800 text-gray-800 rounded-lg px-2 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all'
                                >
                                  <option value="uz">сўм</option>
                                  <option value="usd">$</option>
                                </select>
                                <input
                                  type='text'
                                  value={editing[product._id]?.price !== undefined
                                    ? editing[product._id].price
                                    : formatNumber(product.price)
                                  }
                                  onChange={e => handleNumberChange(product._id, 'price', e.target.value)}
                                  className='border border-gray-800 rounded-lg px-3 py-2 w-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all'
                                  placeholder='0'
                                />
                              </div>
                            ) : (
                              <div className='flex items-center gap-2'>
                                <span className='text-green-500 font-bold'>{product.priceType == "uz" ? "сўм" : "$"}</span>
                                <span className='font-semibold text-green-600'>
                                  {formatNumber(product.price)}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Stock */}
                        <td className='px-8 py-4'>
                          <p className='text-xl'>{formatNumber(product.stock)}</p>
                        </td>

                        {/* Unit */}
                        <td className='px-8 py-4'>
                          <p className='text-xl'>{product.unit}</p>
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

                            {user.role === 'admin' && isEdited && (
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
                  {searchID || searchTitle || searchDate
                    ? 'Қидирув шартларингизга мос келувчи маҳсулотлар топилмади'
                    : 'Ҳали бирор маҳсулот қўшилмаган'}
                </p>
                {(searchID || searchTitle || searchDate) && (
                  <button
                    onClick={() => {
                      setSearchID('')
                      setSearchTitle('')
                      setSearchDate('')
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
                className='bg-white w-full max-w-md rounded-3xl shadow-2xl relative'
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
                  {/* Basic Information */}
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
                        <DollarSign size={18} className='text-blue-600' />
                      </div>
                      <div className='flex-1'>
                        <p className='text-sm text-gray-500'>Нархи</p>
                        {user.role === 'admin' ? (
                          <div className='flex items-center gap-2'>
                            <select
                              value={editing[viewData._id]?.priceType || viewData.priceType}
                              onChange={e => handleChange(viewData._id, 'priceType', e.target.value)}
                              className='border border-gray-300 rounded-lg px-2 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all'
                            >
                              <option value="uz">сўм</option>
                              <option value="usd">$</option>
                            </select>
                            <input
                              type='text'
                              value={editing[viewData._id]?.price !== undefined
                                ? editing[viewData._id].price
                                : formatNumber(viewData.price)
                              }
                              onChange={e => handleNumberChange(viewData._id, 'price', e.target.value)}
                              className='border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all'
                              placeholder='0'
                            />
                          </div>
                        ) : (
                          <p className='font-medium'>
                            {formatNumber(viewData.price)} {viewData.priceType == "uz" ? "сўм" : "$"}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className='flex items-center gap-3'>
                      <div className='bg-blue-100 p-2 rounded-lg'>
                        <Package size={18} className='text-blue-600' />
                      </div>
                      <div>
                        <p className='text-sm text-gray-500'>Миқдори</p>
                        <p className='font-medium'>{formatNumber(viewData.stock)}</p>
                      </div>
                    </div>

                    <div className='flex items-center gap-3'>
                      <div className='bg-blue-100 p-2 rounded-lg'>
                        <Ruler size={18} className='text-blue-600' />
                      </div>
                      <div>
                        <p className='text-sm text-gray-500'>Бирлик</p>
                        <p className='font-medium'>{viewData.unit || 'дона'}</p>
                      </div>
                    </div>

                    <div className='flex items-center gap-3'>
                      <div className='bg-blue-100 p-2 rounded-lg'>
                        {viewData.ready ? (
                          <CheckCircle size={18} className='text-green-600' />
                        ) : (
                          <XCircle size={18} className='text-red-600' />
                        )}
                      </div>
                      <div>
                        <p className='text-sm text-gray-500'>Ҳолати</p>
                        <p className={`font-medium ${viewData.ready ? 'text-green-600' : 'text-red-600'}`}>
                          {viewData.ready ? 'Тайёр' : 'Хом ашё'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Time Information */}
                  <div className='pt-4 border-t border-gray-200'>
                    <div className='flex items-center gap-3'>
                      <Calendar size={16} className='text-gray-500 flex-shrink-0' />
                      <div>
                        <p className='text-sm text-gray-500'>Қўшилган</p>
                        <p className='font-medium'>
                          {new Date(viewData.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {user.role === 'admin' && editing[viewData._id] && (
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
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}