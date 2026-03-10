import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import HabitList from './pages/HabitList'
import HabitDetail from './pages/HabitDetail'
import Profile from './pages/Profile'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import Page from './pages/Page'
import Footer from './components/Footer'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" />
}

function AdminRoute({ children }) {
  const { user } = useAuth()
  return user && user.is_admin ? children : <Navigate to="/" />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/" element={
        <PrivateRoute>
          <HabitListWithFooter />
        </PrivateRoute>
      } />
      <Route path="/habit/:id" element={
        <PrivateRoute>
          <HabitDetailWithFooter />
        </PrivateRoute>
      } />
      <Route path="/profile" element={
        <PrivateRoute>
          <ProfileWithFooter />
        </PrivateRoute>
      } />
      <Route path="/admin" element={
        <AdminRoute>
          <AdminDashboardWithFooter />
        </AdminRoute>
      } />
      <Route path="/admin/users" element={
        <AdminRoute>
          <AdminUsersWithFooter />
        </AdminRoute>
      } />
      <Route path="/about" element={<Page />} />
      <Route path="/privacy" element={<Page />} />
      <Route path="/agreement" element={<Page />} />
      <Route path="/contact" element={<Page />} />
      <Route path="/:slug" element={<Page />} />
    </Routes>
  )
}

// HOC to wrap pages with Footer
function withFooter(Component) {
  return () => (
    <>
      <Component />
      <Footer />
    </>
  )
}

const HabitListWithFooter = withFooter(HabitList)
const HabitDetailWithFooter = withFooter(HabitDetail)
const ProfileWithFooter = withFooter(Profile)
const AdminDashboardWithFooter = withFooter(AdminDashboard)
const AdminUsersWithFooter = withFooter(AdminUsers)

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
