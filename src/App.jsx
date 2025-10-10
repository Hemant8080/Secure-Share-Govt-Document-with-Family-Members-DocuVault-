import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import Home from './components/Home'
import Register from './components/Register'
import Login from './components/Login'
import UploadDoc from './components/UploadDoc'
import ManageDocs from './components/ManageDocs'
import ShareDoc from './components/ShareDoc'
import ShareView from './components/ShareView'
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import Profile from './components/Profile'
import ForgotPassword from './components/ForgotPassword'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const navigate = useNavigate()
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email,
          aadhaarNumber: ''
        })
      } else {
        setUser(null)
      }
      setAuthReady(true)
    })
    return () => unsubscribe()
  }, [])

  const navigateTo = (page) => {
    setCurrentPage(page)
    const pathMap = {
      home: '/',
      register: '/register',
      login: '/login',
      forgot: '/forgot',
      upload: '/upload',
      manage: '/manage',
      share: '/share',
      profile: '/profile'
    }
    navigate(pathMap[page] || '/')
  }

  const ProtectedRoute = ({ children }) => {
    if (!authReady) return null
    if (!user) return <Navigate to="/login" replace />
    return children
  }

  if (!authReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Home navigateTo={navigateTo} />} />
        <Route path="/register" element={<Register navigateTo={navigateTo} />} />
        <Route path="/login" element={<Login navigateTo={navigateTo} setUser={setUser} />} />
        <Route path="/forgot" element={<ForgotPassword navigateTo={navigateTo} />} />
        <Route path="/upload" element={<ProtectedRoute><UploadDoc navigateTo={navigateTo} user={user} /></ProtectedRoute>} />
        <Route path="/manage" element={<ProtectedRoute><ManageDocs navigateTo={navigateTo} user={user} /></ProtectedRoute>} />
        <Route path="/share" element={<ProtectedRoute><ShareDoc navigateTo={navigateTo} user={user} /></ProtectedRoute>} />
        <Route path="/share/:token" element={<ShareView />} />
        <Route path="/profile" element={<ProtectedRoute><Profile navigateTo={navigateTo} user={user} /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
