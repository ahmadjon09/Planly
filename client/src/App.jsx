import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { useContext, useEffect, useState, useRef } from 'react'
import { ContextData } from './contextData/Context'
import { Root } from './layout/Root'
import Err from './pages/Err'
import { Loading } from './components/Loading'
import { Ping } from './components/Ping'
import Fetch from './middlewares/fetcher'
import Cookies from 'js-cookie'
import { ProductsPage } from './pages/Product'
import { UserManagement } from './mod/UserManagement'
import { AuthModals } from './components/AuthModals'
import { Admins } from './pages/Admins'
import { Workers } from './pages/Workers'
import { StatsPage } from './pages/StatsPage'
import { ViewOrders } from './pages/Orders'

export default function App () {
  const { setUser, user, netErr } = useContext(ContextData)
  const [isLoading, setIsLoading] = useState(false)
  const token = Cookies.get('user_token')

  useEffect(() => {
    const getMyData = async () => {
      setIsLoading(true)

      try {
        const { data } = await Fetch.get('/users/me')
        if (data?.data) {
          setUser(data.data)
        } else {
          console.log('Unknown Token')
          Cookies.remove('user_token')
        }
      } catch (error) {
        console.log(error)

        if (error.response?.status === 404) {
          console.log('Token removed: 404 Not Found')
        } else {
          console.log(error || 'Unknown Error')
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      getMyData()
    }
  }, [token, setUser])

  if (netErr) return <Ping />
  if (!token) return <AuthModals />
  if (isLoading) return <Loading />
  const isAdmin = user.role === 'admin'
  const routes = [
    { index: true, element: <ProductsPage /> },
    { path: 'user/edit/:id', element: <UserManagement /> },
    isAdmin && { path: 'user/:admin', element: <UserManagement /> },
    isAdmin && { path: 'user', element: <UserManagement /> },
    isAdmin && { path: 'static', element: <StatsPage /> },
    isAdmin && { path: 'orders', element: <ViewOrders /> },
    { path: 'admin', element: <Admins /> },
    { path: 'workers', element: <Workers /> },
    { path: '*', element: <Err /> }
  ].filter(Boolean)

  const router = createBrowserRouter([
    {
      path: '/',
      element: <Root />,
      children: routes
    }
  ])

  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}
