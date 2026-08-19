import React, { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import AuthContext from '../context/AuthContext'
import RenterDashboard from './RenterDashboard'
import OwnerDashboard from './OwnerDashboard'

export default function DashboardRouter() {
  const { user, loading } = useContext(AuthContext)

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
        <p>Loading your dashboard...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role === 'owner') {
    return <OwnerDashboard />
  }

  return <RenterDashboard />
}
