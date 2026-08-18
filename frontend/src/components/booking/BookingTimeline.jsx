import React, { useState } from 'react'

export default function BookingTimeline({ booking, inspections = [], onOpenUploadModal, userRole }) {
  const [activePhoto, setActivePhoto] = useState(null)

  const beforeInspection = inspections.find(i => i.phase === 'BEFORE')
  const afterInspection = inspections.find(i => i.phase === 'AFTER')

  const isCashConfirmed = ['CASH_PAYMENT_CONFIRMED', 'ACTIVE', 'COMPLETED'].includes(booking.status)
  const isActive = ['ACTIVE', 'COMPLETED'].includes(booking.status)
  const isCompleted = booking.status === 'COMPLETED'

  const angles = ['front', 'back', 'left', 'right', 'odometer', 'damage']

  const renderPhotoGrid = (inspection) => {
    if (!inspection || !inspection.images) return null

    const validAngles = angles.filter(a => inspection.images[a])
    if (validAngles.length === 0) return null

    return (
      <div style={{ marginTop: '10px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
          gap: '8px',
          marginTop: '6px'
        }}>
          {validAngles.map(angle => (
            <div
              key={angle}
              onClick={() => setActivePhoto({ url: inspection.images[angle], title: `${inspection.phase} - ${angle.toUpperCase()}` })}
              style={{
                cursor: 'pointer',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                overflow: 'hidden',
                position: 'relative',
                height: '60px',
                backgroundColor: '#0f172a'
              }}
              title={`Click to view ${angle}`}
            >
              <img
                src={inspection.images[angle]}
                alt={angle}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <span style={{
                position: 'absolute',
                bottom: '2px',
                left: '2px',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                fontSize: '9px',
                padding: '1px 3px',
                borderRadius: '3px',
                textTransform: 'capitalize'
              }}>
                {angle}
              </span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
          Uploaded by: <strong>{inspection.uploadedBy?.name || 'User'}</strong> ({new Date(inspection.createdAt).toLocaleString()})
        </div>
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: '#f8fafc',
      border: '1.5px solid #e2e8f0',
      borderRadius: '12px',
      padding: '20px',
      marginTop: '16px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🔄</span> Rental Handover & Inspection Timeline
        </h4>
        <span style={{ fontSize: '12px', color: '#64748b' }}>
          Status: <strong>{booking.status}</strong>
        </span>
      </div>

      {/* Step Progress Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', position: 'relative' }}>
        {/* Step 1: Before Rental Photos */}
        <div style={{
          backgroundColor: beforeInspection ? '#f0fdf4' : (isCashConfirmed ? '#eff6ff' : '#ffffff'),
          border: beforeInspection ? '2px solid #22c55e' : (isCashConfirmed ? '2px solid #3b82f6' : '1px solid #cbd5e1'),
          borderRadius: '10px',
          padding: '14px',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: beforeInspection ? '#16a34a' : '#0284c7',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              {beforeInspection ? '✓' : '1'}
            </span>
            <strong style={{ fontSize: '13px', color: '#0f172a' }}>1. BEFORE PHOTOS</strong>
          </div>

          <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
            {beforeInspection ? 'Photos recorded at pickup' : 'Inspect bike condition & odometer'}
          </p>

          {renderPhotoGrid(beforeInspection)}

          {!beforeInspection && isCashConfirmed && (
            <button
              onClick={() => onOpenUploadModal('BEFORE')}
              style={{
                marginTop: '10px',
                padding: '6px 12px',
                backgroundColor: '#0284c7',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                width: '100%'
              }}
            >
              + Upload Before Photos
            </button>
          )}
        </div>

        {/* Step 2: Rental Active */}
        <div style={{
          backgroundColor: isActive ? '#ecfdf5' : '#ffffff',
          border: isActive ? '2px solid #10b981' : '1px solid #cbd5e1',
          borderRadius: '10px',
          padding: '14px',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: isActive ? '#059669' : '#94a3b8',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              {isActive ? '✓' : '2'}
            </span>
            <strong style={{ fontSize: '13px', color: '#0f172a' }}>2. RENTAL ACTIVE</strong>
          </div>

          <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
            {isActive
              ? `Started: ${booking.rentalStartTime ? new Date(booking.rentalStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}`
              : 'Requires 6-digit OTP verification'}
          </p>

          {isActive && (
            <div style={{
              marginTop: '8px',
              padding: '6px 8px',
              backgroundColor: '#d1fae5',
              borderRadius: '6px',
              fontSize: '11px',
              color: '#065f46',
              fontWeight: '600'
            }}>
              🚴 Rental in Progress
            </div>
          )}
        </div>

        {/* Step 3: After Rental Photos */}
        <div style={{
          backgroundColor: afterInspection ? '#f0fdf4' : (isActive ? '#eff6ff' : '#ffffff'),
          border: afterInspection ? '2px solid #22c55e' : (isActive ? '2px solid #3b82f6' : '1px solid #cbd5e1'),
          borderRadius: '10px',
          padding: '14px',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: afterInspection ? '#16a34a' : '#94a3b8',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              {afterInspection ? '✓' : '3'}
            </span>
            <strong style={{ fontSize: '13px', color: '#0f172a' }}>3. AFTER PHOTOS</strong>
          </div>

          <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
            {afterInspection ? 'Return condition recorded' : 'Return & post-ride inspection'}
          </p>

          {renderPhotoGrid(afterInspection)}

          {!afterInspection && isActive && (
            <button
              onClick={() => onOpenUploadModal('AFTER')}
              style={{
                marginTop: '10px',
                padding: '6px 12px',
                backgroundColor: '#0284c7',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                width: '100%'
              }}
            >
              + Upload Return Photos
            </button>
          )}
        </div>
      </div>

      {/* Lightbox Photo Preview */}
      {activePhoto && (
        <div
          onClick={() => setActivePhoto(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px'
          }}
        >
          <div style={{ maxWidth: '800px', maxHeight: '80vh', textAlign: 'center' }}>
            <img
              src={activePhoto.url}
              alt={activePhoto.title}
              style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '8px' }}
            />
            <div style={{ color: 'white', marginTop: '8px', fontSize: '14px', fontWeight: '600' }}>
              {activePhoto.title} (Click anywhere to close)
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
