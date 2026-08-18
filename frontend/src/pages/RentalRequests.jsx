import React, { useEffect, useState, useContext } from 'react'
import AuthContext from '../context/AuthContext'
import * as bookingService from '../services/bookingService'
import * as reviewService from '../services/reviewService'
import BookingTimeline from '../components/booking/BookingTimeline'
import InspectionModal from '../components/booking/InspectionModal'
import ReturnModal from '../components/booking/ReturnModal'
import SecurityDepositBadge from '../components/booking/SecurityDepositBadge'
import ReviewModal from '../components/reviews/ReviewModal'
import StarRating from '../components/common/StarRating'

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

export default function RentalRequests() {
  const { user } = useContext(AuthContext)
  const [bookings, setBookings] = useState([])
  const [inspectionsMap, setInspectionsMap] = useState({})
  const [depositsMap, setDepositsMap] = useState({})
  const [reviewsMap, setReviewsMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [refundLoading, setRefundLoading] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [generatedOtps, setGeneratedOtps] = useState({})

  // Inspection modal state
  const [modalBookingId, setModalBookingId] = useState(null)
  const [modalPhase, setModalPhase] = useState('BEFORE')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Return modal state
  const [returnBooking, setReturnBooking] = useState(null)
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)

  // Review modal state
  const [reviewBooking, setReviewBooking] = useState(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    try {
      const data = await bookingService.getOwnerBookings()
      const list = data.bookings || []
      setBookings(list)

      // Initialize existing OTPs from booking objects
      const otps = {}
      list.forEach(b => {
        if (b.otp) otps[b._id] = b.otp
      })
      setGeneratedOtps(otps)

      // Load inspections, deposits, and reviews for relevant bookings
      const insMap = {}
      const depMap = {}
      const revMap = {}

      await Promise.all(
        list.map(async (b) => {
          if (['CASH_PAYMENT_CONFIRMED', 'ACTIVE', 'COMPLETED', 'DISPUTED'].includes(b.status)) {
            try {
              const res = await bookingService.getInspections(b._id)
              insMap[b._id] = res.inspections || []
            } catch (e) {}

            try {
              const depRes = await bookingService.getBookingDeposit(b._id)
              if (depRes.securityDeposit) {
                depMap[b._id] = depRes.securityDeposit
              }
            } catch (e) {}

            if (b.status === 'COMPLETED') {
              try {
                const revRes = await reviewService.getBookingReviews(b._id)
                const myRev = (revRes.reviews || []).find(r => r.fromUser?._id === user?._id || r.fromUser === user?._id)
                if (myRev) {
                  revMap[b._id] = myRev
                }
              } catch (e) {}
            }
          }
        })
      )
      setInspectionsMap(insMap)
      setDepositsMap(depMap)
      setReviewsMap(revMap)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load requests')
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
      setBookings(prev => prev.map(b =>
        b._id === bookingId ? { ...b, status: 'CASH_PAYMENT_PENDING' } : b
      ))
      setSuccessMsg('Booking approved! Waiting for cash payment handover from renter.')
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
      setBookings(prev => prev.map(b =>
        b._id === bookingId ? { ...b, status: 'REJECTED' } : b
      ))
      setSuccessMsg('Booking rejected.')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject booking')
    } finally {
      setActionLoading(null)
    }
  }

  const handleConfirmCashPayment = async (bookingId) => {
    if (!window.confirm('Have you received the cash payment directly from the renter in person?')) return

    setActionLoading(bookingId)
    setError(null)
    setSuccessMsg(null)
    try {
      await bookingService.confirmCashPayment(bookingId)
      setBookings(prev => prev.map(b =>
        b._id === bookingId ? { ...b, status: 'CASH_PAYMENT_CONFIRMED' } : b
      ))
      setSuccessMsg('Cash payment confirmed successfully! You can now generate the Handover OTP.')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to confirm cash payment')
    } finally {
      setActionLoading(null)
    }
  }

  const handleGenerateOtp = async (bookingId) => {
    setActionLoading(bookingId)
    setError(null)
    setSuccessMsg(null)
    try {
      const res = await bookingService.generateOtp(bookingId)
      setGeneratedOtps(prev => ({ ...prev, [bookingId]: res.otp }))
      setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, otp: res.otp } : b))
      setSuccessMsg(`Handover OTP generated: ${res.otp}. Please share this code in person with the renter at bike handover.`)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate OTP')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRefundDeposit = async (bookingId, depositId) => {
    if (!window.confirm('Confirm that you have returned the cash deposit directly to the renter in person?')) return

    setRefundLoading(bookingId)
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await bookingService.refundDeposit(depositId || bookingId)
      setDepositsMap(prev => ({
        ...prev,
        [bookingId]: res.securityDeposit
      }))
      setSuccessMsg('✓ Security deposit marked as refunded directly by owner in cash!')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark security deposit as refunded')
    } finally {
      setRefundLoading(null)
    }
  }

  const handleOpenUpload = (bookingId, phase) => {
    setModalBookingId(bookingId)
    setModalPhase(phase)
    setIsModalOpen(true)
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

  const handleOpenReturnModal = (booking) => {
    setReturnBooking(booking)
    setIsReturnModalOpen(true)
  }

  const handleReturnSuccess = (res) => {
    const updated = res.booking
    setBookings(prev => prev.map(b => b._id === updated._id ? updated : b))
    if (res.securityDeposit) {
      setDepositsMap(prev => ({ ...prev, [updated._id]: res.securityDeposit }))
    }
    setSuccessMsg(res.message || 'Bike return processed successfully!')
    loadBookings()
  }

  const handleOpenReviewModal = (booking) => {
    setReviewBooking(booking)
    setIsReviewModalOpen(true)
  }

  const handleReviewSubmitted = (newReview) => {
    if (reviewBooking) {
      setReviewsMap(prev => ({ ...prev, [reviewBooking._id]: newReview }))
      setSuccessMsg('⭐ Rating submitted for the renter successfully!')
    }
  }

  if (!user || user.role !== 'owner') {
    return (
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          padding: '20px',
          backgroundColor: '#fee2e2',
          color: '#b91c1c',
          borderRadius: '8px',
          fontWeight: '500'
        }}>
          Only bike owners can view rental requests.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', maxWidth: '1200px', margin: '0 auto' }}>
        <p style={{ fontSize: '18px', color: '#4b5563', fontWeight: '500' }}>Loading rental requests...</p>
      </div>
    )
  }

  const pendingBookings = bookings.filter(b => b.status === 'PENDING')
  const cashPendingBookings = bookings.filter(b => b.status === 'CASH_PAYMENT_PENDING')
  const handoverBookings = bookings.filter(b => b.status === 'CASH_PAYMENT_CONFIRMED')
  const activeBookings = bookings.filter(b => b.status === 'ACTIVE')
  const otherBookings = bookings.filter(b => ['COMPLETED', 'DISPUTED', 'REJECTED', 'CANCELLED'].includes(b.status))

  return (
    <div style={{ padding: '30px 20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 6px 0', fontSize: '28px', color: '#111827' }}>Rental Requests & Returns Management</h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Manage bookings, cash payments, OTP handovers, return inspections, deposit refunds, and reviews</p>
      </div>

      {successMsg && (
        <div style={{
          padding: '14px 18px',
          backgroundColor: '#ecfdf5',
          color: '#065f46',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #a7f3d0',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {successMsg}
        </div>
      )}

      {error && (
        <div style={{
          padding: '14px 18px',
          backgroundColor: '#fee2e2',
          color: '#b91c1c',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #fca5a5',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {bookings.length === 0 ? (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          border: '1px dashed #d1d5db',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
          <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>No rental requests yet</h3>
          <p style={{ fontSize: '14px', margin: 0 }}>Incoming requests for your bikes will appear here.</p>
        </div>
      ) : (
        <>
          {/* Section 1: Active Rentals (ACTIVE) - Ready for Return */}
          {activeBookings.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '22px' }}>🚴</span>
                <h2 style={{ margin: 0, fontSize: '20px', color: '#15803d', fontWeight: '700' }}>
                  Active Rentals In Progress ({activeBookings.length})
                </h2>
              </div>

              <div style={{ display: 'grid', gap: '20px' }}>
                {activeBookings.map(booking => {
                  const bikeImage = booking.bike?.images?.[0] || '/placeholder.png'
                  const inspections = inspectionsMap[booking._id] || []
                  const deposit = depositsMap[booking._id]

                  return (
                    <div
                      key={booking._id}
                      style={{
                        border: '2px solid #22c55e',
                        borderRadius: '16px',
                        padding: '24px',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 4px 12px rgba(34, 197, 94, 0.12)'
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '24px' }}>
                        <div>
                          <img
                            src={bikeImage}
                            alt="bike"
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22150%22%3E%3Crect fill=%22%23e5e7eb%22 width=%22150%22 height=%22150%22/%3E%3Ctext fill=%22%239ca3af%22 font-family=%22sans-serif%22 font-size=%2214%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3EBike Image%3C/text%3E%3C/svg%3E'
                            }}
                            style={{
                              width: '150px',
                              height: '150px',
                              objectFit: 'cover',
                              borderRadius: '10px',
                              border: '1px solid #e2e8f0'
                            }}
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div>
                              <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#0f172a', fontWeight: '700' }}>
                                {booking.bike?.brand} {booking.bike?.model}
                              </h3>
                              <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                                Renter: <strong>{booking.renter?.name}</strong> ({booking.renter?.phone}) • Started: {booking.rentalStartTime ? new Date(booking.rentalStartTime).toLocaleString() : 'Active'}
                              </p>
                            </div>
                            <span style={{
                              padding: '6px 14px',
                              backgroundColor: '#dcfce7',
                              color: '#15803d',
                              borderRadius: '9999px',
                              fontWeight: '600',
                              fontSize: '13px'
                            }}>
                              🚴 Active Ride
                            </span>
                          </div>

                          {/* Phase 9 Return Action Button */}
                          <div style={{
                            backgroundColor: '#f0fdf4',
                            border: '1.5px solid #86efac',
                            borderRadius: '10px',
                            padding: '16px',
                            marginBottom: '16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '12px'
                          }}>
                            <div>
                              <strong style={{ fontSize: '15px', color: '#166534', display: 'block', marginBottom: '2px' }}>
                                Has the renter returned the bike?
                              </strong>
                              <span style={{ fontSize: '12px', color: '#15803d' }}>
                                Inspect the bike's condition, check for scratches/damage, and process the return.
                              </span>
                            </div>

                            <button
                              id={`return-bike-btn-${booking._id}`}
                              onClick={() => handleOpenReturnModal(booking)}
                              style={{
                                padding: '10px 22px',
                                backgroundColor: '#15803d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '700',
                                fontSize: '14px',
                                boxShadow: '0 2px 6px rgba(21, 128, 61, 0.3)'
                              }}
                            >
                              🏁 Process Bike Return
                            </button>
                          </div>

                          {/* Security Deposit Tracker */}
                          <SecurityDepositBadge
                            deposit={deposit}
                            amount={booking.securityDeposit}
                            isOwner={true}
                            onRefundClick={() => handleRefundDeposit(booking._id, deposit?._id)}
                            refundLoading={refundLoading === booking._id}
                          />

                          {/* Timeline */}
                          <BookingTimeline
                            booking={booking}
                            inspections={inspections}
                            onOpenUploadModal={(phase) => handleOpenUpload(booking._id, phase)}
                            userRole="owner"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Section 2: Ready for Handover OTP (CASH_PAYMENT_CONFIRMED) */}
          {handoverBookings.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '22px' }}>🔑</span>
                <h2 style={{ margin: 0, fontSize: '20px', color: '#b45309', fontWeight: '700' }}>
                  Ready for Handover & OTP Generation ({handoverBookings.length})
                </h2>
              </div>

              <div style={{ display: 'grid', gap: '24px' }}>
                {handoverBookings.map(booking => {
                  const bikeImage = booking.bike?.images?.[0] || '/placeholder.png'
                  const startDate = new Date(booking.startDate).toLocaleDateString()
                  const endDate = new Date(booking.endDate).toLocaleDateString()
                  const totalCash = Number(booking.totalCash || ((booking.rentalAmount || 0) + (booking.securityDeposit || 0)))
                  const otp = generatedOtps[booking._id] || booking.otp
                  const inspections = inspectionsMap[booking._id] || []
                  const deposit = depositsMap[booking._id]

                  return (
                    <div
                      key={booking._id}
                      style={{
                        border: '2px solid #f59e0b',
                        borderRadius: '16px',
                        padding: '24px',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)'
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '24px' }}>
                        <div>
                          <img
                            src={bikeImage}
                            alt="bike"
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22150%22%3E%3Crect fill=%22%23e5e7eb%22 width=%22150%22 height=%22150%22/%3E%3Ctext fill=%22%239ca3af%22 font-family=%22sans-serif%22 font-size=%2214%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3EBike Image%3C/text%3E%3C/svg%3E'
                            }}
                            style={{
                              width: '150px',
                              height: '150px',
                              objectFit: 'cover',
                              borderRadius: '10px',
                              border: '1px solid #e2e8f0'
                            }}
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div>
                              <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#0f172a', fontWeight: '700' }}>
                                {booking.bike?.brand} {booking.bike?.model}
                              </h3>
                              <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                                📅 {startDate} to {endDate} • Total Cash Received: <strong>₹{totalCash.toFixed(2)}</strong>
                              </p>
                            </div>
                            <span style={{
                              padding: '6px 14px',
                              backgroundColor: '#fef3c7',
                              color: '#b45309',
                              borderRadius: '9999px',
                              fontWeight: '600',
                              fontSize: '13px',
                              border: '1px solid #fde68a'
                            }}>
                              🔑 Cash Confirmed
                            </span>
                          </div>

                          {/* OTP Generation Card */}
                          <div style={{
                            backgroundColor: '#fffbeb',
                            border: '1.5px solid #fde68a',
                            borderRadius: '10px',
                            padding: '16px',
                            marginBottom: '16px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                              <div>
                                <strong style={{ fontSize: '15px', color: '#92400e', display: 'block', marginBottom: '4px' }}>
                                  Handover Verification OTP
                                </strong>
                                <span style={{ fontSize: '12px', color: '#78350f' }}>
                                  Share this 6-digit code with the renter in person when handing over the keys.
                                </span>
                              </div>

                              {otp ? (
                                <div style={{
                                  padding: '10px 20px',
                                  backgroundColor: '#ffffff',
                                  border: '2px dashed #f59e0b',
                                  borderRadius: '8px',
                                  textAlign: 'center'
                                }}>
                                  <div style={{ fontSize: '11px', color: '#92400e', fontWeight: 'bold', textTransform: 'uppercase' }}>Handover Code</div>
                                  <div style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '6px', color: '#b45309' }}>
                                    {otp}
                                  </div>
                                </div>
                              ) : (
                                <button
                                  id={`generate-otp-btn-${booking._id}`}
                                  onClick={() => handleGenerateOtp(booking._id)}
                                  disabled={actionLoading === booking._id}
                                  style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#d97706',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: actionLoading === booking._id ? 'not-allowed' : 'pointer',
                                    fontWeight: '700',
                                    fontSize: '14px'
                                  }}
                                >
                                  {actionLoading === booking._id ? 'Generating...' : '🔑 Generate Handover OTP'}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Security Deposit Tracker */}
                          <SecurityDepositBadge
                            deposit={deposit}
                            amount={booking.securityDeposit}
                            isOwner={true}
                          />

                          {/* Timeline */}
                          <BookingTimeline
                            booking={booking}
                            inspections={inspections}
                            onOpenUploadModal={(phase) => handleOpenUpload(booking._id, phase)}
                            userRole="owner"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Section 3: Awaiting Cash Payment (CASH_PAYMENT_PENDING) */}
          {cashPendingBookings.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '22px' }}>💵</span>
                <h2 style={{ margin: 0, fontSize: '20px', color: '#0369a1', fontWeight: '700' }}>
                  Awaiting Cash Payment Handover ({cashPendingBookings.length})
                </h2>
              </div>

              <div style={{ display: 'grid', gap: '20px' }}>
                {cashPendingBookings.map(booking => {
                  const bikeImage = booking.bike?.images?.[0] || '/placeholder.png'
                  const startDate = new Date(booking.startDate).toLocaleDateString()
                  const endDate = new Date(booking.endDate).toLocaleDateString()
                  const rentalAmount = Number(booking.rentalAmount || 0)
                  const securityDeposit = Number(booking.securityDeposit || 0)
                  const totalCash = Number(booking.totalCash || (rentalAmount + securityDeposit))

                  return (
                    <div
                      key={booking._id}
                      style={{
                        border: '2px solid #38bdf8',
                        borderRadius: '12px',
                        padding: '24px',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 4px 12px rgba(56, 189, 248, 0.15)'
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '24px' }}>
                        <div>
                          <img
                            src={bikeImage}
                            alt="bike"
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22150%22%3E%3Crect fill=%22%23e5e7eb%22 width=%22150%22 height=%22150%22/%3E%3Ctext fill=%22%239ca3af%22 font-family=%22sans-serif%22 font-size=%2214%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3EBike Image%3C/text%3E%3C/svg%3E'
                            }}
                            style={{
                              width: '150px',
                              height: '150px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0'
                            }}
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div>
                              <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#0f172a', fontWeight: '700' }}>
                                {booking.bike?.brand} {booking.bike?.model}
                              </h3>
                              <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                                📅 Rental Period: <strong>{startDate}</strong> to <strong>{endDate}</strong>
                              </p>
                            </div>
                            <span style={{
                              padding: '6px 14px',
                              backgroundColor: '#e0f2fe',
                              color: '#0369a1',
                              borderRadius: '9999px',
                              fontWeight: '600',
                              fontSize: '13px',
                              border: '1px solid #7dd3fc'
                            }}>
                              💵 Cash Payment Pending
                            </span>
                          </div>

                          <div style={{
                            backgroundColor: '#eff6ff',
                            padding: '14px 18px',
                            borderRadius: '8px',
                            marginBottom: '16px',
                            fontSize: '14px',
                            border: '1px solid #bfdbfe'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span>Rental Amount:</span>
                              <strong>₹{rentalAmount.toFixed(2)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span>Security Deposit (held by owner):</span>
                              <strong>₹{securityDeposit.toFixed(2)}</strong>
                            </div>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              borderTop: '1.5px solid #93c5fd',
                              paddingTop: '8px',
                              fontSize: '16px'
                            }}>
                              <span><strong>Total Cash to Collect at Handover:</strong></span>
                              <strong style={{ fontSize: '18px', color: '#1d4ed8' }}>₹{totalCash.toFixed(2)}</strong>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <button
                              id={`confirm-cash-${booking._id}`}
                              onClick={() => handleConfirmCashPayment(booking._id)}
                              disabled={actionLoading === booking._id}
                              style={{
                                padding: '12px 24px',
                                backgroundColor: '#16a34a',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: actionLoading === booking._id ? 'not-allowed' : 'pointer',
                                fontWeight: '700',
                                fontSize: '15px'
                              }}
                            >
                              {actionLoading === booking._id ? 'Recording Payment...' : '✓ Confirm Cash Payment Received'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Section 4: Pending Approval Requests (PENDING) */}
          {pendingBookings.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '22px' }}>🔔</span>
                <h2 style={{ margin: 0, fontSize: '20px', color: '#854d0e', fontWeight: '700' }}>
                  Pending Approval Requests ({pendingBookings.length})
                </h2>
              </div>

              <div style={{ display: 'grid', gap: '20px' }}>
                {pendingBookings.map(booking => {
                  const bikeImage = booking.bike?.images?.[0] || '/placeholder.png'
                  const startDate = new Date(booking.startDate).toLocaleDateString()
                  const endDate = new Date(booking.endDate).toLocaleDateString()
                  const rentalAmount = Number(booking.rentalAmount || 0)
                  const securityDeposit = Number(booking.securityDeposit || 0)
                  const totalCash = Number(booking.totalCash || (rentalAmount + securityDeposit))

                  return (
                    <div
                      key={booking._id}
                      style={{
                        border: '2px solid #facc15',
                        borderRadius: '12px',
                        padding: '24px',
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '24px' }}>
                        <div>
                          <img
                            src={bikeImage}
                            alt="bike"
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22140%22 height=%22140%22%3E%3Crect fill=%22%23e5e7eb%22 width=%22140%22 height=%22140%22/%3E%3Ctext fill=%22%239ca3af%22 font-family=%22sans-serif%22 font-size=%2214%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3EBike Image%3C/text%3E%3C/svg%3E'
                            }}
                            style={{ width: '140px', height: '140px', objectFit: 'cover', borderRadius: '8px' }}
                          />
                        </div>

                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>
                            {booking.bike?.brand} {booking.bike?.model}
                          </h3>
                          <p style={{ margin: '0 0 12px 0', color: '#6b7280', fontSize: '14px' }}>
                            📅 {startDate} to {endDate} • Total Cash: <strong>₹{totalCash.toFixed(2)}</strong>
                          </p>

                          <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                              onClick={() => handleApprove(booking._id)}
                              disabled={actionLoading === booking._id}
                              style={{
                                flex: 1,
                                padding: '10px 16px',
                                backgroundColor: '#16a34a',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '700'
                              }}
                            >
                              {actionLoading === booking._id ? 'Processing...' : '✓ Approve Request'}
                            </button>
                            <button
                              onClick={() => handleReject(booking._id)}
                              disabled={actionLoading === booking._id}
                              style={{
                                flex: 1,
                                padding: '10px 16px',
                                backgroundColor: '#dc2626',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '700'
                              }}
                            >
                              {actionLoading === booking._id ? 'Processing...' : '✗ Reject Request'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Section 5: Completed, Disputed, & Past Bookings */}
          {otherBookings.length > 0 && (
            <div>
              <h2 style={{ fontSize: '20px', color: '#374151', marginBottom: '16px', fontWeight: '700' }}>
                Completed & Disputed Bookings ({otherBookings.length})
              </h2>
              <div style={{ display: 'grid', gap: '20px' }}>
                {otherBookings.map(booking => {
                  const statusStyle = statusStyles[booking.status] || statusStyles.PENDING
                  const startDate = new Date(booking.startDate).toLocaleDateString()
                  const endDate = new Date(booking.endDate).toLocaleDateString()
                  const deposit = depositsMap[booking._id]
                  const inspections = inspectionsMap[booking._id] || []
                  const submittedReview = reviewsMap[booking._id]

                  return (
                    <div
                      key={booking._id}
                      style={{
                        border: booking.status === 'DISPUTED' ? '2px solid #ef4444' : '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '20px',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#111827' }}>
                            {booking.bike?.brand} {booking.bike?.model}
                          </h3>
                          <p style={{ margin: 0, color: '#4b5563', fontSize: '13px' }}>
                            Renter: <strong>{booking.renter?.name}</strong> • {startDate} to {endDate}
                          </p>
                        </div>
                        <span style={{
                          padding: '6px 14px',
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color,
                          borderRadius: '9999px',
                          fontWeight: '600',
                          fontSize: '13px'
                        }}>
                          {statusStyle.label}
                        </span>
                      </div>

                      {/* Deposit badge with Direct Refund button */}
                      {booking.securityDeposit > 0 && (
                        <SecurityDepositBadge
                          deposit={deposit}
                          amount={booking.securityDeposit}
                          isOwner={true}
                          onRefundClick={() => handleRefundDeposit(booking._id, deposit?._id)}
                          refundLoading={refundLoading === booking._id}
                        />
                      )}

                      {/* Phase 10: Ratings & Reviews for Completed Bookings */}
                      {booking.status === 'COMPLETED' && (
                        <div style={{
                          marginTop: '16px',
                          padding: '16px 20px',
                          backgroundColor: '#f8fafc',
                          border: '1.5px solid #e2e8f0',
                          borderRadius: '10px'
                        }}>
                          {submittedReview ? (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontSize: '14px', fontWeight: '700', color: '#166534' }}>
                                  ✓ You Rated Renter ({booking.renter?.name}):
                                </span>
                                <StarRating value={submittedReview.rating || submittedReview.renterRating || 5} readOnly size="sm" />
                              </div>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                {submittedReview.renterRating && (
                                  <span style={{ fontSize: '11px', padding: '2px 8px', backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '4px' }}>
                                    Overall: {submittedReview.renterRating}/5
                                  </span>
                                )}
                                {submittedReview.communicationRating && (
                                  <span style={{ fontSize: '11px', padding: '2px 8px', backgroundColor: '#eff6ff', color: '#1e40af', borderRadius: '4px' }}>
                                    Communication: {submittedReview.communicationRating}/5
                                  </span>
                                )}
                                {submittedReview.bikeHandlingRating && (
                                  <span style={{ fontSize: '11px', padding: '2px 8px', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '4px' }}>
                                    Bike Handling: {submittedReview.bikeHandlingRating}/5
                                  </span>
                                )}
                              </div>
                              {submittedReview.comment && (
                                <p style={{ margin: 0, fontSize: '13px', color: '#475569', fontStyle: 'italic' }}>
                                  "{submittedReview.comment}"
                                </p>
                              )}
                            </div>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                              <div>
                                <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>
                                  Rate {booking.renter?.name || 'the Renter'}
                                </strong>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>
                                  Help build trust in the community by rating communication and bike handling.
                                </span>
                              </div>
                              <button
                                id={`rate-renter-btn-${booking._id}`}
                                onClick={() => handleOpenReviewModal(booking)}
                                style={{
                                  padding: '8px 18px',
                                  backgroundColor: '#f59e0b',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontWeight: '700',
                                  fontSize: '13px',
                                  boxShadow: '0 2px 4px rgba(245, 158, 11, 0.25)'
                                }}
                              >
                                ⭐ Rate Renter
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Timeline */}
                      {['COMPLETED', 'DISPUTED'].includes(booking.status) && (
                        <BookingTimeline
                          booking={booking}
                          inspections={inspections}
                          onOpenUploadModal={(phase) => handleOpenUpload(booking._id, phase)}
                          userRole="owner"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Shared Inspection Upload Modal */}
      <InspectionModal
        bookingId={modalBookingId}
        phase={modalPhase}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUploadSuccess={handleInspectionUploaded}
      />

      {/* Return Modal */}
      <ReturnModal
        booking={returnBooking}
        existingAfterInspection={returnBooking ? inspectionsMap[returnBooking._id]?.find(i => i.phase === 'AFTER') : null}
        isOpen={isReturnModalOpen}
        onClose={() => {
          setIsReturnModalOpen(false)
          setReturnBooking(null)
        }}
        onReturnSuccess={handleReturnSuccess}
      />

      {/* Owner Review Modal */}
      <ReviewModal
        booking={reviewBooking}
        role="owner"
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false)
          setReviewBooking(null)
        }}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  )
}
