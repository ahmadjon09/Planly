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
  Target,
  Users,
  CreditCard,
  ShoppingCart,
  PieChart,
  LineChart as LineChartIcon,
  Eye,
  Wallet,
  Receipt,
  Scale
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
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area
} from 'recharts'
import { LoadingState } from '../components/loading-state'
import { motion, AnimatePresence } from 'framer-motion'

// SWR fetcher function
const fetcher = url => Fetch.get(url).then(res => res.data)

// Custom Tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-2xl border border-gray-200">
        <p className="font-bold text-gray-800 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold">
              {typeof entry.value === 'number' ? entry.value.toLocaleString('uz-UZ') : entry.value}
              {entry.dataKey === 'revenue' && ' сўм'}
            </span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, format, subtitle, growth, isCurrency = false }) => {
  const colors = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-pink-500',
    orange: 'from-orange-500 to-amber-500',
    indigo: 'from-indigo-500 to-blue-500',
    teal: 'from-teal-500 to-cyan-500',
    red: 'from-red-500 to-pink-500',
    lime: 'from-lime-500 to-green-500'
  }

  const formattedValue = format === 'currency'
    ? value.toLocaleString('uz-UZ') + (isCurrency ? ' $' : ' сўм')
    : format === 'number'
      ? value.toLocaleString('uz-UZ')
      : value

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={`bg-gradient-to-r ${colors[color]} rounded-2xl p-6 text-white shadow-xl relative overflow-hidden`}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90 mb-1">{title}</p>
            <p className="text-2xl font-bold">{formattedValue}</p>
            {subtitle && <p className="text-xs opacity-80 mt-1">{subtitle}</p>}
            {growth && (
              <div className={`flex items-center mt-2 text-xs ${growth > 0 ? 'text-green-200' : 'text-red-200'}`}>
                {growth > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                <span className="ml-1">{Math.abs(growth)}%</span>
              </div>
            )}
          </div>
          <div className="bg-opacity-20 p-3 rounded-xl">
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Growth Indicator Component
const GrowthIndicator = ({ value, label, size = 'md' }) => {
  const isPositive = value > 0
  const sizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  return (
    <div className={`flex items-center ${sizes[size]} font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      {isPositive ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
      {Math.abs(value)}% {label}
    </div>
  )
}

// Debt Card Component
const DebtCard = ({ title, amountUZ, amountEN, icon: Icon, color, type }) => {
  const colors = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    red: 'from-red-500 to-pink-500',
    orange: 'from-orange-500 to-amber-500'
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={`bg-gradient-to-r ${colors[color]} rounded-2xl p-6 text-white shadow-xl relative overflow-hidden`}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm opacity-90">{title}</p>
          </div>
          <div className="bg-opacity-20 p-2 rounded-lg">
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm opacity-90">Сўмда:</span>
            <span className="font-bold text-lg">
              {amountUZ.toLocaleString('uz-UZ')} сўм
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm opacity-90">Долларда:</span>
            <span className="font-bold text-lg">
              {amountEN.toLocaleString('uz-UZ')} $
            </span>
          </div>
        </div>
      </div>

    </motion.div>
  )
}

export const StatsPage = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedDay, setSelectedDay] = useState(new Date().getDate())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from(
    { length: currentYear - 2023 + 1 },
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

  // Chart data preparation
  const periodComparisonData = stats ? [
    {
      name: 'Кунлик',
      revenue: stats.daily.current.revenue,
      orders: stats.daily.current.totalOrders,
      products: stats.daily.current.totalProducts,
      margin: stats.daily.current.margin,
      growth: stats.daily.growth.revenue
    },
    {
      name: 'Ойлик',
      revenue: stats.monthly.current.revenue,
      orders: stats.monthly.current.totalOrders,
      products: stats.monthly.current.totalProducts,
      margin: stats.monthly.current.margin,
      growth: stats.monthly.growth.revenue
    },
    {
      name: 'Йиллик',
      revenue: stats.yearly.current.revenue,
      orders: stats.yearly.current.totalOrders,
      products: stats.yearly.current.totalProducts,
      margin: stats.yearly.current.margin,
      growth: stats.yearly.growth.revenue
    }
  ] : []



  const debtComparisonData = stats ? [
    {
      name: 'Мижозлар қарзи',
      amount: stats.daily.current.debts.customerDebts.totalUZ,
      color: '#0088FE'
    },
    {
      name: 'Манбалар қарзи',
      amount: stats.daily.current.debts.supplierDebts.totalUZ,
      color: '#00C49F'
    },
    {
      name: 'Соф қарз',
      amount: stats.daily.current.debts.netBalance.uz,
      color: stats.daily.current.debts.netBalance.uz >= 0 ? '#FFBB28' : '#FF8042'
    }
  ] : []


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex justify-center items-center">
        <LoadingState />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col justify-center items-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md border border-gray-200"
        >
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Маълумотларни юклашда хатолик
          </h3>
          <p className="text-gray-600 mb-6">
            Серверга уланишда муаммо юз берди. Илтимос, қайта уриниб кўринг.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl hover:shadow-xl transition-all duration-300 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Қайта уриниш
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200 mb-8"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4 rounded-2xl shadow-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Бизнес аналитика
                </h1>
                <p className="text-gray-600 mt-2">
                  Буюртмалар, даромад, қарзлар ва маҳсулотларнинг батафсил таҳлили
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={isValidating || isRefreshing}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-300 font-semibold ${isValidating || isRefreshing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl'
                  }`}
              >
                <RefreshCw
                  className={`w-5 h-5 ${isValidating || isRefreshing ? 'animate-spin' : ''}`}
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
              className="mt-4 flex items-center gap-2 text-sm text-gray-500"
            >
              <Activity className="w-4 h-4" />
              Охирги янгиланган: {new Date().toLocaleTimeString('uz-UZ')}
            </motion.div>
          )}
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-2 border border-gray-200 mb-8"
        >
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: 'Умумий кўриниш', icon: Eye },
              { id: 'revenue', label: 'Даромад', icon: DollarSign },
              { id: 'debts', label: 'Қарзлар', icon: CreditCard },
              { id: 'products', label: 'Маҳсулотлар', icon: Package },
              { id: 'clients', label: 'Мижозлар', icon: Users }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 flex-1 justify-center ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Date Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 mb-8"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="text-blue-500" size={20} />
            Санани танлаш
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Йил
              </label>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 bg-gray-50"
                disabled={isValidating}
              >
                {yearOptions.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ой
              </label>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 bg-gray-50"
                disabled={isValidating}
              >
                {monthOptions.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Кун
              </label>
              <select
                value={selectedDay}
                onChange={e => setSelectedDay(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 bg-gray-50"
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
        </motion.div>

        {/* Loading indicator */}
        <AnimatePresence>
          {isValidating && !isRefreshing && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex justify-center mb-6"
            >
              <div className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-xl">
                <Loader2 className="w-4 h-4 animate-spin" />
                Маълумотлар янгиланяпти...
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Key Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              <StatCard
                title="Жами даромад"
                value={stats.yearly.current.revenue}
                icon={DollarSign}
                color="green"
                format="currency"
                growth={stats.yearly.growth.revenue}
              />
              <StatCard
                title="Жами буюртмалар"
                value={stats.yearly.current.totalOrders}
                icon={ShoppingCart}
                color="blue"
                format="number"
                growth={stats.yearly.growth.orders}
              />
              <StatCard
                title="Маҳсулотлар"
                value={stats.yearly.current.totalProducts}
                icon={Package}
                color="purple"
                format="number"
              />
              <StatCard
                title="Сотув маржаси"
                value={stats.yearly.current.margin}
                icon={TrendingUp}
                color="orange"
                subtitle="%"
              />
            </motion.div>

            {/* Debt Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            >
              <DebtCard
                title="Мижозлар қарзи"
                amountUZ={stats.yearly.current.debts.customerDebts.totalUZ}
                amountEN={stats.yearly.current.debts.customerDebts.totalEN}
                icon={Users}
                color="blue"
              />
              <DebtCard
                title="Манбалар қарзи"
                amountUZ={stats.yearly.current.debts.supplierDebts.totalUZ}
                amountEN={stats.yearly.current.debts.supplierDebts.totalEN}
                icon={Package}
                color="red"
              />
              <DebtCard
                title="Соф қарз"
                amountUZ={stats.yearly.current.debts.netBalance.uz}
                amountEN={stats.yearly.current.debts.netBalance.en}
                icon={Scale}
                color={stats.yearly.current.debts.netBalance.uz >= 0 ? "green" : "orange"}
              />
            </motion.div>

            {/* Growth Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 mb-8"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <TrendingUp className="text-green-500" size={24} />
                Ўсиш кўрсаткичлари
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200">
                  <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-2">Даромад ўсиши</p>
                  <GrowthIndicator value={stats.daily.growth.revenue} size="lg" />
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl border border-blue-200">
                  <ShoppingCart className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-2">Буюртмалар ўсиши</p>
                  <GrowthIndicator value={stats.daily.growth.orders} size="lg" />
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl border border-purple-200">
                  <Users className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-2">Мижозлар ўсиши</p>
                  <GrowthIndicator value={stats.daily.growth.clients} size="lg" />
                </div>
              </div>
            </motion.div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Revenue Trend Chart */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <LineChartIcon className="text-blue-500" size={24} />
                  Даромад тарҳи
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={periodComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name="Даромад"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.2}
                        strokeWidth={3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Debt Comparison Chart */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <CreditCard className="text-purple-500" size={24} />
                  Қарзлар тақсимланиши
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={debtComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip
                        formatter={(value) => [value.toLocaleString('uz-UZ') + ' сўм', 'Миқдор']}
                        contentStyle={{
                          background: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Bar dataKey="amount" name="Қарз миқдори">
                        {debtComparisonData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* Period Comparison */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {[
                {
                  period: 'Кунлик',
                  data: stats.daily.current,
                  growth: stats.daily.growth,
                  color: 'green'
                },
                {
                  period: 'Ойлик',
                  data: stats.monthly.current,
                  growth: stats.monthly.growth,
                  color: 'blue'
                },
                {
                  period: 'Йиллик',
                  data: stats.yearly.current,
                  growth: stats.yearly.growth,
                  color: 'purple'
                }
              ].map((periodData, index) => (
                <motion.div
                  key={periodData.period}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center mb-4">
                    <div className={`bg-${periodData.color}-500 p-2 rounded-lg mr-3`}>
                      <Calendar className="text-white w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">{periodData.period}</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Даромад</span>
                      <span className="font-bold text-green-600">
                        {periodData.data.revenue.toLocaleString('uz-UZ')} сўм
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Буюртмалар</span>
                      <span className="font-bold text-blue-600">
                        {periodData.data.totalOrders}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Маҳсулотлар</span>
                      <span className="font-bold text-purple-600">
                        {periodData.data.totalProducts}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Фойда маржаси</span>
                      <span className="font-bold text-orange-600">
                        {periodData.data.margin}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}

        {/* Debts Tab Content */}
        {activeTab === 'debts' && stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Debt Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <DebtCard
                title="Мижозлардан олиш керак"
                amountUZ={stats.yearly.current.debts.customerDebts.totalUZ}
                amountEN={stats.yearly.current.debts.customerDebts.totalEN}
                icon={Users}
                color="blue"
              />
              <DebtCard
                title="Манбаларга бериш керак"
                amountUZ={stats.yearly.current.debts.supplierDebts.totalUZ}
                amountEN={stats.yearly.current.debts.supplierDebts.totalEN}
                icon={Package}
                color="red"
              />
              <StatCard
                title="Соф қарз"
                value={stats.yearly.current.debts.netBalance.uz}
                icon={Scale}
                color={stats.yearly.current.debts.netBalance.uz >= 0 ? "green" : "orange"}
                format="currency"
                subtitle={stats.yearly.current.debts.netBalance.uz >= 0 ? "Сизга қарздорлар" : "Сиз қарздорсиз"}
              />
            </div>

            {/* Client Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="text-blue-500" size={24} />
                  Мижозлар статистикаси
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm text-gray-600">Жами мижозлар</span>
                    <span className="font-bold text-blue-600">
                      {stats.yearly.current.clients.total}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm text-gray-600">Қарздор мижозлар</span>
                    <span className="font-bold text-green-600">
                      {stats.yearly.current.debts.customerDebts.count}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm text-gray-600">Манбалар</span>
                    <span className="font-bold text-purple-600">
                      {stats.yearly.current.clients.suppliers}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Wallet className="text-green-500" size={24} />
                  Қарз баланси
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm text-gray-600">Олиш керак (сўм)</span>
                    <span className="font-bold text-green-600">
                      {stats.yearly.current.debts.customerDebts.totalUZ.toLocaleString('uz-UZ')} сўм
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-sm text-gray-600">Бериш керак (сўм)</span>
                    <span className="font-bold text-red-600">
                      {stats.yearly.current.debts.supplierDebts.totalUZ.toLocaleString('uz-UZ')} сўм
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm text-gray-600">Олиш керак ($)</span>
                    <span className="font-bold text-blue-600">
                      {stats.yearly.current.debts.customerDebts.totalEN.toLocaleString('uz-UZ')} $
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm text-gray-600">Бериш керак ($)</span>
                    <span className="font-bold text-orange-600">
                      {stats.yearly.current.debts.supplierDebts.totalEN.toLocaleString('uz-UZ')} $
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Additional tabs can be implemented similarly */}
        {activeTab !== 'overview' && activeTab !== 'debts' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 text-center"
          >
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Яқинда тайёр бўлади
            </h3>
            <p className="text-gray-600">
              Бу бўлим ишлаб чиқилмоқда. Умумий кўриниш бўлимида асосий маълумотларни кўришингиз мумкин.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}