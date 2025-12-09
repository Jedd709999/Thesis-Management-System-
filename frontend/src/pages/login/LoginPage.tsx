import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Leaf, Mail, Lock, ArrowRight, Eye, EyeOff, Users, FileText, 
  Calendar, UserPlus, CheckCircle, User, ChevronDown
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { useAuth } from '../../hooks/useAuth';
import { login as apiLogin, saveTokens, register, fetchProfile, ApiError } from '../../api/authService';
import api from '../../api/api';
import { User as UserType, UserRole } from '../../types';

interface LoginFormData {
  email: string;
  password: string;
}

interface SignupFormData extends LoginFormData {
  first_name: string;
  last_name: string;
  role: UserRole;
  confirmPassword: string;
}

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<LoginFormData | SignupFormData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'STUDENT',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, checkAuthStatus } = useAuth();

  // Check for registration success message from SignupPage
  useEffect(() => {
    if (location.state?.registrationSuccess) {
      setSuccess(true);
      // Check if email verification is needed
      if (location.state?.emailVerificationNeeded) {
        setShowVerificationMessage(true);
        setVerificationEmail(location.state?.email || '');
        setError('Registration successful, but we couldn\'t send the verification email. Please contact support or request a new verification email.');
      }
      // Clear the location state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Function to handle resending verification email
  const handleResendVerification = async (email: string) => {
    try {
      setIsResending(true);
      await api.post('auth/resend-verification/', { email });
      setSuccess(true);
      setError('A new verification email has been sent. Please check your inbox.');
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      setError(error.response?.data?.detail || 'Failed to resend verification email. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShowVerificationMessage(false);

    try {
      if (isLogin) {
        // Handle login
        console.log('Attempting real login with:', formData.email);
        try {
          const tokens = await apiLogin(formData.email, formData.password);
          console.log('Login successful, received tokens:', tokens);
          saveTokens(tokens);
          
          // Fetch user profile using the proper API client
          try {
            const userData: UserType = await fetchProfile();
            console.log('User profile fetched:', userData);
            login(userData);
            
            // Check auth status to ensure context is updated
            await checkAuthStatus();
            
            // Check if Google Drive was reconnected
            const driveReconnected = localStorage.getItem('drive_reconnected') === 'true';
            if (driveReconnected) {
              // Show a success message about Google Drive reconnection
              console.log('Google Drive reconnected successfully');
              // You could show a toast notification here if desired
            }
            
            // Navigate to dashboard
            navigate('/dashboard', { replace: true });
          } catch (profileError) {
            console.error('Error fetching user profile:', profileError);
            setError('Authentication failed. Please try again.');
            // Clear tokens on error
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
          }
        } catch (error: any) {
          console.error('Login error:', error);
          if (error.response?.data?.detail?.includes('verify your email')) {
            setVerificationEmail(formData.email);
            setShowVerificationMessage(true);
            setError(error.response.data.detail);
          } else {
            setError(error.message || 'Login failed. Please check your credentials.');
          }
        }
      } else {
        // Handle signup
        if (formData.password !== (formData as SignupFormData).confirmPassword) {
          throw new Error('Passwords do not match');
        }
        
        // Remove confirmPassword before sending to API
        const { confirmPassword, ...registrationData } = formData as SignupFormData;
        const response = await register(registrationData);
        
        // Show appropriate message based on email verification status
        if (response.email_verification_needed) {
          setVerificationEmail(formData.email);
          setShowVerificationMessage(true);
          setError(response.detail);
        } else {
          // Show success message and switch to login
          setSuccess(true);
          setFormData({
            email: formData.email,
            password: '',
            first_name: '',
            last_name: '',
            role: 'STUDENT',
            confirmPassword: ''
          });
          
          // Auto-switch to login after a delay
          setTimeout(() => {
            setSuccess(false);
            setIsLogin(true);
          }, 3000);
        }
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.response?.data?.detail || error.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 via-green-700 to-green-900 p-12 flex-col justify-between relative h-screen sticky top-0">
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
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white">Collaborative Research</p>
                <p className="text-green-200 text-sm">Work together on environmental studies</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white">Document Management</p>
                <p className="text-green-200 text-sm">Integrated with Google Workspace</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white">Automated Scheduling</p>
                <p className="text-green-200 text-sm">Smart scheduling with automated conflict resolution</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-green-100 text-sm">
          <p> 2025 Environmental Science Department</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 overflow-y-auto h-screen">
        <div className="min-h-full flex items-center justify-center p-8 bg-slate-50">
          <Card className="w-full max-w-md p-8 shadow-xl border-0">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
                {isLogin ? (
                  <User className="w-8 h-8 text-green-700" />
                ) : (
                  <UserPlus className="w-8 h-8 text-green-700" />
                )}
              </div>
              <h2 className="text-2xl text-slate-900 mb-2">
                {isLogin ? 'Welcome Back' : 'Create an Account'}
              </h2>
              <p className="text-slate-600">
                {isLogin 
                  ? 'Log in to access your thesis workspace' 
                  : 'Join our research community today'}
              </p>
            </div>
            
            {/* Tabs */}
            <div className="flex mb-6 border-b border-slate-200">
              <button
                type="button"
                className={`flex-1 py-3 font-medium text-sm ${isLogin ? 'text-green-700 border-b-2 border-green-700' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => {
                  setError(null);
                  setIsLogin(true);
                }}
              >
                Log In
              </button>
              <button
                type="button"
                className={`flex-1 py-3 font-medium text-sm ${!isLogin ? 'text-green-700 border-b-2 border-green-700' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => {
                  setError(null);
                  setIsLogin(false);
                }}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4" role="alert">
                  <div className="flex flex-col space-y-2">
                    <span className="block sm:inline text-sm">{error}</span>
                    {showVerificationMessage && verificationEmail && (
                      <button
                        type="button"
                        onClick={() => handleResendVerification(verificationEmail)}
                        disabled={isResending}
                        className="text-sm text-red-700 hover:text-red-900 underline focus:outline-none font-medium"
                      >
                        {isResending ? 'Sending...' : 'Resend verification email'}
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                {!isLogin && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-700 mb-2">First Name</label>
                      <div className="relative">
                        <input
                          type="text"
                          name="first_name"
                          value={(formData as SignupFormData).first_name}
                          onChange={handleChange}
                          placeholder="John"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                          required={!isLogin}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-700 mb-2">Last Name</label>
                      <div className="relative">
                        <input
                          type="text"
                          name="last_name"
                          value={(formData as SignupFormData).last_name}
                          onChange={handleChange}
                          placeholder="Doe"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                          required={!isLogin}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Email Field */}
                <div>
                  <label className="block text-sm text-slate-700 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your.email@university.edu"
                      className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                
                {!isLogin && (
                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Role</label>
                    <div className="relative">
                      <select
                        name="role"
                        value={(formData as SignupFormData).role}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent appearance-none bg-white"
                        required
                      >
                        <option value="STUDENT">Student</option>
                        <option value="ADVISER">Adviser</option>
                        <option value="PANEL">Panel Member</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Password Field */}
                <div>
                  <label className="block text-sm text-slate-700 mb-2">
                    {isLogin ? 'Password' : 'Create Password'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={isLogin ? "Enter your password" : "Create a password"}
                      className="w-full pl-11 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      required
                      minLength={isLogin ? undefined : 8}
                    />
                  </div>
                  {!isLogin && (
                    <p className="mt-1 text-xs text-slate-500">
                      Use at least 8 characters
                    </p>
                  )}
                </div>
                
                {!isLogin && (
                  <div>
                    <label className="block text-sm text-slate-700 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="password"
                        name="confirmPassword"
                        value={(formData as SignupFormData).confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        className="w-full pl-11 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-green-700 hover:bg-green-800 text-white py-6 rounded-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isLogin ? 'Signing In...' : 'Creating Account...'}
                  </>
                ) : (
                  <>
                    {isLogin ? 'Log In' : 'Create Account'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              {/* Forgot Password Link */}
              {isLogin && (
                <div className="text-center">
                  <a href="#" className="text-sm text-green-700 hover:text-green-800">
                    Forgot your password?
                  </a>
                </div>
              )}
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Export the LoginPage component as default
export default LoginPage;