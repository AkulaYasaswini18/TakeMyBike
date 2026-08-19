import React from 'react';
import { Link } from 'react-router-dom';

export default function EmptyState({
  icon = '📦',
  title = 'No items found',
  description = 'There are no records to display at this moment.',
  actionText = '',
  actionLink = '',
  onAction = null
}) {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      border: '1.5px dashed #cbd5e1',
      padding: '48px 24px',
      textAlign: 'center',
      maxWidth: '480px',
      margin: '20px auto'
    }}>
      <div style={{ fontSize: '44px', marginBottom: '14px', lineHeight: 1 }}>
        {icon}
      </div>
      <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
        {title}
      </h3>
      <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#64748b', lineHeight: 1.5 }}>
        {description}
      </p>

      {actionText && actionLink && (
        <Link
          to={actionLink}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            padding: '9px 18px',
            borderRadius: '8px',
            fontSize: '13.5px',
            fontWeight: '600',
            textDecoration: 'none',
            boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)'
          }}
        >
          {actionText}
        </Link>
      )}

      {actionText && onAction && !actionLink && (
        <button
          onClick={onAction}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            padding: '9px 18px',
            borderRadius: '8px',
            fontSize: '13.5px',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)'
          }}
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
