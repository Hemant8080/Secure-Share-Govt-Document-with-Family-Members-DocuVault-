import { useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

const Navigation = ({ user, navigateTo, showAuthButtons = false }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigateTo('home')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const closeMenu = () => setIsMenuOpen(false)

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className="fas fa-file-alt text-2xl text-primary"></i>
              <span className="ml-2 text-xl font-bold text-gray-900">DocuVault</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              // Authenticated user navigation
              <>
                <span className="text-gray-700 text-sm">
                  Welcome, <span className="font-medium">{user.name}</span>
                </span>
                <button 
                  onClick={() => { navigateTo('upload'); closeMenu(); }}
                  className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition duration-200"
                >
                  Upload
                </button>
                <button 
                  onClick={() => { navigateTo('manage'); closeMenu(); }}
                  className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition duration-200"
                >
                  Manage
                </button>
                <button 
                  onClick={() => { navigateTo('share'); closeMenu(); }}
                  className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition duration-200"
                >
                  Share
                </button>
                <button 
                  onClick={() => { navigateTo('profile'); closeMenu(); }}
                  className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition duration-200"
                >
                  Profile
                </button>
                <button 
                  onClick={handleLogout}
                  className="bg-primary text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition duration-200"
                >
                  Logout
                </button>
              </>
            ) : showAuthButtons ? (
              // Guest user navigation (for home page)
              <>
                <button 
                  onClick={() => { navigateTo('login'); closeMenu(); }}
                  className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition duration-200"
                >
                  Login
                </button>
                <button 
                  onClick={() => { navigateTo('register'); closeMenu(); }}
                  className="bg-primary text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition duration-200"
                >
                  Register
                </button>
              </>
            ) : null}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-primary focus:outline-none focus:text-primary transition duration-200"
              aria-label="Toggle menu"
            >
              <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {user ? (
              // Authenticated user mobile menu
              <>
                <div className="px-3 py-2 text-sm text-gray-500 border-b border-gray-200 mb-2">
                  Welcome, <span className="font-medium text-gray-900">{user.name}</span>
                </div>
                <button 
                  onClick={() => { navigateTo('upload'); closeMenu(); }}
                  className="block w-full text-left px-3 py-2 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md transition duration-200"
                >
                  <i className="fas fa-cloud-upload-alt mr-2"></i>
                  Upload Documents
                </button>
                <button 
                  onClick={() => { navigateTo('manage'); closeMenu(); }}
                  className="block w-full text-left px-3 py-2 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md transition duration-200"
                >
                  <i className="fas fa-folder-open mr-2"></i>
                  Manage Documents
                </button>
                <button 
                  onClick={() => { navigateTo('share'); closeMenu(); }}
                  className="block w-full text-left px-3 py-2 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md transition duration-200"
                >
                  <i className="fas fa-share-alt mr-2"></i>
                  Share Documents
                </button>
                <button 
                  onClick={() => { navigateTo('profile'); closeMenu(); }}
                  className="block w-full text-left px-3 py-2 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md transition duration-200"
                >
                  <i className="fas fa-user mr-2"></i>
                  Profile
                </button>
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition duration-200"
                >
                  <i className="fas fa-sign-out-alt mr-2"></i>
                  Logout
                </button>
              </>
            ) : showAuthButtons ? (
              // Guest user mobile menu
              <>
                <button 
                  onClick={() => { navigateTo('login'); closeMenu(); }}
                  className="block w-full text-left px-3 py-2 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md transition duration-200"
                >
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  Login
                </button>
                <button 
                  onClick={() => { navigateTo('register'); closeMenu(); }}
                  className="block w-full text-left px-3 py-2 text-primary hover:text-blue-700 hover:bg-blue-50 rounded-md transition duration-200"
                >
                  <i className="fas fa-user-plus mr-2"></i>
                  Register
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navigation
