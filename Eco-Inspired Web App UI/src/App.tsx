import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ThesisManagement } from './pages/ThesisManagement';
import { ThesisDetail } from './pages/ThesisDetail';
import { GroupManagement } from './pages/GroupManagement';
import { GroupDetail } from './pages/GroupDetail';
import { DocumentManager } from './pages/DocumentManager';
import { GoogleDocsEmbed } from './pages/GoogleDocsEmbed';
import { ScheduleManagement } from './pages/ScheduleManagement';
import { NotificationCenter } from './pages/NotificationCenter';
import { Settings } from './pages/Settings';

export default function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'student' | 'adviser' | 'panel' | 'admin'>('student');
  const [selectedThesisId, setSelectedThesisId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const handleLogin = (role: 'student' | 'adviser' | 'panel' | 'admin') => {
    setIsLoggedIn(true);
    setUserRole(role);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage('login');
  };

  const navigateToPage = (page: string) => {
    setCurrentPage(page);
  };

  const viewThesisDetail = (thesisId: string) => {
    setSelectedThesisId(thesisId);
    setCurrentPage('thesis-detail');
  };

  const viewGroupDetail = (groupId: string) => {
    setSelectedGroupId(groupId);
    setCurrentPage('group-detail');
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar currentPage={currentPage} onNavigate={navigateToPage} userRole={userRole} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onLogout={handleLogout} userRole={userRole} onNavigate={navigateToPage} />
        
        <main className="flex-1 overflow-y-auto">
          {currentPage === 'dashboard' && <Dashboard userRole={userRole} onNavigate={navigateToPage} />}
          {currentPage === 'thesis' && <ThesisManagement userRole={userRole} onViewDetail={viewThesisDetail} />}
          {currentPage === 'thesis-detail' && <ThesisDetail thesisId={selectedThesisId} onBack={() => setCurrentPage('thesis')} />}
          {currentPage === 'groups' && <GroupManagement userRole={userRole} onViewDetail={viewGroupDetail} />}
          {currentPage === 'group-detail' && <GroupDetail groupId={selectedGroupId} onBack={() => setCurrentPage('groups')} />}
          {currentPage === 'documents' && <DocumentManager userRole={userRole} />}
          {currentPage === 'google-docs' && <GoogleDocsEmbed />}
          {currentPage === 'schedule' && <ScheduleManagement userRole={userRole} />}
          {currentPage === 'notifications' && <NotificationCenter />}
          {currentPage === 'settings' && <Settings userRole={userRole} />}
        </main>
      </div>
    </div>
  );
}
