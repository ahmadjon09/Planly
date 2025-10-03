import { useEffect, useState } from 'react'
import Fetch from '../middlewares/fetcher'
import {
  AlertTriangle,
  ChartColumn,
  Loader2,
  Package,
  Layers,
  DollarSign,
  Calendar,
  TrendingUp
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'

export const StatsPage = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await Fetch.get('/products/stats')
        setStats(res.data)
      } catch (err) {
        setError('Маълумот олиб бўлмади')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  // Combined chart data for price comparison
  const combinedChartData = stats
    ? [
        {
          name: 'Кунлик',
          products: stats.daily.totalProducts,
          stock: stats.daily.totalStock,
          price: stats.daily.totalPrice
        },
        {
          name: 'Ойлик',
          products: stats.monthly.totalProducts,
          stock: stats.monthly.totalStock,
          price: stats.monthly.totalPrice
        },
        {
          name: 'Йиллик',
          products: stats.yearly.totalProducts,
          stock: stats.yearly.totalStock,
          price: stats.yearly.totalPrice
        }
      ]
    : []

  if (loading) {
    return (
      <div className='flex justify-center items-center h-screen text-lg text-gray-600'>
        <Loader2 className='mr-2 text-blue-500 animate-spin' /> Юкланмоқда...
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex justify-center items-center h-screen text-red-500 text-lg'>
        <AlertTriangle className='mr-2' /> {error}
      </div>
    )
  }

  return (
    <div className='min-h-screen'>
      <div className='container mx-auto py-4 px-4 sm:py-6'>
        {/* Header */}
        <div className='text-center mb-6 sm:mb-8'>
          <h1 className='text-2xl sm:text-3xl font-bold text-gray-800 mb-3 flex items-center justify-center'>
            <ChartColumn className='mr-3 text-blue-600 w-6 h-6 sm:w-auto sm:h-auto' />
            Маҳсулотлар статистикаси
          </h1>
          <p className='text-gray-600 text-base sm:text-lg'>
            Барча даврлар учун ўзaro солиштирма
          </p>
        </div>

        {/* Overall Stats */}
        <div className='bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100'>
          <div className='flex items-center justify-center mb-4 sm:mb-6'>
            <TrendingUp className='text-blue-500 mr-3' />
            <h2 className='text-xl sm:text-2xl font-bold text-gray-800'>
              Умумий кўрсаткичлар
            </h2>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6'>
            <div className='text-center p-4 sm:p-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white shadow-lg'>
              <Package className='w-8 h-8 mx-auto mb-3' />
              <p className='text-sm opacity-90'>Жами маҳсулотлар</p>
              <p className='text-2xl sm:text-3xl font-bold mt-2'>
                {stats.yearly.totalProducts}
              </p>
            </div>
            <div className='text-center p-4 sm:p-6 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-xl text-white shadow-lg'>
              <Layers className='w-8 h-8 mx-auto mb-3' />
              <p className='text-sm opacity-90'>Жами қолдиқ</p>
              <p className='text-2xl sm:text-3xl font-bold mt-2'>
                {stats.yearly.totalStock}
              </p>
            </div>
            <div className='text-center p-4 sm:p-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white shadow-lg'>
              <DollarSign className='w-8 h-8 mx-auto mb-3' />
              <p className='text-sm opacity-90'>Жами қиймат</p>
              <p className='text-2xl sm:text-3xl font-bold mt-2'>
                {stats.yearly.totalPrice.toLocaleString('uz-UZ')}
              </p>
              <p className='text-sm opacity-90 mt-1'>сўм</p>
            </div>
          </div>
        </div>

        {/* Combined Price Chart */}
        <div className='bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100 overflow-hidden'>
          <h2 className='text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 text-center'>
            Қийматларни солиштириш
          </h2>
          <div className='h-64 sm:h-80'>
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
                  name='Қиймат (сўм)'
                  stroke='#8b5cf6'
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Period Stats Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6'>
          {/* Daily */}
          <div className='bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100 hover:shadow-2xl transition-shadow duration-300'>
            <div className='flex items-center mb-4 sm:mb-6'>
              <div className='w-3 h-8 bg-green-500 rounded-full mr-3'></div>
              <Calendar className='text-green-500 mr-2' />
              <h3 className='text-lg sm:text-xl font-bold text-gray-800'>
                Кунлик
              </h3>
            </div>

            <div className='space-y-3 sm:space-y-4 mb-4 sm:mb-6'>
              <div className='flex justify-between items-center p-3 sm:p-4 bg-green-50 rounded-lg'>
                <div>
                  <p className='text-sm text-gray-600'>Маҳсулотлар</p>
                  <p className='text-xl sm:text-2xl font-bold text-gray-800'>
                    {stats.daily.totalProducts}
                  </p>
                </div>
                <Package className='text-green-500' />
              </div>

              <div className='flex justify-between items-center p-3 sm:p-4 bg-yellow-50 rounded-lg'>
                <div>
                  <p className='text-sm text-gray-600'>Қолдиқ</p>
                  <p className='text-xl sm:text-2xl font-bold text-gray-800'>
                    {stats.daily.totalStock}
                  </p>
                </div>
                <Layers className='text-yellow-500' />
              </div>

              <div className='flex justify-between items-center p-3 sm:p-4 bg-purple-50 rounded-lg'>
                <div>
                  <p className='text-sm text-gray-600'>Қиймат</p>
                  <p className='text-xl sm:text-2xl font-bold text-gray-800'>
                    {stats.daily.totalPrice.toLocaleString('uz-UZ')}
                  </p>
                  <p className='text-xs text-gray-500'>сўм</p>
                </div>
                <DollarSign className='text-purple-500' />
              </div>
            </div>

            <div className='h-40 sm:h-48'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={[combinedChartData[0]]}>
                  <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
                  <XAxis dataKey='name' />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey='products'
                    name='Маҳсулотлар'
                    fill='#10b981'
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey='stock'
                    name='Қолдиқ'
                    fill='#f59e0b'
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly */}
          <div className='bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100 hover:shadow-2xl transition-shadow duration-300'>
            <div className='flex items-center mb-4 sm:mb-6'>
              <div className='w-3 h-8 bg-blue-500 rounded-full mr-3'></div>
              <Calendar className='text-blue-500 mr-2' />
              <h3 className='text-lg sm:text-xl font-bold text-gray-800'>
                Ойлик
              </h3>
            </div>

            <div className='space-y-3 sm:space-y-4 mb-4 sm:mb-6'>
              <div className='flex justify-between items-center p-3 sm:p-4 bg-blue-50 rounded-lg'>
                <div>
                  <p className='text-sm text-gray-600'>Маҳсулотлар</p>
                  <p className='text-xl sm:text-2xl font-bold text-gray-800'>
                    {stats.monthly.totalProducts}
                  </p>
                </div>
                <Package className='text-blue-500' />
              </div>

              <div className='flex justify-between items-center p-3 sm:p-4 bg-orange-50 rounded-lg'>
                <div>
                  <p className='text-sm text-gray-600'>Қолдиқ</p>
                  <p className='text-xl sm:text-2xl font-bold text-gray-800'>
                    {stats.monthly.totalStock}
                  </p>
                </div>
                <Layers className='text-orange-500' />
              </div>

              <div className='flex justify-between items-center p-3 sm:p-4 bg-indigo-50 rounded-lg'>
                <div>
                  <p className='text-sm text-gray-600'>Қиймат</p>
                  <p className='text-xl sm:text-2xl font-bold text-gray-800'>
                    {stats.monthly.totalPrice.toLocaleString('uz-UZ')}
                  </p>
                  <p className='text-xs text-gray-500'>сўм</p>
                </div>
                <DollarSign className='text-indigo-500' />
              </div>
            </div>

            <div className='h-40 sm:h-48'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={[combinedChartData[1]]}>
                  <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
                  <XAxis dataKey='name' />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey='products'
                    name='Маҳсулотлар'
                    fill='#3b82f6'
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey='stock'
                    name='Қолдиқ'
                    fill='#f97316'
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Yearly */}
          <div className='bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100 hover:shadow-2xl transition-shadow duration-300'>
            <div className='flex items-center mb-4 sm:mb-6'>
              <div className='w-3 h-8 bg-red-500 rounded-full mr-3'></div>
              <Calendar className='text-red-500 mr-2' />
              <h3 className='text-lg sm:text-xl font-bold text-gray-800'>
                Йиллик
              </h3>
            </div>

            <div className='space-y-3 sm:space-y-4 mb-4 sm:mb-6'>
              <div className='flex justify-between items-center p-3 sm:p-4 bg-red-50 rounded-lg'>
                <div>
                  <p className='text-sm text-gray-600'>Маҳсулотлар</p>
                  <p className='text-xl sm:text-2xl font-bold text-gray-800'>
                    {stats.yearly.totalProducts}
                  </p>
                </div>
                <Package className='text-red-500' />
              </div>

              <div className='flex justify-between items-center p-3 sm:p-4 bg-amber-50 rounded-lg'>
                <div>
                  <p className='text-sm text-gray-600'>Қолдиқ</p>
                  <p className='text-xl sm:text-2xl font-bold text-gray-800'>
                    {stats.yearly.totalStock}
                  </p>
                </div>
                <Layers className='text-amber-500' />
              </div>

              <div className='flex justify-between items-center p-3 sm:p-4 bg-pink-50 rounded-lg'>
                <div>
                  <p className='text-sm text-gray-600'>Қиймат</p>
                  <p className='text-xl sm:text-2xl font-bold text-gray-800'>
                    {stats.yearly.totalPrice.toLocaleString('uz-UZ')}
                  </p>
                  <p className='text-xs text-gray-500'>сўм</p>
                </div>
                <DollarSign className='text-pink-500' />
              </div>
            </div>

            <div className='h-40 sm:h-48'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={[combinedChartData[2]]}>
                  <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
                  <XAxis dataKey='name' />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey='products'
                    name='Маҳсулотлар'
                    fill='#ef4444'
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey='stock'
                    name='Қолдиқ'
                    fill='#f59e0b'
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
