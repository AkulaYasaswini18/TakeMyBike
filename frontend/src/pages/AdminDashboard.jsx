import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import * as adminService from '../services/adminService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import './AdminDashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const statusBadges = {
  PENDING: { bg: '#fff3cd', color: '#856404', label: '⧗ Pending' },
  APPROVED: { bg: '#d1ecf1', color: '#0c5460', label: '✓ Approved' },
  REJECTED: { bg: '#fee2e2', color: '#b91c1c', label: '✗ Rejected' },
  CASH_PAYMENT_PENDING: { bg: '#e0f2fe', color: '#0369a1', label: '💵 Cash Pending' },
  CASH_PAYMENT_CONFIRMED: { bg: '#fef3c7', color: '#b45309', label: '🔑 Handover OTP' },
  ACTIVE: { bg: '#dcfce7', color: '#15803d', label: '🚴 Active' },
  COMPLETED: { bg: '#f3f4f6', color: '#374151', label: '✓ Completed' },
  CANCELLED: { bg: '#fee2e2', color: '#b91c1c', label: '✗ Cancelled' },
  DISPUTED: { bg: '#fee2e2', color: '#b91c1c', label: '⚠️ Disputed' }
};

export default function AdminDashboard() {
  const { user } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Datasets
  const [statsData, setStatsData] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [bikesList, setBikesList] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);
  const [paymentsData, setPaymentsData] = useState({ cashPayments: [], securityDeposits: [] });
  const [disputesList, setDisputesList] = useState([]);
  const [reportsList, setReportsList] = useState([]);

  // Filters & Search
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [bikeStatusFilter, setBikeStatusFilter] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('');
  const [disputeStatusFilter, setDisputeStatusFilter] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState('');

  // Action / Modal states
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeStatusInput, setDisputeStatusInput] = useState('RESOLVED');
  const [disputeNotesInput, setDisputeNotesInput] = useState('');

  const [selectedReport, setSelectedReport] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportStatusInput, setReportStatusInput] = useState('ACTION_TAKEN');
  const [reportNotesInput, setReportNotesInput] = useState('');

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, usersRes, bikesRes, bookingsRes, paymentsRes, disputesRes, reportsRes] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers(),
        adminService.getBikes(),
        adminService.getBookings(),
        adminService.getPayments(),
        adminService.getDisputes(),
        adminService.getReports()
      ]);

      setStatsData(statsRes);
      setUsersList(usersRes.users || []);
      setBikesList(bikesRes.bikes || []);
      setBookingsList(bookingsRes.bookings || []);
      setPaymentsData(paymentsRes || { cashPayments: [], securityDeposits: [] });
      setDisputesList(disputesRes.disputes || []);
      setReportsList(reportsRes.reports || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  // Bike actions
  const handleApproveBike = async (id) => {
    setActionLoading(id);
    try {
      await adminService.approveBike(id);
      setSuccessMsg('✓ Bike listing approved successfully');
      setBikesList(prev => prev.map(b => b._id === id ? { ...b, isApproved: true, isAvailable: true } : b));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve bike');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectBike = async (id) => {
    const reason = window.prompt('Enter rejection reason for owner:');
    if (reason === null) return;
    setActionLoading(id);
    try {
      await adminService.rejectBike(id, reason);
      setSuccessMsg('Bike listing rejected');
      setBikesList(prev => prev.map(b => b._id === id ? { ...b, isApproved: false, isAvailable: false } : b));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject bike');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendBike = async (id) => {
    const reason = window.prompt('Enter suspension reason:');
    if (reason === null) return;
    setActionLoading(id);
    try {
      await adminService.suspendBike(id, reason);
      setSuccessMsg('Bike listing suspended');
      setBikesList(prev => prev.map(b => b._id === id ? { ...b, isApproved: false, isAvailable: false } : b));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to suspend bike');
    } finally {
      setActionLoading(null);
    }
  };

  // Dispute actions
  const handleOpenDisputeModal = (dispute) => {
    setSelectedDispute(dispute);
    setDisputeStatusInput(dispute.status === 'OPEN' ? 'RESOLVED' : dispute.status);
    setDisputeNotesInput(dispute.adminNotes || '');
    setDisputeModalOpen(true);
  };

  const handleSaveDispute = async () => {
    if (!selectedDispute) return;
    try {
      await adminService.resolveDispute(selectedDispute._id, disputeStatusInput, disputeNotesInput);
      setSuccessMsg('✓ Dispute status and notes updated');
      setDisputesList(prev => prev.map(d =>
        d._id === selectedDispute._id
          ? { ...d, status: disputeStatusInput, adminNotes: disputeNotesInput }
          : d
      ));
      setDisputeModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update dispute');
    }
  };

  // Report actions
  const handleOpenReportModal = (report) => {
    setSelectedReport(report);
    setReportStatusInput(report.status === 'PENDING' ? 'ACTION_TAKEN' : report.status);
    setReportNotesInput(report.adminNotes || '');
    setReportModalOpen(true);
  };

  const handleSaveReport = async () => {
    if (!selectedReport) return;
    try {
      await adminService.updateReport(selectedReport._id, reportStatusInput, reportNotesInput);
      setSuccessMsg('✓ Report status updated');
      setReportsList(prev => prev.map(r =>
        r._id === selectedReport._id
          ? { ...r, status: reportStatusInput, adminNotes: reportNotesInput }
          : r
      ));
      setReportModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update report');
    }
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🛡️</div>
          <p style={{ fontSize: '18px', fontWeight: '600' }}>Loading Admin Command Center...</p>
        </div>
      </div>
    );
  }

  const stats = statsData?.stats || {};
  const monthly = statsData?.monthlyAnalytics || [];
  const popularBikes = statsData?.popularBikes || [];

  // Chart 1: Monthly Bookings
  const monthlyBookingsChart = {
    labels: monthly.map(m => m.label),
    datasets: [
      {
        label: 'Bookings Count',
        data: monthly.map(m => m.bookingsCount),
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.15)',
        tension: 0.35,
        fill: true
      }
    ]
  };

  // Chart 2: Monthly Rental Value
  const monthlyRevenueChart = {
    labels: monthly.map(m => m.label),
    datasets: [
      {
        label: 'Recorded Rental Value (₹)',
        data: monthly.map(m => m.rentalValue),
        backgroundColor: '#10b981',
        borderRadius: 6
      }
    ]
  };

  // Chart 3: User Growth
  const userGrowthChart = {
    labels: monthly.map(m => m.label),
    datasets: [
      {
        label: 'New Renters',
        data: monthly.map(m => m.newRenters),
        borderColor: '#38bdf8',
        backgroundColor: '#38bdf8'
      },
      {
        label: 'New Owners',
        data: monthly.map(m => m.newOwners),
        borderColor: '#8b5cf6',
        backgroundColor: '#8b5cf6'
      }
    ]
  };

  // Chart 4: Popular Bikes
  const popularBikesChart = {
    labels: popularBikes.map(b => `${b.brand} ${b.model}`),
    datasets: [
      {
        label: 'Bookings Count',
        data: popularBikes.map(b => b.count),
        backgroundColor: ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6'],
        borderRadius: 6
      }
    ]
  };

  // Filtered lists
  const filteredUsers = usersList.filter(u => {
    const matchesSearch = !userSearch || (
      (u.name && u.name.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.phone && u.phone.includes(userSearch))
    );
    const matchesRole = !userRoleFilter || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredBikes = bikesList.filter(b => {
    if (bikeStatusFilter === 'approved') return b.isApproved === true;
    if (bikeStatusFilter === 'pending') return b.isApproved === false;
    return true;
  });

  const filteredBookings = bookingsList.filter(b => {
    if (!bookingStatusFilter) return true;
    return b.status === bookingStatusFilter;
  });

  const filteredDisputes = disputesList.filter(d => {
    if (!disputeStatusFilter) return true;
    return d.status === disputeStatusFilter;
  });

  const filteredReports = reportsList.filter(r => {
    if (!reportStatusFilter) return true;
    return r.status === reportStatusFilter;
  });

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-title-group">
          <h1>🛡️ Admin Command Center</h1>
          <p className="admin-subtitle">
            Platform-wide governance, analytics, bike approvals, dispute mediation, and community reports.
          </p>
        </div>
        <div>
          <button
            onClick={loadAllAdminData}
            className="btn-action-sm primary"
            style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px' }}
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>

      {/* Notification banners */}
      {error && (
        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #fca5a5' }}>
          {error}
        </div>
      )}
      {successMsg && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #86efac' }}>
          {successMsg}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon">👥</div>
          <div className="admin-stat-label">Total Users</div>
          <div className="admin-stat-value">{stats.totalUsers || 0}</div>
          <div className="admin-stat-hint">{stats.rentersCount || 0} Renters • {stats.ownersCount || 0} Owners</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">🏍️</div>
          <div className="admin-stat-label">Total Bikes</div>
          <div className="admin-stat-value">{stats.totalBikes || 0}</div>
          <div className="admin-stat-hint">{stats.approvedBikesCount || 0} Approved • {stats.pendingBikesCount || 0} Pending</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">📋</div>
          <div className="admin-stat-label">Total Bookings</div>
          <div className="admin-stat-value">{stats.totalBookings || 0}</div>
          <div className="admin-stat-hint">{stats.activeBookingsCount || 0} Active • {stats.completedBookingsCount || 0} Completed</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">💵</div>
          <div className="admin-stat-label">Recorded Rental Value</div>
          <div className="admin-stat-value" style={{ color: '#10b981' }}>
            ₹{(stats.totalRentalValue || 0).toLocaleString('en-IN')}
          </div>
          <div className="admin-stat-hint">Platform cash volume</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">⚠️</div>
          <div className="admin-stat-label">Disputes & Reports</div>
          <div className="admin-stat-value" style={{ color: stats.openDisputesCount > 0 || stats.pendingReportsCount > 0 ? '#ef4444' : '#0f172a' }}>
            {(stats.openDisputesCount || 0) + (stats.pendingReportsCount || 0)}
          </div>
          <div className="admin-stat-hint">{stats.openDisputesCount || 0} Open Disputes • {stats.pendingReportsCount || 0} Reports</div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="admin-tabs">
        <button
          className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview & Charts
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
          <span className="admin-tab-badge">{usersList.length}</span>
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'bikes' ? 'active' : ''}`}
          onClick={() => setActiveTab('bikes')}
        >
          🏍️ Bike Approvals
          {stats.pendingBikesCount > 0 && (
            <span className="admin-tab-badge" style={{ background: '#f59e0b', color: '#ffffff' }}>
              {stats.pendingBikesCount}
            </span>
          )}
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          📋 Bookings
          <span className="admin-tab-badge">{bookingsList.length}</span>
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          💵 Cash Ledgers (Read-Only)
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'disputes' ? 'active' : ''}`}
          onClick={() => setActiveTab('disputes')}
        >
          ⚠️ Disputes
          {stats.openDisputesCount > 0 && (
            <span className="admin-tab-badge" style={{ background: '#ef4444', color: '#ffffff' }}>
              {stats.openDisputesCount}
            </span>
          )}
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          🚩 User Reports
          {stats.pendingReportsCount > 0 && (
            <span className="admin-tab-badge" style={{ background: '#ef4444', color: '#ffffff' }}>
              {stats.pendingReportsCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Overview & Charts */}
      {activeTab === 'overview' && (
        <div>
          <div className="charts-grid">
            <div className="chart-card">
              <h3 className="chart-card-title">📈 Monthly Bookings Trend</h3>
              <div className="chart-wrapper">
                <Line
                  data={monthlyBookingsChart}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              </div>
            </div>

            <div className="chart-card">
              <h3 className="chart-card-title">💰 Monthly Recorded Rental Value (₹)</h3>
              <div className="chart-wrapper">
                <Bar
                  data={monthlyRevenueChart}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              </div>
            </div>

            <div className="chart-card">
              <h3 className="chart-card-title">👥 User Acquisition Growth</h3>
              <div className="chart-wrapper">
                <Bar
                  data={userGrowthChart}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              </div>
            </div>

            <div className="chart-card">
              <h3 className="chart-card-title">🔥 Most Popular Bikes</h3>
              <div className="chart-wrapper">
                {popularBikes.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#94a3b8', paddingTop: '80px' }}>No booking data yet.</p>
                ) : (
                  <Bar
                    data={popularBikesChart}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      indexAxis: 'y'
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Users Management */}
      {activeTab === 'users' && (
        <div className="admin-table-card">
          <div className="admin-table-toolbar">
            <input
              type="text"
              placeholder="Search user by name, email, phone..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="admin-search-input"
            />
            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="admin-filter-select"
            >
              <option value="">All Roles</option>
              <option value="renter">Renters</option>
              <option value="owner">Owners</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Verification</th>
                <th>Activity</th>
                <th>Rating</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No users found matching filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>{u.name || 'Unnamed'}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{u.email}</div>
                    </td>
                    <td>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        backgroundColor: u.role === 'admin' ? '#f3e8ff' : (u.role === 'owner' ? '#dcfce7' : '#e0f2fe'),
                        color: u.role === 'admin' ? '#7e22ce' : (u.role === 'owner' ? '#15803d' : '#0369a1')
                      }}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td>{u.phone || 'N/A'}</td>
                    <td>
                      <span style={{
                        fontSize: '12px',
                        color: u.isVerified ? '#16a34a' : '#ea580c',
                        fontWeight: '600'
                      }}>
                        {u.isVerified ? '✓ Verified' : '⧗ Unverified'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12.5px', color: '#475569' }}>
                        {u.role === 'owner' ? `${u.bikesCount || 0} bikes` : `${u.bookingsCount || 0} bookings`}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', color: '#d97706' }}>
                        ⭐ {Number(u.rating || 0).toFixed(1)}
                      </span>
                    </td>
                    <td style={{ fontSize: '12.5px', color: '#64748b' }}>
                      {new Date(u.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Bike Approvals & Inventory */}
      {activeTab === 'bikes' && (
        <div className="admin-table-card">
          <div className="admin-table-toolbar">
            <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Bike Approval Queue & Inventory</h3>
            <select
              value={bikeStatusFilter}
              onChange={(e) => setBikeStatusFilter(e.target.value)}
              className="admin-filter-select"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved</option>
            </select>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Bike</th>
                <th>Owner</th>
                <th>Rates</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBikes.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No bikes found matching filter.
                  </td>
                </tr>
              ) : (
                filteredBikes.map(b => (
                  <tr key={b._id}>
                    <td>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>
                        <Link to={`/bikes/${b._id}`} style={{ color: '#0f172a', textDecoration: 'none' }}>
                          {b.brand} {b.model}
                        </Link>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {b.type || 'Bike'} • {b.year || 'N/A'} • Reg: {b.registrationNumber || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{b.owner?.name || 'Owner'}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{b.owner?.phone}</div>
                    </td>
                    <td>
                      <div><strong>₹{b.pricePerDay}</strong>/day</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>Deposit: ₹{b.securityDeposit || 0}</div>
                    </td>
                    <td>{b.location?.area || 'Location not set'}</td>
                    <td>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        backgroundColor: b.isApproved ? '#dcfce7' : '#fef3c7',
                        color: b.isApproved ? '#15803d' : '#b45309'
                      }}>
                        {b.isApproved ? '✓ Approved' : '⧗ Pending'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {!b.isApproved ? (
                          <>
                            <button
                              onClick={() => handleApproveBike(b._id)}
                              disabled={actionLoading === b._id}
                              className="btn-action-sm approve"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleRejectBike(b._id)}
                              disabled={actionLoading === b._id}
                              className="btn-action-sm reject"
                            >
                              ✕ Reject
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleSuspendBike(b._id)}
                            disabled={actionLoading === b._id}
                            className="btn-action-sm suspend"
                          >
                            ⛔ Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: All Bookings Oversight */}
      {activeTab === 'bookings' && (
        <div className="admin-table-card">
          <div className="admin-table-toolbar">
            <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Platform Bookings Oversight</h3>
            <select
              value={bookingStatusFilter}
              onChange={(e) => setBookingStatusFilter(e.target.value)}
              className="admin-filter-select"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="CASH_PAYMENT_PENDING">Cash Pending</option>
              <option value="CASH_PAYMENT_CONFIRMED">Ready for Handover</option>
              <option value="DISPUTED">Disputed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Bike</th>
                <th>Renter</th>
                <th>Owner</th>
                <th>Dates</th>
                <th>Total Cash</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No bookings found.
                  </td>
                </tr>
              ) : (
                filteredBookings.map(b => {
                  const style = statusBadges[b.status] || { bg: '#f1f5f9', color: '#475569', label: b.status };
                  return (
                    <tr key={b._id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: '700' }}>
                        #{b._id.slice(-6).toUpperCase()}
                      </td>
                      <td><strong>{b.bike?.brand} {b.bike?.model}</strong></td>
                      <td>
                        <div>{b.renter?.name || 'Renter'}</div>
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>{b.renter?.phone}</div>
                      </td>
                      <td>
                        <div>{b.owner?.name || 'Owner'}</div>
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>{b.owner?.phone}</div>
                      </td>
                      <td style={{ fontSize: '12.5px' }}>
                        {new Date(b.startDate).toLocaleDateString('en-IN')} — {new Date(b.endDate).toLocaleDateString('en-IN')}
                      </td>
                      <td>
                        <strong style={{ color: '#0284c7' }}>₹{b.totalCash?.toLocaleString('en-IN')}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Rent: ₹{b.rentalAmount} • Dep: ₹{b.securityDeposit}</div>
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: '700',
                          backgroundColor: style.bg,
                          color: style.color
                        }}>
                          {style.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 5: Cash Ledgers (Read-Only) */}
      {activeTab === 'payments' && (
        <div>
          <div className="readonly-banner">
            <span>🛡️</span>
            <div>
              <strong>Audit Notice:</strong> All cash payments and security deposits are directly exchanged in cash between renters and owners. This administrative view is strictly read-only for transaction auditing and dispute resolution.
            </div>
          </div>

          <div className="admin-table-card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Platform Cash Payments Ledger</h3>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Bike</th>
                  <th>Renter</th>
                  <th>Owner</th>
                  <th>Handover Amount</th>
                  <th>Payment Mode</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paymentsData.cashPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                      No cash payments recorded.
                    </td>
                  </tr>
                ) : (
                  paymentsData.cashPayments.map(p => (
                    <tr key={p._id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: '700' }}>
                        #{p.booking?._id ? p.booking._id.slice(-6).toUpperCase() : p._id.slice(-6).toUpperCase()}
                      </td>
                      <td>{p.booking?.bike?.brand} {p.booking?.bike?.model}</td>
                      <td>{p.booking?.renter?.name || 'Renter'}</td>
                      <td>{p.booking?.owner?.name || 'Owner'}</td>
                      <td><strong style={{ color: '#15803d' }}>₹{p.amount?.toLocaleString('en-IN')}</strong></td>
                      <td><span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>CASH</span></td>
                      <td>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '9999px',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          backgroundColor: p.status === 'RECEIVED' ? '#dcfce7' : '#fef3c7',
                          color: p.status === 'RECEIVED' ? '#15803d' : '#b45309'
                        }}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: Disputes Management */}
      {activeTab === 'disputes' && (
        <div className="admin-table-card">
          <div className="admin-table-toolbar">
            <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Dispute Mediation Queue</h3>
            <select
              value={disputeStatusFilter}
              onChange={(e) => setDisputeStatusFilter(e.target.value)}
              className="admin-filter-select"
            >
              <option value="">All Disputes</option>
              <option value="OPEN">Open</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Booking</th>
                <th>Raised By</th>
                <th>Reason / Claim</th>
                <th>Admin Notes</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDisputes.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No disputes found.
                  </td>
                </tr>
              ) : (
                filteredDisputes.map(d => (
                  <tr key={d._id}>
                    <td>
                      <div style={{ fontFamily: 'monospace', fontWeight: '700' }}>
                        #{d.booking?._id ? d.booking._id.slice(-6).toUpperCase() : 'N/A'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {d.booking?.bike?.brand} {d.booking?.bike?.model}
                      </div>
                    </td>
                    <td>
                      <strong>{d.raisedBy?.name || 'User'}</strong>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>Role: {d.raisedBy?.role}</div>
                    </td>
                    <td style={{ maxWidth: '280px' }}>{d.reason}</td>
                    <td style={{ fontSize: '12.5px', color: '#475569' }}>
                      {d.adminNotes || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No notes yet</span>}
                    </td>
                    <td>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        backgroundColor: d.status === 'OPEN' ? '#fee2e2' : (d.status === 'RESOLVED' ? '#dcfce7' : '#f1f5f9'),
                        color: d.status === 'OPEN' ? '#b91c1c' : (d.status === 'RESOLVED' ? '#15803d' : '#475569')
                      }}>
                        {d.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleOpenDisputeModal(d)}
                        className="btn-action-sm primary"
                      >
                        ⚖️ Mediate / Resolve
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 7: User Reports Queue */}
      {activeTab === 'reports' && (
        <div className="admin-table-card">
          <div className="admin-table-toolbar">
            <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Community User Reports Queue</h3>
            <select
              value={reportStatusFilter}
              onChange={(e) => setReportStatusFilter(e.target.value)}
              className="admin-filter-select"
            >
              <option value="">All Reports</option>
              <option value="PENDING">Pending Review</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="ACTION_TAKEN">Action Taken</option>
              <option value="DISMISSED">Dismissed</option>
            </select>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Reported By</th>
                <th>Target</th>
                <th>Reason</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No community reports found.
                  </td>
                </tr>
              ) : (
                filteredReports.map(r => (
                  <tr key={r._id}>
                    <td>
                      <strong>{r.reportedBy?.name || 'User'}</strong>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{r.reportedBy?.email}</div>
                    </td>
                    <td>
                      <span style={{
                        padding: '2px 6px',
                        background: '#e2e8f0',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        marginRight: '6px'
                      }}>
                        {r.targetType.toUpperCase()}
                      </span>
                      {r.targetBike && <strong>{r.targetBike.brand} {r.targetBike.model}</strong>}
                      {r.targetUser && <strong>{r.targetUser.name}</strong>}
                    </td>
                    <td>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: '#fee2e2',
                        color: '#991b1b'
                      }}>
                        {r.reason}
                      </span>
                    </td>
                    <td style={{ maxWidth: '300px', fontSize: '13px' }}>
                      {r.description}
                      {r.adminNotes && (
                        <div style={{ marginTop: '4px', fontSize: '12px', color: '#0369a1' }}>
                          <strong>Admin Note:</strong> {r.adminNotes}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        backgroundColor: r.status === 'PENDING' ? '#fef3c7' : (r.status === 'ACTION_TAKEN' ? '#dcfce7' : '#f1f5f9'),
                        color: r.status === 'PENDING' ? '#b45309' : (r.status === 'ACTION_TAKEN' ? '#15803d' : '#475569')
                      }}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleOpenReportModal(r)}
                        className="btn-action-sm primary"
                      >
                        🔍 Review / Action
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Dispute Modal */}
      {disputeModalOpen && selectedDispute && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-box">
            <h3 style={{ margin: '0 0 14px 0', fontSize: '18px', color: '#0f172a' }}>
              ⚖️ Dispute Resolution & Notes
            </h3>
            <p style={{ fontSize: '13.5px', color: '#475569', marginBottom: '14px' }}>
              Claim: <em>"{selectedDispute.reason}"</em>
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                Update Status:
              </label>
              <select
                value={disputeStatusInput}
                onChange={(e) => setDisputeStatusInput(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              >
                <option value="OPEN">OPEN</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                Admin Findings & Commentary:
              </label>
              <textarea
                rows={4}
                value={disputeNotesInput}
                onChange={(e) => setDisputeNotesInput(e.target.value)}
                placeholder="Enter mediation resolution notes for renter and owner..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setDisputeModalOpen(false)}
                className="btn-action-sm reject"
                style={{ padding: '8px 14px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDispute}
                className="btn-action-sm primary"
                style={{ padding: '8px 16px' }}
              >
                Save Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Action Modal */}
      {reportModalOpen && selectedReport && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-box">
            <h3 style={{ margin: '0 0 14px 0', fontSize: '18px', color: '#0f172a' }}>
              🚩 Review User Report
            </h3>
            <p style={{ fontSize: '13.5px', color: '#475569', marginBottom: '14px' }}>
              Reason: <strong>{selectedReport.reason}</strong><br />
              Details: <em>"{selectedReport.description}"</em>
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                Update Status:
              </label>
              <select
                value={reportStatusInput}
                onChange={(e) => setReportStatusInput(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              >
                <option value="PENDING">PENDING</option>
                <option value="REVIEWED">REVIEWED</option>
                <option value="ACTION_TAKEN">ACTION TAKEN</option>
                <option value="DISMISSED">DISMISSED</option>
              </select>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                Admin Action Notes:
              </label>
              <textarea
                rows={4}
                value={reportNotesInput}
                onChange={(e) => setReportNotesInput(e.target.value)}
                placeholder="Document actions taken or explanation..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setReportModalOpen(false)}
                className="btn-action-sm reject"
                style={{ padding: '8px 14px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReport}
                className="btn-action-sm primary"
                style={{ padding: '8px 16px' }}
              >
                Save Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
