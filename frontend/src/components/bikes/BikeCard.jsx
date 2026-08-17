import React from 'react'
import { Link } from 'react-router-dom'

export default function BikeCard({ bike }) {
  const imageUrl = bike.images && bike.images.length > 0 ? bike.images[0] : '/placeholder-bike.png'
  const ownerRating = bike.owner?.rating || 0

  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '15px',
      backgroundColor: '#fff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      transition: 'box-shadow 0.2s',
      cursor: 'pointer',
      ':hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.15)' }
    }}>
      {/* Image */}
      <div style={{ marginBottom: '12px', borderRadius: '4px', overflow: 'hidden', height: '200px', backgroundColor: '#f0f0f0' }}>
        <img
          src={imageUrl}
          alt={`${bike.brand} ${bike.model}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23ccc%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2216%22 fill=%22%23666%22%3ENo Image%3C/text%3E%3C/svg%3E'}
        />
      </div>

      {/* Bike Info */}
      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{bike.brand} {bike.model}</h3>
      <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
        <strong>Year:</strong> {bike.year} | <strong>Type:</strong> {bike.type || 'N/A'}
      </p>

      {/* Price */}
      <div style={{ margin: '8px 0', fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>
        ${bike.pricePerDay}/day
      </div>

      {/* Owner & Rating */}
      <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
        <strong>Owner:</strong> {bike.owner?.name || 'Unknown'} ⭐ {ownerRating.toFixed(1)}
      </p>

      {/* Location & Area */}
      {bike.location?.area && (
        <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
          📍 {bike.location.area}
        </p>
      )}

      {/* Condition & Availability */}
      <div style={{ margin: '8px 0', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {bike.condition && (
          <span style={{ padding: '4px 8px', backgroundColor: '#e9ecef', borderRadius: '4px', fontSize: '12px' }}>
            {bike.condition}
          </span>
        )}
        {bike.isAvailable && (
          <span style={{ padding: '4px 8px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
            ✓ Available
          </span>
        )}
      </div>

      {/* View Details Button */}
      <Link
        to={`/bikes/${bike._id}`}
        style={{
          display: 'inline-block',
          marginTop: '12px',
          padding: '10px 15px',
          backgroundColor: '#007bff',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: 'bold',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
      >
        View Details
      </Link>
    </div>
  )
}
