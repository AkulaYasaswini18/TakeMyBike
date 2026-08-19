import React, { useState, useEffect, useContext } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import AuthContext from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import * as bikeService from '../services/bikeService'
import * as bookingService from '../services/bookingService'
import ErrorMessage from '../components/common/ErrorMessage'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { getErrorMessage } from '../services/api'

export default function Booking() {
  const { id: bikeId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const toast = useToast()

  const [bike, setBike] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [booking, setBooking] = useState(false)

  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '')
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '')
  const [rentalAmount, setRentalAmount] = useState(0)
  const [totalCash, setTotalCash] = useState(0)
  const [totalDays, setTotalDays] = useState(0)

  useEffect(() => {
    loadBike()
  }, [bikeId])

  useEffect(() => {
    calculateAmount()
  }, [startDate, endDate, bike])

  const loadBike = async () => {
    try {
      setLoading(true)
      const data = await bikeService.getBikeById(bikeId)
      setBike(data.bike)
    } catch (err) {
      setError('Failed to load bike details. The motorcycle listing might no longer be available.')
    } finally {
      setLoading(false)
    }
  }

  const calculateAmount = () => {
    if (!bike || !startDate || !endDate) {
      setRentalAmount(0)
      setTotalCash(0)
      setTotalDays(0)
      return
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start >= end) {
      setRentalAmount(0)
      setTotalCash(0)
      setTotalDays(0)
      return
    }

    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    const rental = days * bike.pricePerDay
    const deposit = bike.securityDeposit || 0
    const total = rental + deposit

    setTotalDays(days)
    setRentalAmount(rental)
    setTotalCash(total)
  }

  const handleBooking = async (e) => {
    e.preventDefault()

    if (!startDate || !endDate) {
      setError('Please select both start and end rental dates.')
      return
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (start < today) {
      setError('Start date cannot be in the past.')
      return
    }

    if (start >= end) {
      setError('End date must be after start date.')
      return
    }

    setBooking(true)
    setError(null)

    try {
      await bookingService.createBooking(bikeId, startDate, endDate)
      toast.success('Your rental request has been sent to the bike owner!', 'Request Submitted')
      navigate('/my-bookings', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, 'Booking failed. Please try again.'))
    } finally {
      setBooking(false)
    }
  }

  if (loading) {
    return <LoadingSpinner fullPage message="Loading motorcycle booking details..." />
  }

  if (error && !bike) {
    return (
      <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
        <ErrorMessage
          scenario="BIKE_UNAVAILABLE"
          message={error}
        />
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link to="/find-bikes" className="btn btn-primary">
            🔍 Browse Other Motorcycles
          </Link>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'renter') {
    return (
      <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
        <ErrorMessage
          scenario="UNAUTHORIZED"
          message="Only registered renters can submit bike booking requests. Please switch to a renter account."
        />
      </div>
    )
  }

  const isConflict = error && (error.toLowerCase().includes('conflict') || error.toLowerCase().includes('already booked'))

  return (
    <div style={{ padding: '32px 20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link to={`/bikes/${bikeId}`} style={{ color: '#0284c7', fontSize: '13.5px', textDecoration: 'none', fontWeight: '600' }}>
          ← Back to Motorcycle Details
        </Link>
        <h1 style={{ margin: '8px 0 4px 0', fontSize: '26px', fontWeight: '800', color: '#0f172a' }}>
          Request Rental: {bike?.brand} {bike?.model}
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
          Review trip duration, rates, and direct cash handover amount
        </p>
      </div>

      <div className="booking-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.1fr',
        gap: '30px',
        alignItems: 'start'
      }}>
        {/* Left: Bike Preview Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 4px 12px -2px rgba(15, 23, 42, 0.04)'
        }}>
          {bike?.images?.length > 0 ? (
            <img
              src={bike.images[0]}
              alt={`${bike.brand} ${bike.model}`}
              style={{
                width: '100%',
                height: '220px',
                objectFit: 'cover'
              }}
            />
          ) : (
            <div style={{ height: '200px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
              🏍️
            </div>
          )}

          <div style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0f172a' }}>
              {bike?.brand} {bike?.model}
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
              📍 {bike?.location?.area || 'Location specified by owner'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
              <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ color: '#64748b' }}>Type:</span> <strong>{bike?.type || 'Standard'}</strong>
              </div>
              <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ color: '#64748b' }}>Owner:</span> <strong>{bike?.owner?.name}</strong>
              </div>
              <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ color: '#64748b' }}>Daily Rate:</span> <strong>₹{bike?.pricePerDay}</strong>
              </div>
              <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ color: '#64748b' }}>Deposit:</span> <strong>₹{bike?.securityDeposit || 0}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Booking Form & Cash Breakdown */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '26px',
          boxShadow: '0 4px 12px -2px rgba(15, 23, 42, 0.04)'
        }}>
          <h2 style={{ margin: '0 0 18px 0', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
            Rental Dates & Summary
          </h2>

          {error && (
            <ErrorMessage
              scenario={isConflict ? 'DATE_CONFLICT' : null}
              message={error}
              compact
            />
          )}

          <form onSubmit={handleBooking} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                  Start Date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                  End Date *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().split('T')[0]}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Calculation Breakdown Card */}
            {totalDays > 0 && (
              <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid #e2e8f0',
                marginTop: '6px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13.5px', color: '#475569' }}>
                  <span>Rental Rate ({totalDays} day{totalDays > 1 ? 's' : ''} × ₹{bike?.pricePerDay}):</span>
                  <strong style={{ color: '#0f172a' }}>₹{rentalAmount.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13.5px', color: '#475569' }}>
                  <span>Refundable Security Deposit:</span>
                  <strong style={{ color: '#0f172a' }}>₹{(bike?.securityDeposit || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1.5px solid #cbd5e1',
                  paddingTop: '10px',
                  fontSize: '16px',
                  fontWeight: '800',
                  color: '#0f172a'
                }}>
                  <span>Total Cash at Handover:</span>
                  <span style={{ color: '#15803d' }}>₹{totalCash.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            {/* Cash Handover Notice */}
            <div style={{
              padding: '12px 14px',
              backgroundColor: '#f0fdf4',
              borderRadius: '8px',
              fontSize: '12.5px',
              color: '#166534',
              border: '1px solid #bbf7d0',
              lineHeight: 1.4
            }}>
              💵 <strong>Direct Cash Handover:</strong> You will pay the total cash directly to the owner at bike collection. Your security deposit will be returned in full upon ride completion and inspection.
            </div>

            <button
              type="submit"
              disabled={booking || totalDays <= 0}
              style={{
                width: '100%',
                padding: '13px',
                backgroundColor: totalDays > 0 ? '#16a34a' : '#94a3b8',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: totalDays > 0 && !booking ? 'pointer' : 'not-allowed',
                boxShadow: totalDays > 0 ? '0 4px 12px rgba(22, 163, 74, 0.25)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {booking ? 'Submitting Request...' : 'Send Rental Request'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .booking-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
