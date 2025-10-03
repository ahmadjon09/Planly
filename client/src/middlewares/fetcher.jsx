import axios from 'axios'
import Cookies from 'js-cookie'

// const BASE_URL = `${window.location.protocol}//${window.location.host}/api`
const BASE_URL = `http://localhost:7777/api`

const token = Cookies.get('user_token')

const instance = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${token}`
  }
})

export default instance
