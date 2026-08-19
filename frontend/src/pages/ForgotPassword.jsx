import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import * as authService from '../services/authService'
import { useToast } from '../context/ToastContext'
import ErrorMessage from '../components/common/ErrorMessage'
import './Auth.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const toast = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await authService.forgotPassword(email)
      setSent(true)
      toast.success('Password reset link sent to your email.', 'Check Your Inbox')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">🔑</span>
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">Enter your registered email to receive a password reset link</p>
        </div>

        {error && <ErrorMessage message={error} compact />}

        {sent ? (
          <div style={{
            background: '#dcfce7',
            border: '1px solid #86efac',
            color: '#15803d',
            padding: '16px',
            borderRadius: '10px',
            textAlign: 'center',
            fontSize: '14px',
            lineHeight: 1.5
          }}>
            ✓ If an account with <strong>{email}</strong> exists, we've sent password reset instructions to your inbox.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Registered Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="auth-submit-btn">
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="auth-footer-links">
          <Link to="/login" className="auth-link">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
