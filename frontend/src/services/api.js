import axios from 'axios'

// ✔️ API URL (FROM .env - Render backend)
const API_URL = import.meta.env.VITE_API_URL

// ✔️ Create Axios instance
const api = axios.create({
  baseURL: API_URL, // backend URL (Render)
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ✔️ Request Interceptor (add token if exists)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// ✔️ Response Interceptor (handle errors globally)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Unauthorized (token expired)
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }

    // Network error (backend not reachable)
    if (!error.response) {
      console.error('Network error:', error)
      return Promise.reject(new Error('Unable to reach server'))
    }

    // Other API errors
    console.error('API error:', error.response?.data || error.message)

    return Promise.reject(error)
  }
)

export default api