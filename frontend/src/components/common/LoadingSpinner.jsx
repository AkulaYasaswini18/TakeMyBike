import React from 'react';

export default function LoadingSpinner({ size = 'md', message = '', fullPage = false }) {
  const sizeMap = {
    sm: { dimension: 20, stroke: 3 },
    md: { dimension: 36, stroke: 3.5 },
    lg: { dimension: 52, stroke: 4 }
  };

  const { dimension, stroke } = sizeMap[size] || sizeMap.md;

  const content = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: fullPage ? '60px 20px' : '20px',
      gap: '12px'
    }}>
      <svg
        width={dimension}
        height={dimension}
        viewBox="0 0 50 50"
        style={{ animation: 'spin 0.8s linear infinite' }}
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={stroke}
        />
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="#0284c7"
          strokeWidth={stroke}
          strokeDasharray="80"
          strokeDashoffset="60"
        />
      </svg>
      {message && (
        <p style={{
          margin: 0,
          fontSize: size === 'sm' ? '12.5px' : '14px',
          color: '#64748b',
          fontWeight: '500'
        }}>
          {message}
        </p>
      )}
      <style>{`
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  if (fullPage) {
    return (
      <div style={{
        minHeight: '40vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {content}
      </div>
    );
  }

  return content;
}
