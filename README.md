# 📁 DocuVault - Digital Document Management System

A secure, cloud-based document management system built with React and Firebase, featuring Aadhaar integration, real-time validation, and responsive design.

![DocuVault](https://img.shields.io/badge/DocuVault-Document%20Management-blue)
![React](https://img.shields.io/badge/React-19.1.1-blue)
![Firebase](https://img.shields.io/badge/Firebase-10.14.1-orange)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.0-cyan)

## 🚀 Features

### 🔐 Authentication & Security
- **Firebase Authentication** with email/password
- **Email verification** during registration
- **Password reset** functionality
- **Aadhaar number integration** for enhanced security
- **Unique email and mobile number validation**
- **Protected routes** for authenticated users

### 📁 Document Management
- **Drag & drop file upload** with support for PDF, JPG, PNG, DOC, DOCX
- **Document categorization** (Mark Sheets, PAN Cards, Passports, Certificates, Medical Records, Other)
- **File size validation** (max 10MB per file)
- **Document viewing and downloading**
- **Bulk operations** (select multiple documents for deletion)
- **Search and filter** functionality

### 🔗 Document Sharing
- **Secure sharing** with unique tokens
- **Email notifications** when documents are shared
- **Access control** (view/download permissions)
- **Expiry dates** for shared links
- **Access tracking** (view count)
- **Revoke access** functionality

### 👤 User Profile
- **Profile management** with editable information
- **Password change** with re-authentication
- **Usage statistics** (total documents, verified documents, shared documents, storage used)
- **Aadhaar number** (read-only for security)

### 📱 Responsive Design
- **Mobile-first approach** with responsive navigation
- **Hamburger menu** for mobile devices
- **Touch-friendly interface**
- **Cross-platform compatibility**

## 🏗️ Project Structure

```
cloud/
├── src/
│   ├── components/
│   │   ├── Navigation.jsx          # Responsive navigation component
│   │   ├── Home.jsx               # Landing page with features
│   │   ├── Register.jsx           # User registration with validation
│   │   ├── Login.jsx              # User authentication
│   │   ├── ForgotPassword.jsx     # Password reset
│   │   ├── OTPInput.jsx           # OTP input component
│   │   ├── UploadDoc.jsx          # Document upload interface
│   │   ├── ManageDocs.jsx         # Document management
│   │   ├── ShareDoc.jsx           # Document sharing
│   │   ├── ShareView.jsx          # Public document viewing
│   │   └── Profile.jsx            # User profile management
│   ├── App.jsx                    # Main app with routing
│   ├── firebase.js                # Firebase configuration
│   ├── main.jsx                   # App entry point
│   ├── App.css                    # Global styles
│   └── index.css                  # Base styles
├── backend/
│   ├── src/
│   │   └── index.js               # Express server for email service
│   ├── setup-ethereal.js          # Test email account setup
│   └── package.json               # Backend dependencies
├── public/
│   └── vite.svg                   # Vite logo
├── package.json                   # Frontend dependencies
├── vite.config.js                 # Vite configuration
├── eslint.config.js               # ESLint configuration
└── index.html                     # HTML template
```

## 🛠️ Technology Stack

### Frontend
- **React 19.1.1** - UI framework
- **React Router DOM 6.30.1** - Client-side routing
- **Firebase 10.14.1** - Backend services
- **Tailwind CSS** - Utility-first CSS framework
- **React Hot Toast 2.6.0** - Notifications
- **Font Awesome** - Icons
- **Vite 7.1.2** - Build tool

### Backend
- **Node.js** - Runtime environment
- **Express.js 4.19.2** - Web framework
- **Nodemailer 6.9.13** - Email service
- **CORS 2.8.5** - Cross-origin resource sharing

### Database & Storage
- **Firebase Firestore** - NoSQL database
- **Firebase Storage** - File storage
- **Firebase Authentication** - User management

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase project
- SMTP email service (optional)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd cloud
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Firebase Setup

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Email/Password)
4. Create Firestore database
5. Enable Storage
6. Get your Firebase config

#### Update Firebase Configuration
Edit `src/firebase.js`:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 4. Environment Configuration

#### Frontend Environment
Create `.env` in the project root:
```env
VITE_EMAIL_API_URL=http://localhost:4000
```

#### Backend Environment
Create `backend/.env`:
```env
PORT=4000
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_user@example.com
SMTP_PASS=your_password
MAIL_FROM="DocuVault <no-reply@example.com>"
```

### 5. Run the Application

#### Start Backend Server
```bash
cd backend
npm run dev
```

#### Start Frontend Development Server
```bash
# In a new terminal
npm run dev
```

The application will be available at `http://localhost:5173`

## 📋 Workflow & Execution

### 🔄 Application Workflow

#### 1. User Registration Flow
```
User visits app → Home page → Register → Form validation → 
Unique email/phone check → Firebase account creation → 
Email verification → Profile setup → Dashboard access
```

#### 2. User Authentication Flow
```
User login → Firebase authentication → User state update → 
Protected route access → Dashboard with user data
```

#### 3. Document Upload Flow
```
User selects files → Drag & drop or browse → File validation → 
Document type selection → Firebase Storage upload → 
Firestore metadata save → Success notification
```

#### 4. Document Sharing Flow
```
User selects document → Share form → Recipient details → 
Access permissions → Unique token generation → 
Email notification → Share link creation
```

#### 5. Document Management Flow
```
User views documents → Search/filter → Bulk operations → 
Download/delete → Real-time updates → Statistics update
```

### 🎯 Key Components Execution

#### Navigation Component
- **Responsive design** adapts to screen size
- **Mobile hamburger menu** for small screens
- **User state management** shows appropriate options
- **Route navigation** with React Router

#### Registration Component
- **Real-time validation** for email and phone uniqueness
- **Debounced API calls** to prevent excessive requests
- **Visual feedback** with loading states and icons
- **Firebase integration** for account creation

#### Document Upload Component
- **Drag & drop interface** with visual feedback
- **File type validation** and size limits
- **Progress indicators** during upload
- **Error handling** with user-friendly messages

#### Document Management Component
- **Real-time data** from Firestore
- **Search and filter** functionality
- **Bulk operations** for multiple documents
- **Responsive table** design

### 🔧 Development Workflow

#### 1. Local Development
```bash
# Start both frontend and backend
npm run dev          # Frontend (port 5173)
cd backend && npm run dev  # Backend (port 4000)
```

#### 2. Building for Production
```bash
# Build frontend
npm run build

# Preview production build
npm run preview
```

#### 3. Code Quality
```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint -- --fix
```

## 🎨 UI/UX Features

### Design System
- **Color Palette**: Primary blue (#1e40af), Secondary blue (#3b82f6), Accent cyan (#06b6d4)
- **Typography**: System fonts with proper hierarchy
- **Spacing**: Consistent padding and margins
- **Icons**: Font Awesome for consistent iconography

### Responsive Breakpoints
- **Mobile**: < 768px (hamburger menu)
- **Tablet**: 768px - 1024px (responsive layout)
- **Desktop**: > 1024px (full navigation)

### User Experience
- **Loading states** for all async operations
- **Error handling** with clear messages
- **Success feedback** with toast notifications
- **Form validation** with real-time feedback
- **Accessibility** features (ARIA labels, keyboard navigation)

## 🔒 Security Features

### Authentication Security
- **Firebase Authentication** with secure token management
- **Email verification** required for account activation
- **Password strength** validation
- **Session persistence** with browser storage

### Data Security
- **Firestore security rules** for data access control
- **Storage security** with user-based access
- **Unique field validation** to prevent duplicates
- **Input sanitization** and validation

### Document Security
- **Secure sharing** with unique tokens
- **Access control** with view/download permissions
- **Expiry dates** for shared links
- **Revoke access** functionality

## 📊 Performance Optimizations

### Frontend Optimizations
- **Code splitting** with React.lazy
- **Image optimization** and lazy loading
- **Debounced API calls** to reduce server load
- **Memoization** for expensive calculations

### Backend Optimizations
- **CORS configuration** for cross-origin requests
- **Error handling** with proper HTTP status codes
- **Email queuing** for better performance
- **Environment-based configuration**

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration with unique validation
- [ ] User login and logout
- [ ] Document upload with different file types
- [ ] Document management (view, download, delete)
- [ ] Document sharing with email notifications
- [ ] Responsive design on different devices
- [ ] Error handling and edge cases

### Browser Compatibility
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)
```bash
# Build the project
npm run build

# Deploy the dist folder
# Update environment variables in deployment platform
```

### Backend Deployment (Railway/Heroku)
```bash
# Deploy backend folder
# Set environment variables in deployment platform
```

### Environment Variables for Production
```env
# Frontend
VITE_EMAIL_API_URL=https://your-backend-url.com

# Backend
PORT=4000
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your-email
SMTP_PASS=your-password
MAIL_FROM="DocuVault <no-reply@yourdomain.com>"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@docuvault.com or create an issue in the repository.

## 🙏 Acknowledgments

- Firebase for backend services
- React team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- Font Awesome for the icon library

---

**DocuVault** - Securing your documents, simplifying your life. 🔐📁