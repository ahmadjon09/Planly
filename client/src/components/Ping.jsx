import { MessageSquareWarning } from 'lucide-react'
import Fetch from '../middlewares/fetcher'
import { useState, useEffect } from 'react'

export const Ping = () => {
  const [ping, setPing] = useState(0)

  const checkPing = async () => {
    const start = performance.now()
    try {
      await Fetch.get('/status')
      const end = performance.now()
      setPing(Number((end - start).toFixed()))
    } catch (err) {
      setPing(999)
    }
  }

  useEffect(() => {
    checkPing()
    const interval = setInterval(checkPing, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (ping == 999) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [ping])

  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <>
      {ping === 999 && (
        <div className='fixed inset-0 bg-black/90 bg-opacity-70 flex items-center justify-center z-999'>
          <div className='bg-gray-900 p-8 rounded-xl shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full'>
            <MessageSquareWarning size={74} color='red' />
            <h2 className='text-3xl font-bold text-center text-red-600'>
              Сервер хатолиги!
            </h2>
            <p className='text-gray-300 text-center text-sm'>
              Серверда хатолик юз берди. Илтимос, кейинроқ қайта уриниб кўринг!
            </p>
            <button
              onClick={handleRetry}
              className='mt-4 border text-white px-6 py-2 rounded-lg hover:bg-[#4682B4] transition-colors duration-300 font-medium'
            >
              Қайта уриниш
            </button>
          </div>
        </div>
      )}
    </>
  )
}
