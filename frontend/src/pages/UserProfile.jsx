import React, { useEffect, useState, useContext } from 'react'
import { useParams, Link } from 'react-router-dom'
import AuthContext from '../context/AuthContext'
import * as reviewService from '../services/reviewService'
import StarRating from '../components/common/StarRating'
import ReportModal from '../components/common/ReportModal'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import EmptyState from '../components/common/EmptyState'

export default function UserProfile() {
  const { id } = useParams()
  const { user } = useContext(AuthContext)
  const [profileUser, setProfileUser] = useState(null)
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  useEffect(() => {
    loadUserProfile()
  }, [id])

  const loadUserProfile = async () => {
    try {
      setLoading(true)
      const data = await reviewService.getUserReviews(id)
      setProfileUser(data.user)
      setReviews(data.reviews || [])
      setStats(data.stats || null)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load user profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner fullPage message="Loading member profile & reviews..." />
  }

  if (error || !profileUser) {
    return (
      <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
        <ErrorMessage
          title="Profile Notice"
          message={error || 'User profile could not be found.'}
        />
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link to="/" className="btn btn-primary">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const ratingVal = Number(stats?.avgRating || profileUser.rating || 0)

  return (
    <div style={{ padding: '30px 20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header Profile Card */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '30px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        marginBottom: '30px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            fontWeight: '900'
          }}>
            {profileUser.name ? profileUser.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h1 style={{ margin: 0, fontSize: '26px', color: '#0f172a' }}>
                {profileUser.name}
              </h1>
              <span style={{
                padding: '4px 10px',
                backgroundColor: profileUser.role === 'owner' ? '#dcfce7' : '#eff6ff',
                color: profileUser.role === 'owner' ? '#15803d' : '#1e40af',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: '700',
                textTransform: 'uppercase'
              }}>
                {profileUser.role}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
              <StarRating value={Math.round(ratingVal)} readOnly size="sm" />
              <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>
                {ratingVal.toFixed(1)} / 5
              </span>
              <span style={{ color: '#64748b', fontSize: '13px' }}>
                ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
              </span>
            </div>
          </div>

          {user && user._id !== profileUser._id && (
            <div>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                style={{
                  background: 'none',
                  border: '1px solid #cbd5e1',
                  color: '#64748b',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                🚩 Report User
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Received */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '30px',
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#0f172a' }}>
          Reviews Received ({reviews.length})
        </h2>

        {reviews.length === 0 ? (
          <EmptyState
            icon="💬"
            title="No reviews received yet"
            description="This user has not received any community reviews on BikeShare yet."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {reviews.map((review, idx) => {
              const reviewerName = review.fromUser?.name || 'Community Member'
              const reviewDate = review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''

              return (
                <div
                  key={review._id || idx}
                  style={{
                    padding: '18px 20px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <strong style={{ fontSize: '15px', color: '#0f172a' }}>{reviewerName}</strong>
                      <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '8px' }}>• {reviewDate}</span>
                      {review.bike && (
                        <div style={{ fontSize: '12px', color: '#0284c7', marginTop: '2px', fontWeight: '500' }}>
                          🏍️ {review.bike.brand} {review.bike.model}
                        </div>
                      )}
                    </div>
                    <StarRating value={review.rating || 5} readOnly size="sm" />
                  </div>

                  {review.comment && (
                    <p style={{ margin: '8px 0 0 0', color: '#334155', fontSize: '14px', lineHeight: '1.5' }}>
                      "{review.comment}"
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Report User Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetType="user"
        targetId={profileUser._id}
        targetName={profileUser.name}
      />
    </div>
  )
}
