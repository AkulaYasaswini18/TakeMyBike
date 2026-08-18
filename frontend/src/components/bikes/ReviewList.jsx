import React from 'react'
import StarRating from '../common/StarRating'

export default function ReviewList({ reviews = [], bikeRating = 0, stats = null }) {
  const ratingVal = Number(bikeRating || stats?.avgRating || 0)
  const total = reviews.length

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>
          Customer Reviews & Ratings ({total})
        </h3>
      </div>

      {/* Summary Score Card */}
      {total > 0 && (
        <div style={{
          padding: '20px 24px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          marginBottom: '24px',
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '20px',
          alignItems: 'center'
        }}>
          {/* Main Average */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderRight: '1px solid #f1f5f9', paddingRight: '16px' }}>
            <div style={{ fontSize: '38px', fontWeight: '900', color: '#0f172a', lineHeight: 1 }}>
              {ratingVal.toFixed(1)}
            </div>
            <div>
              <StarRating value={Math.round(ratingVal)} readOnly size="md" />
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>
                Based on {total} review{total !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Aspect Breakdown */}
          {stats && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#334155' }}>
              {stats.avgCondition > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>🏍️ Bike Condition:</span>
                  <strong>{stats.avgCondition.toFixed(1)} / 5</strong>
                </div>
              )}
              {stats.avgOwner > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>👤 Owner Experience:</span>
                  <strong>{stats.avgOwner.toFixed(1)} / 5</strong>
                </div>
              )}
              {stats.avgOverall > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>⭐ Overall Ride:</span>
                  <strong>{stats.avgOverall.toFixed(1)} / 5</strong>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Individual Review Cards */}
      {total === 0 ? (
        <div style={{
          padding: '40px 20px',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          textAlign: 'center',
          border: '1px dashed #cbd5e1',
          color: '#64748b'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📝</div>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: '500' }}>No reviews yet for this bike.</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>Reviews from renters will appear here after completed trips.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reviews.map((review, idx) => {
            const reviewerName = review.fromUser?.name || 'Verified Renter'
            const reviewDate = review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''

            return (
              <div
                key={review._id || idx}
                style={{
                  padding: '18px 20px',
                  backgroundColor: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: '#e2e8f0',
                      color: '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '15px'
                    }}>
                      {reviewerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <strong style={{ fontSize: '15px', color: '#0f172a', display: 'block' }}>
                        {reviewerName}
                      </strong>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {reviewDate}
                      </span>
                    </div>
                  </div>

                  <StarRating value={review.rating || review.overallRating || 5} readOnly size="sm" />
                </div>

                {/* Aspect Ratings Badges */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {review.bikeConditionRating && (
                    <span style={{ fontSize: '11px', padding: '3px 8px', backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                      Bike Condition: {review.bikeConditionRating}/5
                    </span>
                  )}
                  {review.ownerRating && (
                    <span style={{ fontSize: '11px', padding: '3px 8px', backgroundColor: '#eff6ff', color: '#1e40af', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                      Owner: {review.ownerRating}/5
                    </span>
                  )}
                  {review.overallRating && (
                    <span style={{ fontSize: '11px', padding: '3px 8px', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '4px', border: '1px solid #fde68a' }}>
                      Overall: {review.overallRating}/5
                    </span>
                  )}
                </div>

                {review.comment && (
                  <p style={{ margin: '0', color: '#334155', fontSize: '14px', lineHeight: '1.5' }}>
                    "{review.comment}"
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
