import api from './api';

export async function getStats() {
  const res = await api.get('/api/admin/stats');
  return res.data;
}

export async function getUsers(params = {}) {
  const res = await api.get('/api/admin/users', { params });
  return res.data;
}

export async function getBikes(params = {}) {
  const res = await api.get('/api/admin/bikes', { params });
  return res.data;
}

export async function approveBike(id) {
  const res = await api.put(`/api/admin/bikes/${id}/approve`);
  return res.data;
}

export async function rejectBike(id, reason = '') {
  const res = await api.put(`/api/admin/bikes/${id}/reject`, { reason });
  return res.data;
}

export async function suspendBike(id, reason = '') {
  const res = await api.put(`/api/admin/bikes/${id}/suspend`, { reason });
  return res.data;
}

export async function getBookings(params = {}) {
  const res = await api.get('/api/admin/bookings', { params });
  return res.data;
}

export async function getPayments() {
  const res = await api.get('/api/admin/payments');
  return res.data;
}

export async function getDisputes(params = {}) {
  const res = await api.get('/api/admin/disputes', { params });
  return res.data;
}

export async function resolveDispute(id, status, adminNotes = '') {
  const res = await api.put(`/api/admin/disputes/${id}`, { status, adminNotes });
  return res.data;
}

export async function getReports(params = {}) {
  const res = await api.get('/api/admin/reports', { params });
  return res.data;
}

export async function updateReport(id, status, adminNotes = '') {
  const res = await api.put(`/api/admin/reports/${id}`, { status, adminNotes });
  return res.data;
}
