import axios from 'axios'

// ✔️ API URL (from .env)
const API_URL = import.meta.env.VITE_API_URL

// ✔️ Axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ✔️ Add token automatically
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

// ✔️ Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }

    // Network error
    if (!error.response) {
      console.error('Network error:', error.message)
      return Promise.reject(new Error('Server not reachable'))
    }

    // Other errors
    console.error('API error:', error.response?.data || error.message)

    return Promise.reject(error)
  }
)

export default api