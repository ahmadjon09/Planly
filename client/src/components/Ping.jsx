import { WifiOff } from 'lucide-react'
import Fetch from '../middlewares/fetcher'
import { useState, useEffect } from 'react'

export const Ping = () => {
  const [isOffline, setIsOffline] = useState(false)

  const checkConnection = async () => {
    if (!navigator.onLine) {
      setIsOffline(true)
      return
    }

    const start = performance.now()
    try {
      await Fetch.get('/status')
      const end = performance.now()
      const latency = Number((end - start).toFixed())
      if (latency > 5000) {
        setIsOffline(true)
      } else {
        setIsOffline(false)
      }
    } catch (err) {
      setIsOffline(true)
    }
  }

  useEffect(() => {
    checkConnection()
    const interval = setInterval(checkConnection, 5000)
    window.addEventListener('online', () => setIsOffline(false))
    window.addEventListener('offline', () => setIsOffline(true))

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', () => setIsOffline(false))
      window.removeEventListener('offline', () => setIsOffline(true))
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = isOffline ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOffline])

  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <>
      {isOffline && (
        <div className='fixed inset-0 bg-black/90 flex items-center justify-center z-[9999]'>
          <div className='bg-gray-900 p-8 rounded-xl shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full text-center'>
            <WifiOff size={74} color='#ef4444' />
            <h2 className='text-3xl font-bold text-red-500'>
              Интернет уланмаган!
            </h2>
            <p className='text-gray-300 text-sm'>
              Интернетга уланишингиз узилди. Илтимос, тармоқни текширинг ёки
              қайта уриниб кўринг.
            </p>
            <button
              onClick={handleRetry}
              className='mt-4 border border-gray-700 text-white px-6 py-2 rounded-lg hover:bg-[#2563eb] transition-colors duration-300 font-medium'
            >
              Қайта уриниш
            </button>
          </div>
        </div>
      )}
    </>
  )
}
