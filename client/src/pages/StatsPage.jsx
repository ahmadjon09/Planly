import { useState } from 'react'
import useSWR from 'swr'
import Fetch from '../middlewares/fetcher'
import {
  AlertTriangle,
  Loader2,
  Package,
  RefreshCw,
  Activity,
  Users,
  Wallet,
  BadgeDollarSignIcon
} from 'lucide-react'

import { LoadingState } from '../components/loading-state'
import { motion, AnimatePresence } from 'framer-motion'

// SWR fetcher function
const fetcher = url => Fetch.get(url).then(res => res.data)


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
                <BadgeDollarSignIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Қарзлар
                </h1>
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


        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Debt Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <DebtCard
              title="Мижозлардан олиш керак"
              amountUZ={stats.yearly.current.debts.customerDebts.totalUZ}
              amountEN={stats.yearly.current.debts.customerDebts.totalEN}
              icon={Users}
              color="blue"
            />
            <DebtCard
              title="Таминотчиларга бериш керак"
              amountUZ={stats.yearly.current.debts.supplierDebts.totalUZ}
              amountEN={stats.yearly.current.debts.supplierDebts.totalEN}
              icon={Package}
              color="red"
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

      </div>
    </div>
  )
}