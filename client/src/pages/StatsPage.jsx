import { useState } from 'react'
import useSWR from 'swr'
import Fetch from '../middlewares/fetcher'
import {
  AlertTriangle,
  Loader2,
  Package,
  Layers,
  DollarSign,
  Calendar,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  BarChart3,
  Activity,
  Target
} from 'lucide-react'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts'
import { LoadingState } from '../components/loading-state'
import { motion, AnimatePresence } from 'framer-motion'

// SWR fetcher function
const fetcher = url => Fetch.get(url).then(res => res.data)

export const StatsPage = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedDay, setSelectedDay] = useState(new Date().getDate())
  const [isRefreshing, setIsRefreshing] = useState(false)

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from(
    { length: currentYear - 2023 },
    (_, i) => currentYear - i
  )

  const monthOptions = [
    { value: 1, label: 'Январ' },
    { value: 2, label: 'Феврал' },
    { value: 3, label: 'Март' },
    { value: 4, label: 'Апрел' },
    { value: 5, label: 'Май' },
    { value: 6, label: 'Июн' },
    { value: 7, label: 'Июл' },
    { value: 8, label: 'Август' },
    { value: 9, label: 'Сентябр' },
    { value: 10, label: 'Октябр' },
    { value: 11, label: 'Ноябр' },
    { value: 12, label: 'Декабр' }
  ]

  const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1)

  // SWR hook for data fetching
  const {
    data: stats,
    error,
    isLoading,
    mutate,
    isValidating
  } = useSWR(
    `/orders/stats?year=${selectedYear}&month=${selectedMonth}&day=${selectedDay}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 300000
    }
  )

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await mutate()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  // Combined chart data for multiple metrics
  const combinedChartData = stats
    ? [
      {
        name: 'Кунлик',
        products: stats.daily.current.totalProducts,
        stock: stats.daily.current.totalStockValue,
        price: stats.daily.current.revenue,
        orders: stats.daily.current.totalOrders
      },
      {
        name: 'Ойлик',
        products: stats.monthly.current.totalProducts,
        stock: stats.monthly.current.totalStockValue,
        price: stats.monthly.current.revenue,
        orders: stats.monthly.current.totalOrders
      },
      {
        name: 'Йиллик',
        products: stats.yearly.current.totalProducts,
        stock: stats.yearly.current.totalStockValue,
        price: stats.yearly.current.revenue,
        orders: stats.yearly.current.totalOrders
      }
    ]
    : []

  // Pie chart data for revenue distribution
  const pieChartData = stats
    ? [
      { name: 'Кунлик', value: stats.daily.current.revenue },
      { name: 'Ойлик', value: stats.monthly.current.revenue },
      { name: 'Йиллик', value: stats.yearly.current.revenue }
    ]
    : []

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28']

  // Function to render growth percentage with arrow
  const renderGrowth = (value, label) => {
    const numValue = parseFloat(value)
    const isPositive = numValue > 0
    return (
      <div
        className={`flex items-center justify-center text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'
          }`}
      >
        {isPositive ? (
          <ArrowUp className='w-4 h-4 mr-1' />
        ) : (
          <ArrowDown className='w-4 h-4 mr-1' />
        )}
        {value}% {label}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex justify-center items-center'>
        <LoadingState />
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center items-center p-6'>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className='bg-white rounded-2xl shadow-xl p-8 text-center max-w-md'
        >
          <AlertTriangle className='w-16 h-16 text-red-500 mx-auto mb-4' />
          <h3 className='text-xl font-bold text-gray-800 mb-2'>
            Хатолик юз берди
          </h3>
          <p className='text-gray-600 mb-6'>
            Маълумотларни олиб бўлмади. Интернет уланишингизни текширинг.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            className='flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl hover:shadow-xl transition-all duration-300 mx-auto'
          >
            <RefreshCw className='w-4 h-4' />
            Қайта уриниш
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
      <div className='mx-auto py-6 px-4 sm:px-6'>
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-white rounded-2xl shadow-xl p-8 border border-gray-200 mb-8'
        >
          <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6'>
            <div className='flex items-center gap-4'>
              <div className='bg-gradient-to-r from-blue-500 to-indigo-500 p-4 rounded-2xl shadow-lg'>
                <BarChart3 className='h-8 w-8 text-white' />
              </div>
              <div>
                <h1 className='text-3xl font-bold text-gray-800'>
                  Статистика ва ҳисоботлар
                </h1>
                <p className='text-gray-600 mt-2'>
                  Маҳсулотлар ва буюртмаларнинг батафсил таҳлили
                </p>
              </div>
            </div>

            <div className='flex flex-col sm:flex-row gap-4 w-full lg:w-auto'>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={isValidating || isRefreshing}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-300 ${isValidating || isRefreshing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl'
                  }`}
              >
                <RefreshCw
                  className={`w-5 h-5 ${isValidating || isRefreshing ? 'animate-spin' : ''
                    }`}
                />
                {isValidating || isRefreshing ? 'Янгиланяпти...' : 'Янгилаш'}
              </motion.button>
            </div>
          </div>

          {/* Last updated time */}
          {stats && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='mt-4 flex items-center gap-2 text-sm text-gray-500'
            >
              <Activity className='w-4 h-4' />
              Охирги янгиланган: {new Date().toLocaleTimeString('uz-UZ')}
            </motion.div>
          )}
        </motion.div>

        {/* Date Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='bg-white rounded-2xl shadow-xl p-6 border border-gray-200 mb-8'
        >
          <div className='flex flex-col md:flex-row gap-6'>
            <div className='flex-1 grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='space-y-2'>
                <label className='block text-sm font-semibold text-gray-700'>
                  Йил
                </label>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                  className='w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 bg-gray-50'
                  disabled={isValidating}
                >
                  {yearOptions.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className='space-y-2'>
                <label className='block text-sm font-semibold text-gray-700'>
                  Ой
                </label>
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(Number(e.target.value))}
                  className='w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 bg-gray-50'
                  disabled={isValidating}
                >
                  {monthOptions.map(month => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className='space-y-2'>
                <label className='block text-sm font-semibold text-gray-700'>
                  Кун
                </label>
                <select
                  value={selectedDay}
                  onChange={e => setSelectedDay(Number(e.target.value))}
                  className='w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 bg-gray-50'
                  disabled={isValidating}
                >
                  {dayOptions.map(day => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Loading indicator during validation */}
        <AnimatePresence>
          {isValidating && !isRefreshing && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className='flex justify-center mb-6'
            >
              <div className='flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-xl'>
                <Loader2 className='w-4 h-4 animate-spin' />
                Маълумотлар янгиланяпти...
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overall Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'
        >
          <div className='bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white shadow-xl'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm opacity-90'>Жами маҳсулотлар</p>
                <p className='text-3xl font-bold mt-2'>
                  {stats.yearly.current.totalProducts}
                </p>
              </div>
              <Package className='w-8 h-8 opacity-90' />
            </div>
          </div>

          <div className='bg-gradient-to-r from-yellow-500 to-amber-500 rounded-2xl p-6 text-white shadow-xl'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm opacity-90'>Жами қолдиқ</p>
                <p className='text-3xl font-bold mt-2'>
                  {stats.yearly.current.totalStockValue}
                </p>
              </div>
              <Layers className='w-8 h-8 opacity-90' />
            </div>
          </div>

          <div className='bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm opacity-90'>Жами даромад</p>
                <p className='text-3xl font-bold mt-2'>
                  {stats.yearly.current.revenue.toLocaleString('uz-UZ')}
                </p>
                <p className='text-xs opacity-90 mt-1'>сўм</p>
              </div>
              <DollarSign className='w-8 h-8 opacity-90' />
            </div>
          </div>

          <div className='bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-xl'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm opacity-90'>Жами буюртмалар</p>
                <p className='text-3xl font-bold mt-2'>
                  {stats.yearly.current.totalOrders}
                </p>
              </div>
              <Target className='w-8 h-8 opacity-90' />
            </div>
          </div>
        </motion.div>

        {/* Growth Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className='bg-white rounded-2xl shadow-xl p-6 border border-gray-200 mb-8'
        >
          <h2 className='text-xl font-bold text-gray-800 mb-6 text-center'>
            Ўсиш кўрсаткичлари
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='text-center p-4 bg-green-50 rounded-xl border border-green-200'>
              <p className='text-sm text-gray-600 mb-2'>Даромад ўсиши</p>
              {renderGrowth(stats.daily.growth.revenue, '')}
            </div>
            <div className='text-center p-4 bg-blue-50 rounded-xl border border-blue-200'>
              <p className='text-sm text-gray-600 mb-2'>Буюртмалар ўсиши</p>
              {renderGrowth(stats.daily.growth.orders, '')}
            </div>
            {/* <div className='text-center p-4 bg-purple-50 rounded-xl border border-purple-200'>
              <p className='text-sm text-gray-600 mb-2'>Маҳсулотлар ўсиши</p>
              {renderGrowth(stats.daily.growth.products, '')}
            </div>
            <div className='text-center p-4 bg-amber-50 rounded-xl border border-amber-200'>
              <p className='text-sm text-gray-600 mb-2'>Қолдиқ ўсиши</p>
              {renderGrowth(stats.daily.growth.stock, '')}
            </div> */}
          </div>
        </motion.div>

        {/* Charts Section */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
          {/* Combined Metrics Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className='bg-white rounded-2xl shadow-xl p-6 border border-gray-200'
          >
            <h2 className='text-xl font-bold text-gray-800 mb-6 text-center'>
              Кўрсаткичларни солиштириш
            </h2>
            <div className='h-80'>
              <ResponsiveContainer width='100%' height='100%'>
                <LineChart data={combinedChartData}>
                  <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
                  <XAxis dataKey='name' stroke='#666' />
                  <YAxis stroke='#666' />
                  <Tooltip
                    contentStyle={{
                      background: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend />
                  <Line
                    type='monotone'
                    dataKey='price'
                    name='Даромад (сўм)'
                    stroke='#8b5cf6'
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type='monotone'
                    dataKey='products'
                    name='Маҳсулотлар (дона)'
                    stroke='#ef4444'
                    strokeWidth={3}
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type='monotone'
                    dataKey='stock'
                    name='Қолдиқ (дона)'
                    stroke='#f59e0b'
                    strokeWidth={3}
                    dot={{ fill: '#f59e0b', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type='monotone'
                    dataKey='orders'
                    name='Буюртмалар (дона)'
                    stroke='#10b981'
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Revenue Distribution Pie Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className='bg-white rounded-2xl shadow-xl p-6 border border-gray-200'
          >
            <h2 className='text-xl font-bold text-gray-800 mb-6 text-center'>
              Даромад тақсимланиши
            </h2>
            <div className='h-80'>
              <ResponsiveContainer width='100%' height='100%'>
                <RechartsPieChart>
                  <Pie
                    data={pieChartData}
                    cx='50%'
                    cy='50%'
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill='#8884d8'
                    dataKey='value'
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={value => [
                      value.toLocaleString('uz-UZ') + ' сўм',
                      'Даромад'
                    ]}
                    contentStyle={{
                      background: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Period Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className='grid grid-cols-1 lg:grid-cols-3 gap-6'
        >
          {/* Daily Stats */}
          <div className='bg-white rounded-2xl shadow-xl p-6 border border-gray-200 hover:shadow-2xl transition-all duration-300'>
            <div className='flex items-center mb-6'>
              <div className='bg-green-500 p-2 rounded-lg mr-3'>
                <Calendar className='text-white w-5 h-5' />
              </div>
              <h3 className='text-lg font-bold text-gray-800'>Кунлик</h3>
            </div>
            <div className='space-y-4'>
              {[
                {
                  label: 'Маҳсулотлар',
                  value: stats.daily.current.totalProducts,
                  icon: Package,
                  color: 'green'
                },
                {
                  label: 'Қолдиқ',
                  value: stats.daily.current.totalStockValue,
                  icon: Layers,
                  color: 'yellow'
                },
                {
                  label: 'Даромад',
                  value: stats.daily.current.revenue,
                  icon: DollarSign,
                  color: 'purple'
                },
                {
                  label: 'Буюртмалар',
                  value: stats.daily.current.totalOrders,
                  icon: TrendingUp,
                  color: 'blue'
                }
              ].map((item, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center p-3 bg-${item.color}-50 rounded-lg border border-${item.color}-200`}
                >
                  <div>
                    <p className='text-sm text-gray-600'>{item.label}</p>
                    <p className='text-lg font-bold text-gray-800'>
                      {item.label === 'Даромад'
                        ? item.value.toLocaleString('uz-UZ')
                        : item.value}
                    </p>
                    {item.label === 'Даромад' && (
                      <p className='text-xs text-gray-500'>сўм</p>
                    )}
                  </div>
                  <item.icon className={`text-${item.color}-500 w-5 h-5`} />
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Stats */}
          <div className='bg-white rounded-2xl shadow-xl p-6 border border-gray-200 hover:shadow-2xl transition-all duration-300'>
            <div className='flex items-center mb-6'>
              <div className='bg-blue-500 p-2 rounded-lg mr-3'>
                <Calendar className='text-white w-5 h-5' />
              </div>
              <h3 className='text-lg font-bold text-gray-800'>Ойлик</h3>
            </div>
            <div className='space-y-4'>
              {[
                {
                  label: 'Маҳсулотлар',
                  value: stats.monthly.current.totalProducts,
                  icon: Package,
                  color: 'blue'
                },
                {
                  label: 'Қолдиқ',
                  value: stats.monthly.current.totalStockValue,
                  icon: Layers,
                  color: 'orange'
                },
                {
                  label: 'Даромад',
                  value: stats.monthly.current.revenue,
                  icon: DollarSign,
                  color: 'indigo'
                },
                {
                  label: 'Буюртмалар',
                  value: stats.monthly.current.totalOrders,
                  icon: TrendingUp,
                  color: 'cyan'
                }
              ].map((item, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center p-3 bg-${item.color}-50 rounded-lg border border-${item.color}-200`}
                >
                  <div>
                    <p className='text-sm text-gray-600'>{item.label}</p>
                    <p className='text-lg font-bold text-gray-800'>
                      {item.label === 'Даромад'
                        ? item.value.toLocaleString('uz-UZ')
                        : item.value}
                    </p>
                    {item.label === 'Даромад' && (
                      <p className='text-xs text-gray-500'>сўм</p>
                    )}
                  </div>
                  <item.icon className={`text-${item.color}-500 w-5 h-5`} />
                </div>
              ))}
            </div>
          </div>

          {/* Yearly Stats */}
          <div className='bg-white rounded-2xl shadow-xl p-6 border border-gray-200 hover:shadow-2xl transition-all duration-300'>
            <div className='flex items-center mb-6'>
              <div className='bg-red-500 p-2 rounded-lg mr-3'>
                <Calendar className='text-white w-5 h-5' />
              </div>
              <h3 className='text-lg font-bold text-gray-800'>Йиллик</h3>
            </div>
            <div className='space-y-4'>
              {[
                {
                  label: 'Маҳсулотлар',
                  value: stats.yearly.current.totalProducts,
                  icon: Package,
                  color: 'red'
                },
                {
                  label: 'Қолдиқ',
                  value: stats.yearly.current.totalStockValue,
                  icon: Layers,
                  color: 'amber'
                },
                {
                  label: 'Даромад',
                  value: stats.yearly.current.revenue,
                  icon: DollarSign,
                  color: 'pink'
                },
                {
                  label: 'Буюртмалар',
                  value: stats.yearly.current.totalOrders,
                  icon: TrendingUp,
                  color: 'green'
                }
              ].map((item, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center p-3 bg-${item.color}-50 rounded-lg border border-${item.color}-200`}
                >
                  <div>
                    <p className='text-sm text-gray-600'>{item.label}</p>
                    <p className='text-lg font-bold text-gray-800'>
                      {item.label === 'Даромад'
                        ? item.value.toLocaleString('uz-UZ')
                        : item.value}
                    </p>
                    {item.label === 'Даромад' && (
                      <p className='text-xs text-gray-500'>сўм</p>
                    )}
                  </div>
                  <item.icon className={`text-${item.color}-500 w-5 h-5`} />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
