import { useState, useEffect, useRef } from "react";
import { Bell, Check, Trash2, CheckCheck, X } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/router";

type Notification = {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  priority: "low" | "medium" | "high";
  createdAt: string;
};

type NotificationBellProps = {
  userId?: string;
};

export default function NotificationBell({ userId = "DEMO_USER" }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const bellRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      const { data } = await axios.get(`/api/notifications?userId=${userId}`);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const markAsRead = async (notificationId: string, link?: string) => {
    try {
      await axios.put(`/api/notifications/${notificationId}`);
      setNotifications(notifications.map(n => 
        n._id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
      
      if (link) {
        setIsOpen(false);
        router.push(link);
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.post('/api/notifications/mark-all-read', { userId });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await axios.delete(`/api/notifications/${notificationId}`);
      setNotifications(notifications.filter(n => n._id !== notificationId));
      if (!notifications.find(n => n._id === notificationId)?.isRead) {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: any = {
      "POST_CREATED": "📝",
      "CONTENT_UPLOADED": "📤",
      "CLIENT_VALIDATED": "✅",
      "POST_SCHEDULED": "📅",
      "POST_PUBLISHED": "🚀",
      "CLIENT_REJECTED": "❌",
      "COMMENT_ADDED": "💬",
      "COLLAB_CREATED": "🤝",
      "COLLAB_CONTENT_UPLOADED": "📤",
      "COLLAB_VALIDATED": "✅",
      "DEADLINE_APPROACHING": "⏰",
      "MENTION": "👤"
    };
    return icons[type] || "🔔";
  };

  const getPriorityColor = (priority: string) => {
    const colors: any = {
      low: "#10b981",
      medium: "#f59e0b",
      high: "#ef4444"
    };
    return colors[priority] || "#6366f1";
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString();
  };

  return (
    <div style={{ position: "relative" }} ref={bellRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "relative",
          width: "44px",
          height: "44px",
          border: "2px solid #e5e5e5",
          borderRadius: "12px",
          background: "white",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#6366f1";
          e.currentTarget.style.background = "#6366f108";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#e5e5e5";
          e.currentTarget.style.background = "white";
        }}
      >
        <Bell size={20} style={{ color: unreadCount > 0 ? "#6366f1" : "#999" }} />
        
        {unreadCount > 0 && (
          <span style={{
            position: "absolute",
            top: "-6px",
            right: "-6px",
            width: "22px",
            height: "22px",
            background: "linear-gradient(135deg, #ef4444, #dc2626)",
            color: "white",
            borderRadius: "50%",
            fontSize: "0.6875rem",
            fontWeight: "800",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid white",
            animation: "pulse 2s ease-in-out infinite"
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 12px)",
          right: 0,
          width: "420px",
          maxHeight: "600px",
          background: "white",
          border: "2px solid #e5e5e5",
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          zIndex: 1000,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }}>
          {/* Header */}
          <div style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "2px solid #e5e5e5",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <div style={{ fontSize: "1rem", fontWeight: "800", marginBottom: "0.25rem" }}>
                🔔 Notifications
              </div>
              <div style={{ fontSize: "0.75rem", opacity: 0.9 }}>
                {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
              </div>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  padding: "0.5rem 0.875rem",
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.3)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
              >
                <CheckCheck size={14} />
                Tout lire
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            maxHeight: "500px"
          }}>
            {notifications.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem 2rem", color: "#999" }}>
                <Bell size={64} strokeWidth={1} style={{ opacity: 0.2, margin: "0 auto 1rem" }} />
                <p style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                  Aucune notification
                </p>
                <p style={{ fontSize: "0.875rem" }}>
                  Vous êtes à jour ! 🎉
                </p>
              </div>
            ) : (
              <div>
                {notifications.map((notif) => (
                  <div
                    key={notif._id}
                    onClick={() => markAsRead(notif._id, notif.link)}
                    style={{
                      padding: "1.25rem 1.5rem",
                      borderBottom: "1px solid #f0f0f0",
                      cursor: notif.link ? "pointer" : "default",
                      background: notif.isRead ? "white" : "#f8f9ff",
                      transition: "all 0.2s ease",
                      position: "relative"
                    }}
                    onMouseEnter={(e) => {
                      if (notif.link) {
                        e.currentTarget.style.background = notif.isRead ? "#f8f9fa" : "#eef2ff";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = notif.isRead ? "white" : "#f8f9ff";
                    }}
                  >
                    <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                      <div style={{
                        width: "40px",
                        height: "40px",
                        background: notif.isRead ? "#f8f9fa" : `${getPriorityColor(notif.priority)}15`,
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.25rem",
                        flexShrink: 0
                      }}>
                        {getNotificationIcon(notif.type)}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: "0.875rem",
                          fontWeight: notif.isRead ? "500" : "700",
                          color: "#111",
                          marginBottom: "0.375rem"
                        }}>
                          {notif.title}
                        </div>
                        <div style={{
                          fontSize: "0.8125rem",
                          color: "#666",
                          marginBottom: "0.5rem",
                          lineHeight: "1.4"
                        }}>
                          {notif.message}
                        </div>
                        <div style={{
                          fontSize: "0.6875rem",
                          color: "#999",
                          fontWeight: "600"
                        }}>
                          {formatTime(notif.createdAt)}
                        </div>
                      </div>

                      <button
                        onClick={(e) => deleteNotification(notif._id, e)}
                        style={{
                          width: "28px",
                          height: "28px",
                          border: "none",
                          background: "transparent",
                          borderRadius: "6px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s ease",
                          flexShrink: 0
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#fee2e2";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <X size={14} style={{ color: "#999" }} />
                      </button>
                    </div>

                    {!notif.isRead && (
                      <div style={{
                        position: "absolute",
                        left: "0",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "4px",
                        height: "60%",
                        background: getPriorityColor(notif.priority),
                        borderRadius: "0 4px 4px 0"
                      }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}

