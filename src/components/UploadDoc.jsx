import { useState, useRef } from 'react'
import { storage, db } from '../firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import toast from 'react-hot-toast'
import Navigation from './Navigation'

const UploadDoc = ({ navigateTo, user }) => {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  const documentTypes = [
    { id: 'marksheet', name: 'Mark Sheet', icon: 'fas fa-graduation-cap', color: 'text-primary' },
    { id: 'pancard', name: 'PAN Card', icon: 'fas fa-id-card', color: 'text-secondary' },
    { id: 'passport', name: 'Passport', icon: 'fas fa-passport', color: 'text-accent' },
    { id: 'certificate', name: 'Certificate', icon: 'fas fa-certificate', color: 'text-green-500' },
    { id: 'medical', name: 'Medical Record', icon: 'fas fa-file-medical', color: 'text-red-500' },
    { id: 'other', name: 'Other', icon: 'fas fa-file-invoice', color: 'text-purple-500' }
  ]

  const [selectedDocType, setSelectedDocType] = useState('')

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFiles = (files) => {
    const fileArray = Array.from(files)
    const newFiles = fileArray.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      docType: selectedDocType,
      uploadDate: new Date().toISOString()
    }))
    
    setUploadedFiles(prev => [...prev, ...newFiles])
  }

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
  }

  const uploadFiles = async () => {
    if (!user?.id) {
      alert('Please sign in to upload files.')
      return
    }
    if (uploadedFiles.length === 0) return

    setIsUploading(true)
    try {
      const tasks = uploadedFiles.map(async (item) => {
        try {
          const path = `users/${user.id}/${item.docType || 'other'}/${item.name}`
          const storageRef = ref(storage, path)
          await uploadBytes(storageRef, item.file)
          const url = await getDownloadURL(storageRef)

          await addDoc(collection(db, 'documents'), {
            userId: user.id,
            name: item.name,
            type: item.docType || 'other',
            size: item.size,
            contentType: item.type,
            storagePath: path,
            downloadURL: url,
            uploadDate: serverTimestamp()
          })
          return { ok: true }
        } catch (err) {
          console.error('Upload failed for', item.name, err)
          return { ok: false, error: err }
        }
      })

      const timeout = new Promise((resolve) => setTimeout(resolve, 20000))
      await Promise.race([Promise.allSettled(tasks), timeout])
      setUploadedFiles([])
      toast.success('Files uploaded successfully!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to upload files. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation user={user} navigateTo={navigateTo} />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Documents</h1>
          <p className="text-gray-600">Securely upload your important documents</p>
        </div>

        {/* Document Type Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Document Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {documentTypes.map((docType) => (
              <button
                key={docType.id}
                onClick={() => setSelectedDocType(docType.id)}
                className={`p-4 rounded-lg border-2 transition duration-300 ${
                  selectedDocType === docType.id
                    ? 'border-primary bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <i className={`${docType.icon} text-2xl ${docType.color} mb-2`}></i>
                <p className="text-sm font-medium text-gray-900">{docType.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Files</h2>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition duration-300 ${
              dragActive
                ? 'border-primary bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drag and drop your files here
            </p>
            <p className="text-gray-600 mb-4">or</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-primary text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-300"
            >
              Browse Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileInput}
              className="hidden"
            />
            <p className="text-sm text-gray-500 mt-4">
              Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB per file)
            </p>
          </div>
        </div>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Files to Upload</h2>
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <i className="fas fa-file text-2xl text-gray-400 mr-3"></i>
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={uploadFiles}
                disabled={isUploading}
                className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <div className="flex items-center">
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Uploading...
                  </div>
                ) : (
                  'Upload Files'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => navigateTo('manage')}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition duration-300 text-left"
          >
            <i className="fas fa-folder-open text-3xl text-primary mb-3"></i>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Documents</h3>
            <p className="text-gray-600">View, update, or delete your uploaded documents</p>
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

export default UploadDoc
