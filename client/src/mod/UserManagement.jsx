import { useState, useContext, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  X,
  Loader2,
  Save,
  UserPlus,
  Shield,
  UserCog2,
  ArrowLeft
} from 'lucide-react'
import Fetch from '../middlewares/fetcher'
import { ContextData } from '../context/ContextT'

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
      setIsLoading(true)
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
      setIsLoading(false)
    }
  }

  if (isEditing && id !== user?._id) {
    return (
      <div className='pt-20 flex items-center justify-center px-4'>
        <div className='max-w-md mx-auto bg-white border shadow-lg rounded-xl overflow-hidden'>
          <div className='p-6 text-center'>
            <Shield className='h-16 w-16 text-red-500 mx-auto mb-4' />
            <h2 className='text-xl font-bold text-red-600 mb-2'>Рухсат йўқ</h2>
            <p className='text-gray-600 mb-4'>
              Сизда бошқа фойдаланувчиларни таҳрирлаш ҳуқуқи йўқ
            </p>
            <button
              onClick={() => navigate(-1)}
              className='bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition'
            >
              Орқага қайтиш
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='w-full px-4 py-8'>
      <div className='mx-auto w-full md:max-w-2xl rounded-xl overflow-hidden shadow bg-white border'>
        <form onSubmit={handleSubmit} className='w-full p-6'>
          <button
            type='button'
            onClick={() => navigate(-1)}
            className='flex gap-2 mb-5 items-center text-gray-600 hover:text-gray-800 transition'
          >
            <ArrowLeft className='h-5 w-5' />
            Орқага
          </button>

          <h3 className='text-lg font-semibold text-gray-800 mb-6 flex items-center'>
            <UserCog2 className='h-5 w-5 mr-2 text-blue-500' />
            Фойдаланувчи маълумотлари
          </h3>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Исм{' '}
                <button
                  type='button'
                  onClick={() => setOpenX(true)}
                  className='text-red-500 font-bold'
                >
                  *
                </button>
              </label>
              <input
                className='w-full p-3 border rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none'
                type='text'
                name='firstName'
                value={adminData.firstName}
                onChange={handleInputChange}
                required
                placeholder='Исмингизни киритинг'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Фамилия{' '}
                <button
                  type='button'
                  onClick={() => setOpenX(true)}
                  className='text-red-500 font-bold'
                >
                  *
                </button>
              </label>
              <input
                className='w-full p-3 border rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none'
                type='text'
                name='lastName'
                value={adminData.lastName}
                onChange={handleInputChange}
                required
                placeholder='Фамилиянгизни киритинг'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Телефон рақам{' '}
                <button
                  type='button'
                  onClick={() => setOpenX(true)}
                  className='text-red-500 font-bold'
                >
                  *
                </button>
              </label>
              <input
                className='w-full p-3 border rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none'
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

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
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
                className='w-full p-3 border rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none'
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

          {error && (
            <div className='mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center'>
              <X className='h-5 w-5 mr-2 flex-shrink-0' />
              {error}
            </div>
          )}

          <div className='grid grid-cols-2 gap-4 mt-8'>
            <button
              type='button'
              onClick={() => navigate(-1)}
              className='rounded-lg border border-gray-300 bg-gray-100 hover:bg-gray-200 cursor-pointer flex justify-center items-center gap-2 text-gray-700 py-3 font-medium transition'
            >
              <X className='h-5 w-5' />
              Бекор қилиш
            </button>
            <button
              type='submit'
              disabled={isLoading}
              className={`${
                isLoading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } rounded-lg text-white py-3 font-medium transition cursor-pointer flex justify-center items-center gap-2 shadow`}
            >
              {isLoading ? (
                <>
                  <Loader2 className='h-5 w-5 animate-spin' />
                  Юкланмоқда...
                </>
              ) : (
                <>
                  {isEditing ? (
                    <Save className='h-5 w-5' />
                  ) : (
                    <UserPlus className='h-5 w-5' />
                  )}
                  {isEditing ? 'Сақлаш' : 'Қўшиш'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
