import { useState } from 'react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../firebase'
import toast from 'react-hot-toast'

const ForgotPassword = ({ navigateTo }) => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) { setError('Email is required'); return }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Email is invalid'); return }
    setIsLoading(true)
    try {
      await sendPasswordResetEmail(auth, email)
      toast.success('Reset link sent. Check your email.')
      navigateTo('login')
    } catch (err) {
      let message = 'Failed to send reset email.'
      if (err?.code === 'auth/user-not-found') message = 'No account found for this email.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <i className="fas fa-lock text-4xl text-primary"></i>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Forgot your password?</h2>
        <p className="mt-2 text-center text-sm text-gray-600">We'll email you a reset link.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${error ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="Enter your email"
              />
              {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center"><i className="fas fa-spinner fa-spin mr-2"></i>Sending...</div>
              ) : (
                'Send reset link'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigateTo('login')}
              className="w-full mt-2 text-center text-sm text-primary hover:text-blue-700"
            >
              Back to sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword


