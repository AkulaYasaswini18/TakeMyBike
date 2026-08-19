import React, { useEffect, useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthContext from '../context/AuthContext'
import * as bookingService from '../services/bookingService'
import * as bikeService from '../services/bikeService'
import * as reviewService from '../services/reviewService'
import ReturnModal from '../components/booking/ReturnModal'
import InspectionModal from '../components/booking/InspectionModal'
import SecurityDepositBadge from '../components/booking/SecurityDepositBadge'
import ReviewModal from '../components/reviews/ReviewModal'
import StarRating from '../components/common/StarRating'
import './OwnerDashboard.css'

const statusStyles = {
  PENDING: { bg: '#fff3cd', color: '#856404', label: '⧗ Approval Pending' },
  APPROVED: { bg: '#d1ecf1', color: '#0c5460', label: '✓ Approved' },
  REJECTED: { bg: '#fee2e2', color: '#b91c1c', label: '✗ Rejected' },
  CASH_PAYMENT_PENDING: { bg: '#e0f2fe', color: '#0369a1', label: '💵 Cash Payment Pending' },
  CASH_PAYMENT_CONFIRMED: { bg: '#fef3c7', color: '#b45309', label: '🔑 Ready for Handover OTP' },
  ACTIVE: { bg: '#dcfce7', color: '#15803d', label: '🚴 Rental Active' },
  COMPLETED: { bg: '#f3f4f6', color: '#374151', label: '✓ Completed' },
  CANCELLED: { bg: '#fee2e2', color: '#b91c1c', label: '✗ Cancelled' },
  DISPUTED: { bg: '#fee2e2', color: '#b91c1c', label: '⚠️ Disputed (Damage Flagged)' }
}

export default function OwnerDashboard() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('overview')
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  // Generated OTPs map
  const [generatedOtps, setGeneratedOtps] = useState({})

  // Modals state
  const [returnBooking, setReturnBooking] = useState(null)
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)

  const [modalBookingId, setModalBookingId] = useState(null)
  const [modalPhase, setModalPhase] = useState('BEFORE')
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false)

  const [reviewBooking, setReviewBooking] = useState(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const data = await bookingService.getOwnerDashboard()
      setDashboardData(data)

      // Initialize OTPs from bookings
      const otps = {}
      ;(data.bookings || []).forEach(b => {
        if (b.otp) otps[b._id] = b.otp
      })
      setGeneratedOtps(otps)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load owner dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (bookingId) => {
    setActionLoading(bookingId)
    setError(null)
    setSuccessMsg(null)
    try {
      await bookingService.approveBooking(bookingId)
      setSuccessMsg('✓ Booking request approved! Waiting for cash payment handover from renter.')
      await loadDashboard()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve booking')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (bookingId) => {
    if (!window.confirm('Are you sure you want to reject this booking request?')) return
    setActionLoading(bookingId)
    setError(null)
    setSuccessMsg(null)
    try {
      await bookingService.rejectBooking(bookingId)
      setSuccessMsg('Booking request rejected.')
      await loadDashboard()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject booking')
    } finally {
      setActionLoading(null)
    }
  }

  const handleConfirmCashPayment = async (bookingId) => {
    if (!window.confirm('Confirm that you have physically received the cash payment (Rental fee + Security deposit) from the renter?')) return
    setActionLoading(bookingId)
    setError(null)
    setSuccessMsg(null)
    try {
      const res = await bookingService.confirmCashPayment(bookingId)
      if (res.booking?.otp) {
        setGeneratedOtps(prev => ({ ...prev, [bookingId]: res.booking.otp }))
      }
      setSuccessMsg('💵 Cash payment confirmed! You can now generate/share the Handover OTP.')
      await loadDashboard()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to confirm cash payment')
    } finally {
      setActionLoading(null)
    }
  }

  const handleGenerateOtp = async (bookingId) => {
    setActionLoading(bookingId)
    setError(null)
    try {
      const res = await bookingService.generateOtp(bookingId)
      setGeneratedOtps(prev => ({ ...prev, [bookingId]: res.otp }))
      setSuccessMsg(`🔑 Handover OTP generated: ${res.otp}. Share this code with the renter to start their ride.`)
      await loadDashboard()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate OTP')
    } finally {
      setActionLoading(null)
    }
  }

  const handleOpenReturnModal = (booking) => {
    setReturnBooking(booking)
    setIsReturnModalOpen(true)
  }

  const handleReturnSuccess = async (result) => {
    setIsReturnModalOpen(false)
    if (result.dispute) {
      setSuccessMsg('⚠️ Return recorded with damage flagged. Security deposit is withheld in dispute.')
    } else {
      setSuccessMsg('🎉 Bike return completed successfully! You can now return the security deposit in cash to the renter.')
    }
    await loadDashboard()
  }

  const handleRefundDeposit = async (bookingId, depositAmount) => {
    if (!window.confirm(`Confirm that you have returned the ₹${depositAmount} security deposit in cash directly to the renter?`)) return
    setActionLoading(`refund-${bookingId}`)
    setError(null)
    try {
      await bookingService.refundDeposit(bookingId, 'Security deposit returned directly in cash upon return inspection')
      setSuccessMsg('🔒 Security deposit marked as refunded directly in cash.')
      await loadDashboard()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record deposit refund')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteBike = async (bikeId) => {
    if (!window.confirm('Are you sure you want to delete this bike? This action cannot be undone.')) return
    try {
      await bikeService.deleteBike(bikeId)
      setSuccessMsg('Bike listing deleted successfully.')
      await loadDashboard()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete bike')
    }
  }

  const handleOpenInspection = (bookingId, phase) => {
    setModalBookingId(bookingId)
    setModalPhase(phase)
    setIsInspectionModalOpen(true)
  }

  const handleOpenReview = (booking) => {
    setReviewBooking(booking)
    setIsReviewModalOpen(true)
  }

  if (loading) {
    return (
      <div className="owner-dash-container">
        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏍️</div>
          <p style={{ fontSize: '18px', fontWeight: '600' }}>Loading your Owner Dashboard...</p>
        </div>
      </div>
    )
  }

  const summary = dashboardData?.summary || {}
  const bikes = dashboardData?.bikes || []
  const allBookings = dashboardData?.bookings || []
  const pendingRequests = dashboardData?.pendingRequests || []
  const activeBookings = dashboardData?.activeBookings || []
  const completedBookings = dashboardData?.completedBookings || []
  const actionRequiredBookings = dashboardData?.actionRequiredBookings || []
  const cashPayments = dashboardData?.cashPayments || []
  const securityDeposits = dashboardData?.securityDeposits || []
  const reviews = dashboardData?.reviews || []

  const renderBookingCard = (booking) => {
    const style = statusStyles[booking.status] || { bg: '#f1f5f9', color: '#475569', label: booking.status }
    const bike = booking.bike || {}
    const renter = booking.renter || {}
    const otp = generatedOtps[booking._id] || booking.otp

    const startDate = new Date(booking.startDate).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
    const endDate = new Date(booking.endDate).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
    const days = Math.max(1, Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24)))

    const depRecord = securityDeposits.find(d => d.booking === booking._id || d.booking?._id === booking._id)
    const isDepositRefunded = depRecord?.status === 'REFUNDED_DIRECTLY_BY_OWNER'

    return (
      <div key={booking._id} className="request-card">
        <div className="request-card-header">
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0f172a' }}>
              {bike.brand} {bike.model}
            </h3>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              Booking #{booking._id.slice(-6).toUpperCase()} • Requested on {new Date(booking.createdAt).toLocaleDateString('en-IN')}
            </span>
          </div>

          <span className="status-pill" style={{ backgroundColor: style.bg, color: style.color }}>
            {style.label}
          </span>
        </div>

        <div className="request-card-body">
          <div className="request-details-grid">
            <div className="request-detail-box">
              <div className="request-detail-title">Renter Details</div>
              <div className="request-detail-val">{renter.name || 'Renter'}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                📞 {renter.phone || 'No phone'} {renter.rating ? `• ⭐ ${renter.rating.toFixed(1)}` : ''}
              </div>
            </div>

            <div className="request-detail-box">
              <div className="request-detail-title">Rental Period</div>
              <div className="request-detail-val">{startDate} — {endDate}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Total Duration: {days} day{days > 1 ? 's' : ''}
              </div>
            </div>

            <div className="request-detail-box">
              <div className="request-detail-title">Rental Fee</div>
              <div className="request-detail-val" style={{ color: '#059669' }}>
                ₹{booking.rentalAmount?.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                Your direct earnings upon completion
              </div>
            </div>

            <div className="request-detail-box">
              <div className="request-detail-title">Security Deposit</div>
              <div className="request-detail-val">₹{booking.securityDeposit?.toLocaleString('en-IN')}</div>
              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                Held by you during rental
              </div>
            </div>

            <div className="request-detail-box" style={{ background: '#e0f2fe', borderColor: '#bae6fd' }}>
              <div className="request-detail-title" style={{ color: '#0369a1' }}>Total Direct Cash</div>
              <div className="request-detail-val" style={{ color: '#0284c7' }}>
                ₹{booking.totalCash?.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '11.5px', color: '#0369a1', marginTop: '2px' }}>
                Paid directly in cash by renter
              </div>
            </div>
          </div>

          {/* OTP Box if generated */}
          {otp && (
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              padding: '10px 16px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <div>
                <span style={{ fontSize: '12.5px', color: '#065f46', fontWeight: '600' }}>🔑 Handover OTP Code:</span>
                <strong style={{ fontSize: '18px', color: '#047857', marginLeft: '10px', letterSpacing: '2px' }}>{otp}</strong>
              </div>
              <span style={{ fontSize: '12px', color: '#047857' }}>Share this with the renter</span>
            </div>
          )}
        </div>

        {/* Action Buttons for Owner */}
        <div className="request-actions-bar">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {['CASH_PAYMENT_CONFIRMED', 'ACTIVE', 'COMPLETED', 'DISPUTED'].includes(booking.status) && (
              <button
                onClick={() => handleOpenInspection(booking._id, 'BEFORE')}
                className="action-btn action-btn-secondary"
              >
                📷 Pickup Photos
              </button>
            )}
            {['ACTIVE', 'COMPLETED', 'DISPUTED'].includes(booking.status) && (
              <button
                onClick={() => handleOpenInspection(booking._id, 'AFTER')}
                className="action-btn action-btn-secondary"
              >
                📷 Return Photos
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* PENDING: Accept / Reject */}
            {booking.status === 'PENDING' && (
              <>
                <button
                  onClick={() => handleApprove(booking._id)}
                  disabled={actionLoading === booking._id}
                  className="btn-approve"
                >
                  ✓ Accept Request
                </button>
                <button
                  onClick={() => handleReject(booking._id)}
                  disabled={actionLoading === booking._id}
                  className="btn-reject"
                >
                  ✕ Reject
                </button>
              </>
            )}

            {/* CASH_PAYMENT_PENDING: Confirm cash handover */}
            {booking.status === 'CASH_PAYMENT_PENDING' && (
              <button
                onClick={() => handleConfirmCashPayment(booking._id)}
                disabled={actionLoading === booking._id}
                className="btn-confirm-cash"
              >
                💵 Confirm Cash Received (₹{booking.totalCash})
              </button>
            )}

            {/* CASH_PAYMENT_CONFIRMED: Generate / view OTP */}
            {booking.status === 'CASH_PAYMENT_CONFIRMED' && (
              <button
                onClick={() => handleGenerateOtp(booking._id)}
                disabled={actionLoading === booking._id}
                className="btn-otp-gen"
              >
                🔑 {otp ? 'Regenerate OTP' : 'Generate Handover OTP'}
              </button>
            )}

            {/* ACTIVE: Complete return inspection & checklist */}
            {booking.status === 'ACTIVE' && (
              <button
                onClick={() => handleOpenReturnModal(booking)}
                className="btn-return-complete"
              >
                🏁 Complete Bike Return
              </button>
            )}

            {/* COMPLETED: Refund security deposit if not yet refunded */}
            {booking.status === 'COMPLETED' && (
              <>
                {!isDepositRefunded ? (
                  <button
                    onClick={() => handleRefundDeposit(booking._id, booking.securityDeposit)}
                    disabled={actionLoading === `refund-${booking._id}`}
                    className="btn-refund-deposit"
                  >
                    🔒 Confirm Security Deposit Refunded (₹{booking.securityDeposit})
                  </button>
                ) : (
                  <span style={{ fontSize: '13px', color: '#0d9488', fontWeight: '600' }}>
                    ✓ Security Deposit Refunded in Cash
                  </span>
                )}
                <button
                  onClick={() => handleOpenReview(booking)}
                  className="action-btn action-btn-warning"
                >
                  ⭐ Review Renter
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="owner-dash-container">
      {/* Header */}
      <div className="owner-dash-header">
        <div className="owner-dash-title-group">
          <h1>🏍️ Owner Dashboard</h1>
          <p className="owner-dash-subtitle">
            Welcome, <strong>{user?.name}</strong>! Manage your bike listings, rental requests, cash earnings, and reviews.
          </p>
        </div>
        <div className="owner-header-actions">
          <Link to={`/user/${user?._id}`} className="action-btn action-btn-secondary" style={{ padding: '9px 16px', borderRadius: '10px' }}>
            👤 Public Profile
          </Link>
          <Link to="/add-bike" className="btn-add-bike-dash">
            + Add New Bike
          </Link>
        </div>
      </div>

      {/* Alert Messages */}
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

      {/* Total Earnings Highlight Card (Recorded Cash Disclaimer) */}
      <div className="earnings-highlight-card">
        <div className="earnings-left">
          <span className="earnings-tag">Direct Cash Earnings Summary</span>
          <div className="earnings-amount">
            ₹{(summary.totalEarnings || 0).toLocaleString('en-IN')}
          </div>
          <div className="earnings-disclaimer">
            <strong>* Recorded Direct Cash Earnings:</strong> All rental transactions and security deposits are paid directly in cash between the renter and owner during physical handover. This is a <em>recorded calculation</em> of your completed rentals, not money held by the platform.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <div className="earnings-badge-pill">
            <div className="earnings-badge-pill-title">Completed Rentals</div>
            <div className="earnings-badge-pill-val">{summary.completedRentalsCount || 0}</div>
          </div>
          <div className="earnings-badge-pill">
            <div className="earnings-badge-pill-title">Active Rentals</div>
            <div className="earnings-badge-pill-val" style={{ color: '#38bdf8' }}>{summary.activeRentals || 0}</div>
          </div>
          <div className="earnings-badge-pill">
            <div className="earnings-badge-pill-title">Owner Rating</div>
            <div className="earnings-badge-pill-val" style={{ color: '#fbbf24' }}>
              ⭐ {Number(summary.averageRating || 0).toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="owner-stat-grid">
        <div className="owner-stat-card">
          <div className="owner-stat-icon">🏍️</div>
          <div className="owner-stat-label">Listed Bikes</div>
          <div className="owner-stat-val">{summary.totalBikes || 0}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            {summary.approvedBikes || 0} approved, {summary.availableBikes || 0} available
          </div>
        </div>

        <div className="owner-stat-card">
          <div className="owner-stat-icon">⏳</div>
          <div className="owner-stat-label">Pending Requests</div>
          <div className="owner-stat-val" style={{ color: summary.pendingRequestsCount > 0 ? '#d97706' : '#0f172a' }}>
            {summary.pendingRequestsCount || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Needs your accept/reject
          </div>
        </div>

        <div className="owner-stat-card">
          <div className="owner-stat-icon">🚴</div>
          <div className="owner-stat-label">Active Rentals</div>
          <div className="owner-stat-val" style={{ color: '#0284c7' }}>{summary.activeRentals || 0}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Bikes currently out
          </div>
        </div>

        <div className="owner-stat-card">
          <div className="owner-stat-icon">🏁</div>
          <div className="owner-stat-label">Completed</div>
          <div className="owner-stat-val" style={{ color: '#16a34a' }}>{summary.completedRentalsCount || 0}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Finished rentals
          </div>
        </div>

        <div className="owner-stat-card">
          <div className="owner-stat-icon">⭐</div>
          <div className="owner-stat-label">Reviews Received</div>
          <div className="owner-stat-val">{summary.totalReviews || 0}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Average: {Number(summary.averageRating || 0).toFixed(1)} / 5.0
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="owner-tabs">
        <button
          className={`owner-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          ⚡ Action Center & Overview
          {(summary.pendingRequestsCount > 0 || (summary.cashPaymentPendingCount || 0) > 0) && (
            <span className="owner-tab-badge" style={{ background: '#f59e0b', color: '#ffffff' }}>
              {(summary.pendingRequestsCount || 0) + (summary.cashPaymentPendingCount || 0)}
            </span>
          )}
        </button>

        <button
          className={`owner-tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          📋 Rental Requests & Bookings
          <span className="owner-tab-badge">{allBookings.length}</span>
        </button>

        <button
          className={`owner-tab-btn ${activeTab === 'bikes' ? 'active' : ''}`}
          onClick={() => setActiveTab('bikes')}
        >
          🏍️ My Listed Bikes
          <span className="owner-tab-badge">{bikes.length}</span>
        </button>

        <button
          className={`owner-tab-btn ${activeTab === 'cash' ? 'active' : ''}`}
          onClick={() => setActiveTab('cash')}
        >
          💵 Cash & Deposit Ledgers
        </button>

        <button
          className={`owner-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          ⭐ Reviews Received
          <span className="owner-tab-badge">{reviews.length}</span>
        </button>
      </div>

      {/* Tab 1: Overview & Action Center */}
      {activeTab === 'overview' && (
        <div>
          {/* Pending Requests Alert section */}
          {pendingRequests.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#b45309', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ⚠️ Pending Rental Requests Requiring Your Approval ({pendingRequests.length})
              </h3>
              <div className="requests-list">
                {pendingRequests.map(renderBookingCard)}
              </div>
            </div>
          )}

          {/* Action Required (Cash pending / Ready for OTP) */}
          {actionRequiredBookings.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0369a1', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🔑 Handover & Cash Confirmations Needed ({actionRequiredBookings.length})
              </h3>
              <div className="requests-list">
                {actionRequiredBookings.map(renderBookingCard)}
              </div>
            </div>
          )}

          {/* Active Rentals section */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🚴 Currently Active Rides ({activeBookings.length})
            </h3>
            {activeBookings.length === 0 ? (
              <div className="empty-dashboard-card" style={{ padding: '32px' }}>
                <p style={{ margin: 0, color: '#64748b' }}>No bikes are currently out on rent.</p>
              </div>
            ) : (
              <div className="requests-list">
                {activeBookings.map(renderBookingCard)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: All Rental Requests & Bookings */}
      {activeTab === 'requests' && (
        <div>
          {allBookings.length === 0 ? (
            <div className="empty-dashboard-card">
              <span className="empty-icon">📋</span>
              <div className="empty-title">No Rental Requests Yet</div>
              <p className="empty-desc">When renters request to book your bikes, their requests will appear here with Accept/Reject actions.</p>
            </div>
          ) : (
            <div className="requests-list">
              {allBookings.map(renderBookingCard)}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Bike Management */}
      {activeTab === 'bikes' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>My Listed Bikes ({bikes.length})</h3>
            <Link to="/add-bike" className="btn-add-bike-dash" style={{ fontSize: '13px', padding: '8px 14px' }}>
              + Add Another Bike
            </Link>
          </div>

          {bikes.length === 0 ? (
            <div className="empty-dashboard-card">
              <span className="empty-icon">🏍️</span>
              <div className="empty-title">You Haven't Listed Any Bikes Yet</div>
              <p className="empty-desc">List your bikes to start receiving rental requests and earning direct cash.</p>
              <Link to="/add-bike" className="btn-add-bike-dash">
                + List Your First Bike
              </Link>
            </div>
          ) : (
            <div className="bikes-manage-grid">
              {bikes.map(bike => {
                const imgUrl = bike.images && bike.images.length > 0
                  ? (bike.images[0].startsWith('http') ? bike.images[0] : `http://localhost:5000/${bike.images[0]}`)
                  : null

                return (
                  <div key={bike._id} className="bike-manage-card">
                    {imgUrl ? (
                      <img src={imgUrl} alt={bike.brand} className="bike-manage-thumb" />
                    ) : (
                      <div className="bike-manage-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>
                        🏍️
                      </div>
                    )}

                    <div className="bike-manage-content">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                        <h4 className="bike-manage-title">{bike.brand} {bike.model}</h4>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '9999px',
                          backgroundColor: bike.isApproved ? '#dcfce7' : '#fef3c7',
                          color: bike.isApproved ? '#15803d' : '#b45309'
                        }}>
                          {bike.isApproved ? '✓ Approved' : '⧗ Pending Approval'}
                        </span>
                      </div>

                      <div className="bike-manage-meta">
                        {bike.type || 'Standard'} • {bike.year || 'N/A'} • {bike.city || bike.location || 'Location not set'}
                      </div>

                      <div className="bike-manage-rates">
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Daily Price</span>
                          <strong>₹{bike.pricePerDay}/day</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Deposit</span>
                          <strong>₹{bike.securityDeposit || 0}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Status</span>
                          <strong style={{ color: bike.isAvailable ? '#16a34a' : '#ea580c' }}>
                            {bike.isAvailable ? 'Available' : 'Rented Out'}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="bike-manage-footer">
                      <Link to={`/bikes/${bike._id}`} className="action-btn action-btn-secondary" style={{ fontSize: '12px', padding: '5px 10px' }}>
                        View Public
                      </Link>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Link to={`/add-bike/${bike._id}`} className="action-btn action-btn-secondary" style={{ fontSize: '12px', padding: '5px 10px' }}>
                          ✏️ Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteBike(bike._id)}
                          className="action-btn"
                          style={{ fontSize: '12px', padding: '5px 10px', background: '#fee2e2', color: '#b91c1c' }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Cash & Deposit Ledgers */}
      {activeTab === 'cash' && (
        <div>
          <div className="ledger-table-wrapper" style={{ marginBottom: '24px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>💵 Cash Collections & Earnings Breakdown</h3>
            </div>
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Bike</th>
                  <th>Renter</th>
                  <th>Rental Earnings</th>
                  <th>Security Deposit</th>
                  <th>Total Handover</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {allBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                      No cash transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  allBookings.map(b => (
                    <tr key={b._id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>#{b._id.slice(-6).toUpperCase()}</td>
                      <td><strong>{b.bike?.brand} {b.bike?.model}</strong></td>
                      <td>{b.renter?.name || 'Renter'}</td>
                      <td><strong style={{ color: '#059669' }}>₹{b.rentalAmount?.toLocaleString('en-IN')}</strong></td>
                      <td>₹{b.securityDeposit?.toLocaleString('en-IN')}</td>
                      <td><strong>₹{b.totalCash?.toLocaleString('en-IN')}</strong></td>
                      <td>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: '700',
                          backgroundColor: b.status === 'COMPLETED' ? '#dcfce7' : '#f1f5f9',
                          color: b.status === 'COMPLETED' ? '#166534' : '#475569'
                        }}>
                          {b.status === 'COMPLETED' ? '✓ Completed & Recorded' : b.status}
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

      {/* Tab 5: Reviews Received */}
      {activeTab === 'reviews' && (
        <div>
          {reviews.length === 0 ? (
            <div className="empty-dashboard-card">
              <span className="empty-icon">⭐</span>
              <div className="empty-title">No Reviews Received Yet</div>
              <p className="empty-desc">Once renters complete bike returns, their ratings and reviews for you and your bikes will be showcased here.</p>
            </div>
          ) : (
            <div className="reviews-grid">
              {reviews.map(rev => (
                <div key={rev._id} className="review-item-card">
                  <div className="review-card-header">
                    <div>
                      <div className="review-user-name">{rev.fromUser?.name || 'Renter'}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <StarRating rating={rev.rating || rev.overallRating} size={16} />
                  </div>

                  {rev.bike && (
                    <div className="review-bike-tag">
                      🏍️ Bike: <strong>{rev.bike.brand} {rev.bike.model}</strong>
                    </div>
                  )}

                  {rev.comment && (
                    <p className="review-comment-text">"{rev.comment}"</p>
                  )}

                  <div className="breakdown-ratings">
                    {rev.bikeConditionRating && <span>Bike: <strong>{rev.bikeConditionRating}/5</strong></span>}
                    {rev.ownerRating && <span>Owner: <strong>{rev.ownerRating}/5</strong></span>}
                    {rev.overallRating && <span>Overall: <strong>{rev.overallRating}/5</strong></span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <ReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        booking={returnBooking}
        onSuccess={handleReturnSuccess}
      />

      <InspectionModal
        isOpen={isInspectionModalOpen}
        onClose={() => setIsInspectionModalOpen(false)}
        bookingId={modalBookingId}
        phase={modalPhase}
        onSuccess={() => loadDashboard()}
      />

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        booking={reviewBooking}
        userRole="owner"
        onSuccess={() => {
          setSuccessMsg('⭐ Review submitted successfully!')
          loadDashboard()
        }}
      />
    </div>
  )
}
