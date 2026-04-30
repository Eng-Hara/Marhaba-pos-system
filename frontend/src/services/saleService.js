import api from './api'

export const saleService = {
  // Create new sale
  createSale: async (saleData) => {
    const response = await api.post('/sales', saleData)
    return response.data
  },

  // Get all transactions
  getTransactions: async (params = {}) => {
    const response = await api.get('/sales', { params })
    return response.data
  },

  // Get single transaction
  getTransaction: async (id) => {
    const response = await api.get(`/sales/${id}`)
    return response.data
  },

  // Get invoice PDF
  getInvoice: async (id) => {
    const response = await api.get(`/sales/${id}/invoice`, {
      responseType: 'blob'
    })
    return response.data
  },

  // Refund transaction
  refundTransaction: async (id, notes) => {
    const response = await api.post(`/sales/${id}/refund`, { notes })
    return response.data
  }
}