import React, { useEffect, useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AuthContext from '../context/AuthContext'
import * as bikeService from '../services/bikeService'
import ImageGallery from '../components/bikes/ImageGallery'
import ReviewList from '../components/bikes/ReviewList'

export default function BikeDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)

  const [bike, setBike] = useState(null)
  const [reviews, setReviews] = useState([])
  const [bikeRating, setBikeRating] = useState(0)
  const [bookedDates, setBookedDates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    loadBikeDetails()
  }, [id])

  const loadBikeDetails = async () => {
    try {
      const bikeData = await bikeService.getBikeById(id)
      setBike(bikeData.bike)
      setReviews(bikeData.reviews || [])
      setBikeRating(parseFloat(bikeData.bikeRating) || 0)

      // Load availability
      const availData = await bikeService.getBikeAvailability(id)
      setBookedDates(availData.bookedDates || [])
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  const isDateBooked = (date) => {
    const checkDate = new Date(date)
    return bookedDates.some(range => {
      const rangeStart = new Date(range.start)
      const rangeEnd = new Date(range.end)
      return checkDate >= rangeStart && checkDate <= rangeEnd
    })
  }

  const handleBookNow = () => {
    if (!user) {
      navigate('/login')
      return
    }
    if (!startDate || !endDate) {
      alert('Please select both start and end dates')
      return
    }
    // Navigate to booking page (to be implemented)
    navigate(`/booking/${id}?startDate=${startDate}&endDate=${endDate}`)
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ fontSize: '18px' }}>Loading bike details...</p>
      </div>
    )
  }

  if (error || !bike) {
    return (
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          padding: '20px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          border: '1px solid #f5c6cb'
        }}>
          Error: {error || 'Bike not found'}
        </div>
      </div>
    )
  }

  const ownerRating = bike.owner?.rating || 0

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
        {/* Left Column: Images and Info */}
        <div>
          <ImageGallery images={bike.images} />

          <div style={{ marginTop: '30px', backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
            <h3>About this bike</h3>
            <p style={{ margin: '10px 0', lineHeight: '1.6' }}>
              {bike.description || 'No description provided'}
            </p>

            <h4 style={{ marginTop: '20px', marginBottom: '10px' }}>Specs</h4>
            <ul style={{ margin: '0 0 20px 20px', lineHeight: '1.8' }}>
              <li><strong>Brand:</strong> {bike.brand}</li>
              <li><strong>Model:</strong> {bike.model}</li>
              <li><strong>Type:</strong> {bike.type || 'N/A'}</li>
              <li><strong>Year:</strong> {bike.year || 'N/A'}</li>
              <li><strong>Condition:</strong> {bike.condition || 'N/A'}</li>
              {bike.registrationNumber && <li><strong>Reg. No:</strong> {bike.registrationNumber}</li>}
            </ul>
          </div>
        </div>

        {/* Right Column: Owner, Booking, and Calendar */}
        <div>
          {/* Bike Title and Owner Info */}
          <div style={{ marginBottom: '30px' }}>
            <h1 style={{ margin: '0 0 10px 0', fontSize: '28px' }}>
              {bike.brand} {bike.model}
            </h1>
            <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '16px' }}>
              📍 {bike.location?.area || 'Location not specified'}
            </p>

            {/* Owner Card */}
            <div style={{
              padding: '15px',
              backgroundColor: '#e7f3ff',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #b3d9ff'
            }}>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>Owner:</strong> {bike.owner?.name || 'Unknown'}
              </p>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                ⭐ Owner Rating: {ownerRating.toFixed(1)}/5
              </p>
              {bike.owner?.phone && (
                <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
                  📞 {bike.owner.phone}
                </p>
              )}
            </div>
          </div>

          {/* Price and Deposit */}
          <div style={{
            padding: '20px',
            backgroundColor: '#fff3cd',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #ffeaa7'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d63031', marginBottom: '10px' }}>
              ${bike.pricePerDay}/day
            </div>
            {bike.securityDeposit && (
              <p style={{ margin: '0', color: '#666' }}>
                🔒 Security Deposit: ${bike.securityDeposit}
              </p>
            )}
          </div>

          {/* Date Picker and Booking */}
          <div style={{
            padding: '20px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            border: '1px solid #ddd',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 15px 0' }}>Select Dates</h3>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
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
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {bookedDates.length > 0 && (
              <div style={{
                padding: '10px',
                backgroundColor: '#ffe0e0',
                borderRadius: '4px',
                marginBottom: '15px',
                fontSize: '12px',
                color: '#c0392b'
              }}>
                ⚠️ This bike has {bookedDates.length} booked period(s). Dates may be unavailable.
              </div>
            )}

            <button
              onClick={handleBookNow}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#229954'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#27ae60'}
            >
              Book Now
            </button>

            {!user && (
              <p style={{ margin: '15px 0 0 0', color: '#666', fontSize: '12px', textAlign: 'center' }}>
                You'll need to log in to book this bike
              </p>
            )}
          </div>

          {/* Availability Info */}
          {bookedDates.length > 0 && (
            <div style={{
              padding: '15px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}>
              <h4 style={{ margin: '0 0 10px 0' }}>Booked Dates:</h4>
              <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '14px', color: '#666' }}>
                {bookedDates.map((range, idx) => (
                  <li key={idx}>
                    {new Date(range.start).toLocaleDateString()} to {new Date(range.end).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div style={{
        backgroundColor: '#f9f9f9',
        padding: '30px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        marginTop: '40px'
      }}>
        <ReviewList reviews={reviews} bikeRating={bikeRating} />
      </div>
    </div>
  )
}
