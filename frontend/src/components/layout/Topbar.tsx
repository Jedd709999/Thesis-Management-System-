<<<<<<< HEAD
import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Menu, User, Search, Loader2 } from 'lucide-react'
import { Input } from '../ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Button } from '../ui/button'
import { useAuth } from '../../hooks/useAuth'
import { searchTopics } from '../../api/thesisService'
=======
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Bell, Menu, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
>>>>>>> 9986194de6c7eb0f9dff4a8117cc3ead7b76b7fd

interface TopbarProps {
  unreadCount?: number
  onMenuToggle?: () => void
<<<<<<< HEAD
  onNavigate?: (page: string) => void
}

export const Topbar: React.FC<TopbarProps> = ({ unreadCount = 0, onMenuToggle, onNavigate }) => {
  const { user, displayName } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<any>(null)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setSelectedTopic(null)
      setShowSearchModal(false)
      return
    }

    setSearchLoading(true)
    try {
      const response = await searchTopics(query)
      const results = response?.results || []
      setSearchResults(results)

      // Show modal with search results
      if (results.length > 0) {
        setSelectedTopic({ ...results[0], exists: true })
      } else {
        setSelectedTopic({ title: query, exists: false })
      }
      setShowSearchModal(true)
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
      setSelectedTopic({ title: query, exists: false })
      setShowSearchModal(true)
    } finally {
      setSearchLoading(false)
    }
  }, [])

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery)
    }, 60000) // 60 seconds debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery, performSearch])

=======
}

export const Topbar: React.FC<TopbarProps> = ({ unreadCount = 0, onMenuToggle }) => {
  const { user, displayName } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search functionality would be implemented here
    console.log('Searching for:', searchQuery)
  }
  
>>>>>>> 9986194de6c7eb0f9dff4a8117cc3ead7b76b7fd
  const getRoleBadgeColor = () => {
    switch (user?.role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800'
      case 'ADVISER': return 'bg-blue-100 text-blue-800'
      case 'PANEL': return 'bg-amber-100 text-amber-800'
      default: return 'bg-green-100 text-green-800'
    }
  }

<<<<<<< HEAD
  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <header className="h-20 bg-gradient-to-r from-slate-50 to-white border-b-2 border-slate-300 shadow-lg px-6 sm:px-8 flex items-center justify-between">
=======
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
>>>>>>> 9986194de6c7eb0f9dff4a8117cc3ead7b76b7fd
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-slate-600" />
        </button>
<<<<<<< HEAD

=======
        
>>>>>>> 9986194de6c7eb0f9dff4a8117cc3ead7b76b7fd
        <div className="hidden sm:block">
          <h1 className="text-xl font-semibold text-slate-800">ENVISys</h1>
        </div>
      </div>

<<<<<<< HEAD
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Search Bar */}
        <div className="relative flex items-center bg-white border-2 border-green-500 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
          <Input
            type="text"
            placeholder="Search theses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                performSearch(searchQuery)
              }
              if (e.key === 'Escape') {
                setSearchQuery('')
                setShowSearchModal(false)
                setSelectedTopic(null)
              }
            }}
            className="pl-4 pr-20 w-64 bg-transparent border-0 focus:ring-0 text-sm font-medium placeholder:text-slate-400"
          />
          <Button
            onClick={() => performSearch(searchQuery)}
            disabled={searchLoading}
            className="absolute right-1 h-8 px-3 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-md shadow-md hover:shadow-lg transition-all duration-200"
          >
            {searchLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              'Search'
            )}
          </Button>
        </div>

        {/* Notification Bell */}
        <Link
          to="/notifications"
          className="relative p-3 hover:bg-slate-100 rounded-xl transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-6 h-6 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full"></span>
          )}
        </Link>

        {/* Profile Section */}
        <div className="flex items-center gap-3 sm:gap-4 pl-4 sm:pl-6 border-l-2 border-slate-300">
          {user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleAvatarClick}
                className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shadow-md hover:bg-green-200 transition-colors cursor-pointer"
                aria-label="Change profile picture"
              >
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-green-800" />
                )}
              </button>
              <div className="hidden sm:flex flex-col">
                <span className="text-base font-semibold text-slate-700">User {displayName}</span>
                <span className={`text-sm px-2 py-1 rounded-full w-fit font-medium ${getRoleBadgeColor()}`}>
=======
      <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4 sm:mx-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search theses, documents, groups..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </form>

      <div className="flex items-center gap-2 sm:gap-4">
        <Link
          to="/notifications"
          className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-slate-200">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <User className="w-4 h-4 text-green-800" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-medium text-slate-700">User {displayName}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full w-fit ${getRoleBadgeColor()}`}>
>>>>>>> 9986194de6c7eb0f9dff4a8117cc3ead7b76b7fd
                  {user.role?.toLowerCase()}
                </span>
              </div>
            </div>
          ) : (
<<<<<<< HEAD
            <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse"></div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: 'none' }}
        />

        {/* Search Modal */}
        <Dialog open={showSearchModal} onOpenChange={setShowSearchModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedTopic?.exists ? 'Topic Already Exists' : 'Topic Not Found'}
              </DialogTitle>
              <DialogDescription>
                {selectedTopic?.exists
                  ? 'This thesis topic already exists in the system.'
                  : 'This thesis topic does not exist yet. You can proceed to create it.'
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedTopic?.title || searchQuery}</h3>
              </div>

              {selectedTopic?.exists ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Abstract</label>
                    <p className="text-sm text-slate-600 mt-1 p-3 bg-slate-50 rounded-md">
                      {selectedTopic?.abstract || 'No abstract available'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Date & Time</label>
                      <p className="text-sm text-slate-600 mt-1">
                        {selectedTopic?.created_at ? new Date(selectedTopic.created_at).toLocaleString() : 'N/A'}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700">Group Name</label>
                      <p className="text-sm text-slate-600 mt-1">
                        {selectedTopic?.group_name || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">Location</label>
                    <p className="text-sm text-slate-600 mt-1">
                      {selectedTopic?.location || 'N/A'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-slate-600 mb-4">
                    The topic "{searchQuery}" is not yet registered in the system.
                  </p>
                  <p className="text-sm text-slate-500">
                    You can proceed to create this thesis topic.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowSearchModal(false)}>
                Close
              </Button>
              {!selectedTopic?.exists && (
                <Button
                  onClick={() => {
                    setShowSearchModal(false)
                    onNavigate?.('thesis')
                  }}
                >
                  Proceed to Create
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
=======
            <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse"></div>
          )}
        </div>
>>>>>>> 9986194de6c7eb0f9dff4a8117cc3ead7b76b7fd
      </div>
    </header>
  )
}