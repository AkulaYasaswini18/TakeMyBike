import React from 'react';

const ERROR_SCENARIOS = {
  INVALID_LOGIN: {
    icon: '🔒',
    title: 'Incorrect Credentials',
    message: 'The email or password you entered is incorrect. Please check your credentials and try again.'
  },
  BIKE_UNAVAILABLE: {
    icon: '🚫',
    title: 'Bike Currently Unavailable',
    message: 'This bike is currently rented out or undergoing maintenance. Please choose another available motorcycle.'
  },
  DATE_CONFLICT: {
    icon: '📅',
    title: 'Booking Date Conflict',
    message: 'The selected dates conflict with an existing confirmed rental for this bike. Please select alternative dates.'
  },
  REJECTED_REQUEST: {
    icon: '✗',
    title: 'Request Declined',
    message: 'This rental request was declined by the bike owner. You can browse other bikes in the area.'
  },
  CASH_PAYMENT_PENDING: {
    icon: '💵',
    title: 'Cash Payment Handover Pending',
    message: 'Cash payment has not been recorded yet. Please hand over the exact cash amount (Rental fee + Security deposit) directly to the owner.'
  },
  INVALID_OTP: {
    icon: '🔑',
    title: 'Invalid Handover OTP',
    message: 'The 6-digit OTP code does not match. Please verify the code generated on the owner\'s dashboard.'
  },
  EXPIRED_BOOKING: {
    icon: '⏳',
    title: 'Invalid Rental Dates',
    message: 'Selected start date cannot be in the past. Please choose current or future dates.'
  },
  UPLOAD_FAILURE: {
    icon: '📷',
    title: 'Photo Upload Failed',
    message: 'Unable to upload image. Please ensure photos are valid JPEG/PNG formats under 5MB.'
  },
  UNAUTHORIZED: {
    icon: '🛡️',
    title: 'Access Restricted',
    message: 'You do not have permission to view or manage this resource with your current user account.'
  },
  NETWORK_ERROR: {
    icon: '📡',
    title: 'Connection Issue',
    message: 'Unable to connect to BikeShare servers. Please check your internet connection and try again.'
  },
  DISPUTE_OPENED: {
    icon: '⚠️',
    title: 'Damage Flagged / Dispute Active',
    message: 'A damage report or dispute is active on this rental. Security deposit is withheld pending admin mediation.'
  }
};

export default function ErrorMessage({
  scenario = null,
  title = '',
  message = '',
  onRetry = null,
  compact = false
}) {
  const scenarioData = scenario && ERROR_SCENARIOS[scenario] ? ERROR_SCENARIOS[scenario] : null;

  const displayIcon = scenarioData?.icon || '⚠️';
  const displayTitle = title || scenarioData?.title || 'Notice';
  const displayMessage = message || scenarioData?.message || 'An issue occurred. Please check and try again.';

  if (compact) {
    return (
      <div style={{
        background: '#fee2e2',
        border: '1px solid #fca5a5',
        borderRadius: '8px',
        padding: '10px 14px',
        color: '#b91c1c',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        margin: '10px 0'
      }}>
        <span>{displayIcon}</span>
        <span style={{ flex: 1 }}>{displayMessage}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              background: 'none',
              border: 'none',
              color: '#991b1b',
              fontWeight: '700',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
              fontSize: '12px'
            }}
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '14px',
      border: '1.5px solid #fca5a5',
      borderLeft: '5px solid #ef4444',
      padding: '20px',
      margin: '16px 0',
      boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.08)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '16px'
    }}>
      <div style={{
        fontSize: '28px',
        lineHeight: 1,
        background: '#fee2e2',
        width: '44px',
        height: '44px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {displayIcon}
      </div>

      <div style={{ flex: 1 }}>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: '#991b1b' }}>
          {displayTitle}
        </h4>
        <p style={{ margin: '0 0 10px 0', fontSize: '13.5px', color: '#475569', lineHeight: 1.5 }}>
          {displayMessage}
        </p>

        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
          >
            🔄 Retry Action
          </button>
        )}
      </div>
    </div>
  );
}
