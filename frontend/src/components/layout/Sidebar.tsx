import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Leaf, Settings as SettingsIcon } from 'lucide-react'
import { User, UserRole } from '../../types'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
  roles?: UserRole[]
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    roles: ['STUDENT', 'ADVISER', 'PANEL', 'ADMIN']
  },
  {
    label: 'Groups',
    path: '/groups',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    roles: ['STUDENT', 'ADVISER', 'PANEL', 'ADMIN']
  },
  {
    label: 'Thesis',
    path: '/thesis',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>,
    roles: ['STUDENT', 'ADVISER', 'PANEL', 'ADMIN']
  },
  {
    label: 'Documents',
    path: '/documents',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
    roles: ['STUDENT', 'ADVISER', 'PANEL', 'ADMIN']
  },
  {
    label: 'Schedule',
    path: '/schedule',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    roles: ['STUDENT', 'ADVISER', 'PANEL', 'ADMIN']
  },
  {
    label: 'Archive',
    path: '/archive',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>,
    roles: ['STUDENT', 'ADVISER', 'PANEL', 'ADMIN']
  },
  {
    label: 'Notifications',
    path: '/notifications',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    roles: ['STUDENT', 'ADVISER', 'PANEL', 'ADMIN']
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: <SettingsIcon className="w-5 h-5" />,
    roles: ['STUDENT', 'ADVISER', 'PANEL', 'ADMIN']
  }
]

interface SidebarProps {
  user: User | null
  onLogout: () => void
  isOpen?: boolean
  onClose?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, isOpen = true, onClose }) => {
  const location = useLocation()

  // Don't render sidebar if it's not open
  if (!isOpen) {
    return null
  }

  const filteredNavItems = Array.isArray(navItems) ? navItems.filter(
    item => !item.roles || (user?.role && item.roles.includes(user.role))
  ) : [];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  // Only close sidebar on mobile after clicking a link
  const handleNavigationClick = () => {
    // Check if we're on a mobile screen (less than 1024px)
    if (window.innerWidth < 1024 && onClose) {
      onClose()
    }
  }

  return (
    <aside className="w-64 bg-gradient-to-b from-green-800 to-green-900 text-white flex flex-col">
      <div className="p-6 border-b border-green-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
            <Leaf className="w-6 h-6 text-green-300" />
          </div>
          <div>
            <h1 className="tracking-tight">ENVISys</h1>
            <p className="text-xs text-green-300">Environmental Science Thesis</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {filteredNavItems.map((item) => {
          const isActiveItem = isActive(item.path)
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleNavigationClick}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActiveItem
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-green-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="w-5 h-5 flex-shrink-0">
                {item.icon}
              </span>
              <span className="text-sm">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {user && (
        <div className="p-4 border-t border-green-700">
          <div className="px-3 py-2 bg-white/10 rounded-lg">
            <p className="text-xs text-green-300 uppercase tracking-wider">User</p>
            <p className="text-sm capitalize">{user.first_name} {user.last_name}</p>
            <p className="text-xs text-green-200 mt-1 capitalize">{user.role.toLowerCase()}</p>
          </div>
          <button
            onClick={onLogout}
            className="w-full mt-3 flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-green-100 hover:bg-white/10 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span className="text-sm">Logout</span>
          </button>
        </div>
      )}
    </aside>
  )
}