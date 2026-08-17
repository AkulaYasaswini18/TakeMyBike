import React, { useEffect, useState, useContext } from 'react'
import AuthContext from '../context/AuthContext'
import * as bookingService from '../services/bookingService'

const statusStyles = {
  PENDING: { bg: '#fff3cd', color: '#856404', label: '⧗ Pending' },
  APPROVED: { bg: '#d1ecf1', color: '#0c5460', label: '✓ Approved' },
  REJECTED: { bg: '#f8d7da', color: '#721c24', label: '✗ Rejected' },
  CASH_PAYMENT_PENDING: { bg: '#cfe2ff', color: '#084298', label: '💰 Payment Pending' },
  CASH_PAYMENT_CONFIRMED: { bg: '#d1e7dd', color: '#0f5132', label: '✓ Payment Confirmed' },
  ACTIVE: { bg: '#d1e7dd', color: '#0f5132', label: '🚴 Active' },
  COMPLETED: { bg: '#e2e3e5', color: '#383d41', label: '✓ Completed' },
  CANCELLED: { bg: '#f8d7da', color: '#721c24', label: '✗ Cancelled' },
  DISPUTED: { bg: '#f8d7da', color: '#721c24', label: '⚠️ Disputed' }
}

export default function MyBookings() {
  const { user } = useContext(AuthContext)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    try {
      const data = await bookingService.getMyBookings()
      setBookings(data.bookings || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  if (!user || user.role !== 'renter') {
    return (
      <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{
          padding: '20px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px'
        }}>
          Only renters can view their bookings.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading your bookings...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>My Bookings</h1>

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
          <p style={{ fontSize: '16px' }}>You haven't booked any bikes yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {bookings.map(booking => {
            const statusStyle = statusStyles[booking.status] || statusStyles.PENDING
            const bikeImage = booking.bike?.images?.[0] || '/placeholder.png'
            const startDate = new Date(booking.startDate).toLocaleDateString()
            const endDate = new Date(booking.endDate).toLocaleDateString()

            return (
              <div
                key={booking._id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '20px',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '20px' }}>
                  {/* Bike Image */}
                  <div>
                    <img
                      src={bikeImage}
                      alt="bike"
                      onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22%3E%3Crect fill=%22%23ccc%22 width=%22120%22 height=%22120%22/%3E%3C/svg%3E'}
                      style={{
                        width: '120px',
                        height: '120px',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                    />
                  </div>

                  {/* Details */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                      <div>
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>
                          {booking.bike?.brand} {booking.bike?.model}
                        </h3>
                        <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
                          Owner: <strong>{booking.owner?.name}</strong>
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

                    <div style={{
                      backgroundColor: '#f9f9f9',
                      padding: '12px',
                      borderRadius: '4px',
                      marginBottom: '12px',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      fontSize: '14px'
                    }}>
                      <div>
                        <strong>Dates:</strong> {startDate} to {endDate}
                      </div>
                      <div>
                        <strong>Daily Rate:</strong> ${booking.bike?.pricePerDay}/day
                      </div>
                      <div>
                        <strong>Rental Amount:</strong> ${booking.rentalAmount.toFixed(2)}
                      </div>
                      <div>
                        <strong>Security Deposit:</strong> ${booking.securityDeposit.toFixed(2)}
                      </div>
                    </div>

                    <div style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#d63031',
                      padding: '10px',
                      backgroundColor: '#fff3cd',
                      borderRadius: '4px'
                    }}>
                      Total Cash Due: ${booking.totalCash.toFixed(2)}
                    </div>

                    {booking.status === 'CASH_PAYMENT_PENDING' && (
                      <div style={{
                        marginTop: '12px',
                        padding: '10px',
                        backgroundColor: '#cfe2ff',
                        color: '#084298',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}>
                        💡 Booking approved! You'll pay cash to the owner at pickup.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
