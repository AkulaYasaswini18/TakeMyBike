import React, { useEffect, useState, useContext } from 'react'
import AuthContext from '../context/AuthContext'
import * as bookingService from '../services/bookingService'
import * as reviewService from '../services/reviewService'
import BookingTimeline from '../components/booking/BookingTimeline'
import InspectionModal from '../components/booking/InspectionModal'
import SecurityDepositBadge from '../components/booking/SecurityDepositBadge'
import ReviewModal from '../components/reviews/ReviewModal'
import StarRating from '../components/common/StarRating'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'
import ErrorMessage from '../components/common/ErrorMessage'
import { useToast } from '../context/ToastContext'

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

export default function MyBookings() {
  const { user } = useContext(AuthContext)
  const [bookings, setBookings] = useState([])
  const [inspectionsMap, setInspectionsMap] = useState({})
  const [depositsMap, setDepositsMap] = useState({})
  const [reviewsMap, setReviewsMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [otpInputs, setOtpInputs] = useState({})
  const [otpLoading, setOtpLoading] = useState(null)
  const [otpError, setOtpError] = useState({})
  const [successMessage, setSuccessMessage] = useState(null)

  // Inspection modal state
  const [modalBookingId, setModalBookingId] = useState(null)
  const [modalPhase, setModalPhase] = useState('BEFORE')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Review modal state
  const [reviewBooking, setReviewBooking] = useState(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    try {
      const data = await bookingService.getMyBookings()
      const list = data.bookings || []
      setBookings(list)

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
      setError(err.response?.data?.error || 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (bookingId) => {
    const code = (otpInputs[bookingId] || '').trim()
    if (!code || code.length !== 6) {
      setOtpError(prev => ({ ...prev, [bookingId]: 'Please enter a valid 6-digit OTP code' }))
      return
    }

    setOtpLoading(bookingId)
    setOtpError(prev => ({ ...prev, [bookingId]: null }))
    setSuccessMessage(null)

    try {
      const res = await bookingService.verifyOtp(bookingId, code)
      setBookings(prev => prev.map(b => b._id === bookingId ? res.booking : b))
      setSuccessMessage('🎉 OTP verified successfully! Your bike rental is now ACTIVE.')
      setOtpInputs(prev => ({ ...prev, [bookingId]: '' }))
    } catch (err) {
      setOtpError(prev => ({ ...prev, [bookingId]: err.response?.data?.error || 'Failed to verify OTP' }))
    } finally {
      setOtpLoading(null)
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
    setSuccessMessage(`✓ ${newInspection.phase} inspection photos uploaded successfully!`)
  }

  const handleOpenReviewModal = (booking) => {
    setReviewBooking(booking)
    setIsReviewModalOpen(true)
  }

  const handleReviewSubmitted = (newReview) => {
    if (reviewBooking) {
      setReviewsMap(prev => ({ ...prev, [reviewBooking._id]: newReview }))
      setSuccessMessage('⭐ Thank you! Your review and rating have been submitted successfully.')
    }
  }

  if (!user || user.role !== 'renter') {
    return (
      <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
        <ErrorMessage
          scenario="UNAUTHORIZED"
          message="Only registered renters can view their booking history."
        />
      </div>
    )
  }

  if (loading) {
    return <LoadingSpinner fullPage message="Loading your bookings..." />
  }

  return (
    <div style={{ padding: '30px 20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '28px', color: '#111827' }}>My Bookings</h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Manage bookings, inspect bike condition, verify OTPs, and track direct deposit refunds</p>
        </div>
      </div>

      {successMessage && (
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
          {successMessage}
        </div>
      )}

      {error && (
        <ErrorMessage message={error} compact />
      )}

      {bookings.length === 0 ? (
        <EmptyState
          icon="🚲"
          title="No bookings yet"
          description="Browse available motorcycles in your city and make your first rental request!"
          actionText="🔍 Find Motorcycles"
          actionLink="/find-bikes"
        />
      ) : (
        <div style={{ display: 'grid', gap: '28px' }}>
          {bookings.map(booking => {
            const statusStyle = statusStyles[booking.status] || statusStyles.PENDING
            const bikeImage = booking.bike?.images?.[0] || '/placeholder.png'
            const startDate = new Date(booking.startDate).toLocaleDateString()
            const endDate = new Date(booking.endDate).toLocaleDateString()
            const rentalAmount = Number(booking.rentalAmount || 0)
            const securityDeposit = Number(booking.securityDeposit || 0)
            const totalCash = Number(booking.totalCash || (rentalAmount + securityDeposit))
            const inspections = inspectionsMap[booking._id] || []
            const deposit = depositsMap[booking._id]
            const submittedReview = reviewsMap[booking._id]

            return (
              <div
                key={booking._id}
                style={{
                  border: booking.status === 'DISPUTED' ? '2px solid #fca5a5' : '1px solid #e5e7eb',
                  borderRadius: '16px',
                  padding: '24px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  transition: 'box-shadow 0.2s ease'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '24px' }}>
                  {/* Bike Image */}
                  <div>
                    <img
                      src={bikeImage}
                      alt={booking.bike?.brand ? `${booking.bike.brand} ${booking.bike.model}` : 'Bike'}
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22140%22 height=%22140%22%3E%3Crect fill=%22%23e5e7eb%22 width=%22140%22 height=%22140%22/%3E%3Ctext fill=%22%239ca3af%22 font-family=%22sans-serif%22 font-size=%2214%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3EBike Image%3C/text%3E%3C/svg%3E'
                      }}
                      style={{
                        width: '140px',
                        height: '140px',
                        objectFit: 'cover',
                        borderRadius: '10px',
                        border: '1px solid #f3f4f6'
                      }}
                    />
                  </div>

                  {/* Booking Details */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#111827', fontWeight: '700' }}>
                          {booking.bike?.brand} {booking.bike?.model}
                        </h3>
                        <p style={{ margin: 0, color: '#4b5563', fontSize: '14px' }}>
                          Owner: <strong>{booking.owner?.name || 'Owner'}</strong> {booking.owner?.phone ? `(${booking.owner.phone})` : ''}
                        </p>
                      </div>
                      <span style={{
                        padding: '6px 14px',
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color,
                        borderRadius: '9999px',
                        fontWeight: '600',
                        fontSize: '13px',
                        border: '1px solid currentColor'
                      }}>
                        {statusStyle.label}
                      </span>
                    </div>

                    {/* Booking Dates & Rate Grid */}
                    <div style={{
                      backgroundColor: '#f9fafb',
                      padding: '14px 18px',
                      borderRadius: '8px',
                      marginBottom: '16px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                      gap: '12px',
                      fontSize: '14px',
                      border: '1px solid #f3f4f6'
                    }}>
                      <div>
                        <span style={{ color: '#6b7280', display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Duration</span>
                        <strong style={{ color: '#1f2937' }}>{startDate} — {endDate}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#6b7280', display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rental Amount</span>
                        <strong style={{ color: '#1f2937' }}>₹{rentalAmount.toFixed(2)}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#6b7280', display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Deposit</span>
                        <strong style={{ color: '#1f2937' }}>₹{securityDeposit.toFixed(2)}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#6b7280', display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Cash Due</span>
                        <strong style={{ color: '#047857', fontSize: '15px' }}>₹{totalCash.toFixed(2)}</strong>
                      </div>
                    </div>

                    {/* Cash Payment Pending Notice */}
                    {booking.status === 'CASH_PAYMENT_PENDING' && (
                      <div style={{
                        marginTop: '16px',
                        padding: '18px',
                        backgroundColor: '#eff6ff',
                        border: '1.5px solid #3b82f6',
                        borderRadius: '8px',
                        color: '#1e3a8a'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '20px' }}>💵</span>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e40af' }}>
                            Pay ₹{totalCash.toFixed(2)} directly to the bike owner at the time of bike handover
                          </h4>
                        </div>
                        <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#1e40af' }}>
                          Please hand over the exact cash amount in person when you meet the bike owner. The owner will confirm receipt of payment on the platform upon handover.
                        </div>
                        <div style={{
                          marginTop: '12px',
                          paddingTop: '10px',
                          borderTop: '1px dashed #93c5fd',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#1d4ed8'
                        }}>
                          📌 Persistent Note: BikeShare does not process or hold rental payments.
                        </div>
                      </div>
                    )}

                    {/* OTP Entry Screen (CASH_PAYMENT_CONFIRMED) */}
                    {booking.status === 'CASH_PAYMENT_CONFIRMED' && (
                      <div style={{
                        marginTop: '16px',
                        padding: '20px',
                        backgroundColor: '#fffbeb',
                        border: '2px solid #f59e0b',
                        borderRadius: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                          <span style={{ fontSize: '22px' }}>🔑</span>
                          <h4 style={{ margin: 0, fontSize: '17px', color: '#92400e', fontWeight: '700' }}>
                            Handover & OTP Verification
                          </h4>
                        </div>
                        <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#78350f', lineHeight: '1.5' }}>
                          1. Inspect the bike and upload <strong>Before-Rental photos</strong> below.<br />
                          2. Ask the owner for the <strong>6-digit Handover OTP</strong> and enter it here to activate your rental.
                        </p>

                        <div style={{
                          backgroundColor: '#ffffff',
                          padding: '16px',
                          borderRadius: '8px',
                          border: '1px solid #fde68a',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          flexWrap: 'wrap'
                        }}>
                          <div style={{ flex: 1, minWidth: '180px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#92400e', marginBottom: '4px' }}>
                              Enter 6-Digit Handover OTP
                            </label>
                            <input
                              type="text"
                              maxLength={6}
                              placeholder="e.g. 849201"
                              value={otpInputs[booking._id] || ''}
                              onChange={(e) => setOtpInputs(prev => ({ ...prev, [booking._id]: e.target.value.replace(/\D/g, '') }))}
                              style={{
                                width: '100%',
                                padding: '10px 14px',
                                fontSize: '18px',
                                letterSpacing: '4px',
                                fontWeight: 'bold',
                                border: '2px solid #f59e0b',
                                borderRadius: '6px',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>

                          <button
                            id={`verify-otp-btn-${booking._id}`}
                            onClick={() => handleVerifyOtp(booking._id)}
                            disabled={otpLoading === booking._id || !(otpInputs[booking._id] && otpInputs[booking._id].length === 6)}
                            style={{
                              padding: '12px 24px',
                              backgroundColor: '#16a34a',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontWeight: '700',
                              fontSize: '14px',
                              cursor: otpLoading === booking._id ? 'not-allowed' : 'pointer',
                              opacity: (otpInputs[booking._id] && otpInputs[booking._id].length === 6) ? 1 : 0.6,
                              marginTop: '20px',
                              boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)'
                            }}
                          >
                            {otpLoading === booking._id ? 'Verifying...' : '✓ Verify OTP & Start Rental'}
                          </button>
                        </div>

                        {otpError[booking._id] && (
                          <div style={{ marginTop: '10px', color: '#dc2626', fontSize: '13px', fontWeight: '600' }}>
                            ⚠️ {otpError[booking._id]}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Active Rental Tracker */}
                    {booking.status === 'ACTIVE' && (
                      <div style={{
                        marginTop: '16px',
                        padding: '16px 20px',
                        backgroundColor: '#ecfdf5',
                        border: '2px solid #10b981',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '20px' }}>🚴</span>
                            <strong style={{ fontSize: '16px', color: '#065f46' }}>Your Rental is Active!</strong>
                          </div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#047857' }}>
                            Started on: {booking.rentalStartTime ? new Date(booking.rentalStartTime).toLocaleString() : 'Now'}. When ready to return, take return photos and meet the owner.
                          </p>
                        </div>
                        <button
                          onClick={() => handleOpenUpload(booking._id, 'AFTER')}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#059669',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600'
                          }}
                        >
                          📸 Upload Return Photos
                        </button>
                      </div>
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
                                ✓ You Rated this Rental:
                              </span>
                              <StarRating value={submittedReview.rating || submittedReview.overallRating || 5} readOnly size="sm" />
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                              {submittedReview.bikeConditionRating && (
                                <span style={{ fontSize: '11px', padding: '2px 8px', backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '4px' }}>
                                  Condition: {submittedReview.bikeConditionRating}/5
                                </span>
                              )}
                              {submittedReview.ownerRating && (
                                <span style={{ fontSize: '11px', padding: '2px 8px', backgroundColor: '#eff6ff', color: '#1e40af', borderRadius: '4px' }}>
                                  Owner: {submittedReview.ownerRating}/5
                                </span>
                              )}
                              {submittedReview.overallRating && (
                                <span style={{ fontSize: '11px', padding: '2px 8px', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '4px' }}>
                                  Overall: {submittedReview.overallRating}/5
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
                                How was your ride?
                              </strong>
                              <span style={{ fontSize: '12px', color: '#64748b' }}>
                                Rate the bike's condition and your experience with the owner.
                              </span>
                            </div>
                            <button
                              id={`rate-ride-btn-${booking._id}`}
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
                              ⭐ Rate & Review Ride
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Phase 9: Security Deposit Status Tracker */}
                    {booking.securityDeposit > 0 && ['CASH_PAYMENT_CONFIRMED', 'ACTIVE', 'COMPLETED', 'DISPUTED'].includes(booking.status) && (
                      <SecurityDepositBadge
                        deposit={deposit}
                        amount={booking.securityDeposit}
                        isOwner={false}
                      />
                    )}

                    {/* Timeline */}
                    {['CASH_PAYMENT_CONFIRMED', 'ACTIVE', 'COMPLETED', 'DISPUTED'].includes(booking.status) && (
                      <BookingTimeline
                        booking={booking}
                        inspections={inspections}
                        onOpenUploadModal={(phase) => handleOpenUpload(booking._id, phase)}
                        userRole="renter"
                      />
                    )}

                    {/* Persistent Disclaimer */}
                    <div style={{
                      marginTop: '14px',
                      fontSize: '12px',
                      color: '#64748b',
                      fontStyle: 'italic'
                    }}>
                      📌 Persistent Note: BikeShare does not process or hold rental payments or security deposits. All transactions are handled directly between owner and renter.
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Shared Inspection Upload Modal */}
      <InspectionModal
        bookingId={modalBookingId}
        phase={modalPhase}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUploadSuccess={handleInspectionUploaded}
      />

      {/* Renter Review Modal */}
      <ReviewModal
        booking={reviewBooking}
        role="renter"
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
