import { Link } from 'react-router-dom'
import { ChartBarIcon, DocumentChartBarIcon } from '@heroicons/react/24/outline'

const Analytics = () => {
  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="page-title">Analytics</h1>
        <p className="text-gray-600">Management analytics and insights</p>
      </div>
      <div className="card flex flex-col items-center justify-center py-16 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-2xl mb-6">
          <DocumentChartBarIcon className="w-10 h-10 text-primary-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Analytics Dashboard</h2>
        <p className="text-gray-600 mb-6 max-w-md">
          View detailed sales reports, trends, and analytics in the Reports section.
        </p>
        <Link
          to="/reports"
          className="btn btn-primary inline-flex items-center"
        >
          <ChartBarIcon className="h-5 w-5 mr-2" />
          Open Sales Reports
        </Link>
      </div>
    </div>
  )
}

export default Analytics
