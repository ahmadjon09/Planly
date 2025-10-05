import { Outlet } from 'react-router-dom'
import { Nav } from '../components/Nav'
import { Ping } from '../components/Ping'
import { AboutModal } from '../mod/Info'

export const Root = () => {
  return (
    <>
      <Nav />
      <br />
      <br />
      <main className='mt-[50px] text-gray-700 container'>
        <Outlet />
        <Ping />
        <AboutModal />
      </main>
    </>
  )
}
