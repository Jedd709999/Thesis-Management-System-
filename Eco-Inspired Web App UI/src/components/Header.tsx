import { Search, Bell, LogOut, User } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';

interface HeaderProps {
  onLogout: () => void;
  userRole: 'student' | 'adviser' | 'panel' | 'admin';
  onNavigate: (page: string) => void;
}

export function Header({ onLogout, userRole, onNavigate }: HeaderProps) {
  const getRoleBadgeColor = () => {
    switch (userRole) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'adviser': return 'bg-blue-100 text-blue-800';
      case 'panel': return 'bg-amber-100 text-amber-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
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

      <div className="flex items-center gap-4">
        <button
          onClick={() => onNavigate('notifications')}
          className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Bell className="w-5 h-5 text-slate-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <Avatar>
            <AvatarFallback className="bg-green-100 text-green-800">
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">John Smith</span>
            <Badge variant="secondary" className={`text-xs w-fit ${getRoleBadgeColor()}`}>
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </Badge>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="text-slate-600 hover:text-slate-900"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}