import { useState } from 'react';
import { Leaf, Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

interface LoginProps {
  onLogin: (role: 'student' | 'adviser' | 'panel' | 'admin') => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'student' | 'adviser' | 'panel' | 'admin'>('student');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(selectedRole);
  };

  const roles = [
    { value: 'student', label: 'Student', color: 'bg-green-100 text-green-800 border-green-300' },
    { value: 'adviser', label: 'Adviser', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    { value: 'panel', label: 'Panel', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    { value: 'admin', label: 'Admin', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Nature Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 via-green-700 to-green-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Leaf className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl tracking-tight">ENVISys</h1>
              <p className="text-green-100 text-sm">Environmental Science Thesis System</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <span className="text-white">🌱</span>
              </div>
              <div>
                <p className="text-white">Collaborative Research</p>
                <p className="text-green-200 text-sm">Work together on environmental studies</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <span className="text-white">🌍</span>
              </div>
              <div>
                <p className="text-white">Document Management</p>
                <p className="text-green-200 text-sm">Integrated with Google Workspace</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <span className="text-white">💧</span>
              </div>
              <div>
                <p className="text-white">Defense Scheduling</p>
                <p className="text-green-200 text-sm">Smart conflict detection system</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-green-100 text-sm">
          <p>© 2025 Environmental Science Department</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <Card className="w-full max-w-md p-8 shadow-xl border-0">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
              <Leaf className="w-8 h-8 text-green-700" />
            </div>
            <h2 className="text-2xl text-slate-900 mb-2">Welcome Back</h2>
            <p className="text-slate-600">Sign in to access your thesis workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@university.edu"
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-2">Select Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setSelectedRole(role.value as any)}
                      className={`px-4 py-2.5 rounded-lg border-2 text-sm transition-all ${
                        selectedRole === role.value
                          ? role.color
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-green-700 hover:bg-green-800 text-white py-6 rounded-lg flex items-center justify-center gap-2"
            >
              Sign In to ENVISys
              <ArrowRight className="w-4 h-4" />
            </Button>

            <div className="text-center">
              <a href="#" className="text-sm text-green-700 hover:text-green-800">
                Forgot your password?
              </a>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
