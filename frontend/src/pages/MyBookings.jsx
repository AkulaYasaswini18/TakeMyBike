import React, { useEffect, useState, useContext } from 'react'
import AuthContext from '../context/AuthContext'
import * as bookingService from '../services/bookingService'

const statusStyles = {
  PENDING: { bg: '#fff3cd', color: '#856404', label: '⧗ Approval Pending' },
  APPROVED: { bg: '#d1ecf1', color: '#0c5460', label: '✓ Approved' },
  REJECTED: { bg: '#f8d7da', color: '#721c24', label: '✗ Rejected' },
  CASH_PAYMENT_PENDING: { bg: '#e0f2fe', color: '#0369a1', label: '💵 Cash Payment Pending' },
  CASH_PAYMENT_CONFIRMED: { bg: '#dcfce7', color: '#15803d', label: '✓ Cash Payment Confirmed' },
  ACTIVE: { bg: '#ecfdf5', color: '#047857', label: '🚴 Active Rental' },
  COMPLETED: { bg: '#f3f4f6', color: '#374151', label: '✓ Completed' },
  CANCELLED: { bg: '#fee2e2', color: '#b91c1c', label: '✗ Cancelled' },
  DISPUTED: { bg: '#fef3c7', color: '#b45309', label: '⚠️ Disputed' }
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
          backgroundColor: '#fee2e2',
          color: '#b91c1c',
          borderRadius: '8px',
          fontWeight: '500'
        }}>
          Only renters can view their bookings.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ fontSize: '18px', color: '#4b5563', fontWeight: '500' }}>Loading your bookings...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '30px 20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '28px', color: '#111827' }}>My Bookings</h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Track your bike reservations and in-person payment statuses</p>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '16px',
          backgroundColor: '#fee2e2',
          color: '#b91c1c',
          borderRadius: '8px',
          marginBottom: '24px',
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
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🚲</div>
          <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>No bookings yet</h3>
          <p style={{ fontSize: '14px', margin: 0 }}>Browse available bikes and make your first rental request.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '24px' }}>
          {bookings.map(booking => {
            const statusStyle = statusStyles[booking.status] || statusStyles.PENDING
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
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '24px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
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
                        borderRadius: '8px',
                        border: '1px solid #f3f4f6'
                      }}
                    />
                  </div>

                  {/* Booking Details */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#111827', fontWeight: '600' }}>
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
                        whiteSpace: 'nowrap',
                        border: '1px solid currentColor',
                        opacity: 0.95
                      }}>
                        {statusStyle.label}
                      </span>
                    </div>

                    {/* Booking Dates & Rate Grid */}
                    <div style={{
                      backgroundColor: '#f9fafb',
                      padding: '16px',
                      borderRadius: '8px',
                      marginBottom: '16px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '12px',
                      fontSize: '14px',
                      border: '1px solid #f3f4f6'
                    }}>
                      <div>
                        <span style={{ color: '#6b7280', display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rental Duration</span>
                        <strong style={{ color: '#1f2937' }}>{startDate} — {endDate}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#6b7280', display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rental Amount</span>
                        <strong style={{ color: '#1f2937' }}>₹{rentalAmount.toFixed(2)}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#6b7280', display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Security Deposit</span>
                        <strong style={{ color: '#1f2937' }}>₹{securityDeposit.toFixed(2)}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#6b7280', display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Cash Due</span>
                        <strong style={{ color: '#047857', fontSize: '15px' }}>₹{totalCash.toFixed(2)}</strong>
                      </div>
                    </div>

                    {/* Cash Payment Pending Card */}
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
                        <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#1e40af', marginTop: '6px' }}>
                          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '6px' }}>
                            <span>• Rental: <strong>₹{rentalAmount.toFixed(2)}</strong></span>
                            <span>• Deposit: <strong>₹{securityDeposit.toFixed(2)}</strong></span>
                            <span>• Total: <strong>₹{totalCash.toFixed(2)}</strong></span>
                          </div>
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

                    {/* Cash Payment Confirmed Card */}
                    {booking.status === 'CASH_PAYMENT_CONFIRMED' && (
                      <div style={{
                        marginTop: '16px',
                        padding: '16px',
                        backgroundColor: '#f0fdf4',
                        border: '1.5px solid #22c55e',
                        borderRadius: '8px',
                        color: '#14532d'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '18px' }}>✓</span>
                          <strong style={{ fontSize: '15px' }}>Cash Payment Confirmed by Owner</strong>
                        </div>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#166534' }}>
                          In-person cash payment of ₹{totalCash.toFixed(2)} has been recorded as received by the owner.
                        </p>
                        <div style={{
                          marginTop: '10px',
                          paddingTop: '8px',
                          borderTop: '1px dashed #86efac',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#15803d'
                        }}>
                          📌 Persistent Note: BikeShare does not process or hold rental payments.
                        </div>
                      </div>
                    )}

                    {/* Other statuses persistent disclaimer */}
                    {!['CASH_PAYMENT_PENDING', 'CASH_PAYMENT_CONFIRMED'].includes(booking.status) && (
                      <div style={{
                        marginTop: '12px',
                        fontSize: '12px',
                        color: '#6b7280',
                        fontStyle: 'italic'
                      }}>
                        📌 BikeShare does not process or hold rental payments. All payments are made directly in cash upon handover.
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
