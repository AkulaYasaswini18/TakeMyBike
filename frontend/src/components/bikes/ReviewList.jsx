import React from 'react'

export default function ReviewList({ reviews = [], bikeRating = 0 }) {
  return (
    <div>
      <h3>Reviews ({reviews.length})</h3>
      
      {/* Overall Rating */}
      {reviews.length > 0 && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
              {bikeRating}
            </div>
            <div>
              <div style={{ fontSize: '16px' }}>
                {'⭐'.repeat(Math.round(bikeRating))}
              </div>
              <p style={{ margin: '5px 0 0 0', color: '#666' }}>
                Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Individual Reviews */}
      {reviews.length === 0 ? (
        <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
          No reviews yet. Be the first to review!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {reviews.map((review, idx) => (
            <div
              key={idx}
              style={{
                padding: '15px',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>
                    {review.fromUser?.name || 'Anonymous'}
                  </p>
                  <div style={{ fontSize: '14px', color: '#999' }}>
                    {'⭐'.repeat(review.rating)}
                  </div>
                </div>
                {review.category && (
                  <span style={{
                    padding: '4px 8px',
                    backgroundColor: '#e7f3ff',
                    color: '#0056b3',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {review.category}
                  </span>
                )}
              </div>

              {review.comment && (
                <p style={{ margin: '8px 0 0 0', color: '#333', lineHeight: '1.5' }}>
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
