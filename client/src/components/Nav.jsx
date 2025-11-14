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
  ReceiptText,
  User
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { ContextData } from '../contextData/Context'
import logo from '../assets/images/logo2.png'
import { name } from '../assets/js/i'

export const Nav = () => {
  const { user, removeUserToken } = useContext(ContextData)
  const [isOpen, setIsOpen] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const location = useLocation()

  const navLinks = [
    { name: 'Склад', path: '/', icon: <Boxes size={20} /> },
    { name: 'Админлар', path: '/admin', icon: <ShieldUser size={20} /> },
    { name: 'Xодимлар', path: '/workers', icon: <UserRoundPen size={20} /> },
    {
      name: 'Буюртмалар',
      path: '/orders',
      icon: <ReceiptText size={20} />
    },
    ...(user.role === 'admin'
      ? [
        {
          name: 'Статистика',
          path: '/static',
          icon: <BarChart3 size={20} />
        },
        {
          name: 'ходим',
          path: '/user',
          icon: <UserPlus2Icon size={20} />
        }
      ]
      : [])
  ]

  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    if (!window.confirm('Сиз ростдан хам тизимдан чиқмоқчимисиз?')) return
    removeUserToken()
    window.location.href = '/'
  }

  return (
    <nav className='fixed top-0 left-0 w-full h-16 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100'>
      <div className='container mx-auto h-full flex items-center justify-between px-4 sm:px-6 lg:px-8'>
        {/* Logo/Brand */}
        <motion.div
          className='flex items-center gap-2'
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <Link to={'/'}>
            <motion.img
              className='w-9 h-9 rounded-lg shadow-sm'
              src={logo}
              alt='logo'
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            />
          </Link>
          <span className='text-lg font-semibold text-gray-900'>{name}</span>
        </motion.div>

        {/* Desktop Navigation */}
        <motion.div
          className='hidden lg:flex items-center gap-2'
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {navLinks.map((link, index) => (
            <motion.div
              key={link.path}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Link
                to={link.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${location.pathname === link.path
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
              >
                <span
                  className={
                    location.pathname === link.path
                      ? 'text-white'
                      : 'text-gray-400 group-hover:text-blue-600'
                  }
                >
                  {link.icon}
                </span>
                {link.name}
                {location.pathname === link.path && (
                  <motion.div
                    className='absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-200 rounded-full'
                    layoutId='activeIndicator'
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  />
                )}
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* User Menu */}
        <motion.div
          className='flex items-center gap-3'
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Desktop User Dropdown */}
          <div className='hidden lg:block relative' ref={dropdownRef}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowDropdown(!showDropdown)}
              className='flex items-center gap-2 bg-white hover:bg-gray-50 rounded-lg px-3 py-2 transition-all duration-200 border border-gray-100 shadow-sm'
            >
              <div className='bg-blue-600 p-1.5 rounded-md'>
                <User className='h-4 w-4 text-white' />
              </div>
              <div className='text-left hidden lg:block'>
                <p className='text-sm font-medium text-gray-800'>
                  {user.firstName || 'Фойдаланувчи'}
                </p>
                <p className='text-xs text-gray-500 capitalize'>{user.role}</p>
              </div>
              <motion.div
                animate={{ rotate: showDropdown ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown size={16} className='text-gray-400' />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className='absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 p-2 z-50'
                >
                  <div className='px-3 py-2 border-b border-gray-100'>
                    <p className='text-sm font-medium text-gray-800'>
                      {user.firstName} {user.lastName}
                    </p>
                    <p className='text-xs text-gray-500 mt-1'>{user.email}</p>
                    <div className='flex items-center gap-2 mt-2'>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium capitalize
                          ${user.role === 'admin'
                            ? 'bg-purple-600 text-white'
                            : user.role === 'owner'
                              ? 'bg-red-600 text-white'
                              : 'bg-blue-600 text-white'
                          }`}
                      >
                        {user.role}
                      </span>
                    </div>
                  </div>
                  <div className='py-1'>
                    <Link
                      to={`/user/edit/${user._id}`}
                      className='flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-md transition-colors'
                      onClick={() => setShowDropdown(false)}
                    >
                      <Pencil size={16} className='text-gray-500' />
                      Профилни таҳрирлаш
                    </Link>
                    <button
                      onClick={handleLogout}
                      className='w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors'
                    >
                      <LogOut size={16} />
                      Чиқиш
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className='lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg'
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Ёпиш' : 'Меню'}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </motion.button>
        </motion.div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className='lg:hidden fixed inset-x-0 top-16 z-40 bg-white/95 backdrop-blur-md shadow-lg'
          >
            <div className='p-4 space-y-3'>
              <motion.div
                className='flex items-center gap-3 p-3 bg-blue-50 rounded-lg'
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className='bg-blue-600 p-2 rounded-md'>
                  <User className='h-5 w-5 text-white' />
                </div>
                <div>
                  <p className='font-medium text-gray-800'>
                    {user.firstName} {user.lastName}
                  </p>
                  <p className='text-sm text-gray-600 capitalize'>
                    {user.role}
                  </p>
                </div>
              </motion.div>

              <div className='space-y-1'>
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <Link
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200
                        ${location.pathname === link.path
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-blue-50'
                        }`}
                    >
                      <span
                        className={
                          location.pathname === link.path
                            ? 'text-white'
                            : 'text-gray-400'
                        }
                      >
                        {link.icon}
                      </span>
                      <span className='font-medium'>{link.name}</span>
                    </Link>
                  </motion.div>
                ))}
              </div>

              <motion.div
                className='border-t border-gray-100 pt-3 space-y-1'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Link
                  to={`/user/edit/${user._id}`}
                  className='flex items-center gap-3 p-3 rounded-lg text-gray-600 hover:bg-blue-50 transition-colors'
                  onClick={() => setIsOpen(false)}
                >
                  <Pencil size={20} className='text-gray-500' />
                  <span>Профилни таҳрирлаш</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className='w-full flex items-center gap-3 p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors'
                >
                  <LogOut size={20} />
                  <span>Чиқиш</span>
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
