import { Outlet } from 'react-router-dom'
import { Nav } from '../components/Nav'
import { Ping } from '../components/Ping'
import { AboutModal } from '../mod/Info'
import { Footer } from '../components/Footer'

export const Root = () => {
  return (
    <>
      <Nav />
      <br />
      <br />
      <main className='pt-[10px] text-gray-700 container'>
        <Outlet />
        <Ping />
        <AboutModal />
      </main>
      <Footer />
    </>
  )
}
