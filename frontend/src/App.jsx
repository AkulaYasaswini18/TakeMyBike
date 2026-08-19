import React, { useContext, useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AuthContext from './context/AuthContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import FindBikes from './pages/FindBikes'
import BikeDetails from './pages/BikeDetails'
import AddBike from './pages/AddBike'
import MyBikes from './pages/MyBikes'
import Booking from './pages/Booking'
import MyBookings from './pages/MyBookings'
import RentalRequests from './pages/RentalRequests'
import UserProfile from './pages/UserProfile'
import DashboardRouter from './pages/DashboardRouter'
import RenterDashboard from './pages/RenterDashboard'
import OwnerDashboard from './pages/OwnerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import NotificationBell from './components/notifications/NotificationBell'
import ProtectedRoute from './routes/ProtectedRoute'

function AppInner() {
  const { user, logout } = useContext(AuthContext)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <BrowserRouter>
      <nav style={{
        padding: '12px 20px',
        backgroundColor: '#1e293b',
        color: '#f8fafc',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to="/" style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '18px', textDecoration: 'none' }}>
            🚲 BikeShare
          </Link>
          <div className="nav-desktop-links" style={{ display: 'flex', gap: '16px' }}>
            <Link to="/find-bikes" style={{ color: '#e2e8f0', textDecoration: 'none', fontSize: '14px' }}>
              Find Bikes
            </Link>
          </div>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="mobile-nav-toggle"
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: '#f8fafc',
            fontSize: '22px',
            cursor: 'pointer',
            padding: '4px'
          }}
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        {/* Desktop Nav Items */}
        <div className="nav-desktop-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {!user ? (
            <>
              <Link to="/login" style={{ color: '#e2e8f0', textDecoration: 'none', fontSize: '14px' }}>Login</Link>
              <Link to="/register" style={{
                backgroundColor: '#0284c7',
                color: 'white',
                padding: '6px 14px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500'
              }}>Register</Link>
            </>
          ) : (
            <>
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                Hi, <strong style={{ color: '#f8fafc' }}>{user.name}</strong> ({user.role})
              </span>
              <Link to="/dashboard" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
                📊 Dashboard
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin/dashboard" style={{ color: '#c084fc', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
                  🛡️ Admin Panel
                </Link>
              )}
              {user.role === 'renter' && (
                <Link to="/my-bookings" style={{ color: '#e2e8f0', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
                  My Bookings
                </Link>
              )}
              {user.role === 'owner' && (
                <>
                  <Link to="/my-bikes" style={{ color: '#e2e8f0', textDecoration: 'none', fontSize: '14px' }}>My Bikes</Link>
                  <Link to="/add-bike" style={{ color: '#e2e8f0', textDecoration: 'none', fontSize: '14px' }}>+ Add Bike</Link>
                  <Link to="/rental-requests" style={{ color: '#e2e8f0', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
                    Rental Requests
                  </Link>
                </>
              )}
              <NotificationBell />
              <button
                onClick={logout}
                style={{
                  backgroundColor: 'transparent',
                  color: '#ef4444',
                  border: '1px solid #ef4444',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              >
                Logout
              </button>
            </>
          )}
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: '#1e293b',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            borderTop: '1px solid #334155',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)'
          }}>
            <Link
              to="/find-bikes"
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: '#e2e8f0', padding: '8px 0', textDecoration: 'none', fontSize: '15px' }}
            >
              🔍 Find Bikes
            </Link>
            {!user ? (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ color: '#e2e8f0', padding: '8px 0', textDecoration: 'none', fontSize: '15px' }}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    backgroundColor: '#0284c7',
                    color: 'white',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    textAlign: 'center',
                    textDecoration: 'none',
                    fontSize: '15px',
                    fontWeight: '600'
                  }}
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                <div style={{ color: '#94a3b8', fontSize: '13.5px', padding: '4px 0' }}>
                  Signed in as <strong style={{ color: '#f8fafc' }}>{user.name}</strong> ({user.role})
                </div>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ color: '#38bdf8', padding: '8px 0', textDecoration: 'none', fontSize: '15px', fontWeight: '600' }}
                >
                  📊 Dashboard
                </Link>
                {user.role === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ color: '#c084fc', padding: '8px 0', textDecoration: 'none', fontSize: '15px', fontWeight: '600' }}
                  >
                    🛡️ Admin Panel
                  </Link>
                )}
                {user.role === 'renter' && (
                  <Link
                    to="/my-bookings"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ color: '#e2e8f0', padding: '8px 0', textDecoration: 'none', fontSize: '15px' }}
                  >
                    My Bookings
                  </Link>
                )}
                {user.role === 'owner' && (
                  <>
                    <Link
                      to="/my-bikes"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{ color: '#e2e8f0', padding: '8px 0', textDecoration: 'none', fontSize: '15px' }}
                    >
                      My Bikes
                    </Link>
                    <Link
                      to="/add-bike"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{ color: '#e2e8f0', padding: '8px 0', textDecoration: 'none', fontSize: '15px' }}
                    >
                      + Add Bike
                    </Link>
                    <Link
                      to="/rental-requests"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{ color: '#e2e8f0', padding: '8px 0', textDecoration: 'none', fontSize: '15px' }}
                    >
                      Rental Requests
                    </Link>
                  </>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #334155' }}>
                  <NotificationBell />
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#ef4444',
                      border: '1px solid #ef4444',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Style for hamburger toggle media query */}
      <style>{`
        @media (max-width: 768px) {
          .nav-desktop-links,
          .nav-desktop-actions {
            display: none !important;
          }
          .mobile-nav-toggle {
            display: block !important;
          }
        }
      `}</style>
      <main style={{ minHeight: 'calc(100vh - 60px)', backgroundColor: '#f8fafc' }}>
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/register" element={<Register/>} />
          <Route path="/forgot-password" element={<ForgotPassword/>} />
          <Route path="/reset-password" element={<ResetPassword/>} />
          <Route path="/find-bikes" element={<FindBikes/>} />
          <Route path="/bikes/:id" element={<BikeDetails/>} />
          <Route path="/user/:id" element={<UserProfile/>} />

          {/* Unified Dashboard Router */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter/></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute roles={["admin"]}><AdminDashboard/></ProtectedRoute>} />

          {/* Renter routes */}
          <Route path="/renter/dashboard" element={<ProtectedRoute roles={["renter"]}><RenterDashboard/></ProtectedRoute>} />
          <Route path="/booking/:id" element={<ProtectedRoute roles={["renter"]}><Booking/></ProtectedRoute>} />
          <Route path="/my-bookings" element={<ProtectedRoute roles={["renter"]}><MyBookings/></ProtectedRoute>} />

          {/* Owner routes */}
          <Route path="/owner/dashboard" element={<ProtectedRoute roles={["owner"]}><OwnerDashboard/></ProtectedRoute>} />
          <Route path="/add-bike" element={<ProtectedRoute roles={["owner"]}><AddBike/></ProtectedRoute>} />
          <Route path="/add-bike/:id" element={<ProtectedRoute roles={["owner"]}><AddBike/></ProtectedRoute>} />
          <Route path="/my-bikes" element={<ProtectedRoute roles={["owner"]}><MyBikes/></ProtectedRoute>} />
          <Route path="/rental-requests" element={<ProtectedRoute roles={["owner"]}><RentalRequests/></ProtectedRoute>} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner/>
    </AuthProvider>
  )
}
