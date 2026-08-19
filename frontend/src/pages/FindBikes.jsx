import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import * as bikeService from '../services/bikeService'
import BikeCard from '../components/bikes/BikeCard'
import SkeletonLoader from '../components/common/SkeletonLoader'
import EmptyState from '../components/common/EmptyState'
import ErrorMessage from '../components/common/ErrorMessage'
import { getErrorMessage } from '../services/api'

export default function FindBikes() {
  const [searchParams] = useSearchParams()
  const initialQuery = searchParams.get('search') || ''

  const [filters, setFilters] = useState({
    location: initialQuery,
    startDate: '',
    endDate: '',
    minPrice: '',
    maxPrice: '',
    brand: '',
    type: '',
    minRating: '',
    sortBy: ''
  })

  const [bikes, setBikes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  useEffect(() => {
    // Initial fetch on mount or if search query changes
    const fetchInitialBikes = async () => {
      setLoading(true)
      setError(null)
      try {
        const cleanFilters = Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value !== '')
        )
        const data = await bikeService.searchBikes(cleanFilters)
        setBikes(data.bikes || [])
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to search bikes. Please try again.'))
        setBikes([])
      } finally {
        setLoading(false)
      }
    }

    fetchInitialBikes()
  }, [])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const handleSearch = async (e) => {
    if (e) e.preventDefault()
    setLoading(true)
    setError(null)
    setMobileFiltersOpen(false)

    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== '')
      )
      const data = await bikeService.searchBikes(cleanFilters)
      setBikes(data.bikes || [])
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to search bikes. Please try again.'))
      setBikes([])
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    const resetValues = {
      location: '',
      startDate: '',
      endDate: '',
      minPrice: '',
      maxPrice: '',
      brand: '',
      type: '',
      minRating: '',
      sortBy: ''
    }
    setFilters(resetValues)
    setError(null)
    setMobileFiltersOpen(false)

    // Re-fetch all bikes
    setLoading(true)
    bikeService.searchBikes({})
      .then(data => setBikes(data.bikes || []))
      .catch(err => {
        setError(getErrorMessage(err, 'Unable to reload bikes. Please try again.'))
        setBikes([])
      })
      .finally(() => setLoading(false))
  }

  return (
    <div className="find-bikes-layout" style={{
      display: 'flex',
      minHeight: 'calc(100vh - 60px)',
      backgroundColor: '#f8fafc',
      position: 'relative'
    }}>
      {/* Mobile Filter Toggle Header */}
      <div className="mobile-filter-bar" style={{
        display: 'none',
        padding: '12px 16px',
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%'
      }}>
        <span style={{ fontWeight: '700', fontSize: '15px' }}>
          🏍️ Available Bikes ({bikes.length})
        </span>
        <button
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          style={{
            background: '#0284c7',
            color: '#ffffff',
            border: 'none',
            padding: '7px 14px',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          {mobileFiltersOpen ? '✕ Close Filters' : '⚙️ Filters'}
        </button>
      </div>

      {/* Sidebar Filters */}
      <aside className={`find-bikes-sidebar ${mobileFiltersOpen ? 'mobile-open' : ''}`} style={{
        width: '320px',
        backgroundColor: '#ffffff',
        padding: '24px 20px',
        borderRight: '1px solid #e2e8f0',
        overflowY: 'auto',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
            Search Filters
          </h2>
          <button
            onClick={handleReset}
            style={{
              background: 'none',
              border: 'none',
              color: '#0284c7',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Reset All
          </button>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Location */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#334155' }}>
              📍 Location / Area
            </label>
            <input
              type="text"
              name="location"
              placeholder="e.g. Koramangala, Indiranagar"
              value={filters.location}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '13.5px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Date Range */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '700', color: '#334155' }}>
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '700', color: '#334155' }}>
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#334155' }}>
              💵 Price / Day (₹)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input
                type="number"
                name="minPrice"
                placeholder="Min ₹"
                value={filters.minPrice}
                onChange={handleFilterChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
              <input
                type="number"
                name="maxPrice"
                placeholder="Max ₹"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Brand */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#334155' }}>
              🏍️ Brand
            </label>
            <select
              name="brand"
              value={filters.brand}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '13.5px',
                background: '#ffffff'
              }}
            >
              <option value="">All Brands</option>
              <option value="Royal Enfield">Royal Enfield</option>
              <option value="KTM">KTM</option>
              <option value="Yamaha">Yamaha</option>
              <option value="Honda">Honda</option>
              <option value="Bajaj">Bajaj</option>
              <option value="TVS">TVS</option>
              <option value="Harley-Davidson">Harley-Davidson</option>
              <option value="BMW">BMW</option>
              <option value="Kawasaki">Kawasaki</option>
              <option value="Hero">Hero</option>
              <option value="Suzuki">Suzuki</option>
            </select>
          </div>

          {/* Bike Type */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#334155' }}>
              Type / Category
            </label>
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '13.5px',
                background: '#ffffff'
              }}
            >
              <option value="">All Types</option>
              <option value="Cruiser">Cruiser</option>
              <option value="Sports">Sports</option>
              <option value="Adventure">Adventure / Touring</option>
              <option value="Commuter">Commuter</option>
              <option value="Scooter">Scooter</option>
            </select>
          </div>

          {/* Rating */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#334155' }}>
              ⭐ Min Rating
            </label>
            <select
              name="minRating"
              value={filters.minRating}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '13.5px',
                background: '#ffffff'
              }}
            >
              <option value="">Any Rating</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="4.0">4.0+ Stars</option>
              <option value="3.5">3.5+ Stars</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#334155' }}>
              Sort By
            </label>
            <select
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '13.5px',
                background: '#ffffff'
              }}
            >
              <option value="">Featured / Newest</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>

          <button
            type="submit"
            style={{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              padding: '11px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              marginTop: '8px',
              boxShadow: '0 4px 10px rgba(2, 132, 199, 0.25)'
            }}
          >
            Apply Filters
          </button>
        </form>
      </aside>

      {/* Main Results Area */}
      <main style={{
        flex: 1,
        padding: '24px 28px',
        overflowY: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
              Find Motorcycles
            </h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
              Verified bikes ready for direct cash handover
            </p>
          </div>

          {!loading && (
            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>
              Showing {bikes.length} motorcycle{bikes.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {error && (
          <ErrorMessage
            title="Search Notice"
            message={error}
            onRetry={handleSearch}
          />
        )}

        {loading && (
          <SkeletonLoader type="bike-grid" count={6} />
        )}

        {!loading && bikes.length === 0 && (
          <EmptyState
            icon="🏍️"
            title="No motorcycles found"
            description="No approved bikes match your selected filters. Try broadening your location or clearing specific filters."
            actionText="Reset Filters"
            onAction={handleReset}
          />
        )}

        {!loading && bikes.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {bikes.map(bike => (
              <BikeCard key={bike._id} bike={bike} />
            ))}
          </div>
        )}
      </main>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 768px) {
          .find-bikes-layout {
            flex-direction: column !important;
          }
          .mobile-filter-bar {
            display: flex !important;
          }
          .find-bikes-sidebar {
            display: none;
            width: 100% !important;
            box-sizing: border-box !important;
            border-right: none !important;
            border-bottom: 1px solid #e2e8f0;
          }
          .find-bikes-sidebar.mobile-open {
            display: block !important;
          }
        }
      `}</style>
    </div>
  )
}
