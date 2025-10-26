import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { db, storage, auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs, updateDoc, doc as fsDoc, increment } from 'firebase/firestore'
import { ref, getDownloadURL } from 'firebase/storage'
import toast from 'react-hot-toast'

const ShareView = () => {
  const { token } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [share, setShare] = useState(null)
  const [isSignedIn, setIsSignedIn] = useState(false)

  useEffect(() => {
    // Monitor auth state so we can tell whether the deployed app is actually signed in
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      const signed = !!user
      setIsSignedIn(signed)
      console.debug('ShareView auth state changed, signed in:', signed, 'user:', user?.email || null)
    })

    const loadShare = async () => {
      try {
        // Query for the share by token and require status==active in the query
        // so Firestore can validate security rules that depend on the 'status' field.
        const q = query(
          collection(db, 'shares'),
          where('token', '==', token),
          where('status', '==', 'active')
        )
        const snap = await getDocs(q)
        if (snap.empty) {
          // No matching share found (or permission denied). Provide helpful debug info.
          setError('Invalid or expired link')
          console.debug('Share query returned empty for token:', token)
          return
        }
        const docSnap = snap.docs[0]
        const data = { id: docSnap.id, ...docSnap.data() }

        // Expiry check
        if (data.expiryDate) {
          const today = new Date().toISOString().split('T')[0]
          if (today > data.expiryDate) {
            setError('This link has expired')
            return
          }
        }
        if (data.status !== 'active') {
          setError('Access to this file has been revoked')
          return
        }

        setShare(data)
        // Increment access count (best effort)
        try {
          await updateDoc(fsDoc(db, 'shares', data.id), { accessCount: increment(1) })
        } catch (_) {}
      } catch (err) {
        console.error('Failed to load share', err)
        // Surface more detailed error info to help debug permission/rule problems
        const msg = err && err.code ? `${err.code}: ${err.message}` : String(err)
        setError(`Failed to load shared file — ${msg}`)
      } finally {
        setLoading(false)
      }
    }
    loadShare()
    return () => {
      try { unsubAuth() } catch (_) {}
    }
  }, [token])

  const handleDownload = async () => {
    if (!share) return
    try {
      const url = share.downloadURL || (share.storagePath ? await getDownloadURL(ref(storage, share.storagePath)) : null)
      if (!url) throw new Error('File URL not available')
      const a = document.createElement('a')
      a.href = url
      a.download = share.documentName || 'download'
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (err) {
      console.error(err)
      toast.error('Failed to download')
    }
  }

  const handleView = async () => {
    if (!share) return
    try {
      const url = share.downloadURL || (share.storagePath ? await getDownloadURL(ref(storage, share.storagePath)) : null)
      if (!url) throw new Error('File URL not available')
      window.open(url, '_blank', 'noopener')
    } catch (err) {
      console.error(err)
      toast.error('Failed to open file')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <i className="fas fa-file-alt text-2xl text-primary"></i>
              <span className="ml-2 text-xl font-bold text-gray-900">DocuVault</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm text-primary hover:text-blue-700">Sign in</Link>
              {/* Debug: show signed-in state on deployed site */}
              <span className={`text-xs px-2 py-1 rounded ${isSignedIn ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {isSignedIn ? 'Signed in' : 'Not signed in'}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-10 px-4">
        {loading ? (
          <div className="text-gray-600">Loading link...</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">{error}</div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">{share.documentName}</h1>
            <p className="text-gray-600 mb-6">Shared by: {share.recipientName ? 'Private link' : 'User'}</p>
            <div className="flex gap-3">
              {share.allowView && (
                <button onClick={handleView} className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded">View</button>
              )}
              {share.allowDownload && (
                <button onClick={handleDownload} className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded">Download</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ShareView


