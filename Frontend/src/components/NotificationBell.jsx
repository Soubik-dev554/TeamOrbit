import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const formatTime = (date) => {
    const now = new Date();
    const created = new Date(date);
    const diff = Math.floor((now - created) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;

    return created.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short'
    });
};

const getNotificationIcon = (type) => {
    switch (type) {
        case 'TASK_ASSIGNED':
            return '📋';

        case 'TASK_REASSIGNED':
            return '🔄';

        case 'TASK_UPDATED':
            return '✏️';

        case 'TASK_COMPLETED':
            return '✅';

        case 'COMMENT_ADDED':
            return '💬';

        default:
            return '🔔';
    }
};

export default function NotificationBell() {
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // FETCH NOTIFICATIONS
    const fetchNotifications = useCallback(async () => {
        try {
            const response = await api.get('/notifications', {
                params: {
                    page: 1,
                    limit: 20
                }
            });

            setNotifications(response.data.notifications || []);
            setUnreadCount(response.data.unreadCount || 0);

        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    }, []);

    // INITIAL FETCH AND AUTO REFRESH
    useEffect(() => {
        fetchNotifications();

        const interval = setInterval(fetchNotifications, 30000);

        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // CLOSE DROPDOWN WHEN CLICKING OUTSIDE
    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, []);

    // TOGGLE DROPDOWN
    const toggleDropdown = async () => {
        const nextOpen = !open;
        setOpen(nextOpen);

        if (nextOpen) {
            setLoading(true);
            await fetchNotifications();
            setLoading(false);
        }
    };

    // MARK ONE NOTIFICATION AS READ
    const markAsRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);

            setNotifications(prev =>
                prev.map(notification =>
                    notification._id === id
                        ? { ...notification, isRead: true }
                        : notification
                )
            );

            setUnreadCount(prev => Math.max(0, prev - 1));

        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    // MARK ALL AS READ
    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/read-all');

            setNotifications(prev =>
                prev.map(notification => ({
                    ...notification,
                    isRead: true
                }))
            );

            setUnreadCount(0);

        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    // DELETE NOTIFICATION
    const deleteNotification = async (id) => {
        try {
            await api.delete(`/notifications/${id}`);

            const deleted = notifications.find(item => item._id === id);

            setNotifications(prev =>
                prev.filter(item => item._id !== id)
            );

            if (deleted && !deleted.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }

        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    // HANDLE NOTIFICATION CLICK
    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            await markAsRead(notification._id);
        }

        setOpen(false);

        if (notification.relatedTask) {
            navigate('/tasks', {
                state: {
                    openTaskId: notification.relatedTask,
                    openComments: notification.type === 'COMMENT_ADDED'
                }
            });
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>

            {/* NOTIFICATION BELL */}
            <button
                type="button"
                onClick={toggleDropdown}
                aria-label="Notifications"
                aria-expanded={open}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-xl text-gray-700 transition hover:bg-gray-50"
            >
                <span>🔔</span>

                {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* DROPDOWN */}
            {open && (
                <div className="absolute right-0 top-12 z-50 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">

                    {/* HEADER */}
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">

                        <div>
                            <h3 className="font-semibold text-gray-900">
                                Notifications
                            </h3>

                            <p className="mt-1 text-xs text-gray-500">
                                {unreadCount} unread notifications
                            </p>
                        </div>

                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs font-medium text-blue-600 hover:text-blue-800"
                            >
                                Mark all read
                            </button>
                        )}

                    </div>

                    {/* NOTIFICATION LIST */}
                    <div className="max-h-[420px] overflow-y-auto">

                        {loading ? (

                            <div className="py-12 text-center text-sm text-gray-500">
                                Loading notifications...
                            </div>

                        ) : notifications.length === 0 ? (

                            <div className="px-5 py-12 text-center">

                                <div className="text-3xl">🔔</div>

                                <h4 className="mt-3 font-medium text-gray-900">
                                    You're all caught up!
                                </h4>

                                <p className="mt-1 text-xs text-gray-500">
                                    New notifications will appear here.
                                </p>

                            </div>

                        ) : (

                            notifications.map(notification => (

                                <div
                                    key={notification._id}
                                    className={`group flex gap-3 border-b border-gray-100 p-4 transition hover:bg-gray-50 ${
                                        !notification.isRead
                                            ? 'bg-blue-50/50'
                                            : ''
                                    }`}
                                >

                                    <button
                                        onClick={() =>
                                            handleNotificationClick(notification)
                                        }
                                        className="flex min-w-0 flex-1 gap-3 text-left"
                                    >

                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg">
                                            {getNotificationIcon(notification.type)}
                                        </div>

                                        <div className="min-w-0 flex-1">

                                            <p className="text-sm leading-5 text-gray-800">
                                                {notification.message}
                                            </p>

                                            <p className="mt-1 text-xs text-gray-400">
                                                {notification.actor?.name || 'TeamOrbit'} · {formatTime(notification.createdAt)}
                                            </p>

                                            {notification.type === 'COMMENT_ADDED' && (
                                                <span className="mt-1 inline-block text-xs font-medium text-blue-600">
                                                    View discussion →
                                                </span>
                                            )}

                                        </div>

                                        {!notification.isRead && (
                                            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                                        )}

                                    </button>

                                    <button
                                        onClick={() =>
                                            deleteNotification(notification._id)
                                        }
                                        title="Delete notification"
                                        aria-label="Delete notification"
                                        className="self-start text-gray-400 opacity-100 transition hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100"
                                    >
                                        ×
                                    </button>

                                </div>

                            ))

                        )}

                    </div>

                    {/* FOOTER */}
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 text-center">

                        <button
                            onClick={() => {
                                setOpen(false);
                                navigate('/tasks');
                            }}
                            className="text-xs font-medium text-gray-600 hover:text-gray-900"
                        >
                            View Tasks →
                        </button>

                    </div>

                </div>
            )}

        </div>
    );
}
