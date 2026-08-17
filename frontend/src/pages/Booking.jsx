import React, { useState, useEffect, useContext } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import AuthContext from '../context/AuthContext'
import * as bikeService from '../services/bikeService'
import * as bookingService from '../services/bookingService'

export default function Booking() {
  const { id: bikeId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)

  const [bike, setBike] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [booking, setBooking] = useState(false)

  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '')
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '')
  const [rentalAmount, setRentalAmount] = useState(0)
  const [totalCash, setTotalCash] = useState(0)

  useEffect(() => {
    loadBike()
  }, [bikeId])

  useEffect(() => {
    calculateAmount()
  }, [startDate, endDate, bike])

  const loadBike = async () => {
    try {
      const data = await bikeService.getBikeById(bikeId)
      setBike(data.bike)
    } catch (err) {
      setError('Failed to load bike details')
    } finally {
      setLoading(false)
    }
  }

  const calculateAmount = () => {
    if (!bike || !startDate || !endDate) {
      setRentalAmount(0)
      setTotalCash(0)
      return
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start >= end) {
      setRentalAmount(0)
      setTotalCash(0)
      return
    }

    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    const rental = days * bike.pricePerDay
    const deposit = bike.securityDeposit || 0
    const total = rental + deposit

    setRentalAmount(rental)
    setTotalCash(total)
  }

  const handleBooking = async (e) => {
    e.preventDefault()

    if (!startDate || !endDate) {
      setError('Please select both dates')
      return
    }

    setBooking(true)
    setError(null)

    try {
      await bookingService.createBooking(bikeId, startDate, endDate)
      navigate('/my-bookings', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed')
    } finally {
      setBooking(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', maxWidth: '1200px', margin: '0 auto' }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (error && !bike) {
    return (
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          padding: '20px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'renter') {
    return (
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          padding: '20px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px'
        }}>
          Only renters can book bikes.
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Book: {bike?.brand} {bike?.model}</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '30px' }}>
        {/* Left: Bike Summary */}
        <div>
          {bike?.images?.length > 0 && (
            <img
              src={bike.images[0]}
              alt="bike"
              style={{
                width: '100%',
                height: '300px',
                objectFit: 'cover',
                borderRadius: '8px',
                marginBottom: '20px'
              }}
            />
          )}

          <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
            <p><strong>Brand:</strong> {bike?.brand}</p>
            <p><strong>Model:</strong> {bike?.model}</p>
            <p><strong>Type:</strong> {bike?.type}</p>
            <p><strong>Owner:</strong> {bike?.owner?.name}</p>
            <p><strong>Daily Rate:</strong> ${bike?.pricePerDay}/day</p>
            <p><strong>Security Deposit:</strong> ${bike?.securityDeposit || 0}</p>
          </div>
        </div>

        {/* Right: Booking Form */}
        <div>
          <form onSubmit={handleBooking} style={{
            backgroundColor: '#f9f9f9',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <h3>Booking Details</h3>

            {error && (
              <div style={{
                padding: '12px',
                backgroundColor: '#f8d7da',
                color: '#721c24',
                borderRadius: '4px',
                marginBottom: '15px',
                border: '1px solid #f5c6cb'
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                End Date *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Calculation Summary */}
            {startDate && endDate && (
              <div style={{
                backgroundColor: 'white',
                padding: '15px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                marginBottom: '15px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Rental Amount:</span>
                  <span>${rentalAmount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Security Deposit:</span>
                  <span>${bike?.securityDeposit || 0}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #ddd',
                  paddingTop: '8px',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}>
                  <span>Total Cash Due at Handover:</span>
                  <span>${totalCash.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div style={{
              padding: '12px',
              backgroundColor: '#e7f3ff',
              borderRadius: '4px',
              fontSize: '13px',
              marginBottom: '15px',
              color: '#004085'
            }}>
              💡 Payment will be made in CASH at bike handover with the owner.
            </div>

            <button
              type="submit"
              disabled={booking || !startDate || !endDate}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: booking ? 'not-allowed' : 'pointer',
                opacity: booking ? 0.7 : 1
              }}
            >
              {booking ? 'Processing...' : 'Request Booking'}
            </button>

            <p style={{ margin: '15px 0 0 0', fontSize: '12px', color: '#666', textAlign: 'center' }}>
              The owner will accept or reject your booking request.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
