import api from './api'

export const productService = {
  // Get all products
  getProducts: async (params = {}) => {
    const response = await api.get('/products', { params })
    return response.data
  },

  // Get single product
  getProduct: async (id) => {
    const response = await api.get(`/products/${id}`)
    return response.data
  },

  // Create product
  createProduct: async (productData) => {
    const formData = new FormData()
    const skipKeys = ['_id', '__v']

    Object.keys(productData).forEach(key => {
      if (skipKeys.includes(key)) return
      if (productData[key] === undefined || productData[key] === null) return
      if (key === 'image' && productData[key] instanceof File) {
        formData.append('image', productData[key])
      } else {
        formData.append(key, productData[key])
      }
    })

    const response = await api.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  // Update product
  updateProduct: async (id, productData) => {
    const formData = new FormData()
    const skipKeys = ['_id', '__v']

    Object.keys(productData).forEach(key => {
      if (skipKeys.includes(key)) return
      if (productData[key] === undefined || productData[key] === null) return
      if (key === 'image' && productData[key] instanceof File) {
        formData.append('image', productData[key])
      } else {
        formData.append(key, productData[key])
      }
    })

    const response = await api.put(`/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  // Delete product
  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`)
    return response.data
  },

  // Update stock
  updateStock: async (id, stockData) => {
    const response = await api.patch(`/products/${id}/stock`, stockData)
    return response.data
  },

  // Get low stock products
  getLowStockProducts: async () => {
    const response = await api.get('/products/low-stock')
    return response.data
  },

  // Search products
  searchProducts: async (searchTerm) => {
    const response = await api.get('/products', {
      params: { search: searchTerm, limit: 20 }
    })
    return response.data
  }
}