import React, { useEffect, useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthContext from '../context/AuthContext'
import * as bookingService from '../services/bookingService'
import * as notificationService from '../services/notificationService'
import * as reviewService from '../services/reviewService'
import InspectionModal from '../components/booking/InspectionModal'
import SecurityDepositBadge from '../components/booking/SecurityDepositBadge'
import ReviewModal from '../components/reviews/ReviewModal'
import StarRating from '../components/common/StarRating'
import './RenterDashboard.css'

const statusStyles = {
  PENDING: { bg: '#fff3cd', color: '#856404', label: '⧗ Approval Pending' },
  APPROVED: { bg: '#d1ecf1', color: '#0c5460', label: '✓ Approved' },
  REJECTED: { bg: '#f8d7da', color: '#721c24', label: '✗ Rejected' },
  CASH_PAYMENT_PENDING: { bg: '#e0f2fe', color: '#0369a1', label: '💵 Cash Payment Pending' },
  CASH_PAYMENT_CONFIRMED: { bg: '#fef3c7', color: '#b45309', label: '🔑 Ready for Handover OTP' },
  ACTIVE: { bg: '#dcfce7', color: '#15803d', label: '🚴 Rental Active' },
  COMPLETED: { bg: '#f3f4f6', color: '#374151', label: '✓ Completed' },
  CANCELLED: { bg: '#fee2e2', color: '#b91c1c', label: '✗ Cancelled' },
  DISPUTED: { bg: '#fee2e2', color: '#b91c1c', label: '⚠️ Disputed (Damage Flagged)' }
}

const notifIcons = {
  BOOKING_REQUESTED: '📋',
  BOOKING_APPROVED: '✓',
  BOOKING_REJECTED: '✗',
  CASH_PAYMENT_PENDING: '💵',
  CASH_PAYMENT_CONFIRMED: '🔑',
  RENTAL_ACTIVE: '🚴',
  RETURN_COMPLETED: '🏁',
  DEPOSIT_REFUNDED: '🔒',
  DISPUTE_CREATED: '⚠️',
  REVIEW_RECEIVED: '⭐',
  SYSTEM: '🔔'
}

function timeAgo(dateString) {
  if (!dateString) return ''
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function RenterDashboard() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('active')
  const [dashboardData, setDashboardData] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // Inspections and reviews state maps
  const [inspectionsMap, setInspectionsMap] = useState({})
  const [reviewsMap, setReviewsMap] = useState({})

  // OTP Verification state
  const [otpInputs, setOtpInputs] = useState({})
  const [otpLoading, setOtpLoading] = useState(null)
  const [otpError, setOtpError] = useState({})

  // Modal states
  const [modalBookingId, setModalBookingId] = useState(null)
  const [modalPhase, setModalPhase] = useState('BEFORE')
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false)

  const [reviewBooking, setReviewBooking] = useState(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  useEffect(() => {
    loadDashboard()
    loadNotifications()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const data = await bookingService.getRenterDashboard()
      setDashboardData(data)

      // Pre-load inspections and reviews for relevant bookings
      const insMap = {}
      const revMap = {}

      const allList = data.bookings || []
      await Promise.all(
        allList.map(async (b) => {
          if (['CASH_PAYMENT_CONFIRMED', 'ACTIVE', 'COMPLETED', 'DISPUTED'].includes(b.status)) {
            try {
              const res = await bookingService.getInspections(b._id)
              insMap[b._id] = res.inspections || []
            } catch (e) {}

            if (b.status === 'COMPLETED') {
              try {
                const revRes = await reviewService.getBookingReviews(b._id)
                const myRev = (revRes.reviews || []).find(
                  r => r.fromUser?._id === user?._id || r.fromUser === user?._id
                )
                if (myRev) {
                  revMap[b._id] = myRev
                }
              } catch (e) {}
            }
          }
        })
      )

      setInspectionsMap(insMap)
      setReviewsMap(revMap)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load renter dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getMyNotifications()
      setNotifications(data.notifications || [])
      setUnreadNotifCount(data.unreadCount || 0)
    } catch (err) {}
  }

  const handleVerifyOtp = async (bookingId) => {
    const code = (otpInputs[bookingId] || '').trim()
    if (!code || code.length !== 6) {
      setOtpError(prev => ({ ...prev, [bookingId]: 'Please enter a valid 6-digit OTP code' }))
      return
    }

    setOtpLoading(bookingId)
    setOtpError(prev => ({ ...prev, [bookingId]: null }))
    setSuccessMsg(null)

    try {
      const res = await bookingService.verifyOtp(bookingId, code)
      setSuccessMsg('🎉 OTP verified successfully! Your bike rental is now ACTIVE.')
      setOtpInputs(prev => ({ ...prev, [bookingId]: '' }))
      await loadDashboard()
    } catch (err) {
      setOtpError(prev => ({ ...prev, [bookingId]: err.response?.data?.error || 'Failed to verify OTP' }))
    } finally {
      setOtpLoading(null)
    }
  }

  const handleOpenInspection = (bookingId, phase) => {
    setModalBookingId(bookingId)
    setModalPhase(phase)
    setIsInspectionModalOpen(true)
  }

  const handleInspectionUploaded = (newInspection) => {
    if (!modalBookingId) return
    setInspectionsMap(prev => {
      const current = prev[modalBookingId] || []
      const filtered = current.filter(i => i.phase !== newInspection.phase)
      return {
        ...prev,
        [modalBookingId]: [...filtered, newInspection]
      }
    })
    setSuccessMsg(`✓ ${newInspection.phase} inspection photos uploaded successfully!`)
  }

  const handleOpenReview = (booking) => {
    setReviewBooking(booking)
    setIsReviewModalOpen(true)
  }

  const handleReviewSubmitted = (newReview) => {
    if (reviewBooking) {
      setReviewsMap(prev => ({ ...prev, [reviewBooking._id]: newReview }))
      setSuccessMsg('⭐ Thank you! Your review has been submitted.')
    }
  }

  const handleMarkNotifRead = async (notif) => {
    if (!notif.isRead) {
      try {
        await notificationService.markAsRead(notif._id)
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n))
        setUnreadNotifCount(prev => Math.max(0, prev - 1))
      } catch (e) {}
    }
    if (notif.link) {
      navigate(notif.link)
    }
  }

  const handleMarkAllNotifsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadNotifCount(0)
    } catch (e) {}
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🚲</div>
          <p style={{ fontSize: '18px', fontWeight: '600' }}>Loading your Renter Dashboard...</p>
        </div>
      </div>
    )
  }

  const summary = dashboardData?.summary || {}
  const activeBookings = dashboardData?.activeBookings || []
  const upcomingBookings = dashboardData?.upcomingBookings || []
  const completedBookings = dashboardData?.completedBookings || []
  const allBookings = dashboardData?.bookings || []
  const cashPayments = dashboardData?.cashPayments || []
  const securityDeposits = dashboardData?.securityDeposits || []

  const renderRentalCard = (booking) => {
    const style = statusStyles[booking.status] || { bg: '#f1f5f9', color: '#475569', label: booking.status }
    const bike = booking.bike || {}
    const owner = booking.owner || {}
    const thumbUrl = bike.images && bike.images.length > 0
      ? (bike.images[0].startsWith('http') ? bike.images[0] : `http://localhost:5000/${bike.images[0]}`)
      : null

    const startDate = new Date(booking.startDate).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
    const endDate = new Date(booking.endDate).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    })

    const days = Math.max(1, Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24)))
    const myReview = reviewsMap[booking._id]
    const inspections = inspectionsMap[booking._id] || []
    const beforeIns = inspections.find(i => i.phase === 'BEFORE')
    const afterIns = inspections.find(i => i.phase === 'AFTER')

    return (
      <div key={booking._id} className="rental-card">
        <div className="rental-card-main">
          {thumbUrl ? (
            <img src={thumbUrl} alt={bike.brand} className="rental-bike-thumb" />
          ) : (
            <div className="rental-bike-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
              🚲
            </div>
          )}

          <div className="rental-card-content">
            <div className="rental-card-top">
              <div>
                <h3 className="rental-bike-title">
                  <Link to={`/bikes/${bike._id}`} style={{ color: '#0f172a', textDecoration: 'none' }}>
                    {bike.brand} {bike.model}
                  </Link>
                </h3>
                <div className="rental-dates">
                  📅 {startDate} — {endDate} <span style={{ color: '#94a3b8' }}>({days} day{days > 1 ? 's' : ''})</span>
                </div>
              </div>

              <span className="status-pill" style={{ backgroundColor: style.bg, color: style.color }}>
                {style.label}
              </span>
            </div>

            {/* Exact Required Fields: Bike Name, Dates, Rental Amount, Deposit, Total Cash, Status */}
            <div className="rental-financials-bar">
              <div className="fin-item">
                <div className="fin-item-label">Rental Amount</div>
                <div className="fin-item-val">₹{booking.rentalAmount?.toLocaleString('en-IN') || 0}</div>
              </div>
              <div className="fin-item">
                <div className="fin-item-label">Security Deposit</div>
                <div className="fin-item-val">₹{booking.securityDeposit?.toLocaleString('en-IN') || 0}</div>
              </div>
              <div className="fin-item">
                <div className="fin-item-label">Total Cash</div>
                <div className="fin-item-val highlight">₹{booking.totalCash?.toLocaleString('en-IN') || 0}</div>
              </div>
            </div>

            {/* OTP Verification Box for CASH_PAYMENT_CONFIRMED */}
            {booking.status === 'CASH_PAYMENT_CONFIRMED' && (
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                padding: '12px 16px',
                borderRadius: '10px',
                marginBottom: '10px'
              }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#92400e', fontWeight: '600' }}>
                  🔑 Ready for Handover: Ask the owner for your 6-digit OTP code to start your trip!
                </p>
                <div className="otp-inline-box">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="6-digit OTP"
                    value={otpInputs[booking._id] || ''}
                    onChange={(e) => setOtpInputs({ ...otpInputs, [booking._id]: e.target.value })}
                    className="otp-input-dash"
                  />
                  <button
                    onClick={() => handleVerifyOtp(booking._id)}
                    disabled={otpLoading === booking._id}
                    className="action-btn action-btn-primary"
                  >
                    {otpLoading === booking._id ? 'Verifying...' : 'Verify OTP & Start Ride'}
                  </button>
                </div>
                {otpError[booking._id] && (
                  <p style={{ color: '#dc2626', fontSize: '12px', margin: '6px 0 0 0' }}>{otpError[booking._id]}</p>
                )}
              </div>
            )}

            {/* Review Display if already reviewed */}
            {myReview && (
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#334155'
              }}>
                <span>Your Review:</span>
                <StarRating rating={myReview.rating} size={14} />
                <span style={{ color: '#64748b', fontStyle: 'italic' }}>"{myReview.comment}"</span>
              </div>
            )}
          </div>
        </div>

        {/* Card Footer Actions & Contacts */}
        <div className="rental-card-footer">
          <div className="owner-contact-chip">
            <span>👤 Owner: <strong>{owner.name || 'Owner'}</strong></span>
            {owner.phone && <span>• 📞 {owner.phone}</span>}
          </div>

          <div className="actions-btn-group">
            {/* Inspection Actions */}
            {['CASH_PAYMENT_CONFIRMED', 'ACTIVE', 'COMPLETED', 'DISPUTED'].includes(booking.status) && (
              <>
                <button
                  onClick={() => handleOpenInspection(booking._id, 'BEFORE')}
                  className="action-btn action-btn-secondary"
                >
                  📷 {beforeIns ? 'View Pickup Photos' : 'Upload Pickup Photos'}
                </button>

                {['ACTIVE', 'COMPLETED', 'DISPUTED'].includes(booking.status) && (
                  <button
                    onClick={() => handleOpenInspection(booking._id, 'AFTER')}
                    className="action-btn action-btn-secondary"
                  >
                    📷 {afterIns ? 'View Return Photos' : 'Upload Return Photos'}
                  </button>
                )}
              </>
            )}

            {/* Review Button for COMPLETED rentals */}
            {booking.status === 'COMPLETED' && !myReview && (
              <button
                onClick={() => handleOpenReview(booking)}
                className="action-btn action-btn-warning"
              >
                ⭐ Rate & Review Owner
              </button>
            )}

            {/* Security Deposit Badge info */}
            {['CASH_PAYMENT_CONFIRMED', 'ACTIVE', 'COMPLETED', 'DISPUTED'].includes(booking.status) && (
              <Link to="/my-bookings" style={{ textDecoration: 'none' }}>
                <SecurityDepositBadge
                  status={booking.status === 'COMPLETED' ? 'REFUND_PENDING' : 'HELD_BY_OWNER'}
                  amount={booking.securityDeposit}
                />
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title-group">
          <h1>🚲 Renter Dashboard</h1>
          <p className="dashboard-subtitle">
            Welcome back, <strong>{user?.name}</strong>! Track all your active bookings, cash payments, and deposits.
          </p>
        </div>
        <Link to="/find-bikes" className="header-action-btn">
          🔍 Explore Available Bikes
        </Link>
      </div>

      {/* Messages */}
      {error && (
        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #fca5a5' }}>
          {error}
        </div>
      )}
      {successMsg && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #86efac' }}>
          {successMsg}
        </div>
      )}

      {/* Direct Cash Notice Banner */}
      <div className="cash-notice-box">
        <span style={{ fontSize: '20px' }}>💡</span>
        <div>
          <strong>Direct Cash Reminder:</strong> Rental amounts and security deposits are paid directly in cash to the bike owner during physical handover. Security deposits are returned in cash by the owner upon return.
        </div>
      </div>

      {/* Summary Stat Metric Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-icon-wrapper blue">🚴</div>
          <div className="stat-card-label">Active Rentals</div>
          <div className="stat-card-value">{summary.activeCount || 0}</div>
          <div className="stat-card-hint">Currently on the road</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon-wrapper amber">⏳</div>
          <div className="stat-card-label">Upcoming / Pending</div>
          <div className="stat-card-value">{summary.upcomingCount || 0}</div>
          <div className="stat-card-hint">Awaiting handover/approval</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon-wrapper emerald">🏁</div>
          <div className="stat-card-label">Completed Rentals</div>
          <div className="stat-card-value">{summary.completedCount || 0}</div>
          <div className="stat-card-hint">Finished successfully</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon-wrapper purple">📊</div>
          <div className="stat-card-label">Total Rentals</div>
          <div className="stat-card-value">{summary.totalRentals || 0}</div>
          <div className="stat-card-hint">All-time bookings</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon-wrapper slate">💵</div>
          <div className="stat-card-label">Total Cash Recorded</div>
          <div className="stat-card-value">₹{(summary.totalCashPaid || 0).toLocaleString('en-IN')}</div>
          <div className="stat-card-hint">Direct cash paid to owners</div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="tabs-header">
        <button
          className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          🚴 Active Rentals
          <span className="tab-badge">{summary.activeCount || 0}</span>
        </button>

        <button
          className={`tab-button ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          ⏳ Upcoming Rentals
          <span className="tab-badge">{summary.upcomingCount || 0}</span>
        </button>

        <button
          className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          🏁 Completed
          <span className="tab-badge">{summary.completedCount || 0}</span>
        </button>

        <button
          className={`tab-button ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          💵 Cash Payments
        </button>

        <button
          className={`tab-button ${activeTab === 'deposits' ? 'active' : ''}`}
          onClick={() => setActiveTab('deposits')}
        >
          🔒 Security Deposits
        </button>

        <button
          className={`tab-button ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          🔔 Notifications
          {unreadNotifCount > 0 && <span className="tab-badge" style={{ background: '#ef4444', color: '#ffffff' }}>{unreadNotifCount}</span>}
        </button>
      </div>

      {/* Tab 1: Active Rentals */}
      {activeTab === 'active' && (
        <div className="tab-pane">
          {activeBookings.length === 0 ? (
            <div className="empty-dashboard-card">
              <span className="empty-icon">🚴</span>
              <div className="empty-title">No Active Rentals</div>
              <p className="empty-desc">You do not have any active bike rides right now. Ready for an adventure?</p>
              <Link to="/find-bikes" className="header-action-btn">
                Browse Bikes for Rent
              </Link>
            </div>
          ) : (
            <div className="rentals-list">
              {activeBookings.map(renderRentalCard)}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Upcoming Rentals */}
      {activeTab === 'upcoming' && (
        <div className="tab-pane">
          {upcomingBookings.length === 0 ? (
            <div className="empty-dashboard-card">
              <span className="empty-icon">⏳</span>
              <div className="empty-title">No Upcoming Rentals</div>
              <p className="empty-desc">You don't have any pending requests or confirmed upcoming bookings.</p>
              <Link to="/find-bikes" className="header-action-btn">
                Find Your Next Ride
              </Link>
            </div>
          ) : (
            <div className="rentals-list">
              {upcomingBookings.map(renderRentalCard)}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Completed Rentals */}
      {activeTab === 'completed' && (
        <div className="tab-pane">
          {completedBookings.length === 0 ? (
            <div className="empty-dashboard-card">
              <span className="empty-icon">🏁</span>
              <div className="empty-title">No Completed Rentals Yet</div>
              <p className="empty-desc">Once you complete bike returns, your rental history and reviews will be shown here.</p>
            </div>
          ) : (
            <div className="rentals-list">
              {completedBookings.map(renderRentalCard)}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Cash Payment Records */}
      {activeTab === 'payments' && (
        <div className="tab-pane">
          <div className="ledger-table-wrapper">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Bike</th>
                  <th>Rental Amount</th>
                  <th>Deposit</th>
                  <th>Total Cash Handover</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {allBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                      No cash payment records found.
                    </td>
                  </tr>
                ) : (
                  allBookings.map((b) => (
                    <tr key={b._id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>#{b._id.slice(-6).toUpperCase()}</td>
                      <td>
                        <strong>{b.bike?.brand} {b.bike?.model}</strong>
                      </td>
                      <td>₹{b.rentalAmount?.toLocaleString('en-IN')}</td>
                      <td>₹{b.securityDeposit?.toLocaleString('en-IN')}</td>
                      <td><strong style={{ color: '#0284c7' }}>₹{b.totalCash?.toLocaleString('en-IN')}</strong></td>
                      <td><span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>CASH</span></td>
                      <td>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: '700',
                          backgroundColor: ['CASH_PAYMENT_CONFIRMED', 'ACTIVE', 'COMPLETED'].includes(b.status) ? '#dcfce7' : '#fef3c7',
                          color: ['CASH_PAYMENT_CONFIRMED', 'ACTIVE', 'COMPLETED'].includes(b.status) ? '#166534' : '#b45309'
                        }}>
                          {['CASH_PAYMENT_CONFIRMED', 'ACTIVE', 'COMPLETED'].includes(b.status) ? '✓ Paid to Owner' : '⧗ Pending Handover'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Security Deposit Records */}
      {activeTab === 'deposits' && (
        <div className="tab-pane">
          <div className="ledger-table-wrapper">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Bike</th>
                  <th>Deposit Amount</th>
                  <th>Refund Method</th>
                  <th>Current Deposit Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {allBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                      No security deposit records found.
                    </td>
                  </tr>
                ) : (
                  allBookings.map((b) => {
                    const depRecord = securityDeposits.find(d => d.booking === b._id || d.booking?._id === b._id)
                    const status = depRecord?.status || (b.status === 'COMPLETED' ? 'REFUND_PENDING' : 'HELD_BY_OWNER')
                    return (
                      <tr key={b._id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>#{b._id.slice(-6).toUpperCase()}</td>
                        <td><strong>{b.bike?.brand} {b.bike?.model}</strong></td>
                        <td><strong style={{ color: '#0f172a' }}>₹{b.securityDeposit?.toLocaleString('en-IN')}</strong></td>
                        <td><span style={{ color: '#475569' }}>Direct Cash</span></td>
                        <td>
                          <SecurityDepositBadge status={status} amount={b.securityDeposit} />
                        </td>
                        <td style={{ color: '#64748b', fontSize: '12.5px' }}>
                          {status === 'REFUNDED_DIRECTLY_BY_OWNER'
                            ? '✓ Refunded directly in cash by owner'
                            : (b.status === 'COMPLETED'
                              ? 'Return complete. Collect cash refund from owner.'
                              : 'Held in cash by owner during active rental.')}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: Notifications Panel */}
      {activeTab === 'notifications' && (
        <div className="tab-pane">
          <div className="notif-panel-card">
            <div className="notif-panel-header">
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Notifications ({notifications.length})</h3>
              {unreadNotifCount > 0 && (
                <button
                  onClick={handleMarkAllNotifsRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0284c7',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  ✓ Mark all as read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                <p>No notifications yet.</p>
              </div>
            ) : (
              <div>
                {notifications.map((notif) => (
                  <div
                    key={notif._id}
                    onClick={() => handleMarkNotifRead(notif)}
                    className={`notif-item ${notif.isRead ? '' : 'unread'}`}
                  >
                    <span className="notif-icon">{notifIcons[notif.type] || '🔔'}</span>
                    <div className="notif-content">
                      <div className="notif-title">{notif.title}</div>
                      <div className="notif-msg">{notif.message}</div>
                      <div className="notif-time">{timeAgo(notif.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <InspectionModal
        isOpen={isInspectionModalOpen}
        onClose={() => setIsInspectionModalOpen(false)}
        bookingId={modalBookingId}
        phase={modalPhase}
        onSuccess={handleInspectionUploaded}
      />

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        booking={reviewBooking}
        userRole="renter"
        onSuccess={handleReviewSubmitted}
      />
    </div>
  )
}
