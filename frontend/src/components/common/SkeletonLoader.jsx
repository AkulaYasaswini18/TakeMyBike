import React from 'react';

export function BikeCardSkeleton() {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
      padding: '0 0 16px 0',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div className="skeleton" style={{ height: '180px', width: '100%', borderRadius: '0' }} />
      <div style={{ padding: '16px 16px 0 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div className="skeleton" style={{ height: '20px', width: '75%' }} />
        <div className="skeleton" style={{ height: '14px', width: '50%' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          <div className="skeleton" style={{ height: '24px', width: '40%' }} />
          <div className="skeleton" style={{ height: '24px', width: '30%', borderRadius: '9999px' }} />
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '14px',
      border: '1px solid #e2e8f0',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div className="skeleton" style={{ height: '36px', width: '36px', borderRadius: '10px' }} />
      <div className="skeleton" style={{ height: '14px', width: '60%' }} />
      <div className="skeleton" style={{ height: '28px', width: '45%' }} />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, idx) => (
        <td key={idx} style={{ padding: '14px 18px' }}>
          <div className="skeleton" style={{ height: '16px', width: idx === 0 ? '80%' : '60%' }} />
        </td>
      ))}
    </tr>
  );
}

export default function SkeletonLoader({ type = 'card', count = 3, cols = 5 }) {
  if (type === 'bike-grid') {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '24px',
        width: '100%'
      }}>
        {Array.from({ length: count }).map((_, idx) => (
          <BikeCardSkeleton key={idx} />
        ))}
      </div>
    );
  }

  if (type === 'stats') {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        width: '100%',
        marginBottom: '24px'
      }}>
        {Array.from({ length: count }).map((_, idx) => (
          <StatCardSkeleton key={idx} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="skeleton" style={{ height: '48px', width: '100%', borderRadius: '10px' }} />
      ))}
    </div>
  );
}
