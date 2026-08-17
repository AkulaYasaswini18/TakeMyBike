import React from 'react'

export default function App() {
  return (
    <div>
      <h1>BikeShare</h1>
      <p>Frontend placeholder. Health check will be shown below:</p>
      <div id="health"></div>
      <script>
        {/* health check script injected by src/services/api.js in real app */}
      </script>
    </div>
  )
}
