import React, { useContext } from 'react'
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
import ProtectedRoute from './routes/ProtectedRoute'

function AppInner() {
  const { user, logout } = useContext(AuthContext)

  return (
    <BrowserRouter>
      <nav style={{ padding: '12px 20px', backgroundColor: '#1e293b', color: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to="/" style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '18px', textDecoration: 'none' }}>🚲 BikeShare</Link>
          <Link to="/find-bikes" style={{ color: '#e2e8f0', textDecoration: 'none', fontSize: '14px' }}>Find Bikes</Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>Hi, <strong style={{ color: '#f8fafc' }}>{user.name}</strong> ({user.role})</span>
              {user.role === 'renter' && (
                <Link to="/my-bookings" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
                  My Bookings
                </Link>
              )}
              {user.role === 'owner' && (
                <>
                  <Link to="/my-bikes" style={{ color: '#e2e8f0', textDecoration: 'none', fontSize: '14px' }}>My Bikes</Link>
                  <Link to="/add-bike" style={{ color: '#e2e8f0', textDecoration: 'none', fontSize: '14px' }}>+ Add Bike</Link>
                  <Link to="/rental-requests" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
                    Rental Requests
                  </Link>
                </>
              )}
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
      </nav>
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

          {/* Renter routes */}
          <Route path="/booking/:id" element={<ProtectedRoute roles={["renter"]}><Booking/></ProtectedRoute>} />
          <Route path="/my-bookings" element={<ProtectedRoute roles={["renter"]}><MyBookings/></ProtectedRoute>} />

          {/* Owner routes */}
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
