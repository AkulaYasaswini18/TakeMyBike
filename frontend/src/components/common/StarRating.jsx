import React, { useState } from 'react'

const labels = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent'
}

export default function StarRating({
  value = 0,
  onChange,
  readOnly = false,
  size = 'md',
  showLabel = false
}) {
  const [hoverValue, setHoverValue] = useState(0)

  const sizeMap = {
    sm: { font: '14px', starSize: '16px' },
    md: { font: '16px', starSize: '22px' },
    lg: { font: '18px', starSize: '28px' }
  }

  const { font, starSize } = sizeMap[size] || sizeMap.md
  const currentVal = hoverValue || value || 0

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= currentVal
          return (
            <span
              key={star}
              onClick={() => !readOnly && onChange && onChange(star)}
              onMouseEnter={() => !readOnly && setHoverValue(star)}
              onMouseLeave={() => !readOnly && setHoverValue(0)}
              style={{
                fontSize: starSize,
                cursor: readOnly ? 'default' : 'pointer',
                color: isFilled ? '#f59e0b' : '#d1d5db',
                transition: 'transform 0.1s ease, color 0.1s ease',
                transform: !readOnly && hoverValue === star ? 'scale(1.15)' : 'none',
                userSelect: 'none'
              }}
            >
              ★
            </span>
          )
        })}
      </div>

      {showLabel && currentVal > 0 && (
        <span style={{ fontSize: font, color: '#475569', fontWeight: '600', marginLeft: '4px' }}>
          {labels[currentVal]} ({currentVal}/5)
        </span>
      )}
    </div>
  )
}
