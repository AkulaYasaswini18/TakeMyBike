import React, { useEffect, useState, useContext } from 'react'
import AuthContext from '../context/AuthContext'
import * as bookingService from '../services/bookingService'

const statusStyles = {
  PENDING: { bg: '#fff3cd', color: '#856404', label: '⧗ Approval Pending' },
  APPROVED: { bg: '#d1ecf1', color: '#0c5460', label: '✓ Approved' },
  REJECTED: { bg: '#fee2e2', color: '#b91c1c', label: '✗ Rejected' },
  CASH_PAYMENT_PENDING: { bg: '#e0f2fe', color: '#0369a1', label: '💵 Cash Payment Pending' },
  CASH_PAYMENT_CONFIRMED: { bg: '#dcfce7', color: '#15803d', label: '✓ Cash Payment Confirmed' },
  ACTIVE: { bg: '#ecfdf5', color: '#047857', label: '🚴 Active' },
  COMPLETED: { bg: '#f3f4f6', color: '#374151', label: '✓ Completed' },
  CANCELLED: { bg: '#fee2e2', color: '#b91c1c', label: '✗ Cancelled' },
  DISPUTED: { bg: '#fef3c7', color: '#b45309', label: '⚠️ Disputed' }
}

export default function RentalRequests() {
  const { user } = useContext(AuthContext)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    try {
      const data = await bookingService.getOwnerBookings()
      setBookings(data.bookings || [])
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
      const res = await bookingService.confirmCashPayment(bookingId)
      setBookings(prev => prev.map(b =>
        b._id === bookingId ? { ...b, status: 'CASH_PAYMENT_CONFIRMED' } : b
      ))
      setSuccessMsg('Cash payment confirmed successfully! Recorded as received.')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to confirm cash payment')
    } finally {
      setActionLoading(null)
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
  const otherBookings = bookings.filter(b => !['PENDING', 'CASH_PAYMENT_PENDING'].includes(b.status))

  return (
    <div style={{ padding: '30px 20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 6px 0', fontSize: '28px', color: '#111827' }}>Rental Requests & Payments</h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Manage incoming booking requests and confirm in-person cash payments received</p>
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
          ✓ {successMsg}
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
          {/* Section 1: Awaiting Cash Payment Handover */}
          {cashPendingBookings.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '22px' }}>💵</span>
                <h2 style={{ margin: 0, fontSize: '20px', color: '#0369a1', fontWeight: '700' }}>
                  Awaiting Cash Payment Handover ({cashPendingBookings.length})
                </h2>
              </div>
              <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '13px' }}>
                These bookings are approved. When the renter meets you and pays cash, click "Confirm Cash Payment Received".
              </p>

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

                          {/* Renter Contact */}
                          <div style={{
                            backgroundColor: '#f8fafc',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            marginBottom: '14px',
                            fontSize: '14px',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            gap: '24px',
                            flexWrap: 'wrap'
                          }}>
                            <div><strong>Renter:</strong> {booking.renter?.name || 'Renter'}</div>
                            <div><strong>Phone:</strong> {booking.renter?.phone || 'N/A'}</div>
                            <div><strong>Rating:</strong> ⭐ {booking.renter?.rating ? Number(booking.renter.rating).toFixed(1) : '5.0'}/5</div>
                          </div>

                          {/* Cash Breakdown */}
                          <div style={{
                            backgroundColor: '#eff6ff',
                            padding: '14px 18px',
                            borderRadius: '8px',
                            marginBottom: '16px',
                            fontSize: '14px',
                            border: '1px solid #bfdbfe'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#1e3a8a' }}>
                              <span>Rental Amount:</span>
                              <strong>₹{rentalAmount.toFixed(2)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#1e3a8a' }}>
                              <span>Security Deposit (held by owner):</span>
                              <strong>₹{securityDeposit.toFixed(2)}</strong>
                            </div>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              borderTop: '1.5px solid #93c5fd',
                              paddingTop: '8px',
                              fontSize: '16px',
                              color: '#1e40af'
                            }}>
                              <span><strong>Total Cash to Collect at Handover:</strong></span>
                              <strong style={{ fontSize: '18px', color: '#1d4ed8' }}>₹{totalCash.toFixed(2)}</strong>
                            </div>
                          </div>

                          {/* Owner Cash Confirm Button */}
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                                fontSize: '15px',
                                boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)',
                                opacity: actionLoading === booking._id ? 0.7 : 1,
                                transition: 'all 0.2s ease'
                              }}
                            >
                              {actionLoading === booking._id ? 'Recording Payment...' : '✓ Confirm Cash Payment Received'}
                            </button>
                          </div>

                          {/* Persistent Disclaimer */}
                          <div style={{
                            marginTop: '14px',
                            paddingTop: '10px',
                            borderTop: '1px dashed #cbd5e1',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#475569'
                          }}>
                            📌 Persistent Note: BikeShare does not process or hold rental payments.
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Section 2: Pending Approval Requests */}
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
                        backgroundColor: '#ffffff',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.06)'
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
                            style={{
                              width: '140px',
                              height: '140px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0'
                            }}
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div>
                              <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#111827', fontWeight: '700' }}>
                                {booking.bike?.brand} {booking.bike?.model}
                              </h3>
                              <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                                📅 {startDate} to {endDate}
                              </p>
                            </div>
                            <span style={{
                              padding: '6px 12px',
                              backgroundColor: '#fef9c3',
                              color: '#854d0e',
                              borderRadius: '9999px',
                              fontWeight: '600',
                              fontSize: '12px',
                              border: '1px solid #fde047'
                            }}>
                              ⧗ Awaiting Approval
                            </span>
                          </div>

                          <div style={{
                            backgroundColor: '#f8fafc',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            marginBottom: '12px',
                            fontSize: '14px',
                            display: 'flex',
                            gap: '24px',
                            border: '1px solid #e2e8f0'
                          }}>
                            <div><strong>Renter:</strong> {booking.renter?.name || 'Renter'}</div>
                            <div><strong>Phone:</strong> {booking.renter?.phone || 'N/A'}</div>
                            <div><strong>Rating:</strong> ⭐ {booking.renter?.rating ? Number(booking.renter.rating).toFixed(1) : '5.0'}/5</div>
                          </div>

                          <div style={{
                            backgroundColor: '#fffbeb',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            marginBottom: '16px',
                            fontSize: '14px',
                            border: '1px solid #fef08a'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span>Rental Amount:</span>
                              <strong>₹{rentalAmount.toFixed(2)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span>Security Deposit:</span>
                              <strong>₹{securityDeposit.toFixed(2)}</strong>
                            </div>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              borderTop: '1px solid #fde047',
                              paddingTop: '6px',
                              fontSize: '15px'
                            }}>
                              <span><strong>Total In-Person Cash:</strong></span>
                              <strong style={{ color: '#b45309' }}>₹{totalCash.toFixed(2)}</strong>
                            </div>
                          </div>

                          {/* Action Buttons */}
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
                                fontWeight: '700',
                                fontSize: '14px',
                                opacity: actionLoading === booking._id ? 0.7 : 1
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
                                fontWeight: '700',
                                fontSize: '14px',
                                opacity: actionLoading === booking._id ? 0.7 : 1
                              }}
                            >
                              {actionLoading === booking._id ? 'Processing...' : '✗ Reject Request'}
                            </button>
                          </div>

                          <div style={{
                            marginTop: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#64748b'
                          }}>
                            📌 Persistent Note: BikeShare does not process or hold rental payments.
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Section 3: Confirmed & Other Requests */}
          {otherBookings.length > 0 && (
            <div>
              <h2 style={{ fontSize: '20px', color: '#374151', marginBottom: '16px', fontWeight: '700' }}>
                Confirmed & Other Requests ({otherBookings.length})
              </h2>
              <div style={{ display: 'grid', gap: '14px' }}>
                {otherBookings.map(booking => {
                  const statusStyle = statusStyles[booking.status] || statusStyles.PENDING
                  const startDate = new Date(booking.startDate).toLocaleDateString()
                  const endDate = new Date(booking.endDate).toLocaleDateString()
                  const totalCash = Number(booking.totalCash || ((booking.rentalAmount || 0) + (booking.securityDeposit || 0)))

                  return (
                    <div
                      key={booking._id}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '10px',
                        padding: '16px 20px',
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                      }}
                    >
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontWeight: '700', color: '#111827', fontSize: '16px' }}>
                          {booking.bike?.brand} {booking.bike?.model}
                        </p>
                        <p style={{ margin: '0 0 4px 0', color: '#4b5563', fontSize: '14px' }}>
                          Renter: <strong>{booking.renter?.name || 'Renter'}</strong> ({booking.renter?.phone || 'N/A'}) • {startDate} to {endDate}
                        </p>
                        <p style={{ margin: 0, color: '#047857', fontSize: '14px', fontWeight: '600' }}>
                          Total Cash: ₹{totalCash.toFixed(2)}
                          {booking.status === 'CASH_PAYMENT_CONFIRMED' && (
                            <span style={{ marginLeft: '10px', color: '#15803d', fontSize: '12px' }}>
                              (Payment Received In-Person)
                            </span>
                          )}
                        </p>
                      </div>
                      <span style={{
                        padding: '6px 14px',
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color,
                        borderRadius: '9999px',
                        fontWeight: '600',
                        fontSize: '13px',
                        whiteSpace: 'nowrap',
                        border: '1px solid currentColor'
                      }}>
                        {statusStyle.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
