import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import { productService } from '../services/productService'
import { saleService } from '../services/saleService'
import toast from 'react-hot-toast'
import {
  ShoppingCartIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline'

const POS = () => {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredProducts, setFilteredProducts] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, reset } = useForm()

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredProducts(filtered.slice(0, 12))
  }, [searchTerm, products])

  const fetchProducts = async () => {
    try {
      const response = await productService.getProducts({ limit: 200, sort: 'name' })
      setProducts(response.data || [])
    } catch (error) {
      toast.error('Failed to load products')
    }
  }

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product._id === product._id)
    
    if (existingItem) {
      toast.error('Product already in cart')
      return
    }

    const newItem = {
      product,
      quantity: product.productType === 'piece' ? 1 : undefined,
      yards: product.productType === 'fabric' ? 0.1 : undefined,
      total: 0
    }
    
    // Calculate initial total
    updateItemTotal(newItem)
    setCart([...cart, newItem])
    toast.success('Product added to cart')
  }

  const updateItemTotal = (item) => {
    if (item.product.productType === 'piece') {
      item.total = item.quantity * item.product.sellingPrice
    } else {
      item.total = item.yards * item.product.sellingPrice
    }
  }

  const updateCartItem = (index, field, value) => {
    const updatedCart = [...cart]
    const item = updatedCart[index]
    
    if (field === 'quantity') {
      item.quantity = Math.max(1, parseInt(value) || 1)
    } else if (field === 'yards') {
      item.yards = Math.max(0.1, parseFloat(value) || 0.1)
    }
    
    updateItemTotal(item)
    setCart(updatedCart)
  }

  const removeFromCart = (index) => {
    const updatedCart = cart.filter((_, i) => i !== index)
    setCart(updatedCart)
    toast.success('Item removed from cart')
  }

  const clearCart = () => {
    if (cart.length === 0) return
    if (window.confirm('Clear all items from cart?')) {
      setCart([])
      toast.success('Cart cleared')
    }
  }

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
    const tax = subtotal * 0.1 // 10% tax
    const total = subtotal + tax
    return { subtotal, tax, total }
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }

    if (paymentMethod === 'mobile_money' && !mobileMoneyNumber) {
      toast.error('Please enter mobile money number')
      return
    }

    setLoading(true)

    try {
      const items = cart.map(item => ({
        productId: item.product._id,
        quantity: item.product.productType === 'piece' ? item.quantity : undefined,
        yards: item.product.productType === 'fabric' ? item.yards : undefined
      }))

      const paymentDetails = paymentMethod === 'mobile_money' 
        ? { phone: mobileMoneyNumber, provider: 'M-Pesa' }
        : {}

      const response = await saleService.createSale({
        items,
        paymentMethod,
        paymentDetails
      })
      const transaction = response?.data || response
      const transactionId = transaction?._id

      if (transactionId) {
        try {
          await handleDownloadInvoice(transactionId)
        } catch (invErr) {
          console.warn('Invoice download failed:', invErr)
          toast.success('Sale completed. Invoice download failed.')
        }
      }
      
      // Reset cart and form
      setCart([])
      setMobileMoneyNumber('')
      toast.success('Sale completed successfully!')
      
      // Print receipt (simulated)

    } catch (error) {
      toast.error(error.response?.data?.message || 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadInvoice = async (transactionId) => {
    try {
      const blob = await saleService.getInvoice(transactionId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${transactionId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to download invoice:', error)
    }
  }

  const { subtotal, tax, total } = calculateTotals()

  return (
    <div className="page-container px-3 sm:px-4 md:px-6">
      <div className="mb-4 sm:mb-8">
        <h1 className="page-title text-xl sm:text-2xl">Point of Sale</h1>
        <p className="text-gray-600 text-sm sm:text-base">Process sales quickly and efficiently</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Left Column - Product Selection */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-2 lg:order-1">
          {/* Search Bar */}
          <div className="card p-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="input pl-10"
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Product Grid */}
          <div className="card p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Products</h3>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No products found. Try a different search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product._id}
                    className="border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => addToCart(product)}
                  >
                    <div className="h-32 mb-2">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                    <h4 className="font-medium text-sm truncate">{product.name}</h4>
                    <p className="text-xs text-gray-500">{product.sku}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-bold text-primary-600">
                        ${product.sellingPrice}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        product.productType === 'piece' 
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {product.productType}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Stock: {product.productType === 'piece' 
                        ? `${product.quantity} pcs`
                        : `${product.lengthStock} yds`
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Cart & Checkout */}
        <div className="space-y-4 sm:space-y-6 order-1 lg:order-2 lg:sticky lg:top-24 lg:self-start">
          {/* Cart */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <ShoppingCartIcon className="h-6 w-6 text-primary-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Shopping Cart</h3>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-sm text-danger-600 hover:text-danger-700"
                >
                  Clear All
                </button>
              )}
            </div>
            
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
                  <ShoppingCartIcon className="h-full w-full" />
                </div>
                <p className="text-gray-500">Your cart is empty</p>
                <p className="text-sm text-gray-400 mt-1">Add products from the left</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {cart.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                        <p className="text-sm text-gray-600">${item.product.sellingPrice}/unit</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(index)}
                        className="text-gray-400 hover:text-danger-500"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                    
                    {item.product.productType === 'piece' ? (
                      <div className="flex items-center justify-between">
                        <label className="text-sm text-gray-600">Quantity</label>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateCartItem(index, 'quantity', item.quantity - 1)}
                            className="p-1 rounded-full hover:bg-gray-100"
                          >
                            <MinusIcon className="h-4 w-4" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateCartItem(index, 'quantity', e.target.value)}
                            className="w-16 text-center border rounded py-1"
                          />
                          <button
                            onClick={() => updateCartItem(index, 'quantity', item.quantity + 1)}
                            className="p-1 rounded-full hover:bg-gray-100"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Yards</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={item.yards}
                          onChange={(e) => updateCartItem(index, 'yards', e.target.value)}
                          className="w-full px-3 py-1 border rounded"
                        />
                      </div>
                    )}
                    
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Item Total</span>
                        <span className="font-bold text-gray-900">
                          ${item.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Totals */}
            {cart.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (10%)</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total</span>
                    <span className="text-primary-600">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment & Checkout */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'cash', label: 'Cash', icon: '💵' },
                    { id: 'mobile_money', label: 'Mobile Money', icon: '📱' },
                    { id: 'card', label: 'Card', icon: '💳' }
                  ].map(({ id, label, icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPaymentMethod(id)}
                      className={`py-3 px-3 rounded-lg border text-center text-sm sm:text-base transition-colors ${
                        paymentMethod === id
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="block sm:inline">{icon}</span> {label}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'mobile_money' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={mobileMoneyNumber}
                    onChange={(e) => setMobileMoneyNumber(e.target.value)}
                    className="input"
                    placeholder="Enter phone number"
                  />
                </div>
              )}

              <div className="pt-4">
                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || loading}
                  className="w-full btn btn-primary py-3 text-lg font-semibold"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <QrCodeIcon className="h-5 w-5 mr-2" />
                      Complete Sale (${total.toFixed(2)})
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default POS