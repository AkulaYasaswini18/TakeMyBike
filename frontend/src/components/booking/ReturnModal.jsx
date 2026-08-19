import React, { useState } from 'react'
import * as bookingService from '../../services/bookingService'
import { getErrorMessage } from '../../services/api'

const anglesConfig = [
  { id: 'front', label: 'Front View 📸' },
  { id: 'back', label: 'Back View 📸' },
  { id: 'left', label: 'Left Side 📸' },
  { id: 'right', label: 'Right Side 📸' },
  { id: 'odometer', label: 'Odometer Reading 🔢' },
  { id: 'damage', label: 'Damage / Scratches ⚠️' }
]

export default function ReturnModal({
  booking,
  existingAfterInspection,
  isOpen,
  onClose,
  onReturnSuccess
}) {
  const [files, setFiles] = useState({})
  const [previews, setPreviews] = useState({})
  const [hasDamage, setHasDamage] = useState(false)
  const [damageNotes, setDamageNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen || !booking) return null

  const handleFileChange = (angle, e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError(`Please select a valid image for ${angle}`)
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(`Image for ${angle} exceeds 5MB limit`)
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

    const hasNewFiles = Object.keys(files).length > 0
    const hasExistingPhotos = existingAfterInspection && existingAfterInspection.images && Object.keys(existingAfterInspection.images).length > 0

    if (!hasNewFiles && !hasExistingPhotos) {
      setError('After-rental inspection photos are required. Please upload at least one photo.')
      return
    }

    if (hasDamage && !damageNotes.trim()) {
      setError('Please provide notes describing the damage found on the bike.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('hasDamage', hasDamage)
      if (damageNotes.trim()) {
        formData.append('damageNotes', damageNotes.trim())
      }

      Object.keys(files).forEach(angle => {
        formData.append(angle, files[angle])
      })

      const res = await bookingService.returnBike(booking._id, formData)
      if (onReturnSuccess) {
        onReturnSuccess(res)
      }
      onClose()
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to process bike return or create the dispute. Please try again.'))
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', color: '#0f172a' }}>
              Process Bike Return & Inspection
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
              {booking.bike?.brand} {booking.bike?.model} • Rented by {booking.renter?.name || 'Renter'}
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
          {/* Step 1: After Photos Upload */}
          <div style={{ marginBottom: '20px' }}>
            <strong style={{ display: 'block', fontSize: '14px', color: '#0f172a', marginBottom: '8px' }}>
              1. Upload Return / After-Rental Photos (Required)
            </strong>
            <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#64748b' }}>
              Capture the bike's returned state, odometer, and any new scratches.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: '12px'
            }}>
              {anglesConfig.map(({ id, label }) => {
                const preview = previews[id] || existingAfterInspection?.images?.[id]
                return (
                  <div
                    key={id}
                    style={{
                      border: preview ? '2px solid #22c55e' : '1.5px dashed #cbd5e1',
                      borderRadius: '10px',
                      padding: '10px',
                      backgroundColor: preview ? '#f0fdf4' : '#f8fafc',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
                      {label}
                    </span>

                    {preview ? (
                      <div style={{ position: 'relative', width: '100%', height: '90px' }}>
                        <img
                          src={preview}
                          alt={id}
                          style={{
                            width: '100%',
                            height: '90px',
                            objectFit: 'cover',
                            borderRadius: '6px'
                          }}
                        />
                        {previews[id] && (
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
                              width: '20px',
                              height: '20px',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ) : (
                      <label style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '90px',
                        cursor: 'pointer',
                        border: '1px dashed #94a3b8',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff'
                      }}>
                        <span style={{ fontSize: '18px' }}>📷</span>
                        <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: '600' }}>Choose Photo</span>
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
          </div>

          {/* Step 2: Damage Flagging */}
          <div style={{
            backgroundColor: hasDamage ? '#fff1f2' : '#f0fdf4',
            border: `1.5px solid ${hasDamage ? '#f43f5e' : '#86efac'}`,
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px'
          }}>
            <strong style={{ display: 'block', fontSize: '14px', color: '#0f172a', marginBottom: '10px' }}>
              2. Damage Assessment & Condition Verification
            </strong>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#166534' }}>
                <input
                  type="radio"
                  name="damageAssessment"
                  checked={!hasDamage}
                  onChange={() => setHasDamage(false)}
                />
                ✅ No Damage (All Good)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#9f1239' }}>
                <input
                  type="radio"
                  name="damageAssessment"
                  checked={hasDamage}
                  onChange={() => setHasDamage(true)}
                />
                ⚠️ Damage / Scratches Identified (Flag for Dispute)
              </label>
            </div>

            {hasDamage && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#9f1239', marginBottom: '4px' }}>
                  Describe the damage found (required for dispute):
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Scratched right side mirror and dented front mudguard during return."
                  value={damageNotes}
                  onChange={(e) => setDamageNotes(e.target.value)}
                  required={hasDamage}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1.5px solid #fda4af',
                    borderRadius: '6px',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ fontSize: '11px', color: '#be123c', marginTop: '4px', display: 'block' }}>
                  Flagging damage will mark the booking as DISPUTED and withhold the security deposit.
                </span>
              </div>
            )}
          </div>

          {/* Persistent Disclaimer */}
          <div style={{
            fontSize: '12px',
            color: '#64748b',
            marginBottom: '20px',
            fontStyle: 'italic'
          }}>
            📌 <strong>Direct Cash Return:</strong> If no damage is flagged, the security deposit must be returned directly in cash to the renter. BikeShare does not process or hold deposit funds.
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
              disabled={loading}
              style={{
                padding: '10px 24px',
                backgroundColor: hasDamage ? '#dc2626' : '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '700',
                fontSize: '14px',
                boxShadow: hasDamage ? '0 2px 6px rgba(220, 38, 38, 0.3)' : '0 2px 6px rgba(22, 163, 74, 0.3)'
              }}
            >
              {loading
                ? 'Processing Return...'
                : (hasDamage ? '⚠️ Flag Damage & Open Dispute' : '✓ Complete Return & Release Deposit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
