import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './global.css'
import { ContextProvider } from './contextData/Context.jsx'
// app.js yoki index.js da
import { SWRConfig } from 'swr'

// SWR global config
const swrConfig = {
  fetcher: (resource, init) => fetch(resource, init).then(res => res.json()),
  revalidateOnFocus: false, // Focus qilganda yangilamaslik
  revalidateOnReconnect: false, // Reconnect qilganda yangilamaslik
  revalidateIfStale: true, // Ma'lumot eskirgan bo'lsa yangilash
  dedupingInterval: 2000, // 2 soniya davomida bir xil so'rovlarni birlashtirish
  focusThrottleInterval: 5000, // Focus qilganda 5 soniya kutish
  loadingTimeout: 3000, // Loading timeout
  errorRetryInterval: 5000, // Error bo'lsa 5 soniyadan keyin qayta urinish
  errorRetryCount: 3, // Maksimal 3 marta qayta urinish
  compare: (a, b) => JSON.stringify(a) === JSON.stringify(b) // Cache solishtirish
}

// App component ichida
createRoot(document.getElementById('root')).render(
  <ContextProvider>
    <SWRConfig value={swrConfig}>
      <App />
    </SWRConfig>
  </ContextProvider>
)
