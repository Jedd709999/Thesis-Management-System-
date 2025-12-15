import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Bell, Menu, User, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { searchTopics } from '../../api/thesisService'
import { ThesisSearchModal } from '../ThesisSearchModal'
import { useNotifications } from '../../hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'

interface TopbarProps {
  onMenuToggle?: () => void
  onNavigate?: (page: string) => void
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuToggle, onNavigate }) => {
  const { user, displayName } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<any>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false)
  const navigate = useNavigate()
  const notificationRef = useRef<HTMLDivElement>(null)
  
  const { notifications, unreadCount, markRead, loading } = useNotifications(0) // Disable polling in topbar
  
  console.log('Topbar: notifications', notifications);
  console.log('Topbar: unreadCount', unreadCount);
  console.log('Topbar: loading', loading);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationDropdownOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  
  // Filter to show only unread notifications, limit to 5
  // Ensure notifications is an array before filtering
  const notificationsArray = Array.isArray(notifications) ? notifications : [];
  const unreadNotifications = notificationsArray
    .filter(notification => notification && !notification.is_read)
    .slice(0, 5);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const results = await searchTopics(searchQuery.trim())
      setSearchResults(results)
      setIsSearchModalOpen(true)
    } catch (error: any) {
      console.error('Search failed:', error)
      // Handle general errors
      alert('Search failed. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const getRoleBadgeColor = () => {
    switch (user?.role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800'
      case 'ADVISER': return 'bg-blue-100 text-blue-800'
      case 'PANEL': return 'bg-amber-100 text-amber-800'
      default: return 'bg-green-100 text-green-800'
    }
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-slate-600" />
        </button>

        <div className="hidden sm:block">
          <h1 className="text-xl font-semibold text-slate-800">ENVISys</h1>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4 sm:mx-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search theses, documents, groups..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>
      </form>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setIsNotificationDropdownOpen(!isNotificationDropdownOpen)}
            className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
          
          {/* Notification Dropdown */}
          {isNotificationDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-medium text-slate-900">Notifications</h3>
                <Link 
                  to="/notifications" 
                  className="text-sm text-green-600 hover:text-green-700"
                  onClick={() => setIsNotificationDropdownOpen(false)}
                >
                  View All
                </Link>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-slate-500">Loading...</div>
                ) : Array.isArray(unreadNotifications) && unreadNotifications.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">No new notifications</div>
                ) : (
                  Array.isArray(unreadNotifications) && unreadNotifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className="p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                      onClick={async () => {
                        await markRead(notification.id)
                        setIsNotificationDropdownOpen(false)
                        if (notification.link) {
                          navigate(notification.link)
                        }
                      }}
                    >
                      <div className="flex justify-between">
                        <h4 className="font-medium text-slate-900 text-sm">{notification.title}</h4>
                        <X 
                          className="w-4 h-4 text-slate-400 hover:text-slate-600" 
                          onClick={(e) => {
                            e.stopPropagation();
                            markRead(notification.id);
                          }}
                        />
                      </div>
                      <p className="text-slate-600 text-sm mt-1">{notification.body}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        {notification.created_at ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true }) : 'Unknown time'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-slate-200">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <User className="w-4 h-4 text-green-800" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-medium text-slate-700">User {displayName}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full w-fit ${getRoleBadgeColor()}`}>
                  {user.role?.toLowerCase()}
                </span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse"></div>
          )}
        </div>
      </div>

      {/* Search Results Modal */}
      {searchResults && (
        <ThesisSearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          query={searchResults.query}
          exists={searchResults.exists}
          results={searchResults.results}
          message={searchResults.message}
        />
      )}
    </header>
  )
}