import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import {
  UserCircleIcon,
  EnvelopeIcon,
  KeyIcon,
  ShieldCheckIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline'

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth()
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  const { register: registerProfile, handleSubmit: handleProfileSubmit, reset: resetProfile, formState: { errors: profileErrors } } = useForm({
    defaultValues: { name: '', email: '' }
  })

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPassword, formState: { errors: passwordErrors } } = useForm()

  useEffect(() => {
    if (user) {
      resetProfile({ name: user.name || '', email: user.email || '' })
    }
  }, [user, resetProfile])

  const onProfileUpdate = async (data) => {
    await updateProfile(data)
  }

  const onPasswordChange = async (data) => {
    const result = await changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword
    })
    if (result?.success) {
      resetPassword()
      setShowPasswordForm(false)
    }
  }

  if (!user) return null

  return (
    <div className="page-container px-3 sm:px-4 md:px-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="page-title text-xl sm:text-2xl">Profile</h1>
        <p className="text-gray-600 text-sm sm:text-base">Manage your account information</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Profile Info Card */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-14 h-14 bg-primary-100 rounded-xl">
              <UserCircleIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
              <p className="text-sm text-gray-500">Update your name and email</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit(onProfileUpdate)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <UserCircleIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  {...registerProfile('name', { required: 'Name is required' })}
                  className={`input pl-10 ${profileErrors.name ? 'input-error' : ''}`}
                  placeholder="Your name"
                />
              </div>
              {profileErrors.name && <p className="mt-1 text-sm text-danger-600">{profileErrors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  {...registerProfile('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className={`input pl-10 ${profileErrors.email ? 'input-error' : ''}`}
                  placeholder="you@example.com"
                />
              </div>
              {profileErrors.email && <p className="mt-1 text-sm text-danger-600">{profileErrors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
                <span className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 capitalize">
                  {user.role}
                </span>
                <span className="text-xs text-gray-500">(cannot be changed)</span>
              </div>
            </div>

            <button type="submit" className="btn btn-primary inline-flex items-center">
              <PencilSquareIcon className="h-5 w-5 mr-2" />
              Save Changes
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-14 h-14 bg-warning-100 rounded-xl">
              <KeyIcon className="h-8 w-8 text-warning-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
              <p className="text-sm text-gray-500">Update your password for security</p>
            </div>
          </div>

          {showPasswordForm ? (
            <form onSubmit={handlePasswordSubmit(onPasswordChange)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  {...registerPassword('currentPassword', { required: 'Current password is required' })}
                  className={`input ${passwordErrors.currentPassword ? 'input-error' : ''}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-sm text-danger-600">{passwordErrors.currentPassword.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  {...registerPassword('newPassword', {
                    required: 'New password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                  })}
                  className={`input ${passwordErrors.newPassword ? 'input-error' : ''}`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-sm text-danger-600">{passwordErrors.newPassword.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  {...registerPassword('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (val, form) => val === form.newPassword || 'Passwords do not match'
                  })}
                  className={`input ${passwordErrors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-danger-600">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary">
                  Update Password
                </button>
                <button
                  type="button"
                  onClick={() => { setShowPasswordForm(false); resetPassword() }}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="btn btn-outline inline-flex items-center"
            >
              <KeyIcon className="h-5 w-5 mr-2" />
              Change Password
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
