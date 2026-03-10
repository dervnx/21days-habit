import CryptoJS from 'crypto-js'
import axios from 'axios'

// 使用Vite环境变量，默认为/api（通过nginx代理）
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// 密码加密函数
export function encryptPassword(password) {
  return CryptoJS.SHA256(password).toString()
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Token ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 获取系统配置
export function getSystemConfig() {
  return axios.get(`${API_BASE_URL}/config/`)
}

// 获取文章详情
export function getArticle(slug) {
  return axios.get(`${API_BASE_URL}/page/${slug}/`)
}

export default api
