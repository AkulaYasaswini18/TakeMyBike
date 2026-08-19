import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthContext from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import ErrorMessage from '../components/common/ErrorMessage'
import './Auth.css'

export default function Register() {
  const { register } = useContext(AuthContext)
  const toast = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'renter'
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) {
      setError('Please fill in all required fields.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await register(form)
      toast.success(res.message || 'Registration successful! Please log in.', 'Account Created')
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">🚀</span>
          <h1 className="auth-title">Create an Account</h1>
          <p className="auth-subtitle">Join the BikeShare community as a Renter or Owner</p>
        </div>

        {error && (
          <ErrorMessage
            message={error}
            compact
          />
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">I want to:</label>
            <div className="role-selector-grid">
              <div
                className={`role-radio-btn ${form.role === 'renter' ? 'active' : ''}`}
                onClick={() => setForm({ ...form, role: 'renter' })}
              >
                🚴 Rent Bikes
              </div>
              <div
                className={`role-radio-btn ${form.role === 'owner' ? 'active' : ''}`}
                onClick={() => setForm({ ...form, role: 'owner' })}
              >
                🏍️ List My Bike
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              placeholder="Aarav Sharma"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number (Optional)</label>
            <input
              type="tel"
              placeholder="9876543210"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="form-input"
                style={{ width: '100%', paddingRight: '40px' }}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  fontSize: '13px'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="auth-submit-btn">
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div className="auth-footer-links">
          <span>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign In
            </Link>
          </span>
        </div>
      </div>
    </div>
  )
}
