import React, { useState, useContext } from 'react'
import AuthContext from '../context/AuthContext'

export default function Register() {
  const { register } = useContext(AuthContext)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'renter' })
  const [msg, setMsg] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    try {
      const res = await register(form)
      setMsg(res.message || 'Registered')
    } catch (err) { setMsg(err.message || 'Error') }
  }

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={submit}>
        <input placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
        <input placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
        <input placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
        <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
          <option value="renter">Renter</option>
          <option value="owner">Bike Owner</option>
        </select>
        <button type="submit">Register</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  )
}
