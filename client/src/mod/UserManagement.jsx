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
  Info,
  Eye,
  Package,
  CheckCircle
} from 'lucide-react'
import Fetch from '../middlewares/fetcher'
import { ContextData } from '../contextData/Context'

export const UserManagement = () => {
  const { id, admin } = useParams()
  const navigate = useNavigate()
  const { user, setUser, setOpenX, dark } = useContext(ContextData)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [adminData, setAdminData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '+998',
    role: 'worker',
    password: '',
    ability: 'both' // default qiymat
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
        password: '',
        ability: 'both' // admin uchun har doim both
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
        password: '',
        ability: data.data.ability || 'both'
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

    // Agar admin bo'lsa, ability har doim 'both' bo'ladi
    const submitData = {
      ...adminData,
      ...(adminData.role === 'admin' && { ability: 'both' })
    }

    try {
      setIsSubmitting(true)
      setError('')

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

  // Dark mode styles
  const bgColor = dark ? 'bg-gray-900' : 'bg-gray-50'
  const cardBg = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  const textColor = dark ? 'text-white' : 'text-gray-800'
  const textMuted = dark ? 'text-gray-300' : 'text-gray-600'
  const inputBg = dark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
  const buttonSecondary = dark ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
  const headerBg = dark ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-100'
  const infoBg = dark ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-100'
  const warningBg = dark ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-200'
  const successBg = dark ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-100'
  const purpleBg = dark ? 'bg-purple-900 border-purple-700' : 'bg-purple-50 border-purple-100'

  if (isEditing && id !== user?._id) {
    return (
      <div className={`min-h-screen pt-20 flex items-center justify-center px-4 ${bgColor}`}>
        <div className={`max-w-md w-full mx-auto rounded-xl shadow-lg overflow-hidden border ${cardBg}`}>
          <div className='p-6 text-center'>
            <div className='mb-4'>
              <Shield className='h-12 w-12 text-red-500 mx-auto' />
            </div>
            {/* <h2 className={`text-xl font-bold text-red-600 mb-2 ${textColor}`}>Ру</h2> */}
            <p className={`mb-4 text-sm ${textMuted}`}>
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
    <div className={`min-h-screen w-full px-4 py-6 ${bgColor}`}>
      <div className='mx-auto max-w-2xl'>
        {/* Header */}
        <div className='flex items-center justify-between mb-6'>
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center gap-2 transition-colors px-4 py-2 rounded-lg shadow-sm hover:shadow-md ${buttonSecondary} ${textColor}`}
          >
            <ArrowLeft className='h-4 w-4' />
            <span className='font-medium text-sm'>Орқага</span>
          </button>

          <div className='text-center'>
            <h1 className={`text-xl font-bold ${textColor}`}>
              {isEditing ? 'Фойдаланувчини Таҳрирлаш' : 'Янги Фойдаланувчи'}
            </h1>
            <p className={`text-xs mt-1 ${textMuted}`}>
              {isEditing
                ? 'Маълумотларни янгиланг'
                : 'Янги фойдаланувчи қўшинг'}
            </p>
          </div>

          <div className='w-20'></div>
        </div>

        <div className={`rounded-xl shadow-lg overflow-hidden border ${cardBg}`}>
          {/* Form Header */}
          <div className={`px-6 py-4 border-b ${headerBg}`}>
            <div className='flex items-center gap-3'>
              <div className='bg-blue-500 p-2 rounded-lg'>
                <UserCog2 className='h-5 w-5 text-white' />
              </div>
              <div>
                <h2 className={`text-lg font-semibold ${textColor}`}>
                  {isEditing
                    ? 'Фойдаланувчи Маълумотлари'
                    : 'Янги Фойдаланувчи'}
                </h2>
                <p className={`text-xs ${textMuted}`}>
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
                <label className={`block text-sm font-medium flex items-center gap-1 ${textColor}`}>
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
                  className={`w-full p-3 border rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm ${inputBg}`}
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
                <label className={`block text-sm font-medium flex items-center gap-1 ${textColor}`}>
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
                  className={`w-full p-3 border rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm ${inputBg}`}
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
                <label className={`block text-sm font-medium flex items-center gap-1 ${textColor}`}>
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
                  className={`w-full p-3 border rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all text-sm ${inputBg}`}
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

              {/* Role */}
              {!isEditing && <div className='space-y-2'>
                <label className={`block text-sm font-medium flex items-center gap-1 ${textColor}`}>
                  <Shield className='h-4 w-4 text-orange-500' />
                  Рол
                  <button
                    type='button'
                    onClick={() => setOpenX(true)}
                    className='text-red-500 font-bold ml-1'
                  >
                    *
                  </button>
                </label>
                <select
                  className={`w-full p-3 border rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-sm appearance-none ${inputBg}`}
                  name='role'
                  value={adminData.role}
                  onChange={handleInputChange}
                  required
                >
                  <option value='worker'>Ходим</option>
                  <option value='admin'>Админ</option>
                </select>
              </div>}

              {!isEditing && adminData.role === 'worker' && (
                <div className='space-y-2'>
                  <label className={`block text-sm font-medium flex items-center gap-1 ${textColor}`}>
                    <Eye className='h-4 w-4 text-purple-500' />
                    Кўриш ҳуқуқи
                    <button
                      type='button'
                      onClick={() => setOpenX(true)}
                      className='text-red-500 font-bold ml-1'
                    >
                      *
                    </button>
                  </label>
                  <select
                    className={`w-full p-3 border rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-sm appearance-none ${inputBg}`}
                    name='ability'
                    value={adminData.ability}
                    onChange={handleInputChange}
                    required
                  >
                    <option value='both'>Ҳаммасини кўра олади</option>
                    <option value='ready'>Фақат тайёр маҳсулотлар</option>
                    <option value='!ready'>Фақат хом ашё</option>
                  </select>
                </div>
              )}

              {/* Password */}
              <div className='space-y-2'>
                <label className={`block text-sm font-medium flex items-center gap-1 ${textColor}`}>
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
                  className={`w-full p-3 border rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-sm ${inputBg}`}
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

            {/* Ability ma'nolari */}
            {!isEditing && adminData.role === 'worker' && (
              <div className={`rounded-lg p-3 border ${purpleBg}`}>
                <div className='flex items-start gap-2'>
                  <Info className='h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0' />
                  <div className={`text-xs ${textMuted}`}>
                    <p className={`font-medium mb-1 ${dark ? 'text-purple-300' : 'text-purple-700'}`}>Кўриш ҳуқуқи изоҳи:</p>
                    <ul className='space-y-1'>
                      <li className='flex items-center gap-2'>
                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                        <span><strong>Ҳаммасини кўра олади</strong> - Барча маҳсулот ва хом ашёлар</span>
                      </li>
                      <li className='flex items-center gap-2'>
                        <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                        <span><strong>Фақат тайёр маҳсулотлар</strong> - Тайёр бўлган маҳсулотларнигина кўради</span>
                      </li>
                      <li className='flex items-center gap-2'>
                        <div className='w-2 h-2 bg-orange-500 rounded-full'></div>
                        <span><strong>Фақат хом ашё</strong> - Хом ашё ва тайёр бўлмаган маҳсулотларнигина кўради</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Admin ability info */}
            {adminData.role === 'admin' && (
              <div className={`rounded-lg p-3 border ${successBg}`}>
                <div className='flex items-start gap-2'>
                  <CheckCircle className='h-4 w-4 text-green-500 mt-0.5 flex-shrink-0' />
                  <div className={`text-xs ${textMuted}`}>
                    <p className={`font-medium mb-1 ${dark ? 'text-green-300' : 'text-green-700'}`}>Админ ҳуқуқлари:</p>
                    <p>Админ роли учун барча маҳсулот ва хом ашёларни кўриш ҳуқуқи автомат равишда берилади.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Help Info */}
            <div className={`rounded-lg p-3 border ${infoBg}`}>
              <div className='flex items-start gap-2'>
                <Info className='h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0' />
                <div className={`text-xs ${textMuted}`}>
                  <p className={`font-medium mb-1 ${dark ? 'text-blue-300' : 'text-blue-700'}`}>Ёрдам:</p>
                  <ul className='space-y-1'>
                    <li>• Мажбурий майдонлар * белгиси билан</li>
                    <li>• Пароль камида 8 та белги</li>
                    <li>• Телефон +998 форматида</li>
                    <li>• Админ - барча маҳсулотларни кўради</li>
                    <li>• Ходим - танланган кўриш ҳуқуқига эга</li>
                  </ul>
                </div>
              </div>
            </div>

            {error && (
              <div className={`p-3 border rounded-lg text-sm flex items-center ${dark ? 'bg-red-900 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-600'
                }`}>
                <X className='h-4 w-4 mr-2 flex-shrink-0' />
                {error}
              </div>
            )}

            <div className='grid grid-cols-1 md:grid-cols-2 gap-3 pt-4'>
              <button
                type='button'
                onClick={() => navigate(-1)}
                className={`rounded-lg border cursor-pointer flex justify-center items-center gap-2 py-3 font-medium transition-colors text-sm ${dark
                  ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-white'
                  : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
              >
                <X className='h-4 w-4' />
                Бекор қилиш
              </button>
              <button
                type='submit'
                disabled={isSubmitting}
                className={`${isSubmitting
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