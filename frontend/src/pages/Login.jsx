import React, { useState, useContext } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import AuthContext from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import ErrorMessage from '../components/common/ErrorMessage'
import { getErrorMessage } from '../services/api'
import './Auth.css'

export default function Login() {
  const { login } = useContext(AuthContext)
  const toast = useToast()
  const [creds, setCreds] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!creds.email || !creds.password) {
      setError('Please enter both your email address and password.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await login(creds)
      toast.success(`Welcome back, ${data.user?.name || 'Rider'}!`, 'Logged In')
      const from = location.state?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid email or password. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">🚲</span>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your BikeShare account</p>
        </div>

        {error && (
          <ErrorMessage
            scenario="INVALID_LOGIN"
            message={error}
            compact
          />
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={creds.email}
              onChange={(e) => setCreds({ ...creds, email: e.target.value })}
              className="form-input"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Password</label>
              <Link to="/forgot-password" style={{ fontSize: '12px', color: '#0284c7', textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={creds.password}
                onChange={(e) => setCreds({ ...creds, password: e.target.value })}
                className="form-input"
                style={{ width: '100%', paddingRight: '40px' }}
                required
                autoComplete="current-password"
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
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer-links">
          <span>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Create Account
            </Link>
          </span>
        </div>
      </div>
    </div>
  )
}
