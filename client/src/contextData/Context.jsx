import { createContext, useState } from 'react'
import Cookies from 'js-cookie'
export const ContextData = createContext()

export const ContextProvider = ({ children }) => {
  const [user, setUser] = useState({})
  const [openX, setOpenX] = useState(false)
  const [netErr, setNetErr] = useState(false)
  const setUserToken = token => {
    Cookies.set('user_token', token)
  }

  const removeUserToken = () => {
    Cookies.remove('user_token')
  }
  return (
    <ContextData.Provider
      value={{
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
