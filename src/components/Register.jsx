import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification as firebaseSendEmailVerification } from 'firebase/auth'
import { auth, db } from '../firebase'
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'

const Register = ({ navigateTo }) => {
  const [step, setStep] = useState(1) // 1: Basic info, 2: Email verification
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    aadhaarNumber: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [userCreated, setUserCreated] = useState(null)
  const [validatingFields, setValidatingFields] = useState({ email: false, phone: false })

  // Debounce function
  const debounce = (func, delay) => {
    let timeoutId
    return (...args) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(null, args), delay)
    }
  }

  // Debounced validation for email and phone
  const validateUniqueField = async (fieldName, value) => {
    if (!value || value.length < 3) return // Don't validate if too short

    setValidatingFields(prev => ({ ...prev, [fieldName]: true }))

    try {
      let queryField, queryValue
      
      if (fieldName === 'email') {
        if (!/\S+@\S+\.\S+/.test(value)) {
          setValidatingFields(prev => ({ ...prev, [fieldName]: false }))
          return // Don't validate invalid email format
        }
        queryField = 'email'
        queryValue = value.toLowerCase().trim()
      } else if (fieldName === 'phone') {
        if (!/^\d{10}$/.test(value)) {
          setValidatingFields(prev => ({ ...prev, [fieldName]: false }))
          return // Don't validate if not 10 digits
        }
        queryField = 'phone'
        queryValue = value.trim()
      } else {
        setValidatingFields(prev => ({ ...prev, [fieldName]: false }))
        return
      }

      const fieldQuery = query(
        collection(db, 'users'),
        where(queryField, '==', queryValue)
      )
      const snapshot = await getDocs(fieldQuery)

      if (!snapshot.empty) {
        setErrors(prev => ({
          ...prev,
          [fieldName]: `${fieldName === 'email' ? 'Email address' : 'Phone number'} is already registered`
        }))
      } else {
        // Clear the error if field is unique
        setErrors(prev => ({
          ...prev,
          [fieldName]: ''
        }))
      }
    } catch (error) {
      console.error(`Error validating ${fieldName}:`, error)
    } finally {
      setValidatingFields(prev => ({ ...prev, [fieldName]: false }))
    }
  }

  // Create debounced validation functions
  const debouncedEmailValidation = debounce((value) => validateUniqueField('email', value), 500)
  const debouncedPhoneValidation = debounce((value) => validateUniqueField('phone', value), 500)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }

    // Trigger debounced validation for email and phone
    if (name === 'email') {
      debouncedEmailValidation(value)
    } else if (name === 'phone') {
      debouncedPhoneValidation(value)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be 10 digits'
    }

    if (!formData.aadhaarNumber.trim()) {
      newErrors.aadhaarNumber = 'Aadhaar number is required'
    } else if (!/^\d{12}$/.test(formData.aadhaarNumber)) {
      newErrors.aadhaarNumber = 'Aadhaar number must be 12 digits'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const checkUniqueFields = async () => {
    try {
      // Check if email already exists
      const emailQuery = query(
        collection(db, 'users'),
        where('email', '==', formData.email.toLowerCase().trim())
      )
      const emailSnapshot = await getDocs(emailQuery)

      // Check if phone number already exists
      const phoneQuery = query(
        collection(db, 'users'),
        where('phone', '==', formData.phone.trim())
      )
      const phoneSnapshot = await getDocs(phoneQuery)

      const newErrors = {}

      if (!emailSnapshot.empty) {
        newErrors.email = 'Email address is already registered'
      }

      if (!phoneSnapshot.empty) {
        newErrors.phone = 'Phone number is already registered'
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(prev => ({ ...prev, ...newErrors }))
        return false
      }

      return true
    } catch (error) {
      console.error('Error checking unique fields:', error)
      toast.error('Failed to validate email and phone number')
      return false
    }
  }

  const sendEmailVerification = async () => {
    if (!validateForm()) {
      return
    }

    // Check for unique email and phone number
    const isUnique = await checkUniqueFields()
    if (!isUnique) {
      return
    }

    setIsLoading(true)
    try {
      console.log('Attempting to create user with email:', formData.email)
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      )
      
      const user = userCredential.user
      setUserCreated(user)

      // Update profile
      if (user && formData.fullName.trim()) {
        await updateProfile(user, { displayName: formData.fullName.trim() })
      }

      // Send email verification
      await firebaseSendEmailVerification(user)
      
      // Save additional user data to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name: formData.fullName.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone.trim(),
        aadhaarNumber: formData.aadhaarNumber.trim(),
        emailVerified: false,
        createdAt: new Date()
      })

      setStep(2)
      toast.success('Account created! Please check your email for verification link.')
    } catch (err) {
      console.error('Registration Error:', err)
      let message = 'Failed to create account.'
      if (err?.code === 'auth/email-already-in-use') message = 'Email already in use.'
      if (err?.code === 'auth/invalid-email') message = 'Invalid email address.'
      if (err?.code === 'auth/weak-password') message = 'Password should be at least 6 characters.'
      if (err?.code === 'auth/operation-not-allowed') message = 'Email registration is not enabled.'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const resendEmailVerification = async () => {
    if (!userCreated) return
    
    setIsLoading(true)
    try {
      await firebaseSendEmailVerification(userCreated)
      toast.success('Verification email sent again!')
    } catch (err) {
      console.error('Resend Error:', err)
      toast.error('Failed to resend verification email')
    } finally {
      setIsLoading(false)
    }
  }

  const checkEmailVerification = async () => {
    if (!userCreated) return
    
    try {
      await userCreated.reload()
      if (userCreated.emailVerified) {
        toast.success('Email verified successfully!')
        navigateTo('login')
      } else {
        toast.error('Email not verified yet. Please check your email.')
      }
    } catch (err) {
      console.error('Verification check error:', err)
      toast.error('Failed to check verification status')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <i className="fas fa-file-alt text-4xl text-primary"></i>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join DocuVault to securely manage your documents
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {step === 1 ? (
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); sendEmailVerification(); }}>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                    errors.fullName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 pr-10 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email"
                />
                {validatingFields.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <i className="fas fa-spinner fa-spin text-gray-400"></i>
                  </div>
                )}
                {!validatingFields.email && !errors.email && formData.email && /\S+@\S+\.\S+/.test(formData.email) && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <i className="fas fa-check text-green-500"></i>
                  </div>
                )}
                {errors.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <i className="fas fa-times text-red-500"></i>
                  </div>
                )}
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <div className="mt-1 relative">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 pr-10 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your phone number"
                />
                {validatingFields.phone && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <i className="fas fa-spinner fa-spin text-gray-400"></i>
                  </div>
                )}
                {!validatingFields.phone && !errors.phone && formData.phone && /^\d{10}$/.test(formData.phone) && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <i className="fas fa-check text-green-500"></i>
                  </div>
                )}
                {errors.phone && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <i className="fas fa-times text-red-500"></i>
                  </div>
                )}
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="aadhaarNumber" className="block text-sm font-medium text-gray-700">
                Aadhaar Number
              </label>
              <div className="mt-1">
                <input
                  id="aadhaarNumber"
                  name="aadhaarNumber"
                  type="text"
                  value={formData.aadhaarNumber}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                    errors.aadhaarNumber ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your 12-digit Aadhaar number"
                />
                {errors.aadhaarNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.aadhaarNumber}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Create a password"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>
          ) : (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <i className="fas fa-envelope text-green-600 text-xl"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Verify Your Email</h3>
                <p className="text-sm text-gray-600 mt-2">
                  We've sent a verification link to <strong>{formData.email}</strong>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Please check your email and click the verification link to activate your account.
                </p>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={checkEmailVerification}
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Checking...
                    </div>
                  ) : (
                    'I\'ve Verified My Email'
                  )}
                </button>

                <button
                  onClick={resendEmailVerification}
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                >
                  Resend Verification Email
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-primary hover:text-blue-700"
                >
                  ← Back to registration
                </button>
              </div>
            </div>
          )}
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => navigateTo('login')}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Sign in instead
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
