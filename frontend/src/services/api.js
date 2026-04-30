import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add token
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

    // Network error
    if (!error.response) {
      console.error('⚠️ Network error. Could not reach backend:', error)
      alert('Network error: Backend is not reachable. Check if the server is running on port 5000.')
      return Promise.reject(new Error('Network error. Please check your backend connection.'))
    }

    // Other errors
    console.error('API error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export default api