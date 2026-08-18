import React, { useState } from 'react'
import * as bookingService from '../../services/bookingService'

const anglesConfig = [
  { id: 'front', label: 'Front View 📸', desc: 'Full frontal photo of the bike' },
  { id: 'back', label: 'Back / Rear View 📸', desc: 'Rear angle including number plate' },
  { id: 'left', label: 'Left Side 📸', desc: 'Left profile including engine & body' },
  { id: 'right', label: 'Right Side 📸', desc: 'Right profile including exhaust' },
  { id: 'odometer', label: 'Odometer / Speedometer 🔢', desc: 'Clear snapshot of mileage reading' },
  { id: 'damage', label: 'Damage / Scratches ⚠️', desc: 'Any existing dents, scratches, or wear' }
]

export default function InspectionModal({ bookingId, phase, isOpen, onClose, onUploadSuccess }) {
  const [files, setFiles] = useState({})
  const [previews, setPreviews] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const handleFileChange = (angle, e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError(`Please select a valid image for ${angle}`)
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(`Image for ${angle} exceeds the 5MB size limit`)
      return
    }

    setError(null)
    setFiles(prev => ({ ...prev, [angle]: file }))
    setPreviews(prev => ({ ...prev, [angle]: URL.createObjectURL(file) }))
  }

  const handleRemove = (angle) => {
    setFiles(prev => {
      const copy = { ...prev }
      delete copy[angle]
      return copy
    })
    setPreviews(prev => {
      const copy = { ...prev }
      delete copy[angle]
      return copy
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const uploadedCount = Object.keys(files).length
    if (uploadedCount === 0) {
      setError('Please select at least one inspection photo')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('phase', phase)

      Object.keys(files).forEach(angle => {
        formData.append(angle, files[angle])
      })

      const res = await bookingService.uploadInspection(bookingId, formData)
      if (onUploadSuccess) {
        onUploadSuccess(res.inspection)
      }
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload inspection photos')
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
      zIndex: 1000,
      padding: '20px',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        maxWidth: '750px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        padding: '28px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', color: '#0f172a' }}>
              Upload {phase === 'BEFORE' ? 'Before-Rental' : 'After-Rental / Return'} Photos
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
              Capture the bike's condition, odometer reading, and existing scratches to protect both parties
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
              color: '#94a3b8',
              padding: '4px'
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
            marginBottom: '18px',
            fontSize: '13px',
            border: '1px solid #fca5a5'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {anglesConfig.map(({ id, label, desc }) => {
              const preview = previews[id]
              return (
                <div
                  key={id}
                  style={{
                    border: preview ? '2px solid #22c55e' : '1.5px dashed #cbd5e1',
                    borderRadius: '12px',
                    padding: '12px',
                    backgroundColor: preview ? '#f0fdf4' : '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative'
                  }}
                >
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#1e293b', marginBottom: '4px' }}>
                      {label}
                    </strong>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '10px' }}>
                      {desc}
                    </span>
                  </div>

                  {preview ? (
                    <div style={{ position: 'relative', width: '100%', height: '110px' }}>
                      <img
                        src={preview}
                        alt={id}
                        style={{
                          width: '100%',
                          height: '110px',
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemove(id)}
                        disabled={loading}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          background: 'rgba(239, 68, 68, 0.9)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '110px',
                      cursor: 'pointer',
                      border: '1px dashed #94a3b8',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff'
                    }}>
                      <span style={{ fontSize: '20px', marginBottom: '4px' }}>📷</span>
                      <span style={{ fontSize: '12px', color: '#0284c7', fontWeight: '600' }}>Choose Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(id, e)}
                        disabled={loading}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '10px 20px',
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
              disabled={loading || Object.keys(files).length === 0}
              style={{
                padding: '10px 24px',
                backgroundColor: '#0284c7',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading || Object.keys(files).length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: '700',
                fontSize: '14px',
                opacity: loading || Object.keys(files).length === 0 ? 0.6 : 1,
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
              }}
            >
              {loading ? 'Uploading Photos...' : `Upload ${Object.keys(files).length} Photo(s)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
