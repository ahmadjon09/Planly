import { createContext, useState } from 'react'
import Cookies from 'js-cookie'
export const ContextData = createContext()

export const ContextProvider = ({ children }) => {
  const [user, setUser] = useState({})
  const [openX, setOpenX] = useState(false)
  const person =
    user?.firstName +
    ' ' +
    `${user.lastName?.slice(0, 1)}.` +
    ' ' +
    `${user.noble?.slice(0, 1)}.`

  const [netErr, setNetErr] = useState(false)
  const [deviceId, setDeviceId] = useState(null)
  const [autoPrint, setAutoPrint] = useState(false)
  const setUserToken = token => {
    Cookies.set('user_token', token)
  }

  const removeUserToken = () => {
    Cookies.remove('user_token')
  }

  return (
    <ContextData.Provider
      value={{
        autoPrint,
        setAutoPrint,
        setUserToken,
        removeUserToken,
        setUser,
        user,
        netErr,
        setNetErr,
        setDeviceId,
        deviceId,
        person,
        openX,
        setOpenX
      }}
    >
      {children}
    </ContextData.Provider>
  )
}
