import React, { useState, useEffect } from 'react'
import * as bikeService from '../services/bikeService'
import BikeCard from '../components/bikes/BikeCard'

export default function FindBikes() {
  const [filters, setFilters] = useState({
    location: '',
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters({ ...filters, [name]: value })
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSearched(true)

    try {
      // Remove empty filters
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== '')
      )
      const data = await bikeService.searchBikes(cleanFilters)
      setBikes(data.bikes || [])
    } catch (err) {
      setError(err.response?.data?.error || err.message)
      setBikes([])
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFilters({
      location: '',
      startDate: '',
      endDate: '',
      minPrice: '',
      maxPrice: '',
      brand: '',
      type: '',
      minRating: '',
      sortBy: ''
    })
    setBikes([])
    setSearched(false)
    setError(null)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      {/* Sidebar Filters */}
      <div style={{
        width: '300px',
        backgroundColor: 'white',
        padding: '20px',
        borderRight: '1px solid #ddd',
        overflowY: 'auto',
        boxShadow: '0 0 4px rgba(0,0,0,0.1)'
      }}>
        <h2>Search Filters</h2>
        <form onSubmit={handleSearch}>
          {/* Location */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Location/Area</label>
            <input
              type="text"
              name="location"
              placeholder="Enter area"
              value={filters.location}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Date Range */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Price Range */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Min Price ($)</label>
            <input
              type="number"
              name="minPrice"
              placeholder="0"
              value={filters.minPrice}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Max Price ($)</label>
            <input
              type="number"
              name="maxPrice"
              placeholder="1000"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Brand */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Brand</label>
            <input
              type="text"
              name="brand"
              placeholder="e.g. Trek, Giant"
              value={filters.brand}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Type */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Type</label>
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            >
              <option value="">Any type</option>
              <option value="Mountain">Mountain</option>
              <option value="Road">Road</option>
              <option value="Hybrid">Hybrid</option>
              <option value="BMX">BMX</option>
              <option value="Cruiser">Cruiser</option>
            </select>
          </div>

          {/* Min Rating */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Min Owner Rating</label>
            <select
              name="minRating"
              value={filters.minRating}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            >
              <option value="">Any rating</option>
              <option value="1">⭐ 1+</option>
              <option value="2">⭐⭐ 2+</option>
              <option value="3">⭐⭐⭐ 3+</option>
              <option value="4">⭐⭐⭐⭐ 4+</option>
              <option value="5">⭐⭐⭐⭐⭐ 5</option>
            </select>
          </div>

          {/* Sort */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Sort By</label>
            <select
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            >
              <option value="">Default</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Rating: Highest</option>
            </select>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      <div style={{
        flex: 1,
        padding: '20px',
        maxHeight: '100vh',
        overflowY: 'auto'
      }}>
        <h1>Find Bikes</h1>

        {error && (
          <div style={{
            padding: '15px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '4px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            Error: {error}
          </div>
        )}

        {!searched && (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#666'
          }}>
            <p style={{ fontSize: '18px' }}>Use the filters on the left to search for bikes</p>
          </div>
        )}

        {searched && loading && (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#666'
          }}>
            <p style={{ fontSize: '18px' }}>Loading bikes...</p>
          </div>
        )}

        {searched && !loading && bikes.length === 0 && (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#999'
          }}>
            <p style={{ fontSize: '18px' }}>No bikes found matching your criteria</p>
          </div>
        )}

        {searched && !loading && bikes.length > 0 && (
          <div>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              Found <strong>{bikes.length}</strong> bike{bikes.length !== 1 ? 's' : ''}
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              {bikes.map(bike => (
                <BikeCard key={bike._id} bike={bike} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
