import api from './api';

export async function createReport(reportData) {
  const res = await api.post('/api/reports', reportData);
  return res.data;
}

export async function getMyReports() {
  const res = await api.get('/api/reports/my-reports');
  return res.data;
}
