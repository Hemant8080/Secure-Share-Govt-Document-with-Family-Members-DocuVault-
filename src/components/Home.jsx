import Navigation from './Navigation'

const Home = ({ navigateTo }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation navigateTo={navigateTo} showAuthButtons={true} />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-secondary">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Digital Document Management
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Securely store and manage your important documents like mark sheets, PAN cards, passports, and more. 
              Linked to your Aadhaar for maximum security and convenience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigateTo('register')}
                className="bg-white text-primary hover:bg-gray-100 px-8 py-3 rounded-lg text-lg font-semibold transition duration-300"
              >
                Get Started
              </button>
              <button 
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                className="border-2 border-white text-white hover:bg-white hover:text-primary px-8 py-3 rounded-lg text-lg font-semibold transition duration-300"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Key Features</h2>
            <p className="text-lg text-gray-600">Everything you need for secure document management</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition duration-300">
              <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-shield-alt text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aadhaar Linked</h3>
              <p className="text-gray-600">Secure authentication using your unique Aadhaar number</p>
            </div>
            
            <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition duration-300">
              <div className="bg-secondary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-cloud-upload-alt text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Upload</h3>
              <p className="text-gray-600">Upload documents with drag-and-drop functionality</p>
            </div>
            
            <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition duration-300">
              <div className="bg-accent text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-share-alt text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Sharing</h3>
              <p className="text-gray-600">Share documents securely with authorized parties</p>
            </div>
            
            <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition duration-300">
              <div className="bg-green-500 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-mobile-alt text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Mobile Access</h3>
              <p className="text-gray-600">Access your documents anytime, anywhere</p>
            </div>
          </div>
        </div>
      </section>

      {/* Document Types Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Supported Document Types</h2>
            <p className="text-lg text-gray-600">Store all your important documents in one place</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition duration-300">
              <i className="fas fa-graduation-cap text-3xl text-primary mb-3"></i>
              <p className="font-semibold text-gray-900">Mark Sheets</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition duration-300">
              <i className="fas fa-id-card text-3xl text-secondary mb-3"></i>
              <p className="font-semibold text-gray-900">PAN Card</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition duration-300">
              <i className="fas fa-passport text-3xl text-accent mb-3"></i>
              <p className="font-semibold text-gray-900">Passport</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition duration-300">
              <i className="fas fa-certificate text-3xl text-green-500 mb-3"></i>
              <p className="font-semibold text-gray-900">Certificates</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition duration-300">
              <i className="fas fa-file-medical text-3xl text-red-500 mb-3"></i>
              <p className="font-semibold text-gray-900">Medical Records</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition duration-300">
              <i className="fas fa-file-invoice text-3xl text-purple-500 mb-3"></i>
              <p className="font-semibold text-gray-900">Other Documents</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p>&copy; 2025 Digital Document Management System. All rights reserved.</p>
            <p className="mt-2 text-gray-400">Securing your documents, simplifying your life.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
