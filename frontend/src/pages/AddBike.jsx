import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as bikeService from '../services/bikeService'
import { useToast } from '../context/ToastContext'
import ErrorMessage from '../components/common/ErrorMessage'
import { getErrorMessage } from '../services/api'
import './AddBike.css'

export default function AddBike() {
  const navigate = useNavigate()
  const { id: bikeId } = useParams()
  const isEdit = !!bikeId
  const toast = useToast()

  const [form, setForm] = useState({
    brand: '',
    model: '',
    type: '',
    year: new Date().getFullYear(),
    registrationNumber: '',
    description: '',
    pricePerDay: '',
    securityDeposit: '',
    location: { coordinates: [0, 0], area: '' },
    condition: ''
  })

  const [images, setImages] = useState([])
  const [previews, setPreviews] = useState([])
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'area') {
      setForm({ ...form, location: { ...form.location, area: value } })
    } else {
      setForm({ ...form, [name]: value })
    }
  }

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    
    // Validate total count
    if (images.length + files.length > 10) {
      setMsg('Maximum 10 images allowed')
      return
    }

    // Validate each file
    let validFiles = []
    for (let file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file.`, 'Invalid Format')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds the 5MB size limit.`, 'File Too Large')
        return
      }
      validFiles.push(file)
    }

    setImages([...images, ...validFiles])
    
    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index))
    setPreviews(previews.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)

    try {
      // Validate required fields
      if (!form.brand || !form.model || !form.type || !form.year || !form.registrationNumber || !form.pricePerDay || !form.condition) {
        setMsg('Please fill in all required fields marked with *')
        setLoading(false)
        return
      }

      let result
      if (isEdit) {
        result = await bikeService.updateBike(bikeId, form)
      } else {
        result = await bikeService.createBike(form)
      }

      // Upload images if any
      if (images.length > 0) {
        const formData = new FormData()
        images.forEach(img => formData.append('images', img))
        await bikeService.uploadImages(result.bike?._id || result._id, formData)
      }

      toast.success('Motorcycle saved successfully! Waiting for admin review.', 'Listing Created')
      navigate('/my-bikes')
    } catch (err) {
      const errMsg = getErrorMessage(err, 'Failed to save bike listing. Please try again.')
      setMsg(errMsg)
      toast.error(errMsg, 'Save Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="add-bike-container">
      <div className="add-bike-card">
        <h1>{isEdit ? 'Edit Motorcycle' : 'List a Motorcycle'}</h1>
        
        {msg && (
          <ErrorMessage
            message={msg}
            compact
          />
        )}

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <fieldset>
            <legend>Basic Information</legend>
            
            <div className="form-group">
              <label>Brand *</label>
              <input name="brand" value={form.brand} onChange={handleChange} placeholder="e.g., Honda, Royal Enfield" required />
            </div>

            <div className="form-group">
              <label>Model *</label>
              <input name="model" value={form.model} onChange={handleChange} placeholder="e.g., CB350, Classic 350" required />
            </div>

            <div className="form-group">
              <label>Type *</label>
              <select name="type" value={form.type} onChange={handleChange} required>
                <option value="">Select Type</option>
                <option value="Motorcycle">Motorcycle</option>
                <option value="Scooter">Scooter</option>
                <option value="Bicycle">Bicycle</option>
                <option value="Electric Bike">Electric Bike</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Year *</label>
              <input type="number" name="year" value={form.year} onChange={handleChange} min="1990" max={new Date().getFullYear()} required />
            </div>

            <div className="form-group">
              <label>Registration Number *</label>
              <input name="registrationNumber" value={form.registrationNumber} onChange={handleChange} placeholder="e.g., MH05AB1234" required />
            </div>

            <div className="form-group">
              <label>Condition *</label>
              <select name="condition" value={form.condition} onChange={handleChange} required>
                <option value="">Select condition</option>
                <option value="New">New</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
              </select>
            </div>
          </fieldset>

          {/* Details */}
          <fieldset>
            <legend>Details</legend>
            
            <div className="form-group">
              <label>Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe your bike, special features, accessories included, etc." />
            </div>
          </fieldset>

          {/* Pricing & Location */}
          <fieldset>
            <legend>Pricing & Location</legend>
            
            <div className="form-group">
              <label>Price per Day (₹) *</label>
              <input type="number" name="pricePerDay" value={form.pricePerDay} onChange={handleChange} placeholder="e.g., 500" min="0" step="10" required />
            </div>

            <div className="form-group">
              <label>Security Deposit (₹)</label>
              <input type="number" name="securityDeposit" value={form.securityDeposit} onChange={handleChange} placeholder="e.g., 5000" min="0" step="100" />
            </div>

            <div className="form-group">
              <label>Pickup Area *</label>
              <input name="area" value={form.location.area} onChange={handleChange} placeholder="e.g., Pune, India or specific locality" required />
            </div>
          </fieldset>

          {/* Images */}
          <fieldset>
            <legend>Bike Images</legend>
            
            <div className="form-group">
              <label>Upload Images (Max 10, 5MB each)</label>
              <input type="file" multiple accept="image/*" onChange={handleImageSelect} disabled={images.length >= 10} />
            </div>

            {previews.length > 0 && (
              <div className="image-preview-grid">
                {previews.map((preview, idx) => (
                  <div key={idx} className="image-preview-item">
                    <img src={preview} alt={`preview-${idx}`} />
                    <button type="button" className="remove-image-btn" onClick={() => removeImage(idx)}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="image-count">{images.length} image(s) selected</p>
          </fieldset>

          {/* Submit */}
          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Bike' : 'List Your Bike')}
            </button>
            <button type="button" className="cancel-btn" onClick={() => navigate('/my-bikes')} disabled={loading}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

