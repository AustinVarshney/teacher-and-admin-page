import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'

// Student Pages
import StudentLogin from './pages/student/StudentLogin'
import StudentDashboard from './pages/student/StudentDashboard'

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'

// Teacher Pages
import TeacherLogin from './pages/teacher/TeacherLogin'
import TeacherDashboard from './pages/teacher/TeacherDashboard'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userType, setUserType] = useState<'student' | 'admin' | 'teacher' | null>(null)

  const handleStudentLogin = () => {
    setIsAuthenticated(true)
    setUserType('student')
  }

  const handleAdminLogin = () => {
    setIsAuthenticated(true)
    setUserType('admin')
  }

  const handleTeacherLogin = () => {
    setIsAuthenticated(true)
    setUserType('teacher')
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUserType(null)
  }

  return (
    <Router>
      <Routes>
        {/* Student Routes */}
        <Route 
          path="/" 
          element={
            isAuthenticated && userType === 'student' ? 
              <Navigate to="/student/dashboard" /> : 
              <StudentLogin onLogin={handleStudentLogin} />
          } 
        />
        <Route 
          path="/student/dashboard" 
          element={
            isAuthenticated && userType === 'student' ? 
              <StudentDashboard onLogout={handleLogout} /> : 
              <Navigate to="/" />
          } 
        />

        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={
            isAuthenticated && userType === 'admin' ? 
              <Navigate to="/admin/dashboard" /> : 
              <AdminLogin onLogin={handleAdminLogin} />
          } 
        />
        <Route 
          path="/admin/dashboard" 
          element={
            isAuthenticated && userType === 'admin' ? 
              <AdminDashboard onLogout={handleLogout} /> : 
              <Navigate to="/admin" />
          } 
        />

        {/* Teacher Routes */}
        <Route 
          path="/teacher" 
          element={
            isAuthenticated && userType === 'teacher' ? 
              <Navigate to="/teacher/dashboard" /> : 
              <TeacherLogin onLogin={handleTeacherLogin} />
          } 
        />
        <Route 
          path="/teacher/dashboard" 
          element={
            isAuthenticated && userType === 'teacher' ? 
              <TeacherDashboard onLogout={handleLogout} /> : 
              <Navigate to="/teacher" />
          } 
        />
      </Routes>
    </Router>
  )
}

export default App
