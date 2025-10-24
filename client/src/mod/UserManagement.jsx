import { useState, useContext, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  X,
  Loader2,
  Save,
  UserPlus,
  Shield,
  UserCog2,
  ArrowLeft,
  User,
  Phone,
  Key,
  Info
} from 'lucide-react'
import Fetch from '../middlewares/fetcher'
import { ContextData } from '../contextData/Context'

export const UserManagement = () => {
  const { id, admin } = useParams()
  const navigate = useNavigate()
  const { user, setUser, setOpenX } = useContext(ContextData)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [adminData, setAdminData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '+998',
    role: 'worker',
    password: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (id) {
      setIsEditing(true)
      fetchAdminData()
    }
    if (admin) {
      setAdminData({
        firstName: '',
        lastName: '',
        phoneNumber: '+998',
        role: 'admin',
        password: ''
      })
    }
  }, [id, admin])

  const fetchAdminData = async () => {
    try {
      setIsLoading(true)
      const { data } = await Fetch.get(`/users/${id}`)
      setAdminData({
        firstName: data.data.firstName || '',
        lastName: data.data.lastName || '',
        phoneNumber: data.data.phoneNumber || '+998',
        role: data.data.role || 'worker',
        password: ''
      })
    } catch (error) {
      setError('Сервер хатоси. Илтимос кейинроқ уриниб кўринг!')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = e => {
    const { name, value } = e.target
    setAdminData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()

    // Валидация
    if (!adminData.firstName || !adminData.lastName) {
      setError('Исм ва фамилия киритилиши шарт!')
      return
    }

    if (!adminData.phoneNumber.match(/^\+998\d{9}$/)) {
      setError('Телефон рақамни тўғри киритинг (+998 xx xxx xx xx)')
      return
    }

    if (adminData.password && adminData.password.length < 8) {
      setError('Пароль камида 8 та белгидан иборат бўлиши керак!')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      const submitData = { ...adminData }
      if (isEditing && !submitData.password) {
        delete submitData.password
      }

      if (isEditing) {
        const { data } = await Fetch.put(`users/${id}`, submitData)
        if (data?.data._id === user._id) {
          setUser(data.data)
        }
      } else {
        await Fetch.post('users/register', submitData)
      }

      navigate(-1)
    } catch (error) {
      setError(
        error.response?.data?.message ||
          'Сервер хатоси. Илтимос кейинроқ уриниб кўринг!'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isEditing && id !== user?._id) {
    return (
      <div className='min-h-screen bg-gray-50 pt-20 flex items-center justify-center px-4'>
        <div className='max-w-md w-full mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200'>
          <div className='p-6 text-center'>
            <div className='mb-4'>
              <Shield className='h-12 w-12 text-red-500 mx-auto' />
            </div>
            <h2 className='text-xl font-bold text-red-600 mb-2'>Рухсат Етак</h2>
            <p className='text-gray-600 mb-4 text-sm'>
              Сизда бошқа фойдаланувчиларни таҳрирлаш ҳуқуқи мавжуд эмас
            </p>
            <button
              onClick={() => navigate(-1)}
              className='bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium'
            >
              Орқага қайтиш
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 w-full px-4 py-6'>
      <div className='mx-auto max-w-2xl'>
        {/* Header */}
        <div className='flex items-center justify-between mb-6'>
          <button
            onClick={() => navigate(-1)}
            className='flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md'
          >
            <ArrowLeft className='h-4 w-4' />
            <span className='font-medium text-sm'>Орқага</span>
          </button>

          <div className='text-center'>
            <h1 className='text-xl font-bold text-gray-800'>
              {isEditing ? 'Фойдаланувчини Таҳрирлаш' : 'Янги Фойдаланувчи'}
            </h1>
            <p className='text-gray-600 text-xs mt-1'>
              {isEditing
                ? 'Маълумотларни янгиланг'
                : 'Янги фойдаланувчи қўшинг'}
            </p>
          </div>

          <div className='w-20'></div>
        </div>

        <div className='bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200'>
          {/* Form Header */}
          <div className='bg-blue-50 px-6 py-4 border-b border-blue-100'>
            <div className='flex items-center gap-3'>
              <div className='bg-blue-500 p-2 rounded-lg'>
                <UserCog2 className='h-5 w-5 text-white' />
              </div>
              <div>
                <h2 className='text-lg font-semibold text-gray-800'>
                  {isEditing
                    ? 'Фойдаланувчи Маълумотлари'
                    : 'Янги Фойдаланувчи'}
                </h2>
                <p className='text-gray-600 text-xs'>
                  {isEditing
                    ? 'Маълумотларни таҳрирланг'
                    : 'Янги фойдаланувчи қўшинг'}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className='p-6 space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* First Name */}
              <div className='space-y-2'>
                <label className='block text-sm font-medium text-gray-700 flex items-center gap-1'>
                  <User className='h-4 w-4 text-blue-500' />
                  Исм
                  <button
                    type='button'
                    onClick={() => setOpenX(true)}
                    className='text-red-500 font-bold ml-1'
                  >
                    *
                  </button>
                </label>
                <input
                  className='w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white text-sm'
                  type='text'
                  name='firstName'
                  value={adminData.firstName}
                  onChange={handleInputChange}
                  required
                  placeholder='Исмингизни киритинг'
                />
              </div>

              {/* Last Name */}
              <div className='space-y-2'>
                <label className='block text-sm font-medium text-gray-700 flex items-center gap-1'>
                  <User className='h-4 w-4 text-blue-500' />
                  Фамилия
                  <button
                    type='button'
                    onClick={() => setOpenX(true)}
                    className='text-red-500 font-bold ml-1'
                  >
                    *
                  </button>
                </label>
                <input
                  className='w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white text-sm'
                  type='text'
                  name='lastName'
                  value={adminData.lastName}
                  onChange={handleInputChange}
                  required
                  placeholder='Фамилиянгизни киритинг'
                />
              </div>

              {/* Phone Number */}
              <div className='space-y-2'>
                <label className='block text-sm font-medium text-gray-700 flex items-center gap-1'>
                  <Phone className='h-4 w-4 text-green-500' />
                  Телефон
                  <button
                    type='button'
                    onClick={() => setOpenX(true)}
                    className='text-red-500 font-bold ml-1'
                  >
                    *
                  </button>
                </label>
                <input
                  className='w-full p-3 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all bg-white text-sm'
                  type='text'
                  name='phoneNumber'
                  value={adminData.phoneNumber}
                  onChange={e => {
                    let value = e.target.value
                    if (!value.startsWith('+998')) {
                      value = '+998' + value.replace(/^\+998/, '')
                    }
                    if (value.length > 13) value = value.slice(0, 13)
                    handleInputChange({
                      target: { name: 'phoneNumber', value }
                    })
                  }}
                  required
                  placeholder='+998901234567'
                />
              </div>

              {/* Password */}
              <div className='space-y-2'>
                <label className='block text-sm font-medium text-gray-700 flex items-center gap-1'>
                  <Key className='h-4 w-4 text-purple-500' />
                  {isEditing ? (
                    'Янги пароль'
                  ) : (
                    <span className='flex items-center gap-1'>
                      Пароль
                      <button
                        type='button'
                        onClick={() => setOpenX(true)}
                        className='text-red-500 font-bold'
                      >
                        *
                      </button>
                    </span>
                  )}
                </label>
                <input
                  className='w-full p-3 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all bg-white text-sm'
                  type='password'
                  name='password'
                  value={adminData.password}
                  onChange={handleInputChange}
                  minLength={isEditing ? 0 : 8}
                  required={!isEditing}
                  placeholder='Камида 8 та белги'
                />
              </div>
            </div>

            {/* Help Info */}
            <div className='bg-blue-50 rounded-lg p-3 border border-blue-100'>
              <div className='flex items-start gap-2'>
                <Info className='h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0' />
                <div className='text-xs text-gray-600'>
                  <p className='font-medium text-blue-700 mb-1'>Ёрдам:</p>
                  <ul className='space-y-1'>
                    <li>• Мажбурий майдонлар * белгиси билан</li>
                    <li>• Пароль камида 8 та белги</li>
                    <li>• Телефон +998 форматида</li>
                  </ul>
                </div>
              </div>
            </div>

            {error && (
              <div className='p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center'>
                <X className='h-4 w-4 mr-2 flex-shrink-0' />
                {error}
              </div>
            )}

            <div className='grid grid-cols-1 md:grid-cols-2 gap-3 pt-4'>
              <button
                type='button'
                onClick={() => navigate(-1)}
                className='rounded-lg border border-gray-300 bg-white hover:bg-gray-50 cursor-pointer flex justify-center items-center gap-2 text-gray-700 py-3 font-medium transition-colors text-sm'
              >
                <X className='h-4 w-4' />
                Бекор қилиш
              </button>
              <button
                type='submit'
                disabled={isSubmitting}
                className={`${
                  isSubmitting
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                } rounded-lg text-white py-3 font-medium transition-colors cursor-pointer flex justify-center items-center gap-2 text-sm`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Юкланмоқда...
                  </>
                ) : (
                  <>
                    {isEditing ? (
                      <Save className='h-4 w-4' />
                    ) : (
                      <UserPlus className='h-4 w-4' />
                    )}
                    {isEditing ? 'Сақлаш' : 'Қўшиш'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
