import React, { useState, useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AuthContext from '../context/AuthContext'

export default function Login(){
  const { login } = useContext(AuthContext)
  const [creds, setCreds] = useState({ email:'', password:'' })
  const [err, setErr] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  const submit = async (e) => {
    e.preventDefault()
    try{
      await login(creds)
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    } catch (e) { setErr('Login failed') }
  }

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={submit}>
        <input placeholder="Email" value={creds.email} onChange={e=>setCreds({...creds,email:e.target.value})} />
        <input placeholder="Password" type="password" value={creds.password} onChange={e=>setCreds({...creds,password:e.target.value})} />
        <button type="submit">Login</button>
      </form>
      {err && <p>{err}</p>}
    </div>
  )
}
