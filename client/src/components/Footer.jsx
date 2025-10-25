import { Phone, Mail, MessageCircle, Heart, ArrowUp } from 'lucide-react'
import { name } from '../assets/js/i'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

export const Footer = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  // Show/hide scroll to top button
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setShowScrollTop(true)
      } else {
        setShowScrollTop(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  // Footer entrance animation
  useEffect(() => {
    setIsVisible(true)
  }, [])

  const footerVariants = {
    hidden: {
      opacity: 0,
      y: 50
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut'
      }
    }
  }

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut'
      }
    }
  }

  const scrollButtonVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    }
  }

  return (
    <>
      <motion.footer
        initial='hidden'
        animate={isVisible ? 'visible' : 'hidden'}
        variants={footerVariants}
        className='bg-gradient-to-r from-gray-50 to-blue-50 text-gray-600 text-sm py-6 border-t border-gray-200'
      >
        <div className='container mx-auto px-4'>
          {/* Main Footer Content */}
          <div className='flex flex-col lg:flex-row items-center justify-between gap-6 mb-4'>
            {/* Copyright Section */}
            <motion.div
              variants={itemVariants}
              className='text-center lg:text-left'
            >
              <p className='flex items-center justify-center lg:justify-start gap-2'>
                © {new Date().getFullYear()}{' '}
                <span className='font-semibold text-gray-800 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
                  {name}
                </span>
                . Барча ҳуқуқлар ҳимояланган.
              </p>
            </motion.div>

            {/* Contact Links */}
            <motion.div
              variants={itemVariants}
              className='flex items-center gap-6 text-center lg:text-right flex-wrap justify-center'
            >
              <motion.a
                whileHover={{
                  scale: 1.05,
                  color: '#1f2937'
                }}
                whileTap={{ scale: 0.95 }}
                href='tel:+998956718883'
                className='flex items-center gap-2 hover:text-gray-900 transition-all duration-300 px-3 py-2 rounded-lg hover:bg-white hover:shadow-md'
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <Phone size={16} className='text-green-500' />
                </motion.div>
                +998 (95) 671-88-83
              </motion.a>

              <motion.a
                whileHover={{
                  scale: 1.05,
                  color: '#1f2937'
                }}
                whileTap={{ scale: 0.95 }}
                href='https://t.me/+998956718883'
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center gap-2 hover:text-gray-900 transition-all duration-300 px-3 py-2 rounded-lg hover:bg-white hover:shadow-md'
              >
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <MessageCircle size={16} className='text-blue-400' />
                </motion.div>
                Telegram
              </motion.a>
            </motion.div>
          </div>

          {/* Additional Info */}
          <motion.div
            variants={itemVariants}
            className='text-center border-t border-gray-200 pt-4'
          >
            <p className='text-xs text-gray-500'>
              Бизнинг хизматлардан фойдаланиш учун раҳмат!
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className='mx-1'
              ></motion.span>
              Ишонч билан <b>{name}</b> жамоаси
            </p>
          </motion.div>
        </div>
      </motion.footer>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial='hidden'
            animate='visible'
            exit='hidden'
            variants={scrollButtonVariants}
            onClick={scrollToTop}
            className='fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-3 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110'
            whileHover={{
              scale: 1.1,
              boxShadow: '0 10px 30px rgba(59, 130, 246, 0.5)'
            }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowUp size={20} />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )
}
