import React, { useState } from 'react'
import { resetPassword } from '../services/authService'
import { useSearchParams } from 'react-router-dom'

export default function ResetPassword(){
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState(null)
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const submit = async (e) => {
    e.preventDefault()
    try{ await resetPassword(token, password); setMsg('Password reset') }catch(e){ setMsg('Error') }
  }

  return (
    <div>
      <h2>Reset Password</h2>
      <form onSubmit={submit}>
        <input placeholder="New password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button type="submit">Reset</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  )
}
