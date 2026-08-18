import React, { useEffect, useState, useContext } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import AuthContext from '../context/AuthContext'
import * as bikeService from '../services/bikeService'
import * as reviewService from '../services/reviewService'
import ImageGallery from '../components/bikes/ImageGallery'
import ReviewList from '../components/bikes/ReviewList'
import StarRating from '../components/common/StarRating'

export default function BikeDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)

  const [bike, setBike] = useState(null)
  const [reviews, setReviews] = useState([])
  const [reviewStats, setReviewStats] = useState(null)
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
      setBikeRating(parseFloat(bikeData.bike?.rating || bikeData.bikeRating) || 0)

      // Load real reviews and stats
      try {
        const reviewData = await reviewService.getBikeReviews(id)
        setReviews(reviewData.reviews || [])
        setReviewStats(reviewData.stats || null)
        if (reviewData.stats?.avgRating) {
          setBikeRating(reviewData.stats.avgRating)
        }
      } catch (revErr) {
        setReviews(bikeData.reviews || [])
      }

      // Load availability
      const availData = await bikeService.getBikeAvailability(id)
      setBookedDates(availData.bookedDates || [])
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
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
    navigate(`/booking/${id}?startDate=${startDate}&endDate=${endDate}`)
  }

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', maxWidth: '1200px', margin: '0 auto' }}>
        <p style={{ fontSize: '18px', color: '#4b5563' }}>Loading bike details...</p>
      </div>
    )
  }

  if (error || !bike) {
    return (
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          padding: '20px',
          backgroundColor: '#fee2e2',
          color: '#b91c1c',
          borderRadius: '8px',
          border: '1px solid #fca5a5'
        }}>
          Error: {error || 'Bike not found'}
        </div>
      </div>
    )
  }

  const ownerRating = Number(bike.owner?.rating || 0)

  return (
    <div style={{ padding: '30px 20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '36px', marginBottom: '40px' }}>
        {/* Left Column: Images and Info */}
        <div>
          <ImageGallery images={bike.images} />

          <div style={{ marginTop: '30px', backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#0f172a' }}>About this motorcycle</h3>
            <p style={{ margin: '0 0 20px 0', lineHeight: '1.6', color: '#475569', fontSize: '14px' }}>
              {bike.description || 'No description provided'}
            </p>

            <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#0f172a' }}>Specifications</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
              <div style={{ padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                <span style={{ color: '#64748b' }}>Brand: </span>
                <strong>{bike.brand}</strong>
              </div>
              <div style={{ padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                <span style={{ color: '#64748b' }}>Model: </span>
                <strong>{bike.model}</strong>
              </div>
              <div style={{ padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                <span style={{ color: '#64748b' }}>Type: </span>
                <strong>{bike.type || 'Standard'}</strong>
              </div>
              <div style={{ padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                <span style={{ color: '#64748b' }}>Year: </span>
                <strong>{bike.year || 'N/A'}</strong>
              </div>
              <div style={{ padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                <span style={{ color: '#64748b' }}>Condition: </span>
                <strong>{bike.condition || 'Excellent'}</strong>
              </div>
              {bike.registrationNumber && (
                <div style={{ padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                  <span style={{ color: '#64748b' }}>Reg. No: </span>
                  <strong>{bike.registrationNumber}</strong>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Owner, Booking, and Calendar */}
        <div>
          {/* Bike Title and Overall Rating */}
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', color: '#0f172a', fontWeight: '800' }}>
              {bike.brand} {bike.model}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <StarRating value={Math.round(bikeRating)} readOnly size="sm" />
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                {bikeRating.toFixed(1)} / 5
              </span>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
              </span>
            </div>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
              📍 {bike.location?.area || 'Location not specified'}
            </p>
          </div>

          {/* Owner Card with link to User Profile */}
          <div style={{
            padding: '16px 20px',
            backgroundColor: '#f0fdf4',
            borderRadius: '10px',
            marginBottom: '20px',
            border: '1.5px solid #bbf7d0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#166534' }}>
                Bike Owner: <strong>{bike.owner?.name || 'Unknown'}</strong>
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#15803d' }}>
                <span>⭐ Owner Rating: <strong>{ownerRating.toFixed(1)}/5</strong></span>
              </div>
            </div>

            {bike.owner?._id && (
              <Link
                to={`/user/${bike.owner._id}`}
                style={{
                  padding: '6px 14px',
                  backgroundColor: '#16a34a',
                  color: 'white',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '12px',
                  fontWeight: '700'
                }}
              >
                View Profile & Reviews ➔
              </Link>
            )}
          </div>

          {/* Price and Deposit */}
          <div style={{
            padding: '20px',
            backgroundColor: '#fffbeb',
            borderRadius: '10px',
            marginBottom: '20px',
            border: '1.5px solid #fde68a'
          }}>
            <div style={{ fontSize: '26px', fontWeight: '900', color: '#b45309', marginBottom: '6px' }}>
              ₹{bike.pricePerDay} <span style={{ fontSize: '14px', fontWeight: '500', color: '#92400e' }}>/ day</span>
            </div>
            {bike.securityDeposit > 0 && (
              <p style={{ margin: '0', color: '#78350f', fontSize: '13px' }}>
                🔒 Security Deposit: <strong>₹{bike.securityDeposit}</strong> (held in cash by owner, refunded upon return)
              </p>
            )}
          </div>

          {/* Date Picker and Booking */}
          <div style={{
            padding: '20px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a' }}>Select Rental Dates</h3>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {bookedDates.length > 0 && (
              <div style={{
                padding: '10px 14px',
                backgroundColor: '#fff1f2',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '12px',
                color: '#be123c',
                border: '1px solid #fecdd3'
              }}>
                ⚠️ This bike has {bookedDates.length} booked period(s). Dates may be unavailable.
              </div>
            )}

            <button
              onClick={handleBookNow}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)'
              }}
            >
              Book Now
            </button>

            {!user && (
              <p style={{ margin: '12px 0 0 0', color: '#64748b', fontSize: '12px', textAlign: 'center' }}>
                You'll need to log in to book this bike
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        marginTop: '30px'
      }}>
        <ReviewList reviews={reviews} bikeRating={bikeRating} stats={reviewStats} />
      </div>
    </div>
  )
}
