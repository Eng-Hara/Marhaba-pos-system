import { NavLink } from 'react-router-dom'
import { 
  HomeIcon, 
  ShoppingCartIcon, 
  CubeIcon, 
  CreditCardIcon,
  ChartBarIcon,
  UsersIcon,
  DocumentChartBarIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'

const Sidebar = ({ isOpen = false, onClose }) => {
  const { isManager } = useAuth()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'POS Sales', href: '/pos', icon: ShoppingCartIcon },
    { name: 'Products', href: '/products', icon: CubeIcon },
    { name: 'Transactions', href: '/transactions', icon: CreditCardIcon },
    { name: 'Reports', href: '/reports', icon: ChartBarIcon },
  ]

  const managerNavigation = [
    { name: 'Users', href: '/users', icon: UsersIcon },
    { name: 'Analytics', href: '/analytics', icon: DocumentChartBarIcon },
  ]

  const accountNavigation = [
    { name: 'Profile', href: '/profile', icon: UserCircleIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ]

  const NavLinkItem = ({ item }) => (
    <NavLink
      to={item.href}
      onClick={onClose}
      className={({ isActive }) =>
        `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
          isActive
            ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      <item.icon className="h-5 w-5 flex-shrink-0" />
      <span className="font-medium">{item.name}</span>
    </NavLink>
  )

  const navContent = (
    <>
      <div className="mb-8">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Main Navigation</h3>
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.name}><NavLinkItem item={item} /></li>
          ))}
        </ul>
      </div>
      {isManager && (
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Management</h3>
          <ul className="space-y-1">
            {managerNavigation.map((item) => (
              <li key={item.name}><NavLinkItem item={item} /></li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Account</h3>
        <ul className="space-y-1">
          {accountNavigation.map((item) => (
            <li key={item.name}><NavLinkItem item={item} /></li>
          ))}
        </ul>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`md:hidden fixed inset-0 bg-black/50 z-30 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Mobile drawer */}
      <aside className={`md:hidden fixed top-0 left-0 z-40 h-full w-72 max-w-[85vw] bg-white shadow-xl transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <span className="font-semibold text-gray-900">Menu</span>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100" aria-label="Close menu">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <nav className="p-4 overflow-y-auto h-[calc(100%-57px)]">{navContent}</nav>
      </aside>
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 flex-shrink-0 bg-white border-r border-gray-200 min-h-[calc(100vh-65px)] sticky top-[65px] self-start">
      <nav className="p-4">{navContent}</nav>
    </aside>
    </>
  )
}

export default Sidebar