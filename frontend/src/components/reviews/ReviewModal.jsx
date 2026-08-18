import React, { useState } from 'react'
import StarRating from '../common/StarRating'
import * as reviewService from '../../services/reviewService'

export default function ReviewModal({
  booking,
  role = 'renter', // 'renter' or 'owner'
  isOpen,
  onClose,
  onReviewSubmitted
}) {
  // Renter rating states
  const [bikeConditionRating, setBikeConditionRating] = useState(5)
  const [ownerRating, setOwnerRating] = useState(5)
  const [overallRating, setOverallRating] = useState(5)

  // Owner rating states
  const [renterRating, setRenterRating] = useState(5)
  const [communicationRating, setCommunicationRating] = useState(5)
  const [bikeHandlingRating, setBikeHandlingRating] = useState(5)

  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen || !booking) return null

  const isRenter = role === 'renter'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const payload = {
        bookingId: booking._id,
        comment: comment.trim()
      }

      if (isRenter) {
        payload.bikeConditionRating = bikeConditionRating
        payload.ownerRating = ownerRating
        payload.overallRating = overallRating
        payload.rating = overallRating
      } else {
        payload.renterRating = renterRating
        payload.communicationRating = communicationRating
        payload.bikeHandlingRating = bikeHandlingRating
        payload.rating = renterRating
      }

      const res = await reviewService.createReview(payload)
      if (onReviewSubmitted) {
        onReviewSubmitted(res.review)
      }
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '20px',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        maxWidth: '560px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        padding: '28px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', color: '#0f172a' }}>
              {isRenter ? 'Rate Your Rental Experience' : 'Rate the Renter'}
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
              {booking.bike?.brand} {booking.bike?.model}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#94a3b8'
            }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '13px',
            border: '1px solid #fca5a5'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRenter ? (
            /* Renter Rating Form */
            <div style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>
              <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                    1. Bike Condition & Performance
                  </label>
                  <StarRating
                    value={bikeConditionRating}
                    onChange={setBikeConditionRating}
                    size="md"
                    showLabel
                  />
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                  How clean, smooth, and well-maintained was the motorcycle?
                </p>
              </div>

              <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                    2. Bike Owner Experience
                  </label>
                  <StarRating
                    value={ownerRating}
                    onChange={setOwnerRating}
                    size="md"
                    showLabel
                  />
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                  Was the owner punctual, helpful, and courteous during handover?
                </p>
              </div>

              <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                    3. Overall Experience
                  </label>
                  <StarRating
                    value={overallRating}
                    onChange={setOverallRating}
                    size="md"
                    showLabel
                  />
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                  Your general satisfaction with the rental.
                </p>
              </div>
            </div>
          ) : (
            /* Owner Rating Form */
            <div style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>
              <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                    1. Renter Overall Rating
                  </label>
                  <StarRating
                    value={renterRating}
                    onChange={setRenterRating}
                    size="md"
                    showLabel
                  />
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                  How was your experience renting to {booking.renter?.name || 'this renter'}?
                </p>
              </div>

              <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                    2. Communication & Punctuality
                  </label>
                  <StarRating
                    value={communicationRating}
                    onChange={setCommunicationRating}
                    size="md"
                    showLabel
                  />
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                  Did the renter arrive on time for pickup and return?
                </p>
              </div>

              <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                    3. Bike Handling & Care
                  </label>
                  <StarRating
                    value={bikeHandlingRating}
                    onChange={setBikeHandlingRating}
                    size="md"
                    showLabel
                  />
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                  Was the bike returned in good condition and handled responsibly?
                </p>
              </div>
            </div>
          )}

          {/* Written Feedback */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
              Written Feedback (Optional)
            </label>
            <textarea
              rows={3}
              placeholder={isRenter ? 'Share your ride experience with other renters...' : 'Leave a comment about the renter...'}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '13px',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '10px 18px',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 22px',
                backgroundColor: '#f59e0b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '700',
                fontSize: '14px',
                boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)'
              }}
            >
              {loading ? 'Submitting...' : '⭐ Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
