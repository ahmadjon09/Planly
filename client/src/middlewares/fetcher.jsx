import axios from 'axios'
import Cookies from 'js-cookie'

// const BASE_URL = `http://coludxuz.duckdns.org:7787/api`
const BASE_URL = `http://localhost:7777/api`
// const BASE_URL = `https://planly.onrender.com/api`

const token = Cookies.get('user_token')
const instance = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${token}`
  }
})

export default instance
