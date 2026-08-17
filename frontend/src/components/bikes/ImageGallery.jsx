import React, { useState } from 'react'

export default function ImageGallery({ images = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div style={{
        width: '100%',
        height: '400px',
        backgroundColor: '#e9ecef',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999'
      }}>
        No images available
      </div>
    )
  }

  const currentImage = images[currentIndex]
  const goToPrevious = () => setCurrentIndex((currentIndex - 1 + images.length) % images.length)
  const goToNext = () => setCurrentIndex((currentIndex + 1) % images.length)

  return (
    <div>
      {/* Main Image */}
      <div style={{
        width: '100%',
        height: '400px',
        backgroundColor: '#f0f0f0',
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '15px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <img
          src={currentImage}
          alt={`Bike view ${currentIndex + 1}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22%3E%3Crect fill=%22%23ccc%22 width=%22400%22 height=%22400%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2220%22 fill=%22%23666%22%3EImage Error%3C/text%3E%3C/svg%3E'}
        />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              style={{
                position: 'absolute',
                left: '15px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ❮
            </button>
            <button
              onClick={goToNext}
              style={{
                position: 'absolute',
                right: '15px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ❯
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div style={{
          display: 'flex',
          gap: '10px',
          overflowX: 'auto',
          paddingBottom: '10px'
        }}>
          {images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`Thumbnail ${idx + 1}`}
              onClick={() => setCurrentIndex(idx)}
              style={{
                width: '80px',
                height: '80px',
                objectFit: 'cover',
                borderRadius: '4px',
                cursor: 'pointer',
                border: idx === currentIndex ? '3px solid #007bff' : '1px solid #ddd',
                opacity: idx === currentIndex ? 1 : 0.7,
                flexShrink: 0
              }}
            />
          ))}
        </div>
      )}

      {/* Counter */}
      {images.length > 1 && (
        <p style={{ margin: '10px 0 0 0', color: '#666', textAlign: 'center', fontSize: '12px' }}>
          {currentIndex + 1} / {images.length}
        </p>
      )}
    </div>
  )
}
