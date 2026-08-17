import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: API_BASE
})

export default api

// quick health-check helper (can be used in dev)
export async function healthCheck() {
  try {
    const res = await api.get('/api/health')
    return res.data
  } catch (err) {
    return { error: true, message: err.message }
  }
}
