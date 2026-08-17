import React, { useState } from 'react'
import { forgotPassword } from '../services/authService'

export default function ForgotPassword(){
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    try{ await forgotPassword(email); setMsg('If that account exists, an email was sent.') }catch(e){ setMsg('Error') }
  }

  return (
    <div>
      <h2>Forgot Password</h2>
      <form onSubmit={submit}>
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <button type="submit">Send reset link</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  )
}
