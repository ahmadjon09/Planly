import { X, Info, AlertCircle } from 'lucide-react'
import { useContext } from 'react'
import { ContextData } from '../contextData/Context'

export const AboutModal = () => {
  const { openX, setOpenX } = useContext(ContextData)
  if (!openX) return null

  return (
    <div className='fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[999] px-4 py-6'>
      <div
        className='bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden animate-scale-in'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='bg-gradient-to-r from-blue-500 to-indigo-600 p-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='bg-white/20 p-2 rounded-xl'>
                <Info size={24} className='text-white' />
              </div>
              <h2 className='text-xl font-bold text-white'>Маълумот</h2>
            </div>
            <button
              onClick={() => setOpenX(false)}
              className='p-2 hover:bg-white/20 rounded-xl transition-all duration-200 text-white hover:scale-110'
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='p-6 space-y-4'>
          {/* Asosiy ma'lumot */}
          <div className='flex items-start gap-3'>
            <div className='bg-blue-100 p-2 rounded-lg mt-0.5'>
              <AlertCircle size={18} className='text-blue-600' />
            </div>
            <div>
              <p className='text-gray-700 leading-relaxed'>
                <span className='font-semibold text-red-500'>*</span> – белгиси
                қўйилган майдонларни тўлдириш{' '}
                <span className='font-semibold text-blue-600'>мажбурий</span>.
              </p>
            </div>
          </div>

          {/* Qo'shimcha tushuntirish */}
          <div className='bg-gray-50 rounded-xl p-4 border border-gray-200'>
            <h3 className='font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2'>
              <Info size={16} className='text-gray-600' />
              Қўшимча маълумот:
            </h3>
            <ul className='text-sm text-gray-600 space-y-1'>
              <li className='flex items-center gap-2'>
                <div className='w-1.5 h-1.5 bg-blue-500 rounded-full'></div>
                Мажбурий майдонларсиз форма тўлиқ сақланмайди
              </li>
              <li className='flex items-center gap-2'>
                <div className='w-1.5 h-1.5 bg-green-500 rounded-full'></div>
                Мажбурий бўлмаган майдонлар ихтиёрий
              </li>
            </ul>
          </div>

          {/* Misol */}
          <div className='border-t pt-4'>
            <p className='text-xs text-gray-500 text-center'>
              💡 <strong>Мисол:</strong> "Номи" майдони ҳар доим мажбурий
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className='bg-gray-50 px-6 py-4 border-t border-gray-200'>
          <button
            onClick={() => setOpenX(false)}
            className='w-full bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]'
          >
            Тушунарли
          </button>
        </div>
      </div>
    </div>
  )
}

// CSS animatsiya qo'shish uchun global styles qo'shing
const styles = `
@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-scale-in {
  animation: scale-in 0.2s ease-out;
}
`

// Stylesni qo'shish
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.innerText = styles
  document.head.appendChild(styleSheet)
}
