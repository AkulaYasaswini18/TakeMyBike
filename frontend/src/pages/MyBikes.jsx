import React, { useEffect, useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthContext from '../context/AuthContext'
import * as bikeService from '../services/bikeService'
import './MyBikes.css'

export default function MyBikes() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [bikes, setBikes] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    loadBikes()
  }, [])

  const loadBikes = async () => {
    try {
      const data = await bikeService.getMyBikes()
      setBikes(data.bikes || [])
    } catch (err) {
      setMsg(`Error loading bikes: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (bikeId) => {
    if (!window.confirm('Are you sure you want to delete this bike? This action cannot be undone.')) return
    try {
      await bikeService.deleteBike(bikeId)
      setBikes(bikes.filter(b => b._id !== bikeId))
      setMsg('Bike deleted successfully')
    } catch (err) {
      setMsg(`Error deleting bike: ${err.message}`)
    }
  }

  const getStatusBadge = (bike) => {
    if (bike.isApproved === true) {
      return <span className="status-badge status-approved">✓ Approved</span>
    } else if (bike.isApproved === false) {
      return <span className="status-badge status-pending">⧗ Pending Approval</span>
    }
    return <span className="status-badge status-rejected">✕ Rejected</span>
  }

  if (!user || user.role !== 'owner') {
    return (
      <div className="my-bikes-container">
        <div className="empty-state">
          <p>Only bike owners can access this page.</p>
          <Link to="/" style={{ marginTop: '15px', display: 'inline-block', padding: '10px 20px', background: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="my-bikes-container">
        <div className="loading-spinner">Loading your bikes...</div>
      </div>
    )
  }

  return (
    <div className="my-bikes-container">
      <div className="my-bikes-header">
        <h2>My Bikes</h2>
        <Link to="/add-bike" className="add-bike-button">
          + Add New Bike
        </Link>
      </div>

      {msg && (
        <div className={`message ${msg.includes('Error') ? 'error-msg' : 'success-msg'}`}>
          {msg}
        </div>
      )}

      {bikes.length === 0 ? (
        <div className="empty-state">
          <p>You haven't added any bikes yet.</p>
          <Link to="/add-bike" className="add-bike-button">
            + Add Your First Bike
          </Link>
        </div>
      ) : (
        <div className="bikes-grid">
          {bikes.map(bike => (
            <div key={bike._id} className="bike-card">
              <div className="bike-card-content">
                <div className="bike-info">
                  <h3 className="bike-title">
                    {bike.brand} {bike.model} <span style={{ fontSize: '0.8em', color: '#999' }}>({bike.year})</span>
                  </h3>
                  
                  {getStatusBadge(bike)}

                  <div className="bike-details">
                    <div className="bike-detail">
                      <span className="bike-detail-label">Type</span>
                      <span className="bike-detail-value">{bike.type}</span>
                    </div>
                    <div className="bike-detail">
                      <span className="bike-detail-label">Price/Day</span>
                      <span className="bike-detail-value">₹{bike.pricePerDay}</span>
                    </div>
                    <div className="bike-detail">
                      <span className="bike-detail-label">Security Deposit</span>
                      <span className="bike-detail-value">{bike.securityDeposit ? `₹${bike.securityDeposit}` : 'N/A'}</span>
                    </div>
                    <div className="bike-detail">
                      <span className="bike-detail-label">Condition</span>
                      <span className="bike-detail-value">{bike.condition}</span>
                    </div>
                    {bike.location?.area && (
                      <div className="bike-detail">
                        <span className="bike-detail-label">Pickup Area</span>
                        <span className="bike-detail-value">{bike.location.area}</span>
                      </div>
                    )}
                    {bike.registrationNumber && (
                      <div className="bike-detail">
                        <span className="bike-detail-label">Registration</span>
                        <span className="bike-detail-value">{bike.registrationNumber}</span>
                      </div>
                    )}
                  </div>

                  {bike.description && (
                    <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: '14px', color: '#555' }}>
                      <strong>Description:</strong> {bike.description}
                    </div>
                  )}

                  {bike.images?.length > 0 && (
                    <div>
                      <strong style={{ display: 'block', marginBottom: '8px', marginTop: '12px' }}>Images:</strong>
                      <div className="bike-images">
                        {bike.images.map((img, idx) => (
                          <img key={idx} src={img} alt={`${bike.brand} ${bike.model} ${idx + 1}`} className="bike-image" title={`Image ${idx + 1}`} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bike-actions">
                  <Link to={`/add-bike/${bike._id}`} className="action-button edit-button">
                    Edit
                  </Link>
                  <button onClick={() => handleDelete(bike._id)} className="action-button delete-button">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
