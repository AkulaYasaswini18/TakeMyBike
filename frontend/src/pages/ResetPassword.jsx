import React, { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import * as authService from '../services/authService'
import { useToast } from '../context/ToastContext'
import ErrorMessage from '../components/common/ErrorMessage'
import './Auth.css'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const navigate = useNavigate()
  const toast = useToast()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token) {
      setError('Invalid or expired reset link. Please request a new one.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await authService.resetPassword(token, password)
      toast.success('Your password has been reset successfully! Please log in.', 'Success')
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.error || 'Password reset failed. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">🔒</span>
          <h1 className="auth-title">Create New Password</h1>
          <p className="auth-subtitle">Enter your new secure password below</p>
        </div>

        {error && <ErrorMessage message={error} compact />}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="auth-submit-btn">
            {loading ? 'Updating...' : 'Set New Password'}
          </button>
        </form>

        <div className="auth-footer-links">
          <Link to="/login" className="auth-link">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
