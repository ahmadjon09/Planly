import { WifiOff } from 'lucide-react'
import Fetch from '../middlewares/fetcher'
import { useState, useEffect } from 'react'
import { useContext } from 'react'
import { ContextData } from '../contextData/Context'

export const Ping = () => {
  const { dark } = useContext(ContextData)
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

      setIsOffline(latency > 5000)
    } catch {
      setIsOffline(true)
    }
  }

  useEffect(() => {
    checkConnection()
    const interval = setInterval(checkConnection, 5000)
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
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
        <div
          className={`fixed inset-0 flex items-center justify-center z-[9999] transition-all duration-300
            ${dark ? 'bg-black/90' : 'bg-black/70'}
          `}
        >
          <div
            className={`p-8 rounded-xl shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full text-center transition-all duration-300
              ${dark ? 'bg-gray-900 text-gray-200' : 'bg-white text-gray-800'}
            `}
          >
            <WifiOff size={74} color="#ef4444" />

            <h2 className="text-3xl font-bold text-red-500">
              Интернет уланмаган!
            </h2>

            <p className={`${dark ? 'text-gray-300' : 'text-gray-600'} text-sm`}>
              Интернетга уланишингиз узилди. Илтимос, тармоқни текширинг ёки
              қайта уриниб кўринг.
            </p>

            <button
              onClick={handleRetry}
              className={`mt-4 border px-6 py-2 rounded-lg transition-colors duration-300 font-medium
                ${dark
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-800 hover:bg-[#2563eb] hover:text-white'
                }
              `}
            >
              Қайта уриниш
            </button>
          </div>
        </div>
      )}
    </>
  )
}
