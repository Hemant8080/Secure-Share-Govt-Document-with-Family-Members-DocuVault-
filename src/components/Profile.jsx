import { useEffect, useMemo, useState } from 'react'
import { auth, db } from '../firebase'
import { doc, getDoc, setDoc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore'
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'
import toast from 'react-hot-toast'
import Navigation from './Navigation'

const Profile = ({ navigateTo, user }) => {
  const [activeTab, setActiveTab] = useState('profile')
  const [profileData, setProfileData] = useState({
    fullName: user?.name || 'John Doe',
    email: user?.email || 'john.doe@example.com',
    phone: '+91 9876543210',
    aadhaarNumber: user?.aadhaarNumber || '123456789012',
    address: '123 Main Street, City, State 12345',
    dateOfBirth: '1990-01-01'
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const saveProfile = async () => {
    if (!user?.id) return
    setIsSaving(true)
    try {
      const userRef = doc(db, 'users', user.id)
      await setDoc(userRef, {
        name: profileData.fullName,
        email: profileData.email,
        phone: profileData.phone,
        aadhaarNumber: profileData.aadhaarNumber,
        address: profileData.address,
        dateOfBirth: profileData.dateOfBirth
      }, { merge: true })
      setIsEditing(false)
      toast.success('Profile updated successfully')
    } catch (err) {
      console.error(err)
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    
    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    
    setIsChangingPassword(true)
    try {
      if (!auth.currentUser || !auth.currentUser.email) throw new Error('No authenticated user')
      const credential = EmailAuthProvider.credential(auth.currentUser.email, passwordData.currentPassword)
      await reauthenticateWithCredential(auth.currentUser, credential)
      await updatePassword(auth.currentUser, passwordData.newPassword)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast.success('Password changed successfully')
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Failed to change password')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const [stats, setStats] = useState({ totalDocuments: 0, verifiedDocuments: 0, sharedDocuments: 0, storageUsed: '0 MB' })

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  useEffect(() => {
    if (!user?.id) return
    // Load profile
    const userRef = doc(db, 'users', user.id)
    getDoc(userRef).then((snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setProfileData(prev => ({
          ...prev,
          fullName: data.name || prev.fullName,
          email: data.email || prev.email,
          phone: data.phone || prev.phone,
          aadhaarNumber: data.aadhaarNumber || prev.aadhaarNumber,
          address: data.address || prev.address,
          dateOfBirth: data.dateOfBirth || prev.dateOfBirth
        }))
      }
    }).catch(() => {})

    // Subscribe to documents for stats
    const docsQ = query(collection(db, 'documents'), where('userId', '==', user.id))
    const unsubDocs = onSnapshot(docsQ, (snap) => {
      let total = 0
      let verified = 0
      let totalBytes = 0
      snap.forEach(d => {
        total += 1
        const data = d.data()
        if ((data.status || '') === 'verified') verified += 1
        totalBytes += Number(data.size || 0)
      })
      setStats(prev => ({ ...prev, totalDocuments: total, verifiedDocuments: verified, storageUsed: formatFileSize(totalBytes) }))
    })

    // Subscribe to shares for stats
    const sharesQ = query(collection(db, 'shares'), where('userId', '==', user.id))
    const unsubShares = onSnapshot(sharesQ, (snap) => {
      setStats(prev => ({ ...prev, sharedDocuments: snap.size }))
    })

    return () => { unsubDocs(); unsubShares() }
  }, [user?.id])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation user={user} navigateTo={navigateTo} />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center">
                <i className="fas fa-file-alt text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
                <p className="text-gray-600">Total Documents</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="bg-green-500 text-white w-12 h-12 rounded-full flex items-center justify-center">
                <i className="fas fa-check-circle text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.verifiedDocuments}</p>
                <p className="text-gray-600">Verified</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="bg-secondary text-white w-12 h-12 rounded-full flex items-center justify-center">
                <i className="fas fa-share-alt text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.sharedDocuments}</p>
                <p className="text-gray-600">Shared</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="bg-accent text-white w-12 h-12 rounded-full flex items-center justify-center">
                <i className="fas fa-hdd text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.storageUsed}</p>
                <p className="text-gray-600">Storage Used</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300"
                  >
                    <i className="fas fa-edit mr-2"></i>
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition duration-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveProfile}
                      disabled={isSaving}
                      className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-300 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <div className="flex items-center">
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Saving...
                        </div>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={profileData.fullName}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                      !isEditing ? 'bg-gray-50' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                      !isEditing ? 'bg-gray-50' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                      !isEditing ? 'bg-gray-50' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aadhaar Number
                  </label>
                  <input
                    type="text"
                    name="aadhaarNumber"
                    value={profileData.aadhaarNumber}
                    onChange={handleProfileChange}
                    disabled={true}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={profileData.dateOfBirth}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                      !isEditing ? 'bg-gray-50' : ''
                    }`}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={profileData.address}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    rows="3"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                      !isEditing ? 'bg-gray-50' : ''
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Change Password */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
              <form onSubmit={changePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300 disabled:opacity-50"
                >
                  {isChangingPassword ? (
                    <div className="flex items-center justify-center">
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Changing...
                    </div>
                  ) : (
                    'Change Password'
                  )}
                </button>
              </form>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigateTo('upload')}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition duration-300"
                >
                  <i className="fas fa-cloud-upload-alt text-primary mr-3"></i>
                  Upload Documents
                </button>
                <button
                  onClick={() => navigateTo('manage')}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition duration-300"
                >
                  <i className="fas fa-folder-open text-secondary mr-3"></i>
                  Manage Documents
                </button>
                <button
                  onClick={() => navigateTo('share')}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition duration-300"
                >
                  <i className="fas fa-share-alt text-accent mr-3"></i>
                  Share Documents
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
