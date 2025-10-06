import { X } from 'lucide-react'
import { useContext } from 'react'
import { ContextData } from '../contextData/Context'

export const AboutModal = () => {
  const { openX, setOpenX } = useContext(ContextData)
  if (!openX) return null

  return (
    <div className='fixed inset-0 flex items-center justify-center bg-black/50 z-999 px-3'>
      <div className='bg-white rounded-xl shadow-lg p-6 w-[320px] relative'>
        <button
          onClick={() => setOpenX(false)}
          className='absolute top-3 right-3 text-gray-500 hover:text-gray-800'
        >
          <X size={20} />
        </button>

        <h2 className='text-lg font-bold mb-3'>ℹ️ Маълумот</h2>
        <p className='text-gray-600'>
          <b>*</b> – бу майдонни тўлдириш мажбурий.
        </p>
      </div>
    </div>
  )
}
