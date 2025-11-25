import { ArrowUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useContext } from 'react'
import { ContextData } from '../contextData/Context'

export const Footer = () => {
  const { dark } = useContext(ContextData)
  const [isVisible, setIsVisible] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) setShowScrollTop(true)
      else setShowScrollTop(false)
    }

    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const footerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' }
    }
  }

  const scrollButtonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  }

  return (
    <>
      <motion.footer
        initial="hidden"
        animate={isVisible ? 'visible' : 'hidden'}
        variants={footerVariants}
        className={`text-sm py-1 border-t transition-all duration-300
          ${dark
            ? 'bg-gray-800 border-gray-700 text-gray-300'
            : 'bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200 text-gray-600'
          }
        `}
      >
        <p className="text-center text-[10px]">
          Coded by
          <b className="hover:underline">
            {' '}
            <a
              href="https://t.me/cc_ZYN"
              target="_blank"
              rel="noopener noreferrer"
            >
              ZYN
            </a>
          </b>
        </p>
      </motion.footer>

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={scrollButtonVariants}
            onClick={scrollToTop}
            className={`fixed hover:cursor-pointer bottom-6 right-6 z-50 text-white p-3 rounded-full shadow-2xl transition-all duration-300
              ${dark
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-gradient-to-r from-blue-500 to-indigo-500'
              }
            `}
            whileHover={{
              scale: 1.1,
              boxShadow: '0 10px 30px rgba(59, 130, 246, 0.5)'
            }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.div
              animate={{ y: [0, -2.5, 0] }}
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
