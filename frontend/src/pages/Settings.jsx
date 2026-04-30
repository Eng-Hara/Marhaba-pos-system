import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  UserCircleIcon,
  BellIcon,
  MoonIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

const Settings = () => {
  const { user } = useAuth()

  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          icon: UserCircleIcon,
          label: 'Profile',
          description: 'Update your name, email, and password',
          href: '/profile',
          color: 'text-primary-600 bg-primary-100'
        }
      ]
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: BellIcon,
          label: 'Notifications',
          description: 'Manage notification preferences',
          onClick: () => {},
          color: 'text-warning-600 bg-warning-100',
          disabled: true
        },
        {
          icon: MoonIcon,
          label: 'Appearance',
          description: 'Theme and display options',
          onClick: () => {},
          color: 'text-gray-600 bg-gray-100',
          disabled: true
        }
      ]
    }
  ]

  return (
    <div className="page-container px-3 sm:px-4 md:px-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="page-title text-xl sm:text-2xl">Settings</h1>
        <p className="text-gray-600 text-sm sm:text-base">Manage your account and preferences</p>
      </div>

      <div className="space-y-8 max-w-2xl">
        {/* Current User Info */}
        <div className="card flex items-center gap-4">
          <div className="flex items-center justify-center w-16 h-16 bg-primary-100 rounded-xl flex-shrink-0">
            <UserCircleIcon className="h-10 w-10 text-primary-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 truncate">{user?.name}</h3>
            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 capitalize">
              {user?.role}
            </span>
          </div>
        </div>

        {/* Settings Sections */}
        {settingsSections.map((section) => (
          <div key={section.title}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {section.title}
            </h2>
            <div className="space-y-2">
              {section.items.map((item) => (
                <div key={item.label} className="card p-4">
                  {item.href ? (
                    <Link
                      to={item.href}
                      className="flex items-center gap-4 hover:bg-gray-50 -m-4 p-4 rounded-xl transition-colors"
                    >
                      <div className={`flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 ${item.color}`}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                      <ChevronRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    </Link>
                  ) : (
                    <div
                      className={`flex items-center gap-4 ${item.disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50 -m-4 p-4 rounded-xl transition-colors'}`}
                      onClick={item.disabled ? undefined : item.onClick}
                    >
                      <div className={`flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 ${item.color}`}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900">
                          {item.label}
                          {item.disabled && (
                            <span className="ml-2 text-xs font-normal text-gray-400">(Coming soon)</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                      <ChevronRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Settings
