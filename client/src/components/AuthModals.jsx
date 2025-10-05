import { useContext, useState } from 'react'
import { Phone, Lock, Eye, EyeOff, Upload } from 'lucide-react'
import { useTranslation } from '../context/LanguageContext'
import Fetch from '../middlewares/fetcher'
import { ContextData } from '../context/Context'

export const AuthModals = ({ initialTab = 'login' }) => {
  const [activeTab, setActiveTab] = useState(initialTab)
  const { t } = useTranslation()

  return (
    <div className='fixed bg-white inset-0 z-50 flex items-center justify-center'>
      <div className='relative bg-blue-500 rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden transition-all duration-300 transform animate-[fadeIn_0.3s_ease-out]'>
        <div className='flex border-b'>
          <button
            className={`flex-1 py-4 font-semibold text-center transition-colors text-white hover:text-white`}
            onClick={() => setActiveTab('login')}
          >
            {t('login')}
          </button>
        </div>

        <div className='p-6'>
          {activeTab === 'login' ? (
            <LoginForm setActiveTab={setActiveTab} />
          ) : (
            <RegisterForm setActiveTab={setActiveTab} />
          )}
        </div>
      </div>
    </div>
  )
}

const LoginForm = () => {
  const { setUserToken } = useContext(ContextData)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validateForm = () => {
    const newErrors = {}

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Телефон рақамини киритинг'
    } else {
      const numericPhone = phoneNumber.replace(/\D/g, '')
      if (numericPhone.length < 10) {
        newErrors.phoneNumber = 'Нотўғри телефон рақами'
      }
    }

    if (!password) {
      newErrors.password = 'Парол киритилиши шарт'
    } else if (password.length < 6) {
      newErrors.password = 'Парол 6 та белгидан кам бўлмаслиги керак'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setErrors({})

    try {
      const { data } = await Fetch.post('users/login', {
        password,
        phoneNumber
      })

      setUserToken(data.token)
      window.location.href = '/'
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Кириш муваффақиятсиз'
      setErrors({
        api: errorMessage,
        ...(error.response?.data?.errors || {})
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <h2 className='text-2xl text-white font-bold text-center mb-6'>
        Тизимга кириш
      </h2>

      {errors.api && (
        <div className='p-3 border border-red-500 bg-red-100 text-red-600 rounded-lg text-sm'>
          {errors.api}
        </div>
      )}

      <div className='space-y-2'>
        <label
          htmlFor='phoneNumber'
          className='block text-sm font-medium text-white'
        >
          Телефон рақами
        </label>
        <div className='relative'>
          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
            <Phone size={18} className='text-white' />
          </div>
          <input
            id='phoneNumber'
            type='tel'
            inputMode='numeric'
            value={phoneNumber}
            onChange={e =>
              setPhoneNumber(e.target.value.replace(/[^\d+]/g, ''))
            }
            className={`w-full pl-10 pr-4 py-2.5 border text-white ${
              errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
            } rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all`}
            placeholder='+998901234567'
          />
        </div>
        {errors.phoneNumber && (
          <p className='text-red-500 text-xs mt-1'>{errors.phoneNumber}</p>
        )}
      </div>

      <div className='space-y-2'>
        <div className='flex justify-between items-center'>
          <label
            htmlFor='password'
            className='block text-sm font-medium text-white'
          >
            Парол
          </label>
        </div>
        <div className='relative'>
          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
            <Lock size={18} className='text-white' />
          </div>
          <input
            id='password'
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={`w-full pl-10 pr-10 py-2.5 border text-white ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            } rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all`}
            placeholder='••••••••'
          />
          <button
            type='button'
            className='absolute inset-y-0 right-0 pr-3 flex items-center'
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff size={18} className='text-white hover:text-gray-600' />
            ) : (
              <Eye size={18} className='text-white hover:text-gray-600' />
            )}
          </button>
        </div>
        {errors.password && (
          <p className='text-red-500 text-xs mt-1'>{errors.password}</p>
        )}
      </div>

      <button
        type='submit'
        className='w-full bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 disabled:opacity-70'
        disabled={loading}
      >
        {loading ? 'Юкланмоқда...' : 'Кириш'}
      </button>
    </form>
  )
}
