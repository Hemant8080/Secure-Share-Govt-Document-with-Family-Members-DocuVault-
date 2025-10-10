import { useEffect, useState } from 'react'
import { db, storage } from '../firebase'
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { ref, getDownloadURL, deleteObject, listAll, getMetadata } from 'firebase/storage'
import toast from 'react-hot-toast'
import Navigation from './Navigation'

const ManageDocs = ({ navigateTo, user }) => {
  const [documents, setDocuments] = useState([])

  const [selectedDocs, setSelectedDocs] = useState([])
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const documentTypes = {
    marksheet: { name: 'Mark Sheet', icon: 'fas fa-graduation-cap', color: 'text-primary' },
    pancard: { name: 'PAN Card', icon: 'fas fa-id-card', color: 'text-secondary' },
    passport: { name: 'Passport', icon: 'fas fa-passport', color: 'text-accent' },
    certificate: { name: 'Certificate', icon: 'fas fa-certificate', color: 'text-green-500' },
    medical: { name: 'Medical Record', icon: 'fas fa-file-medical', color: 'text-red-500' },
    other: { name: 'Other', icon: 'fas fa-file-invoice', color: 'text-purple-500' }
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesFilter = filter === 'all' || doc.type === filter
    const matchesSearch = (doc.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const handleSelectDoc = (docId) => {
    setSelectedDocs(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    )
  }

  const handleSelectAll = () => {
    if (selectedDocs.length === filteredDocuments.length) {
      setSelectedDocs([])
    } else {
      setSelectedDocs(filteredDocuments.map(doc => doc.id))
    }
  }

  const deleteSelected = async () => {
    if (selectedDocs.length === 0) return
    
    if (window.confirm(`Are you sure you want to delete ${selectedDocs.length} document(s)?`)) {
      const toDelete = documents.filter(d => selectedDocs.includes(d.id))

      const results = await Promise.allSettled(toDelete.map(async (d) => {
        // Try deleting from Storage if we have a path
        if (d.storagePath) {
          try { await deleteObject(ref(storage, d.storagePath)) } catch (e) { /* ignore not-found */ }
        }
        // Try deleting Firestore doc; deleting a non-existent doc is a no-op
        try { await deleteDoc(doc(db, 'documents', d.id)) } catch (e) { /* ignore */ }
        return d.id
      }))

      const fulfilled = results.filter(r => r.status === 'fulfilled').length
      const rejected = results.length - fulfilled

      // Update local state to remove successfully deleted docs
      const deletedIds = toDelete.map(d => d.id)
      setDocuments(prev => prev.filter(d => !deletedIds.includes(d.id)))
      setSelectedDocs([])

      if (rejected === 0) {
        toast.success(`${fulfilled} document(s) deleted`)
      } else if (fulfilled > 0) {
        toast.error(`Deleted ${fulfilled}, failed ${rejected}. Some items could not be removed.`)
      } else {
        toast.error('Failed to delete selected documents.')
      }
    }
  }

  const deleteOne = async (documentItem) => {
    try {
      if (documentItem.storagePath) {
        try { await deleteObject(ref(storage, documentItem.storagePath)) } catch (_) {}
      }
      try { await deleteDoc(doc(db, 'documents', documentItem.id)) } catch (_) {}
      setDocuments(prev => prev.filter(d => d.id !== documentItem.id))
      toast.success('Document deleted')
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete document')
    }
  }

  const downloadDoc = async (documentItem) => {
    try {
      const url = documentItem.downloadURL || await getDownloadURL(ref(storage, documentItem.storagePath))

      // Try to force a download using a blob to maximize browser compatibility
      try {
        const response = await fetch(url)
        if (!response.ok) throw new Error('Failed to fetch file')
        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = objectUrl
        anchor.download = documentItem.name || 'download'
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
        URL.revokeObjectURL(objectUrl)
      } catch (_) {
        // Fallback: open in new tab if direct download fails (e.g., CORS/policy)
        window.open(url, '_blank', 'noopener')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to download file.')
    }
  }

  const shareDoc = (doc) => {
    navigateTo('share')
  }

  useEffect(() => {
    if (!user?.id) return
    const q = query(collection(db, 'documents'), where('userId', '==', user.id))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => {
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
          status: data.status || 'uploaded',
          storagePath: data.storagePath,
          downloadURL: data.downloadURL
        }
      })
      setDocuments(docs)
      if (docs.length === 0) {
        // Fallback: read from Storage if Firestore is empty
        fetchFromStorage()
      }
    })
    return () => unsubscribe()
  }, [user?.id])

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const listAllRecursive = async (pathRef, acc = []) => {
    const res = await listAll(pathRef)
    acc.push(...res.items)
    for (const prefix of res.prefixes) {
      await listAllRecursive(prefix, acc)
    }
    return acc
  }

  const fetchFromStorage = async () => {
    try {
      const rootRef = ref(storage, `users/${user.id}`)
      const items = await listAllRecursive(rootRef)
      const mapped = await Promise.all(items.map(async (itemRef) => {
        const meta = await getMetadata(itemRef)
        const parts = itemRef.fullPath.split('/')
        const inferredType = parts.length >= 3 ? parts[parts.length - 2] : 'other'
        return {
          id: itemRef.fullPath,
          name: meta.name,
          type: inferredType,
          size: formatFileSize(Number(meta.size) || 0),
          uploadDate: (meta.updated || '').split('T')[0] || '',
          status: 'uploaded',
          storagePath: itemRef.fullPath,
        }
      }))
      setDocuments(mapped)
    } catch (err) {
      console.error('Failed to fetch from Storage', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation user={user} navigateTo={navigateTo} />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Documents</h1>
          <p className="text-gray-600">View, update, and manage your uploaded documents</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="all">All Types</option>
                <option value="marksheet">Mark Sheets</option>
                <option value="pancard">PAN Cards</option>
                <option value="passport">Passports</option>
                <option value="certificate">Certificates</option>
                <option value="medical">Medical Records</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        {selectedDocs.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-blue-800 font-medium">
                {selectedDocs.length} document(s) selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={deleteSelected}
                  className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-300"
                >
                  <i className="fas fa-trash mr-2"></i>
                  Delete Selected
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Documents List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedDocs.length === filteredDocuments.length && filteredDocuments.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded mr-3"
              />
              <span className="font-medium text-gray-900">
                {filteredDocuments.length} document(s) found
              </span>
            </div>
          </div>

          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-folder-open text-4xl text-gray-400 mb-4"></i>
              <p className="text-gray-500 text-lg">No documents found</p>
              <p className="text-gray-400">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedDocs.includes(doc.id)}
                        onChange={() => handleSelectDoc(doc.id)}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded mr-4"
                      />
                      <div className="flex items-center">
                        <i className={`${documentTypes[doc.type]?.icon} text-2xl ${documentTypes[doc.type]?.color} mr-4`}></i>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{doc.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{documentTypes[doc.type]?.name}</span>
                            <span>{doc.size}</span>
                            <span>Uploaded: {doc.uploadDate}</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              doc.status === 'verified' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {doc.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => downloadDoc(doc)}
                        className="text-gray-400 hover:text-primary p-2"
                        title="Download"
                      >
                        <i className="fas fa-download"></i>
                      </button>
                      <button
                        onClick={() => shareDoc(doc)}
                        className="text-gray-400 hover:text-secondary p-2"
                        title="Share"
                      >
                        <i className="fas fa-share-alt"></i>
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete ${doc.name}?`)) {
                            deleteOne(doc)
                          }
                        }}
                        className="text-gray-400 hover:text-red-500 p-2"
                        title="Delete"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => navigateTo('upload')}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition duration-300 text-left"
          >
            <i className="fas fa-cloud-upload-alt text-3xl text-primary mb-3"></i>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload New Document</h3>
            <p className="text-gray-600">Add more documents to your vault</p>
          </button>
          
          <button
            onClick={() => navigateTo('share')}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition duration-300 text-left"
          >
            <i className="fas fa-share-alt text-3xl text-secondary mb-3"></i>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Share Documents</h3>
            <p className="text-gray-600">Securely share your documents with others</p>
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

export default ManageDocs
