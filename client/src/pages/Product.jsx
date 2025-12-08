import { useState, useContext, useEffect } from 'react'
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
  Circle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react'
import Fetch from '../middlewares/fetcher'
import AddProductModal from '../components/AddProductModal'
import { ContextData } from '../contextData/Context'
import { LoadingState } from '../components/loading-state'
import { motion, AnimatePresence } from 'framer-motion'

export const ProductsPage = () => {
  const { user, dark } = useContext(ContextData)
  const { type } = useParams()

  // Pagination and search states
  const [page, setPage] = useState(1)
  const [searchID, setSearchID] = useState('')
  const [searchTitle, setSearchTitle] = useState('')
  const [searchDate, setSearchDate] = useState('')
  const [debouncedSearchID, setDebouncedSearchID] = useState('')
  const [debouncedSearchTitle, setDebouncedSearchTitle] = useState('')

  // Debounce search inputs
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchID(searchID)
      setPage(1) // Reset to first page when search changes
    }, 500)
    return () => clearTimeout(timer)
  }, [searchID])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTitle(searchTitle)
      setPage(1) // Reset to first page when search changes
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTitle])

  // Build API endpoint with query parameters
  const buildApiEndpoint = () => {
    const params = new URLSearchParams()

    params.append('page', page)
    params.append('limit', 50)
    params.append('type', type === 'ready' ? 'ready' : 'raw')

    if (debouncedSearchID) {
      params.append('search', debouncedSearchID)
      params.append('searchField', 'ID')
    } else if (debouncedSearchTitle) {
      params.append('search', debouncedSearchTitle)
      params.append('searchField', 'title')
    }

    if (searchDate) {
      params.append('date', searchDate)
    }

    return `/products/ready?${params.toString()}`
  }

  const apiEndpoint = buildApiEndpoint()

  const { data, error, isLoading, mutate } = useSWR(apiEndpoint, Fetch, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    keepPreviousData: true
  })

  const [open, setOpen] = useState(false)
  const [viewData, setViewData] = useState(null)
  const [editing, setEditing] = useState({})
  const [loading, setLoading] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Format number with thousand separators
  const formatNumber = (num) => {
    if (num === undefined || num === null) return "0";

    // Agar num butun son bo'lmasa, 1 xonali kasr bilan yaxlitlash
    if (!Number.isInteger(num)) {
      return (Math.round(num * 10) / 10).toLocaleString('uz-UZ');
    }

    // Butun sonni formatlash (minglik ajratish)
    return num.toLocaleString('uz-UZ');
  };

  // Parse formatted number back to raw number
  const parseNumber = (str) => {
    return Number(str.replace(/,/g, ''))
  }

  // Handle number input with formatting
  const handleNumberChange = (id, field, value) => {
    const cleanedValue = value.replace(/[^\d.]/g, '')
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

      // Prepare update data
      const updateData = {
        price: editing[id].price ? parseNumber(editing[id].price) : 0,
        priceType: editing[id].priceType
      }

      // Add count if unit is not "дона"
      if (editing[id].unit !== "дона" && editing[id].count !== undefined) {
        updateData.count = parseInt(editing[id].count) || 0
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

  const handleDelete = async (id) => {
    try {
      setDeleting(id)
      await Fetch.delete(`/products/${id}`)
      mutate()
      setDeleteConfirm(null)
      alert('✅ Маҳсулот муваффақиятли ўчирилди')
    } catch (err) {
      console.error('Delete error:', err)
      alert('❌ Ўчиришда хатолик юз берди')
    } finally {
      setDeleting(null)
    }
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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

  // Dark mode styles
  const bgGradient = dark
    ? 'from-gray-900 to-gray-800'
    : 'from-blue-50 to-indigo-100'

  const cardBg = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  const textColor = dark ? 'text-white' : 'text-gray-800'
  const textMuted = dark ? 'text-gray-300' : 'text-gray-600'
  const inputBg = dark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'
  const headerBg = dark ? 'from-gray-700 to-gray-600' : 'from-blue-50 to-indigo-50'
  const tableHeaderBg = dark ? 'from-gray-700 to-gray-600' : 'from-gray-50 to-gray-100'
  const tableHeaderText = dark ? 'text-gray-200' : 'text-gray-700'
  const tableRowHover = dark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
  const borderColor = dark ? 'border-gray-700' : 'border-gray-200'

  const products = data?.data?.data || []
  const pagination = data?.data?.pagination || {}

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgGradient} p-6 transition-colors duration-300`}>
      <div className='mx-auto space-y-6'>
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl shadow-xl p-8 border ${cardBg} ${borderColor}`}
        >
          <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6'>
            <div className='flex items-center gap-4'>
              <div className='bg-gradient-to-r from-blue-500 to-indigo-500 p-4 rounded-2xl shadow-lg'>
                <Boxes className='h-8 w-8 text-white' />
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${textColor}`}>
                  {getPageTitle()}
                </h1>
                <p className={`${textMuted} mt-2`}>
                  {getPageDescription()} • {pagination.total || 0} та маҳсулот
                </p>
              </div>
            </div>

            <div className='flex items-center gap-4'>
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
          className={`rounded-2xl shadow-xl p-6 border ${cardBg} ${borderColor}`}
        >
          <div className='flex flex-col md:flex-row gap-6'>
            <div className='flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              <div className='relative'>
                <Hash className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${dark ? 'text-gray-400' : 'text-gray-400'} h-5 w-5`} />
                <input
                  type='number'
                  placeholder='ID бўйича'
                  value={searchID}
                  onChange={e => setSearchID(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 ${inputBg}`}
                />
              </div>

              <div className='relative'>
                <Tag className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${dark ? 'text-gray-400' : 'text-gray-400'} h-5 w-5`} />
                <input
                  type='text'
                  placeholder='Номи бўйича қидириш'
                  value={searchTitle}
                  onChange={e => setSearchTitle(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 ${inputBg}`}
                />
              </div>

              <div className='relative'>
                <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${dark ? 'text-gray-400' : 'text-gray-400'} h-5 w-5`} />
                <input
                  type='date'
                  value={searchDate}
                  onChange={e => {
                    setSearchDate(e.target.value)
                    setPage(1)
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 ${inputBg}`}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        {isLoading ? (
          <div className={`rounded-2xl shadow-xl p-12 ${cardBg}`}>
            <LoadingState />
          </div>
        ) : error ? (
          <div className={`rounded-2xl shadow-xl p-8 ${cardBg}`}>
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
            className={`rounded-2xl shadow-xl overflow-hidden border ${cardBg} ${borderColor}`}
          >
            {/* Table Header */}
            <div className={`px-8 py-6 border-b ${borderColor} bg-gradient-to-r ${headerBg}`}>
              <div className='flex items-center justify-between'>
                <h3 className={`text-xl font-semibold ${textColor} flex gap-1 items-center`}>
                  <Circle size={18} color='green' /> {getPageTitle()} ({pagination.total || 0})
                </h3>
                {(searchID || searchTitle || searchDate) && (
                  <button
                    onClick={() => {
                      setSearchID('')
                      setSearchTitle('')
                      setSearchDate('')
                      setPage(1)
                    }}
                    className='flex items-center gap-2 text-blue-500 hover:text-blue-700 font-medium text-sm'
                  >
                    <Search size={16} />
                    Филтрни тозалаш
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className={`bg-gradient-to-r ${tableHeaderBg}`}>
                  <tr>
                    <th className={`px-8 py-4 text-left text-sm font-semibold uppercase tracking-wider ${tableHeaderText}`}>
                      Маҳсулот
                    </th>
                    <th className={`px-8 py-4 text-left text-sm font-semibold uppercase tracking-wider ${tableHeaderText}`}>
                      Нарх
                    </th>
                    <th className={`px-8 py-4 text-left text-sm font-semibold uppercase tracking-wider ${tableHeaderText}`}>
                      Миқдор
                    </th>
                    <th className={`px-8 py-4 text-left text-sm font-semibold uppercase tracking-wider ${tableHeaderText}`}>
                      Дона
                    </th>
                    <th className={`px-8 py-4 text-left text-sm font-semibold uppercase tracking-wider ${tableHeaderText}`}>
                      Сана
                    </th>
                    <th className={`px-8 py-4 text-center text-sm font-semibold uppercase tracking-wider ${tableHeaderText}`}>
                      Амаллар
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${dark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {products.map((product, index) => {
                    const isEdited = Boolean(editing[product._id])
                    return (
                      <motion.tr
                        key={product._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`${product.stock == 0 ? (dark ? "bg-red-900" : "bg-red-300") : (dark ? "bg-green-900" : "bg-green-300")} transition-all duration-200 group ${tableRowHover}`}
                      >
                        {/* Product Info */}
                        <td className='px-8 py-4'>
                          <div className='flex items-center gap-4'>
                            <div className={`${dark ? 'bg-blue-900' : 'bg-blue-100'} p-3 rounded-xl`}>
                              <Circle className={`h-6 w-6 ${product.ready ? 'text-blue-400' : 'text-red-400'}`} />
                            </div>
                            <div>
                              <p className={`font-bold text-lg ${textColor}`}>
                                {product.title}
                              </p>
                              <p className={`text-sm ${textMuted}`}>
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
                                  className={`border ${dark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-800 text-gray-800'} rounded-lg px-2 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all`}
                                >
                                  <option value="uz">сўм</option>
                                  <option value="en">$</option>
                                </select>
                                <input
                                  type='text'
                                  value={editing[product._id]?.price !== undefined
                                    ? editing[product._id].price
                                    : formatNumber(product.price)
                                  }
                                  onChange={e => handleNumberChange(product._id, 'price', e.target.value)}
                                  className={`border ${dark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-800'} rounded-lg px-3 py-2 w-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all`}
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
                        <td className={`px-8 py-4 ${textColor} text-xl flex gap-0.5`} >
                          <p>{formatNumber(product.stock)}</p>
                          <p>{product.unit}</p>
                        </td>

                        {/* Count (dona) */}
                        <td className='px-8 py-4'>
                          {user.role === 'admin' && product.unit !== "дона" ? (
                            <div className='flex items-center gap-2'>
                              <input
                                type='number'
                                min='0'
                                value={editing[product._id]?.count !== undefined
                                  ? editing[product._id].count
                                  : product.count || 0
                                }
                                onChange={e => handleChange(product._id, 'count', e.target.value)}
                                className={`border ${dark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-800'} rounded-lg px-3 py-2 w-20 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all`}
                                placeholder='0'
                              />
                            </div>
                          ) : (
                            <p className={`text-xl ${textColor}`}>{product.count || 0}</p>
                          )}
                        </td>

                        {/* Date */}
                        <td className={`px-8 py-4 ${textMuted}`}>
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

                            {user.role === 'admin' && (
                              <>
                                {(isEdited || (product.unit !== "дона" && editing[product._id]?.count !== undefined)) && (
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
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setDeleteConfirm(product)}
                                  className='flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors'
                                >
                                  <Trash2 size={16} />
                                  Ўчириш
                                </motion.button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {products.length === 0 && (
              <div className='text-center py-16'>
                <Boxes size={64} className={`mx-auto mb-4 ${dark ? 'text-gray-600' : 'text-gray-300'}`} />
                <h3 className={`text-xl font-semibold mb-2 ${textMuted}`}>
                  Маҳсулотлар топилмади
                </h3>
                <p className={`${textMuted} mb-6`}>
                  {searchID || searchTitle || searchDate
                    ? 'Қидирув шартларингизга мос келувчи маҳсулотлар топилмади'
                    : 'Ҳали маҳсулот қўшилмаган'}
                </p>
                {(searchID || searchTitle || searchDate) && (
                  <button
                    onClick={() => {
                      setSearchID('')
                      setSearchTitle('')
                      setSearchDate('')
                      setPage(1)
                    }}
                    className='text-blue-500 hover:text-blue-700 font-semibold'
                  >
                    Филтрни тозалаш
                  </button>
                )}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className={`px-8 py-6 border-t ${borderColor} ${dark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className='flex items-center justify-between'>
                  <div className={`text-sm ${textMuted}`}>
                    Кўрсатилган: {(page - 1) * 50 + 1}-{Math.min(page * 50, pagination.total)}/{pagination.total}
                  </div>

                  <div className='flex items-center gap-2'>
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1}
                      className={`flex items-center gap-1 px-4 py-2 rounded-lg ${page <= 1
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                        } ${textColor}`}
                    >
                      <ChevronLeft size={18} />
                      Олдинги
                    </button>

                    <div className='flex items-center gap-1'>
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1
                        } else if (page <= 3) {
                          pageNum = i + 1
                        } else if (page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i
                        } else {
                          pageNum = page - 2 + i
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-10 cursor-pointer h-10 rounded-lg flex items-center justify-center ${page === pageNum
                              ? 'bg-blue-500 text-white'
                              : `${dark ? "hover:bg-gray-700" : "hover:bg-gray-200"} ${textColor}`
                              }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= pagination.totalPages}
                      className={`flex items-center gap-1 px-4 py-2 cursor-pointer rounded-lg ${page >= pagination.totalPages
                        ? 'opacity-50 cursor-not-allowed'
                        : `${dark ? "hover:bg-gray-700" : "hover:bg-gray-200"}`
                        } ${textColor}`}
                    >
                      Кейинги
                      <ChevronRight size={18} />
                    </button>
                  </div>

                  <div className='flex items-center gap-2'>
                    <span className={`text-sm ${textMuted}`}>Сахифа:</span>
                    <select
                      value={page}
                      onChange={(e) => handlePageChange(parseInt(e.target.value))}
                      className={`border ${dark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} rounded-lg px-3 py-1 outline-none`}
                    >
                      {Array.from({ length: pagination.totalPages }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        <AddProductModal open={open} setOpen={setOpen} mutate={mutate} type={type} />

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
                className={`w-full max-w-md rounded-3xl shadow-2xl relative ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}
              >
                <div className={`sticky top-0 border-b ${borderColor} px-6 py-4 rounded-t-2xl flex justify-between items-center ${dark ? 'bg-gray-800' : 'bg-white'}`}>
                  <h2 className={`text-xl font-bold flex items-center gap-2 ${textColor}`}>
                    <Tag size={22} className='text-blue-600' />
                    Маҳсулот маълумотлари
                  </h2>
                  <button
                    onClick={() => setViewData(null)}
                    className={`${dark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'} transition p-1 rounded-full hover:bg-gray-100' : 'hover:bg-gray-100'} transition p-1 rounded-full ${dark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    ✖
                  </button>
                </div>

                <div className='p-6 space-y-4'>
                  {/* Basic Information */}
                  <div className='space-y-4'>
                    <div className='flex items-center gap-3'>
                      <div className={`${dark ? 'bg-blue-900' : 'bg-blue-100'} p-2 rounded-lg`}>
                        <Hash size={18} className='text-blue-600' />
                      </div>
                      <div>
                        <p className={`text-sm ${textMuted}`}>ID</p>
                        <p className={`font-medium ${textColor}`}>{viewData.ID}</p>
                      </div>
                    </div>

                    <div className='flex items-center gap-3'>
                      <div className={`${dark ? 'bg-blue-900' : 'bg-blue-100'} p-2 rounded-lg`}>
                        <Boxes size={18} className='text-blue-600' />
                      </div>
                      <div>
                        <p className={`text-sm ${textMuted}`}>Номи</p>
                        <p className={`font-medium ${textColor}`}>{viewData.title}</p>
                      </div>
                    </div>

                    <div className='flex items-center gap-3'>
                      <div className={`${dark ? 'bg-blue-900' : 'bg-blue-100'} p-2 rounded-lg`}>
                        <DollarSign size={18} className='text-blue-600' />
                      </div>
                      <div className='flex-1'>
                        <p className={`text-sm ${textMuted}`}>Нархи</p>
                        {user.role === 'admin' ? (
                          <div className='flex items-center gap-2'>
                            <select
                              value={editing[viewData._id]?.priceType || viewData.priceType}
                              onChange={e => handleChange(viewData._id, 'priceType', e.target.value)}
                              className={`border ${dark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} rounded-lg px-2 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all`}
                            >
                              <option value="uz">сўм</option>
                              <option value="en">$</option>
                            </select>
                            <input
                              type='text'
                              value={editing[viewData._id]?.price !== undefined
                                ? editing[viewData._id].price
                                : formatNumber(viewData.price)
                              }
                              onChange={e => handleNumberChange(viewData._id, 'price', e.target.value)}
                              className={`border ${dark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all`}
                              placeholder='0'
                            />
                          </div>
                        ) : (
                          <p className={`font-medium ${textColor}`}>
                            {formatNumber(viewData.price)} {viewData.priceType == "uz" ? "сўм" : "$"}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className='flex items-center gap-3'>
                      <div className={`${dark ? 'bg-blue-900' : 'bg-blue-100'} p-2 rounded-lg`}>
                        <Package size={18} className='text-blue-600' />
                      </div>
                      <div>
                        <p className={`text-sm ${textMuted}`}>Миқдори</p>
                        <p className={`font-medium ${textColor}`}>{formatNumber(viewData.stock)}</p>
                      </div>
                    </div>

                    <div className='flex items-center gap-3'>
                      <div className={`${dark ? 'bg-blue-900' : 'bg-blue-100'} p-2 rounded-lg`}>
                        <Ruler size={18} className='text-blue-600' />
                      </div>
                      <div>
                        <p className={`text-sm ${textMuted}`}>Бирлик</p>
                        <p className={`font-medium ${textColor}`}>{viewData.unit || 'дона'}</p>
                      </div>
                    </div>

                    {/* Count field - only show and edit if unit is not "дона" */}
                    {viewData.unit !== "дона" && (
                      <div className='flex items-center gap-3'>
                        <div className={`${dark ? 'bg-blue-900' : 'bg-blue-100'} p-2 rounded-lg`}>
                          <Hash size={18} className='text-blue-600' />
                        </div>
                        <div className='flex-1'>
                          <p className={`text-sm ${textMuted}`}>Дона</p>
                          {user.role === 'admin' ? (
                            <input
                              type='number'
                              min='0'
                              value={editing[viewData._id]?.count !== undefined
                                ? editing[viewData._id].count
                                : viewData.count || 0
                              }
                              onChange={e => handleChange(viewData._id, 'count', e.target.value)}
                              className={`border ${dark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all`}
                              placeholder='0'
                            />
                          ) : (
                            <p className={`font-medium ${textColor}`}>
                              {viewData.count || 0} дона
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className='flex items-center gap-3'>
                      <div className={`${dark ? 'bg-blue-900' : 'bg-blue-100'} p-2 rounded-lg`}>
                        {viewData.ready ? (
                          <CheckCircle size={18} className='text-green-600' />
                        ) : (
                          <XCircle size={18} className='text-red-600' />
                        )}
                      </div>
                      <div>
                        <p className={`text-sm ${textMuted}`}>Ҳолати</p>
                        <p className={`font-medium ${viewData.ready ? 'text-green-600' : 'text-red-600'}`}>
                          {viewData.ready ? 'Тайёр' : 'Хом ашё'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Time Information */}
                  <div className={`pt-4 border-t ${borderColor}`}>
                    <div className='flex items-center gap-3'>
                      <Calendar size={16} className={`${textMuted} flex-shrink-0`} />
                      <div>
                        <p className={`text-sm ${textMuted}`}>Қўшилган</p>
                        <p className={`font-medium ${textColor}`}>
                          {new Date(viewData.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {user.role === 'admin' && (editing[viewData._id] || (viewData.unit !== "дона" && editing[viewData._id]?.count !== undefined)) && (
                  <div className={`sticky bottom-0 border-t ${borderColor} px-6 py-4 rounded-b-2xl flex justify-end ${dark ? 'bg-gray-800' : 'bg-white'}`}>
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

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={e => e.stopPropagation()}
                className={`w-full max-w-md rounded-2xl shadow-2xl p-6 ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}
              >
                <div className='text-center'>
                  <Trash2 className='h-12 w-12 mx-auto mb-4 text-red-500' />
                  <h3 className={`text-xl font-bold mb-2 ${textColor}`}>
                    Маҳсулотни ўчириш
                  </h3>
                  <p className={`mb-6 ${textMuted}`}>
                    <strong>"{deleteConfirm.title}"</strong> маҳсулотини ўчирмоқчимисиз?
                    <br />
                    <span className='text-red-500'>Бу амални бекор қилиб бўлмайди!</span>
                  </p>

                  <div className='flex gap-3 justify-center'>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${dark
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        }`}
                    >
                      Бекор қилиш
                    </button>
                    <button
                      onClick={() => handleDelete(deleteConfirm._id)}
                      disabled={deleting === deleteConfirm._id}
                      className='flex items-center gap-2 bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors'
                    >
                      {deleting === deleteConfirm._id ? (
                        <Loader2 className='animate-spin' size={18} />
                      ) : (
                        <Trash2 size={18} />
                      )}
                      Ўчириш
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div >
  )
}