import api from './api'

export const userService = {
  // Get all users (manager only)
  getUsers: async () => {
    const response = await api.get('/users')
    return response.data
  },

  // Get single user
  getUser: async (id) => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },

  // Update user
  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData)
    return response.data
  },

  // Delete user (soft delete)
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`)
    return response.data
  }
}
