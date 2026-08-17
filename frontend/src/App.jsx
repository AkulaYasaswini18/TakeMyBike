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
import AddBike from './pages/AddBike'
import MyBikes from './pages/MyBikes'
import ProtectedRoute from './routes/ProtectedRoute'

export default function AppInner() {
  const { user, logout } = useContext(AuthContext)

  return (
    <BrowserRouter>
      <nav style={{ padding: '10px', backgroundColor: '#f0f0f0', borderBottom: '1px solid #ccc' }}>
        <Link to="/" style={{ marginRight: '15px' }}>Home</Link>
        <Link to="/find-bikes" style={{ marginRight: '15px' }}>Find Bikes</Link>
        {!user ? (
          <>
            <Link to="/login" style={{ marginRight: '15px' }}>Login</Link>
            <Link to="/register" style={{ marginRight: '15px' }}>Register</Link>
          </>
        ) : (
          <>
            <span style={{ marginRight: '15px' }}>Hi, {user.name} ({user.role})</span>
            {user.role === 'owner' && <Link to="/my-bikes" style={{ marginRight: '15px' }}>My Bikes</Link>}
            <button onClick={logout} style={{ marginRight: '15px', cursor: 'pointer' }}>Logout</button>
          </>
        )}
      </nav>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/register" element={<Register/>} />
        <Route path="/forgot-password" element={<ForgotPassword/>} />
        <Route path="/reset-password" element={<ResetPassword/>} />
        <Route path="/find-bikes" element={<FindBikes/>} />

        {/* Owner routes */}
        <Route path="/add-bike" element={<ProtectedRoute roles={["owner"]}><AddBike/></ProtectedRoute>} />
        <Route path="/add-bike/:id" element={<ProtectedRoute roles={["owner"]}><AddBike/></ProtectedRoute>} />
        <Route path="/my-bikes" element={<ProtectedRoute roles={["owner"]}><MyBikes/></ProtectedRoute>} />
      </Routes>
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
