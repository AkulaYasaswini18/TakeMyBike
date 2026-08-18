import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as notificationService from '../../services/notificationService'

const notifIcons = {
  BOOKING_REQUESTED: '📋',
  BOOKING_APPROVED: '✓',
  BOOKING_REJECTED: '✗',
  CASH_PAYMENT_PENDING: '💵',
  CASH_PAYMENT_CONFIRMED: '🔑',
  RENTAL_ACTIVE: '🚴',
  RETURN_COMPLETED: '🏁',
  DEPOSIT_REFUNDED: '🔒',
  DISPUTE_CREATED: '⚠️',
  REVIEW_RECEIVED: '⭐',
  SYSTEM: '🔔'
}

function timeAgo(dateString) {
  if (!dateString) return ''
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function NotificationBell() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef(null)

  useEffect(() => {
    fetchNotifications()
    // Poll for fresh notifications every 15 seconds
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getMyNotifications()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (err) {
      // silently ignore polling errors
    }
  }

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await notificationService.markAsRead(notif._id)
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
      } catch (err) {}
    }

    setIsOpen(false)
    if (notif.link) {
      navigate(notif.link)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      setLoading(true)
      await notificationService.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (err) {
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'relative' }} ref={panelRef}>
      {/* Bell Icon Button */}
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          position: 'relative',
          cursor: 'pointer',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          color: '#e2e8f0',
          transition: 'background-color 0.2s ease'
        }}
        title="Notifications"
      >
        <span style={{ fontSize: '20px' }}>🔔</span>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            backgroundColor: '#ef4444',
            color: 'white',
            borderRadius: '9999px',
            fontSize: '11px',
            fontWeight: 'bold',
            minWidth: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            boxShadow: '0 0 0 2px #1e293b'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: '45px',
          width: '380px',
          maxHeight: '480px',
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e2e8f0',
          zIndex: 1000,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ fontSize: '15px', color: '#0f172a' }}>Notifications</strong>
              {unreadCount > 0 && (
                <span style={{
                  padding: '2px 8px',
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: '700'
                }}>
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0284c7',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div style={{ overflowY: 'auto', maxHeight: '400px' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>🔕</span>
                <p style={{ margin: 0, fontSize: '14px' }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const icon = notifIcons[notif.type] || notifIcons.SYSTEM
                return (
                  <div
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    style={{
                      padding: '14px 18px',
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: notif.isRead ? '#ffffff' : '#f0f9ff',
                      cursor: 'pointer',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = notif.isRead ? '#f8fafc' : '#e0f2fe'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notif.isRead ? '#ffffff' : '#f0f9ff'}
                  >
                    <div style={{
                      fontSize: '18px',
                      lineHeight: 1,
                      marginTop: '2px'
                    }}>
                      {icon}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                          {notif.title}
                        </strong>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {timeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>
                        {notif.message}
                      </p>
                    </div>

                    {!notif.isRead && (
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#0284c7',
                        marginTop: '6px',
                        flexShrink: 0
                      }} />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
