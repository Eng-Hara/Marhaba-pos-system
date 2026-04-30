import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import { productService } from '../services/productService'
import toast from 'react-hot-toast'
import {
  PlusIcon,
  PencilIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  PhotoIcon,
  CubeIcon
} from '@heroicons/react/24/outline'
import {
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/solid'

const Products = () => {
  const { isManager } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm()
  const productType = watch('productType')

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'men', label: 'Men' },
    { value: 'women', label: 'Women' },
    { value: 'unisex', label: 'Unisex' },
    { value: 'kids', label: 'Kids' }
  ]

  const productTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'piece', label: 'Piece Products' },
    { value: 'fabric', label: 'Fabric Products' }
  ]

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'sellingPrice', label: 'Price' },
    { value: 'quantity', label: 'Stock' },
    { value: 'createdAt', label: 'Date Added' }
  ]

  useEffect(() => {
    fetchProducts()
  }, [currentPage, searchTerm, selectedCategory, selectedType, sortBy, sortOrder])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        limit: 12,
        sort: `${sortOrder === 'desc' ? '-' : ''}${sortBy}`,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(selectedType !== 'all' && { productType: selectedType })
      }

      const response = await productService.getProducts(params)
      setProducts(response.data)
      setTotalPages(response.pagination?.pages || 1)
    } catch (error) {
      toast.error('Failed to load products')
      console.error('Products error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  // ---------- Add Product ----------
  const handleAddProduct = async (data) => {
    try {
      // `productService` handles conversion into FormData.
      await productService.createProduct(data)
      toast.success('Product added successfully!')
      setShowAddModal(false)
      reset()
      setImagePreview(null)
      fetchProducts()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add product')
    }
  }

  // ---------- Edit Product ----------
  const handleEditProduct = async (data) => {
    try {
      // `productService` handles conversion into FormData.
      await productService.updateProduct(selectedProduct._id, data)
      toast.success('Product updated successfully!')
      setShowEditModal(false)
      setSelectedProduct(null)
      fetchProducts()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update product')
    }
  }

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    try {
      await productService.deleteProduct(id)
      toast.success('Product deleted successfully!')
      fetchProducts()
    } catch (error) {
      toast.error('Failed to delete product')
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      reset({ ...watch(), image: file })
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const openEditModal = (product) => {
    setSelectedProduct(product)
    const formValues = {
      name: product.name,
      category: product.category,
      productType: product.productType,
      size: product.size || '',
      color: product.color,
      quantity: product.quantity ?? '',
      lengthStock: product.lengthStock ?? '',
      buyingPrice: product.buyingPrice,
      sellingPrice: product.sellingPrice,
      description: product.description || '',
      lowStockThreshold: product.lowStockThreshold ?? 10
    }
    reset(formValues)
    setImagePreview(product.imageUrl)
    setShowEditModal(true)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getStockStatus = (product) => {
    if (product.productType === 'piece') {
      if (product.quantity === 0) return { label: 'Out of Stock', color: 'danger' }
      if (product.quantity <= product.lowStockThreshold) return { label: 'Low Stock', color: 'warning' }
      return { label: 'In Stock', color: 'success' }
    } else {
      if (product.lengthStock === 0) return { label: 'Out of Stock', color: 'danger' }
      if (product.lengthStock <= product.lowStockThreshold) return { label: 'Low Stock', color: 'warning' }
      return { label: 'In Stock', color: 'success' }
    }
  }

  // ---------- JSX ----------

  return (
    <div className="page-container px-3 sm:px-4 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Products</h1>
          <p className="text-sm text-gray-500">Manage inventory items, upload images, and track stock.</p>
        </div>
        {isManager && (
          <button
            onClick={() => {
              setShowAddModal(true)
              setSelectedProduct(null)
              reset({})
              setImagePreview(null)
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
          >
            <PlusIcon className="h-4 w-4" />
            Add Product
          </button>
        )}
      </div>

      <div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto]">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, SKU, description..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
          />
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
            Search
          </button>
          <button
            type="button"
            onClick={() => { setSearchTerm(''); setCurrentPage(1) }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Clear
          </button>
        </form>

        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1) }}
            className="rounded-lg border border-gray-300 px-3 py-2"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <select
            value={selectedType}
            onChange={(e) => { setSelectedType(e.target.value); setCurrentPage(1) }}
            className="rounded-lg border border-gray-300 px-3 py-2"
          >
            {productTypes.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="rounded-lg border border-gray-300 px-3 py-2"
          >
            Sort: {sortBy} ({sortOrder})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-600">Loading products…</div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center text-gray-600">No products found. Use Add Product to create one.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
            const status = getStockStatus(product)
            return (
              <div key={product._id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="relative h-40 w-full overflow-hidden rounded-md bg-gray-100">
                  <img
                    src={product.imageUrl || 'https://via.placeholder.com/300'}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="mt-3 space-y-1">
                  <h2 className="text-lg font-semibold">{product.name}</h2>
                  <p className="text-sm text-gray-500">SKU: {product.sku || '—'}</p>
                  <p className="text-sm text-gray-500">Category: {product.category || '—'}</p>
                  <p className="text-sm text-gray-500">Price: {formatCurrency(product.sellingPrice)}</p>
                  <p className="text-sm text-gray-500">Stock: {product.productType === 'piece' ? product.quantity : product.lengthStock}</p>
                  <p className={`text-sm font-medium ${status.color === 'danger' ? 'text-red-600' : status.color === 'warning' ? 'text-yellow-600' : 'text-green-600'}`}>
                    {status.label}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {isManager && (
                    <>
                      <button
                        type="button"
                        onClick={() => openEditModal(product)}
                        className="inline-flex items-center gap-1 rounded-md border border-indigo-500 px-2 py-1 text-xs font-medium text-indigo-600"
                      >
                        <PencilIcon className="h-4 w-4" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product._id)}
                        className="inline-flex items-center gap-1 rounded-md border border-red-500 px-2 py-1 text-xs font-medium text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" /> Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-5 flex items-center justify-center gap-2">
        <button
          onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="rounded-lg border border-gray-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <span className="text-sm">Page {currentPage} / {totalPages}</span>
        <button
          onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="rounded-lg border border-gray-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Add New Product</h3>
                <p className="mt-0.5 text-sm text-gray-500">Fill in the details, then save to add it to inventory.</p>
              </div>
              <button
                type="button"
                onClick={() => { setShowAddModal(false); reset(); setImagePreview(null) }}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit(handleAddProduct)} className="max-h-[75vh] overflow-y-auto px-6 py-5">
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Product name</label>
                  <input
                    {...register('name', { required: 'Product name is required' })}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    placeholder="e.g. Men's Cotton T-Shirt"
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Category</label>
                    <select
                      {...register('category', { required: 'Category is required' })}
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    >
                      {categories.filter(c => c.value !== 'all').map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Product type</label>
                    <select
                      {...register('productType', { required: 'Product type is required' })}
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    >
                      {productTypes.filter(t => t.value !== 'all').map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    {errors.productType && <p className="mt-1 text-xs text-red-600">{errors.productType.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Color</label>
                    <input
                      {...register('color', { required: 'Color is required' })}
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      placeholder="e.g. Black"
                    />
                    {errors.color && <p className="mt-1 text-xs text-red-600">{errors.color.message}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Size</label>
                    <input
                      {...register('size', { required: productType === 'piece' ? 'Size is required for piece products' : false })}
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      placeholder={productType === 'piece' ? 'e.g. M, L, XL (required)' : 'Optional'}
                    />
                    {errors.size && <p className="mt-1 text-xs text-red-600">{errors.size.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">SKU (optional)</label>
                    <input
                      {...register('sku')}
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      placeholder="Leave blank to auto-generate"
                    />
                    <p className="mt-1 text-xs text-gray-500">Must be unique if you enter one.</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Low stock threshold</label>
                    <input
                      type="number"
                      {...register('lowStockThreshold', { valueAsNumber: true })}
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      placeholder="Default 10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Buying price</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('buyingPrice', { valueAsNumber: true, required: 'Buying price is required' })}
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      placeholder="0.00"
                    />
                    {errors.buyingPrice && <p className="mt-1 text-xs text-red-600">{errors.buyingPrice.message}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Selling price</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('sellingPrice', { valueAsNumber: true, required: 'Selling price is required' })}
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      placeholder="0.00"
                    />
                    {errors.sellingPrice && <p className="mt-1 text-xs text-red-600">{errors.sellingPrice.message}</p>}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">Stock</p>
                    <span className="text-xs text-gray-500">
                      {productType === 'fabric' ? 'Fabric uses length stock' : 'Piece uses quantity'}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {productType !== 'fabric' && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Quantity</label>
                        <input
                          type="number"
                          {...register('quantity', { valueAsNumber: true })}
                          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                          placeholder="0"
                        />
                      </div>
                    )}
                    {productType !== 'piece' && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Length stock</label>
                        <input
                          type="number"
                          {...register('lengthStock', { valueAsNumber: true })}
                          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                          placeholder="0"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Image (optional)</label>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="mt-1 w-full text-sm" />
                    <p className="mt-1 text-xs text-gray-500">PNG/JPG/WebP up to 5MB.</p>
                  </div>
                  <div className="sm:justify-self-end sm:w-full">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="h-28 w-full rounded-xl object-cover ring-1 ring-gray-200" />
                    ) : (
                      <div className="flex h-28 w-full items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white text-sm text-gray-500">
                        No image selected
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Description (optional)</label>
                  <textarea
                    {...register('description')}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    placeholder="Notes about material, fit, etc."
                    rows={3}
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); reset(); setImagePreview(null) }}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-200"
                >
                  Save product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Edit Product</h3>
                <p className="mt-0.5 text-sm text-gray-500">Update fields and save your changes.</p>
              </div>
              <button
                type="button"
                onClick={() => { setShowEditModal(false); setSelectedProduct(null); reset(); setImagePreview(null) }}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit(handleEditProduct)} className="max-h-[75vh] overflow-y-auto px-6 py-5">
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Product name</label>
                  <input
                    defaultValue={selectedProduct.name}
                    {...register('name', { required: 'Product name is required' })}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Category</label>
                    <select
                      defaultValue={selectedProduct.category}
                      {...register('category', { required: 'Category is required' })}
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    >
                      {categories.filter(c => c.value !== 'all').map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Product type</label>
                    <select
                      defaultValue={selectedProduct.productType}
                      {...register('productType', { required: 'Product type is required' })}
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    >
                      {productTypes.filter(t => t.value !== 'all').map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    {errors.productType && <p className="mt-1 text-xs text-red-600">{errors.productType.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Color</label>
                    <input
                      defaultValue={selectedProduct.color}
                      {...register('color', { required: 'Color is required' })}
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                    {errors.color && <p className="mt-1 text-xs text-red-600">{errors.color.message}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Size</label>
                    <input
                      defaultValue={selectedProduct.size || ''}
                      {...register('size', { required: productType === 'piece' ? 'Size is required for piece products' : false })}
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                    {errors.size && <p className="mt-1 text-xs text-red-600">{errors.size.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">SKU</label>
                    <input
                      defaultValue={selectedProduct.sku}
                      {...register('sku')}
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                    <p className="mt-1 text-xs text-gray-500">Must be unique.</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Low stock threshold</label>
                    <input
                      type="number"
                      defaultValue={selectedProduct.lowStockThreshold ?? 10}
                      {...register('lowStockThreshold', { valueAsNumber: true })}
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Buying price</label>
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={selectedProduct.buyingPrice}
                      {...register('buyingPrice', { valueAsNumber: true, required: 'Buying price is required' })}
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                    {errors.buyingPrice && <p className="mt-1 text-xs text-red-600">{errors.buyingPrice.message}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Selling price</label>
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={selectedProduct.sellingPrice}
                      {...register('sellingPrice', { valueAsNumber: true, required: 'Selling price is required' })}
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                    {errors.sellingPrice && <p className="mt-1 text-xs text-red-600">{errors.sellingPrice.message}</p>}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">Stock</p>
                    <span className="text-xs text-gray-500">
                      {productType === 'fabric' ? 'Fabric uses length stock' : 'Piece uses quantity'}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {productType !== 'fabric' && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Quantity</label>
                        <input
                          type="number"
                          defaultValue={selectedProduct.quantity}
                          {...register('quantity', { valueAsNumber: true })}
                          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                    )}
                    {productType !== 'piece' && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Length stock</label>
                        <input
                          type="number"
                          defaultValue={selectedProduct.lengthStock}
                          {...register('lengthStock', { valueAsNumber: true })}
                          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Image (optional)</label>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="mt-1 w-full text-sm" />
                    <p className="mt-1 text-xs text-gray-500">Upload a new image to replace the current one.</p>
                  </div>
                  <div className="sm:justify-self-end sm:w-full">
                    {(imagePreview || selectedProduct.imageUrl) ? (
                      <img src={imagePreview || selectedProduct.imageUrl} alt="Preview" className="h-28 w-full rounded-xl object-cover ring-1 ring-gray-200" />
                    ) : (
                      <div className="flex h-28 w-full items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white text-sm text-gray-500">
                        No image
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Description (optional)</label>
                  <textarea
                    defaultValue={selectedProduct.description}
                    {...register('description')}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    rows={3}
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setSelectedProduct(null); reset(); setImagePreview(null) }}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  Update product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Products