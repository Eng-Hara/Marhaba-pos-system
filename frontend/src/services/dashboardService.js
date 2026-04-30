import api from './api'

export const dashboardService = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await api.get('/dashboard/stats')
    return response.data
  },

  // Get sales report
  getSalesReport: async (params = {}) => {
    const response = await api.get('/dashboard/reports', { params })
    return response.data
  }
}