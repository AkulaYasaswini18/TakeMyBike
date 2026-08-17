import React, { useEffect, useState } from 'react'
import { healthCheck } from '../services/api'

export default function Home() {
  const [health, setHealth] = useState(null)
  useEffect(() => {
    healthCheck().then(setHealth)
  }, [])
  return (
    <div>
      <h2>Home</h2>
      <pre>{health ? JSON.stringify(health, null, 2) : 'Checking API...'}</pre>
    </div>
  )
}
