import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight, Eye, EyeOff, UserPlus, CheckCircle } from 'lucide-react';
import { UserRole } from '../../types';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { useAuth } from '../../hooks/useAuth';
import { register as apiRegister } from '../../api/authService';

export function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT' as UserRole, // Default role with type assertion
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false); // Add success state

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Call the registration API
      const response = await apiRegister({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
      
      // Show success message
      setSuccess(true);
      
      // Wait a moment to show the success message before redirecting
      setTimeout(() => {
        // On successful registration, redirect to login with success message
        // If email verification is needed, pass that information as well
        navigate('/login', { 
          state: { 
            registrationSuccess: true,
            emailVerificationNeeded: response.email_verification_needed,
            email: formData.email
          } 
        });
      }, 2000);
    } catch (err: any) {
      console.error('Registration error:', err);
      setSuccess(false);
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding (same as login) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 via-green-700 to-green-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <UserPlus className="w-7 h-7" />
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
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white">Create Your Account</p>
                <p className="text-green-200 text-sm">Join our research community</p>
              </div>
            </div>
            <div className="text-green-100 text-sm">
              <p>Already have an account? <Link to="/login" className="text-white font-medium hover:underline">Sign in here</Link></p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-green-100 text-sm">
          <p> 2025 Environmental Science Department</p>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <Card className="w-full max-w-md p-8 shadow-xl border-0">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
              <UserPlus className="w-8 h-8 text-green-700" />
            </div>
            <h2 className="text-2xl text-slate-900 mb-2">Create Account</h2>
            <p className="text-slate-600">Fill in your details to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-3 bg-green-50 border border-green-100 text-green-700 rounded-lg text-sm flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>Registration successful! Please check your email to verify your account.</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-700 mb-2">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="John"
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                    disabled={success} // Disable inputs when showing success
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-2">Last Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Doe"
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                    disabled={success} // Disable inputs when showing success
                  />
                </div>
              </div>
            </div>

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
                  disabled={success} // Disable inputs when showing success
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-2">Role</label>
              <div className="relative">
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full pl-4 pr-10 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent appearance-none bg-white"
                  required
                  disabled={success} // Disable inputs when showing success
                >
                  <option value="STUDENT">Student</option>
                  <option value="ADVISER">Adviser</option>
                  <option value="PANEL">Panel Member</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className="w-full pl-11 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  required
                  minLength={8}
                  disabled={success} // Disable inputs when showing success
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Must be at least 8 characters</p>
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="w-full pl-11 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  required
                  disabled={success} // Disable inputs when showing success
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading || success} // Disable button when loading or showing success
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 rounded-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Account...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>

            <div className="text-center text-sm text-slate-600 pt-2">
              Already have an account?{' '}
              <Link to="/login" className="text-green-700 font-medium hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default Signup;