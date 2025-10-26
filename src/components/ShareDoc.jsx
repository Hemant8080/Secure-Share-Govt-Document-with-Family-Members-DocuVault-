import { useEffect, useMemo, useState } from 'react'
import { db, storage, auth } from '../firebase'
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc as fsDoc,
  orderBy
} from 'firebase/firestore'
import { ref as storageRef, getDownloadURL } from 'firebase/storage'
import toast from 'react-hot-toast'
import Navigation from './Navigation'

const ShareDoc = ({ navigateTo, user }) => {
  const [documents, setDocuments] = useState([])

  const [selectedDoc, setSelectedDoc] = useState(null)
  const [shareForm, setShareForm] = useState({
    recipientEmail: '',
    recipientName: '',
    message: '',
    expiryDate: '',
    allowDownload: true,
    allowView: true
  })
  const [isSharing, setIsSharing] = useState(false)
  const [sharedLinks, setSharedLinks] = useState([])

  const documentTypes = {
    marksheet: { name: 'Mark Sheet', icon: 'fas fa-graduation-cap', color: 'text-primary' },
    pancard: { name: 'PAN Card', icon: 'fas fa-id-card', color: 'text-secondary' },
    passport: { name: 'Passport', icon: 'fas fa-passport', color: 'text-accent' },
    certificate: { name: 'Certificate', icon: 'fas fa-certificate', color: 'text-green-500' },
    medical: { name: 'Medical Record', icon: 'fas fa-file-medical', color: 'text-red-500' },
    other: { name: 'Other', icon: 'fas fa-file-invoice', color: 'text-purple-500' }
  }

  const handleShare = async (e) => {
    e.preventDefault()
    if (!selectedDoc) return

    setIsSharing(true)
    try {
      // Ensure user is still authenticated before creating a share
      if (!auth?.currentUser) {
        console.error('User not authenticated when attempting to share')
        toast.error('You must be signed in to share documents')
        setIsSharing(false)
        return
      }
      const token = crypto.randomUUID()
      // Ensure we have a public download URL on the share so recipients don't need Storage auth
      let shareDownloadURL = selectedDoc.downloadURL || null
      if (!shareDownloadURL && selectedDoc.storagePath) {
        try {
          shareDownloadURL = await getDownloadURL(storageRef(storage, selectedDoc.storagePath))
        } catch (err) {
          console.warn('Could not resolve downloadURL for shared document', err)
          // proceed without URL; ShareView will attempt to fetch if allowed
        }
      }
      const newShare = {
        userId: user.id,
        documentId: selectedDoc.id,
        documentName: selectedDoc.name,
        storagePath: selectedDoc.storagePath || null,
        downloadURL: shareDownloadURL || null,
        recipientEmail: shareForm.recipientEmail,
        recipientName: shareForm.recipientName,
        message: shareForm.message,
        expiryDate: shareForm.expiryDate,
        allowDownload: shareForm.allowDownload,
        allowView: shareForm.allowView,
        status: 'active',
        accessCount: 0,
        token,
        createdAt: serverTimestamp()
      }
      const docRef = await addDoc(collection(db, 'shares'), newShare)
      // Optimistic local update so it appears immediately
      setSharedLinks(prev => [
        { id: docRef.id, ...newShare, createdAt: { toDate: () => new Date() } },
        ...prev
      ])

      // Send email notification (best effort)
      try {
        const link = `${window.location.origin}/share/${token}`
        await fetch((import.meta.env.VITE_EMAIL_API_URL || 'http://localhost:4000') + '/email/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: shareForm.recipientEmail,
            subject: `Document shared: ${selectedDoc.name}`,
            text: `A document has been shared with you. Open: ${link}`,
            html: `<p>A document has been shared with you.</p><p><a href="${link}">Open document</a></p>`
          })
        })
      } catch (_) {}

      setShareForm({
        recipientEmail: '',
        recipientName: '',
        message: '',
        expiryDate: '',
        allowDownload: true,
        allowView: true
      })
      setSelectedDoc(null)
      toast.success('Document shared successfully')
    } catch (err) {
      console.error(err)
      toast.error('Failed to share document')
    } finally {
      setIsSharing(false)
    }
  }

  const revokeAccess = async (shareId) => {
    if (!window.confirm('Are you sure you want to revoke access to this document?')) return
    try {
      await updateDoc(fsDoc(db, 'shares', shareId), { status: 'revoked' })
      toast.success('Access revoked')
    } catch (err) {
      console.error(err)
      toast.error('Failed to revoke access')
    }
  }

  const copyLink = async (token) => {
    const link = `${window.location.origin}/share/${token}`
    try {
      await navigator.clipboard.writeText(link)
      toast.success('Link copied to clipboard')
    } catch (_) {
      toast.error('Failed to copy link')
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  useEffect(() => {
    if (!user?.id) return
    // Load user's documents
    const docsQ = query(collection(db, 'documents'), where('userId', '==', user.id))
    const unsubDocs = onSnapshot(docsQ, (snap) => {
      const list = snap.docs.map(d => {
        const data = d.data()
        const ts = data.uploadDate
        const readableDate = ts && ts.toDate ? ts.toDate().toISOString().split('T')[0] : ''
        const readableSize = formatFileSize(data.size || 0)
        return {
          id: d.id,
          name: data.name,
          type: data.type || 'other',
          size: readableSize,
          uploadDate: readableDate,
          storagePath: data.storagePath,
          downloadURL: data.downloadURL
        }
        , (err) => {
          console.error('Documents snapshot error', err)
          toast.error('Failed to load your documents: ' + (err?.message || err))
        }
      })
      setDocuments(list)
    })

    // Load user's existing shares
    const sharesQ = query(
      collection(db, 'shares'),
      where('userId', '==', user.id)
    )
    const unsubShares = onSnapshot(sharesQ, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setSharedLinks(list)
    }, (err) => {
      console.error('Shares snapshot error', err)
      toast.error('Failed to load shared links: ' + (err?.message || err))
    })

    return () => { unsubDocs(); unsubShares() }
  }, [user?.id])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation user={user} navigateTo={navigateTo} />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Share Documents</h1>
          <p className="text-gray-600">Securely share your documents with authorized parties</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Share New Document */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Share New Document</h2>
            
            {/* Document Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Document to Share
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`w-full p-3 rounded-lg border-2 text-left transition duration-300 ${
                      selectedDoc?.id === doc.id
                        ? 'border-primary bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <i className={`${documentTypes[doc.type]?.icon} text-xl ${documentTypes[doc.type]?.color} mr-3`}></i>
                      <div>
                        <p className="font-medium text-gray-900">{doc.name}</p>
                        <p className="text-sm text-gray-500">{doc.size} • {doc.uploadDate}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Share Form */}
            {selectedDoc && (
              <form onSubmit={handleShare} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    value={shareForm.recipientEmail}
                    onChange={(e) => setShareForm(prev => ({ ...prev, recipientEmail: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Enter recipient's email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    value={shareForm.recipientName}
                    onChange={(e) => setShareForm(prev => ({ ...prev, recipientName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Enter recipient's name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message (Optional)
                  </label>
                  <textarea
                    value={shareForm.message}
                    onChange={(e) => setShareForm(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    rows="3"
                    placeholder="Add a personal message..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={shareForm.expiryDate}
                    onChange={(e) => setShareForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="allowView"
                      checked={shareForm.allowView}
                      onChange={(e) => setShareForm(prev => ({ ...prev, allowView: e.target.checked }))}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="allowView" className="ml-2 text-sm text-gray-700">
                      Allow viewing
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="allowDownload"
                      checked={shareForm.allowDownload}
                      onChange={(e) => setShareForm(prev => ({ ...prev, allowDownload: e.target.checked }))}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="allowDownload" className="ml-2 text-sm text-gray-700">
                      Allow downloading
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSharing}
                  className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSharing ? (
                    <div className="flex items-center justify-center">
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Sharing...
                    </div>
                  ) : (
                    'Share Document'
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Shared Links */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Shared Links</h2>
            
            {sharedLinks.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-share-alt text-4xl text-gray-400 mb-4"></i>
                <p className="text-gray-500">No documents shared yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sharedLinks.map((link) => (
                  <div key={link.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{link.documentName}</h3>
                        <p className="text-sm text-gray-500">Shared with: {link.recipientEmail}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        link.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {link.status}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-500 mb-3">
                      <p>Shared: {link.createdAt?.toDate ? link.createdAt.toDate().toISOString().split('T')[0] : ''}</p>
                      <p>Expires: {link.expiryDate || '-'}</p>
                      <p>Access count: {link.accessCount}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyLink(link.token)}
                        className="text-primary hover:text-blue-700 text-sm"
                      >
                        <i className="fas fa-copy mr-1"></i>
                        Copy Link
                      </button>
                      {link.status === 'active' && (
                        <button
                          onClick={() => revokeAccess(link.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          <i className="fas fa-ban mr-1"></i>
                          Revoke Access
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => navigateTo('upload')}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition duration-300 text-left"
          >
            <i className="fas fa-cloud-upload-alt text-3xl text-primary mb-3"></i>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Documents</h3>
            <p className="text-gray-600">Add new documents to your vault</p>
          </button>
          
          <button
            onClick={() => navigateTo('manage')}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition duration-300 text-left"
          >
            <i className="fas fa-folder-open text-3xl text-secondary mb-3"></i>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Documents</h3>
            <p className="text-gray-600">View and manage your uploaded documents</p>
          </button>
          
          <button
            onClick={() => navigateTo('profile')}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition duration-300 text-left"
          >
            <i className="fas fa-user text-3xl text-accent mb-3"></i>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">My Profile</h3>
            <p className="text-gray-600">Update your profile information and settings</p>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ShareDoc
