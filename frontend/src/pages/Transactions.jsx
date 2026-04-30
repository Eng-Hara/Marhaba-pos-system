import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { saleService } from '../services/saleService'
import toast from 'react-hot-toast'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

const Transactions = () => {
  const { isManager } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPayment, setSelectedPayment] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchTransactions()
  }, [currentPage, selectedStatus, selectedPayment, startDate, endDate])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        limit: 20,
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(selectedPayment !== 'all' && { paymentMethod: selectedPayment }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      }

      const response = await saleService.getTransactions(params)
      setTransactions(response.data)
      setTotalPages(response.pagination?.pages || 1)
    } catch (error) {
      toast.error('Failed to load transactions')
      console.error('Transactions error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
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
      toast.success('Invoice downloaded')
    } catch (error) {
      toast.error('Failed to download invoice')
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm')
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { label: 'Completed', color: 'success' },
      refunded: { label: 'Refunded', color: 'danger' },
      cancelled: { label: 'Cancelled', color: 'warning' }
    }
    const config = statusConfig[status] || { label: status, color: 'info' }
    return <span className={`badge badge-${config.color}`}>{config.label}</span>
  }

  const getPaymentIcon = (method) => {
    switch (method) {
      case 'cash':
        return <CurrencyDollarIcon className="h-5 w-5 text-success-600" />
      case 'mobile_money':
        return <DevicePhoneMobileIcon className="h-5 w-5 text-primary-600" />
      case 'card':
        return <CreditCardIcon className="h-5 w-5 text-blue-600" />
      default:
        return <CurrencyDollarIcon className="h-5 w-5 text-gray-600" />
    }
  }

  const filteredTransactions = transactions.filter(transaction =>
    transaction.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.cashierName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Transactions</h1>
            <p className="text-gray-600">View and manage all sales transactions</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by invoice number or cashier name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="submit"
                className="btn btn-primary"
              >
                Search
              </button>
            </div>
          </form>

          {/* Advanced Filters */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="refunded">Refunded</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                value={selectedPayment}
                onChange={(e) => setSelectedPayment(e.target.value)}
                className="input"
              >
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="card">Card</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner"></div>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
            <CreditCardIcon className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Invoice #</th>
                <th className="table-header-cell">Date & Time</th>
                <th className="table-header-cell">Cashier</th>
                <th className="table-header-cell">Items</th>
                <th className="table-header-cell">Total Amount</th>
                <th className="table-header-cell">Payment</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction._id} className="table-row">
                  <td className="table-cell font-mono font-medium">
                    {transaction.invoiceNumber}
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">{formatDate(transaction.createdAt)}</div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">{transaction.cashierName}</div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">
                      {transaction.items?.length || 0} items
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="font-bold text-gray-900">
                      {formatCurrency(transaction.totalAmount)}
                    </div>
                    <div className="text-xs text-success-600">
                      Profit: {formatCurrency(transaction.totalProfit)}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      {getPaymentIcon(transaction.paymentMethod)}
                      <span className="ml-2 text-sm capitalize">
                        {transaction.paymentMethod.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="table-cell">
                    {getStatusBadge(transaction.status)}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDownloadInvoice(transaction._id)}
                        className="p-1 text-gray-600 hover:text-primary-600"
                        title="Download Invoice"
                      >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                      </button>
                      <button
                        className="p-1 text-gray-600 hover:text-gray-900"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Transactions