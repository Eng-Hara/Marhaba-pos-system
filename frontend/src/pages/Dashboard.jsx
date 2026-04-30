import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { dashboardService } from '../services/dashboardService'
import { productService } from '../services/productService'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  CurrencyDollarIcon,
  
  ShoppingCartIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  CubeIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline'
import {
   TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon
  
} from '@heroicons/react/24/solid'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [dashboardStats, lowStockData] = await Promise.all([
        dashboardService.getDashboardStats(),
        productService.getLowStockProducts()
      ])
      
      setStats(dashboardStats.data)
      setLowStockProducts(lowStockData.data)
    } catch (error) {
      toast.error('Failed to load dashboard data')
      console.error('Dashboard error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const statCards = [
    {
      title: 'Today Sales',
      value: stats?.today?.totalSales ? formatCurrency(stats.today.totalSales) : '$0.00',
      icon: CurrencyDollarIcon,
      color: 'bg-success-500',
      trend: stats?.salesChange || 0,
      description: `${stats?.today?.transactionCount || 0} transactions`
    },
    {
      title: 'Today Profit',
      value: stats?.today?.totalProfit ? formatCurrency(stats.today.totalProfit) : '$0.00',
      icon: TrashIcon,
      color: 'bg-primary-500',
      trend: stats?.today?.totalProfit > 0 ? '+12%' : '-',
      description: 'Profit margin'
    },
    {
      title: 'Total Products',
      value: stats?.summary?.totalProducts || '0',
      icon: CubeIcon,
      color: 'bg-purple-500',
      description: `${stats?.summary?.outOfStock || 0} out of stock`
    },
    {
      title: 'Low Stock Items',
      value: lowStockProducts.length || '0',
      icon: ExclamationTriangleIcon,
      color: 'bg-warning-500',
      description: 'Requires attention'
    },
    {
      title: 'Active Users',
      value: stats?.summary?.totalUsers || '0',
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      description: `${user?.role === 'manager' ? 'Manager' : 'Cashier'} role`
    },
    {
      title: 'Avg Transaction',
      value: stats?.today?.averageTransaction ? formatCurrency(stats.today.averageTransaction) : '$0.00',
      icon: ShoppingCartIcon,
      color: 'bg-indigo-500',
      description: 'Average sale value'
    }
  ]

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  if (loading) {
    return (
      <div className="page-container px-3 sm:px-4 md:px-6">
        <div className="flex items-center justify-center min-h-[200px] sm:min-h-[256px]">
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container px-3 sm:px-4 md:px-6">
      <div className="mb-4 sm:mb-8">
        <h1 className="page-title text-xl sm:text-2xl">Dashboard</h1>
        <p className="text-gray-600 text-sm sm:text-base">Welcome back, {user?.name}! Here's what's happening with your store today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="card p-3 sm:p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2 sm:mb-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-0.5 sm:mb-1 truncate">{stat.title}</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5 sm:mt-1 truncate">{stat.description}</p>
              </div>
              <div className={`${stat.color} p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0`}>
                <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
            {stat.trend !== undefined && (
              <div className={`inline-flex items-center text-sm ${stat.trend >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                {stat.trend >= 0 ? (
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 mr-1" />
                )}
                {Math.abs(stat.trend)}%
                <span className="text-gray-500 ml-2">vs yesterday</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-4 sm:mb-8">
        {/* Weekly Sales Chart */}
        <div className="card p-4 sm:p-6 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Weekly Sales Trend</h3>
            <Link to="/reports" className="text-sm text-primary-600 hover:text-primary-500">
              View details →
            </Link>
          </div>
          <div className="h-64 sm:h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.weekly || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="day" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  formatter={(value) => [`$${value}`, 'Sales']}
                  labelStyle={{ color: '#374151', fontWeight: '600' }}
                  contentStyle={{ 
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="totalSales" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  name="Sales" 
                />
                <Line 
                  type="monotone" 
                  dataKey="totalProfit" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  name="Profit" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Method Distribution */}
        <div className="card p-4 sm:p-6 min-w-0 overflow-hidden">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Methods</h3>
          <div className="h-64 sm:h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.paymentDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {stats?.paymentDistribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [
                    `${value} transactions ($${props.payload.totalAmount})`,
                    name
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Transactions & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Recent Transactions */}
        <div className="card overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Transactions</h3>
              <Link to="/transactions" className="text-xs sm:text-sm text-primary-600 hover:text-primary-500 whitespace-nowrap">
                View all →
              </Link>
            </div>
          </div>
          {/* Mobile: Card layout */}
          <div className="md:hidden divide-y divide-gray-100">
            {(!stats?.recentTransactions || stats.recentTransactions.length === 0) ? (
              <div className="p-6 text-center text-gray-500 text-sm">No recent transactions</div>
            ) : (
              stats.recentTransactions.map((transaction) => (
                <Link key={transaction._id} to="/transactions" className="block p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 truncate">{transaction.invoiceNumber}</div>
                      <div className="text-xs text-gray-500 truncate">{transaction.cashierName}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-gray-900">{formatCurrency(transaction.totalAmount)}</span>
                      <span className={`badge text-xs ${
                        transaction.paymentMethod === 'cash' ? 'badge-success' :
                        transaction.paymentMethod === 'mobile_money' ? 'badge-primary' : 'badge-info'
                      }`}>
                        {transaction.paymentMethod.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
          {/* Desktop: Table layout */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cashier</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats?.recentTransactions?.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{transaction.invoiceNumber}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{formatCurrency(transaction.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${transaction.paymentMethod === 'cash' ? 'badge-success' : transaction.paymentMethod === 'mobile_money' ? 'badge-primary' : 'badge-info'}`}>
                        {transaction.paymentMethod.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{transaction.cashierName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Low Stock Alerts</h3>
              <Link to="/products" className="text-xs sm:text-sm text-primary-600 hover:text-primary-500 whitespace-nowrap">
                Manage →
              </Link>
            </div>
          </div>
          {/* Mobile: Card layout */}
          <div className="md:hidden divide-y divide-gray-100">
            {lowStockProducts.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">No low stock items</div>
            ) : (
              lowStockProducts.map((product) => (
                <Link key={product._id} to="/products" className="block p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <img
                      className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                      src={product.imageUrl}
                      alt={product.name}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 truncate">{product.name}</div>
                      <div className="text-xs text-gray-500 truncate">{product.sku}</div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="badge badge-info text-xs">{product.productType}</span>
                        <span className="text-xs text-gray-600">
                          {product.productType === 'piece' ? `${product.quantity} pcs` : `${product.lengthStock} yds`}
                        </span>
                        <span className={`badge text-xs ${
                          product.stockStatus === 'out-of-stock' ? 'badge-danger' :
                          product.stockStatus === 'low-stock' ? 'badge-warning' : 'badge-success'
                        }`}>
                          {product.stockStatus === 'out-of-stock' ? 'Out of Stock' : product.stockStatus === 'low-stock' ? 'Low Stock' : 'In Stock'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
          {/* Desktop: Table layout */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lowStockProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img className="h-10 w-10 rounded-lg object-cover flex-shrink-0" src={product.imageUrl} alt={product.name} />
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="badge badge-info">{product.productType}</span></td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {product.productType === 'piece' ? `${product.quantity} pieces` : `${product.lengthStock} yards`}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${product.stockStatus === 'out-of-stock' ? 'badge-danger' : product.stockStatus === 'low-stock' ? 'badge-warning' : 'badge-success'}`}>
                        {product.stockStatus === 'out-of-stock' ? 'Out of Stock' : product.stockStatus === 'low-stock' ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard