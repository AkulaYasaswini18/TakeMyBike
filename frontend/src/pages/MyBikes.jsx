import React, { useEffect, useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthContext from '../context/AuthContext'
import * as bikeService from '../services/bikeService'

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
    if (!window.confirm('Are you sure you want to delete this bike?')) return
    try {
      await bikeService.deleteBike(bikeId)
      setBikes(bikes.filter(b => b._id !== bikeId))
      setMsg('Bike deleted')
    } catch (err) {
      setMsg(`Error deleting bike: ${err.message}`)
    }
  }

  const getStatusBadge = (bike) => {
    if (bike.isApproved) return <span style={{ color: 'green', fontWeight: 'bold' }}>✓ Approved</span>
    return <span style={{ color: 'orange', fontWeight: 'bold' }}>⧗ Pending</span>
  }

  if (!user || user.role !== 'owner') {
    return <div><p>Only bike owners can access this page.</p></div>
  }

  if (loading) return <div><p>Loading...</p></div>

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <h2>My Bikes</h2>
      <Link to="/add-bike" style={{ display: 'inline-block', marginBottom: '20px', padding: '10px 15px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
        + Add New Bike
      </Link>

      {msg && <p style={{ padding: '10px', backgroundColor: msg.includes('Error') ? '#ffe6e6' : '#e6ffe6' }}>{msg}</p>}

      {bikes.length === 0 ? (
        <p>You haven't added any bikes yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {bikes.map(bike => (
            <div key={bike._id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h3>{bike.brand} {bike.model} ({bike.year})</h3>
                  <p><strong>Type:</strong> {bike.type}</p>
                  <p><strong>Price/Day:</strong> ${bike.pricePerDay}</p>
                  <p><strong>Deposit:</strong> ${bike.securityDeposit || 'N/A'}</p>
                  <p><strong>Status:</strong> {getStatusBadge(bike)}</p>
                  <p><strong>Condition:</strong> {bike.condition}</p>
                  {bike.location?.area && <p><strong>Area:</strong> {bike.location.area}</p>}
                  {bike.images?.length > 0 && (
                    <div style={{ marginTop: '10px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {bike.images.map((img, idx) => (
                        <img key={idx} src={img} alt="bike" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Link to={`/add-bike/${bike._id}`} style={{ padding: '8px 15px', backgroundColor: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
                    Edit
                  </Link>
                  <button onClick={() => handleDelete(bike._id)} style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
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
