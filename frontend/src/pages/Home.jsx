import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Home.css'

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/find-bikes?search=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate('/find-bikes')
    }
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          🏍️ Peer-to-Peer Motorcycle Sharing
        </div>
        <h1 className="hero-title">
          Rent Motorcycles from Verified Owners with <span>100% Direct Cash</span>
        </h1>
        <p className="hero-desc">
          Zero middleman deductions. Zero waiting for platform payouts. Pay cash directly at handover, verify with safe OTP, and ride freely.
        </p>

        <form onSubmit={handleSearch} className="hero-search-box">
          <span style={{ fontSize: '18px', color: '#64748b', paddingLeft: '4px' }}>🔍</span>
          <input
            type="text"
            placeholder="Search by city, area, brand (e.g. Royal Enfield, Bengaluru)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="hero-search-input"
          />
          <button type="submit" className="hero-search-btn">
            Find Bikes
          </button>
        </form>

        <div className="hero-city-pills">
          <span>Popular cities:</span>
          <Link to="/find-bikes?search=Bengaluru" className="city-pill">Bengaluru</Link>
          <Link to="/find-bikes?search=Mumbai" className="city-pill">Mumbai</Link>
          <Link to="/find-bikes?search=Delhi" className="city-pill">Delhi</Link>
          <Link to="/find-bikes?search=Hyderabad" className="city-pill">Hyderabad</Link>
          <Link to="/find-bikes?search=Goa" className="city-pill">Goa</Link>
          <Link to="/find-bikes?search=Pune" className="city-pill">Pune</Link>
        </div>
      </section>

      {/* Value Props */}
      <section className="props-section">
        <div className="section-header">
          <h2 className="section-title">Why Riders & Owners Love BikeShare</h2>
          <p className="section-subtitle">A transparent, direct motorcycle sharing experience built on trust</p>
        </div>

        <div className="props-grid">
          <div className="prop-card">
            <span className="prop-icon">💵</span>
            <h3 className="prop-title">100% Direct Cash Handover</h3>
            <p className="prop-desc">
              All rental amounts and security deposits are paid directly in cash between the renter and owner. Zero online gateway charges or delayed payouts.
            </p>
          </div>

          <div className="prop-card">
            <span className="prop-icon">📷</span>
            <h3 className="prop-title">Two-Sided Pre/Post Inspections</h3>
            <p className="prop-desc">
              6-angle photo checklists (front, back, left, right, odometer, damage) protect both parties before departure and at return.
            </p>
          </div>

          <div className="prop-card">
            <span className="prop-icon">🔑</span>
            <h3 className="prop-title">Secure OTP Verification</h3>
            <p className="prop-desc">
              No guesswork. Once cash is handed over, the owner generates a 6-digit OTP code to start the ride safely.
            </p>
          </div>

          <div className="prop-card">
            <span className="prop-icon">⭐</span>
            <h3 className="prop-title">Verified Community Reviews</h3>
            <p className="prop-desc">
              Detailed 2-way rating system evaluating motorcycle condition, owner communication, and rider bike handling.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="steps-section">
        <div className="steps-container">
          <div className="section-header">
            <h2 className="section-title">How BikeShare Works</h2>
            <p className="section-subtitle">Get on the road in 4 simple steps</p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔍</div>
              <h3 className="step-title">Find & Request</h3>
              <p className="step-desc">
                Browse approved bikes in your city, select your rental dates, and submit a booking request to the owner.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>💵</div>
              <h3 className="step-title">Meet & Pay Cash</h3>
              <p className="step-desc">
                Meet the owner at handover, inspect the bike together, and pay the exact rental amount + security deposit in cash.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔑</div>
              <h3 className="step-title">Verify OTP & Ride</h3>
              <p className="step-desc">
                Enter the owner's 6-digit handover OTP on your dashboard to activate the trip and hit the highway!
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">4</div>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🏁</div>
              <h3 className="step-title">Return & Refund</h3>
              <p className="step-desc">
                Complete return inspection and immediately collect your security deposit back in direct cash from the owner.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <div style={{ padding: '0 20px' }}>
        <div className="cta-banner">
          <h2>Ready for Your Next Road Trip?</h2>
          <p>Join thousands of verified riders and owners sharing bikes across India.</p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/find-bikes" className="cta-btn-white">
              🔍 Explore Motorcycles
            </Link>
            <Link to="/register" style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              padding: '12px 26px',
              borderRadius: '10px',
              fontWeight: '700',
              textDecoration: 'none',
              border: '1px solid rgba(255, 255, 255, 0.4)'
            }}>
              🏍️ List Your Bike
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
