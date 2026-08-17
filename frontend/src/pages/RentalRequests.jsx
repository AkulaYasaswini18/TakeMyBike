import React, { useEffect, useState, useContext } from 'react'
import AuthContext from '../context/AuthContext'
import * as bookingService from '../services/bookingService'

const statusStyles = {
  PENDING: { bg: '#fff3cd', color: '#856404', label: '⧗ Pending' },
  APPROVED: { bg: '#d1ecf1', color: '#0c5460', label: '✓ Approved' },
  REJECTED: { bg: '#f8d7da', color: '#721c24', label: '✗ Rejected' }
}

export default function RentalRequests() {
  const { user } = useContext(AuthContext)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

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
    try {
      await bookingService.approveBooking(bookingId)
      // Update local state
      setBookings(bookings.map(b =>
        b._id === bookingId ? { ...b, status: 'CASH_PAYMENT_PENDING' } : b
      ))
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (bookingId) => {
    if (!window.confirm('Are you sure you want to reject this booking?')) return

    setActionLoading(bookingId)
    try {
      await bookingService.rejectBooking(bookingId)
      setBookings(bookings.map(b =>
        b._id === bookingId ? { ...b, status: 'REJECTED' } : b
      ))
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject')
    } finally {
      setActionLoading(null)
    }
  }

  if (!user || user.role !== 'owner') {
    return (
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          padding: '20px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px'
        }}>
          Only bike owners can view rental requests.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading rental requests...</p>
      </div>
    )
  }

  const pendingBookings = bookings.filter(b => b.status === 'PENDING')
  const otherBookings = bookings.filter(b => b.status !== 'PENDING')

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Rental Requests</h1>

      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}

      {bookings.length === 0 ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          color: '#999'
        }}>
          <p style={{ fontSize: '16px' }}>No booking requests yet.</p>
        </div>
      ) : (
        <>
          {/* Pending Section */}
          {pendingBookings.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ color: '#856404', marginBottom: '20px' }}>
                🔔 Pending Requests ({pendingBookings.length})
              </h2>
              <div style={{ display: 'grid', gap: '20px' }}>
                {pendingBookings.map(booking => {
                  const bikeImage = booking.bike?.images?.[0] || '/placeholder.png'
                  const startDate = new Date(booking.startDate).toLocaleDateString()
                  const endDate = new Date(booking.endDate).toLocaleDateString()
                  const renterRating = booking.renter?.rating || 0

                  return (
                    <div
                      key={booking._id}
                      style={{
                        border: '2px solid #ffc107',
                        borderRadius: '8px',
                        padding: '20px',
                        backgroundColor: 'white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '20px' }}>
                        {/* Bike Image */}
                        <div>
                          <img
                            src={bikeImage}
                            alt="bike"
                            onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22140%22 height=%22140%22%3E%3Crect fill=%22%23ccc%22 width=%22140%22 height=%22140%22/%3E%3C/svg%3E'}
                            style={{
                              width: '140px',
                              height: '140px',
                              objectFit: 'cover',
                              borderRadius: '8px'
                            }}
                          />
                        </div>

                        {/* Details */}
                        <div>
                          <div style={{ marginBottom: '15px' }}>
                            <h3 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>
                              {booking.bike?.brand} {booking.bike?.model}
                            </h3>
                            <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                              📅 {startDate} to {endDate}
                            </p>
                          </div>

                          {/* Renter Info */}
                          <div style={{
                            backgroundColor: '#e7f3ff',
                            padding: '12px',
                            borderRadius: '4px',
                            marginBottom: '12px',
                            fontSize: '14px'
                          }}>
                            <p style={{ margin: '0 0 5px 0' }}>
                              <strong>Renter:</strong> {booking.renter?.name}
                            </p>
                            <p style={{ margin: '0 0 5px 0' }}>
                              <strong>Rating:</strong> ⭐ {renterRating.toFixed(1)}/5
                            </p>
                            <p style={{ margin: '0' }}>
                              <strong>Phone:</strong> {booking.renter?.phone || 'N/A'}
                            </p>
                          </div>

                          {/* Payment Details */}
                          <div style={{
                            backgroundColor: '#fff3cd',
                            padding: '12px',
                            borderRadius: '4px',
                            marginBottom: '15px',
                            fontSize: '14px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                              <span>Rental Amount:</span>
                              <strong>${booking.rentalAmount.toFixed(2)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                              <span>Security Deposit:</span>
                              <strong>${booking.securityDeposit.toFixed(2)}</strong>
                            </div>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              borderTop: '1px solid #ffc107',
                              paddingTop: '5px',
                              fontSize: '15px'
                            }}>
                              <span><strong>Total Cash Due:</strong></span>
                              <strong>${booking.totalCash.toFixed(2)}</strong>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                              onClick={() => handleApprove(booking._id)}
                              disabled={actionLoading === booking._id}
                              style={{
                                flex: 1,
                                padding: '10px',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                opacity: actionLoading === booking._id ? 0.7 : 1
                              }}
                            >
                              {actionLoading === booking._id ? 'Processing...' : '✓ Approve'}
                            </button>
                            <button
                              onClick={() => handleReject(booking._id)}
                              disabled={actionLoading === booking._id}
                              style={{
                                flex: 1,
                                padding: '10px',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                opacity: actionLoading === booking._id ? 0.7 : 1
                              }}
                            >
                              {actionLoading === booking._id ? 'Processing...' : '✗ Reject'}
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

          {/* Other Requests Section */}
          {otherBookings.length > 0 && (
            <div>
              <h2 style={{ marginBottom: '20px' }}>Other Requests</h2>
              <div style={{ display: 'grid', gap: '15px' }}>
                {otherBookings.map(booking => {
                  const statusStyle = statusStyles[booking.status] || statusStyles.PENDING
                  const startDate = new Date(booking.startDate).toLocaleDateString()
                  const endDate = new Date(booking.endDate).toLocaleDateString()

                  return (
                    <div
                      key={booking._id}
                      style={{
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        padding: '15px',
                        backgroundColor: '#f9f9f9',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                          {booking.bike?.brand} {booking.bike?.model}
                        </p>
                        <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>
                          {booking.renter?.name} • {startDate} to {endDate}
                        </p>
                        <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                          Total: ${booking.totalCash.toFixed(2)}
                        </p>
                      </div>
                      <span style={{
                        padding: '6px 12px',
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color,
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        whiteSpace: 'nowrap'
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
