import axios from 'axios'

// 🔴 BEDDEL 1: API URL (waxaad ka keenaysaa .env)
const API_URL = import.meta.env.VITE_API_URL

// Create axios instance
const api = axios.create({
  baseURL: API_URL, // 🔴 BEDDEL 2: wuxuu isticmaalaa Render URL (env)
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor (NO CHANGE)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Token expired or unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }

    // 🔴 BEDDEL 3: Network error message (simplified)
    if (!error.response) {
      console.error('Network error:', error)

      alert('Network error: Unable to reach server.') // 🔴 BEDDEL 4

      return Promise.reject(new Error('Network error'))
    }

    // Other errors
    console.error('API error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export default api