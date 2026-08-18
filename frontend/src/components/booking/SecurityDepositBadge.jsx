import React, { useState } from 'react'

const depositStatusConfig = {
  HELD_BY_OWNER: {
    label: 'Held by Owner in Cash',
    bg: '#fef3c7',
    color: '#92400e',
    borderColor: '#fde68a',
    desc: 'Deposit was collected in cash at pickup and is held safely by the bike owner.'
  },
  REFUND_PENDING: {
    label: 'Refund Pending (Direct Cash)',
    bg: '#eff6ff',
    color: '#1e40af',
    borderColor: '#bfdbfe',
    desc: 'Rental completed without damage. The owner must hand over the deposit in cash directly to the renter.'
  },
  REFUNDED_DIRECTLY_BY_OWNER: {
    label: '✓ Refunded Directly by Owner',
    bg: '#dcfce7',
    color: '#15803d',
    borderColor: '#86efac',
    desc: 'Security deposit was returned directly in cash to the renter by the owner.'
  },
  DISPUTED: {
    label: '⚠️ Deposit Withheld / Disputed',
    bg: '#fee2e2',
    color: '#b91c1c',
    borderColor: '#fca5a5',
    desc: 'Damage was flagged during return inspection. Deposit is withheld pending dispute resolution.'
  }
}

export default function SecurityDepositBadge({
  deposit,
  amount = 0,
  isOwner = false,
  onRefundClick,
  refundLoading = false
}) {
  const status = deposit?.status || 'HELD_BY_OWNER'
  const config = depositStatusConfig[status] || depositStatusConfig.HELD_BY_OWNER
  const depositAmount = Number(deposit?.amount || amount || 0)

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: `1.5px solid ${config.borderColor}`,
      borderRadius: '12px',
      padding: '16px 20px',
      marginTop: '14px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🔒</span>
          <strong style={{ fontSize: '15px', color: '#1e293b' }}>
            Security Deposit: ₹{depositAmount.toFixed(2)}
          </strong>
        </div>

        <span style={{
          padding: '4px 12px',
          backgroundColor: config.bg,
          color: config.color,
          borderRadius: '9999px',
          fontWeight: '700',
          fontSize: '12px',
          border: `1px solid ${config.borderColor}`
        }}>
          {config.label}
        </span>
      </div>

      <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
        {config.desc}
      </p>

      {/* Direct Refund Action for Owner */}
      {isOwner && status === 'REFUND_PENDING' && onRefundClick && (
        <div style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px dashed #cbd5e1',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: '600' }}>
            Have you handed ₹{depositAmount.toFixed(2)} cash back to the renter?
          </span>
          <button
            id={`refund-deposit-btn-${deposit?._id || 'btn'}`}
            onClick={onRefundClick}
            disabled={refundLoading}
            style={{
              padding: '8px 18px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: refundLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)',
              opacity: refundLoading ? 0.7 : 1
            }}
          >
            {refundLoading ? 'Processing...' : '✓ Mark Deposit as Refunded (Direct Cash)'}
          </button>
        </div>
      )}

      {/* Persistent Direct Cash Notice */}
      <div style={{
        marginTop: '10px',
        paddingTop: '8px',
        borderTop: '1px dashed #e2e8f0',
        fontSize: '12px',
        color: '#64748b',
        fontWeight: '500'
      }}>
        📌 <strong>Direct Cash Return:</strong> The owner returns the security deposit directly to the renter in person. BikeShare does not process, hold, or transfer deposit funds.
      </div>
    </div>
  )
}
