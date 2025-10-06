import { useState, useRef, useEffect, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LogOut,
  Menu,
  Pencil,
  X,
  ChevronDown,
  ShieldUser,
  UserRoundPen,
  UserPlus2Icon,
  Boxes,
  BarChart3,
  ReceiptText
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { ContextData } from '../contextData/Context'
import '../assets/css/nav.css'

export const Nav = () => {
  const { user, removeUserToken } = useContext(ContextData)
  const [isOpen, setIsOpen] = useState(false)
  const data = user
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const location = useLocation()

  const navLinks = [
    { name: 'Склад', path: '/', icon: <Boxes size={18} /> },
    { name: 'Админлар', path: '/admin', icon: <ShieldUser size={18} /> },
    { name: 'Xодимлар', path: '/workers', icon: <UserRoundPen size={18} /> },
    ...(user.role === 'admin'
      ? [
          {
            name: 'Статистика',
            path: '/static',
            icon: <BarChart3 size={18} />
          },
          {
            name: 'Янги ходим',
            path: '/user',
            icon: <UserPlus2Icon size={18} />
          },
          {
            name: 'Буюртмалар',
            path: '/orders',
            icon: <ReceiptText size={18} />
          }
        ]
      : [])
  ]

  useEffect(() => {
    function handleClickOutside (event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  function handleLogout () {
    if (!window.confirm('Админ сифатида чиқишни хоҳлайсизми?')) return
    removeUserToken()
    window.location.href = '/'
  }

  return (
    <nav className='w-full fixed top-0 left-0 h-[60px] z-[99] bg-gradient-to-r from-blue-700 to-blue-600 shadow-md'>
      <div className='container w-full h-full flex items-center justify-between px-4'>
        <div className='navv items-center space-x-1'>
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5
                ${
                  location.pathname === link.path
                    ? 'bg-blue-800 text-white'
                    : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'
                }`}
            >
              {link.icon}
              {link.name}
            </Link>
          ))}
        </div>

        <button
          className='absolute top-2 right-1 text-white p-2 navvbtn'
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Ёпиш' : 'Меню'}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className='flex navv relative items-center gap-3 text-xl font-bold text-white'>
          <div
            className='flex items-center cursor-pointer relative'
            onClick={() => setShowDropdown(!showDropdown)}
            ref={dropdownRef}
          >
            <div className='ml-2 flex items-center gap-1'>
              <span className='text-sm font-medium hidden sm:block'>
                {data.firstName || 'Фойдаланувчи'}
              </span>
              <ChevronDown
                size={16}
                className={`transition-transform duration-300 ${
                  showDropdown ? 'rotate-180' : ''
                }`}
              />
            </div>

            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className='absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20'
                >
                  <div className='px-4 py-2 border-b border-gray-100'>
                    <p className='text-sm font-medium text-gray-900'>
                      {data.firstName} {data.lastName}
                    </p>
                    <p className='text-xs text-gray-500 truncate'>
                      {data.role}
                    </p>
                  </div>

                  <Link
                    to={`/user/edit/${data._id}`}
                    className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2'
                  >
                    <Pencil size={14} />
                    Профилни таҳрирлаш
                  </Link>

                  <button
                    onClick={e => {
                      e.stopPropagation()
                      handleLogout()
                    }}
                    className='w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2'
                  >
                    <LogOut size={14} />
                    Чиқиш
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className='navmobile absolute z-[99] top-[60px] left-0 w-full bg-blue-800 text-white flex flex-col gap-3 p-4 text-lg shadow-lg rounded-b-lg overflow-hidden'
          >
            {/* Mobile Navigation Links */}
            <div className='flex flex-col gap-1 mb-2'>
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2 py-2 px-3 rounded-md transition-colors
                    ${
                      location.pathname === link.path
                        ? 'bg-blue-700 text-white'
                        : 'hover:bg-blue-700/70 text-blue-100'
                    }`}
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}
            </div>

            <div className='border-t border-blue-700 my-1'></div>

            <div className='flex items-center gap-3'>
              <div className='flex flex-col'>
                <span className='font-medium text-white'>
                  {data.firstName} {data.lastName}
                </span>
                <span className='text-xs text-blue-200'>Админ</span>
              </div>
            </div>

            <div className='flex flex-col gap-2 mt-2 border-t border-blue-700 pt-3'>
              <Link
                to={`/user/edit/${data._id}`}
                className='flex items-center gap-2 py-2 px-3 rounded-md hover:bg-blue-700 transition-colors'
              >
                <Pencil size={16} />
                Профилни таҳрирлаш
              </Link>

              <button
                onClick={handleLogout}
                className='flex items-center gap-2 py-2 px-3 rounded-md text-red-300 hover:bg-blue-700 transition-colors'
              >
                <LogOut size={16} />
                Чиқиш
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
