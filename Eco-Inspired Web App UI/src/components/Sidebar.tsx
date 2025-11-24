import { LayoutDashboard, FileText, Users, FolderOpen, Calendar, Bell, Settings, Leaf } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  userRole: 'student' | 'adviser' | 'panel' | 'admin';
}

export function Sidebar({ currentPage, onNavigate, userRole }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'thesis', label: 'Thesis Management', icon: FileText },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'documents', label: 'Documents', icon: FolderOpen },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

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
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id || 
            (item.id === 'thesis' && currentPage === 'thesis-detail') ||
            (item.id === 'groups' && currentPage === 'group-detail');
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-green-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-green-700">
        <div className="px-3 py-2 bg-white/10 rounded-lg">
          <p className="text-xs text-green-300 uppercase tracking-wider">Role</p>
          <p className="text-sm capitalize">{userRole}</p>
        </div>
      </div>
    </aside>
  );
}
