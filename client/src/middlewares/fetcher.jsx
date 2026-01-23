import axios from 'axios'
import Cookies from 'js-cookie'

const origin = window.location.origin;
// const BASE_URL = `https://planly-beta.onrender.com/api`
const BASE_URL = `http://localhost:7777/api`
// const BASE_URL = `${origin}/api`

localStorage.setItem('base_api', BASE_URL)

const token = Cookies.get('user_token')
const instance = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${token}`
  }
})




export default instance;
