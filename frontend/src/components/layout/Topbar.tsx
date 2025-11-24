import React from 'react'
import { Link } from 'react-router-dom'
import { Search, Bell, Menu } from 'lucide-react'

interface TopbarProps {
  unreadCount?: number
}

export const Topbar: React.FC<TopbarProps> = ({ unreadCount = 0 }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search theses, documents, groups..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link
          to="/notifications"
          className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Bell className="w-5 h-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </Link>
      </div>
    </header>
  )
}