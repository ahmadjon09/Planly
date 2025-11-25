import { createContext, useEffect, useState } from 'react'
import Cookies from 'js-cookie'
export const ContextData = createContext()

export const ContextProvider = ({ children }) => {
  const [user, setUser] = useState({})
  const [openX, setOpenX] = useState(false)
  const [netErr, setNetErr] = useState(false)
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('dark') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('dark', dark)
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const setUserToken = token => {
    Cookies.set('user_token', token)
  }

  const removeUserToken = () => {
    Cookies.remove('user_token')
  }
  return (
    <ContextData.Provider
      value={{
        dark,
        setDark,
        setUserToken,
        removeUserToken,
        setUser,
        user,
        netErr,
        setNetErr,
        openX,
        setOpenX
      }}
    >
      {children}
    </ContextData.Provider>
  )
}
