import { User, Lock, Link as LinkIcon, Moon, Shield, Bell, Leaf } from 'lucide-react';
import { Card, Button, Badge, Avatar, AvatarFallback, Switch } from '../../components/ui';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { googleOAuthService } from '../../services/googleOAuthService';
import { accountLinkingService } from '../../services/accountLinkingService';
import { useAuth } from '../../hooks/useAuth';
import { useDriveConnection } from '../../hooks/useDriveConnection';

interface SettingsProps {
  userRole: 'student' | 'adviser' | 'panel' | 'admin';
}

export function Settings({ userRole }: SettingsProps) {
  const { user } = useAuth();
  const { isDriveConnected: googleDriveConnected, checkDriveConnection } = useDriveConnection();
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    bio: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const getRoleBadgeColor = () => {
    switch (userRole) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'adviser':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'panel':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  // Initialize user data
  useEffect(() => {
    if (user) {
      setUserData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        bio: user.bio || ''
      });
    }
  }, [user?.first_name, user?.last_name, user?.email, user?.bio]);

  // Check if user has Google account connected
  const checkGoogleConnection = async () => {
    console.log('SettingsPage: Checking Google connection');
    setCheckingConnection(true);
    setConnectionError(null);
    try {
      const isConnected = await accountLinkingService.isGoogleConnected();
      console.log('SettingsPage: accountLinkingService says connected:', isConnected);
      // Update localStorage with the actual connection status
      localStorage.setItem('drive_connected', isConnected.toString());
      checkDriveConnection(); // This will update the state through the hook
      console.log('SettingsPage: Drive connection after check - connected:', googleDriveConnected);
    } catch (error: any) {
      console.error('SettingsPage: Google connection check error:', error);
      setConnectionError('Failed to check Google account connection');
      checkDriveConnection(); // This will update the state through the hook
    } finally {
      setCheckingConnection(false);
    }
  };

  // Initial connection check
  useEffect(() => {
    checkGoogleConnection();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle password input changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle avatar file change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
    }
  };

  // Handle password change
  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await changePassword({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        confirm_password: passwordData.confirmPassword
      });
      toast.success('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      const errorMessage = error.response?.data?.detail ||
                          error.response?.data?.current_password?.[0] ||
                          error.response?.data?.new_password?.[0] ||
                          'Failed to change password';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Save profile changes
  const handleSaveChanges = async () => {
    try {
      setLoading(true);

      if (avatarFile) {
        // Use FormData when uploading avatar
        const formData = new FormData();
        formData.append('first_name', userData.firstName);
        formData.append('last_name', userData.lastName);
        formData.append('bio', userData.bio);
        formData.append('avatar', avatarFile);

        await updateProfile(formData);
      } else {
        // Use JSON for text-only updates
        const profileData = {
          first_name: userData.firstName,
          last_name: userData.lastName,
          bio: userData.bio
        };

        await updateProfile(profileData);
      }

      // Fetch updated user profile to refresh avatar and other data
      const updatedUser = await fetchProfile();
      login(updatedUser);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.detail ||
                          error.response?.data?.email?.[0] ||
                          error.response?.data?.first_name?.[0] ||
                          error.response?.data?.last_name?.[0] ||
                          'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Connect Google account
  const handleConnectGoogleAccount = async () => {
    setLoading(true);
    setConnectionError(null);

    try {
      // Connect Google account using our service
      const result = await accountLinkingService.connectGoogleAccount();

      if (result.connected) {
        console.log('SettingsPage: Google account connected successfully');
        // Update the connection state through the hook
        checkDriveConnection();
        toast.success(result.message || 'Google account connected successfully', {
          duration: 5000,
        });
        // Refresh the connection status
        await checkGoogleConnection();
      } else {
        throw new Error(result.message || 'Failed to connect Google account');
      }
    } catch (error: any) {
      console.error('Error connecting Google account:', error);
      let errorMessage = error.message || 'Failed to connect Google account';
      
      // Provide more user-friendly error messages
      if (errorMessage.includes('insufficient_scope')) {
        errorMessage = 'Please grant all required Google Drive permissions when prompted.';
      } else if (errorMessage.includes('invalid_grant')) {
        errorMessage = 'Authentication failed. Please try again and make sure you select the correct Google account.';
      } else if (errorMessage.includes('Invalid Google credentials')) {
        errorMessage = 'Invalid credentials. Please try connecting your Google account again.';
      } else if (errorMessage.includes('Connection failed')) {
        // Keep the specific connection failed message
      } else if (errorMessage.includes('Connection error')) {
        // Keep the specific connection error message
      } else {
        // Generic error message
        errorMessage = 'Failed to connect Google account. Please try again. If the problem persists, contact support.';
      }
      
      setConnectionError(errorMessage);
      toast.error(errorMessage, {
        duration: 7000, // Show longer for important messages
      });
    } finally {
      setLoading(false);
    }
  };

  // Disconnect Google account
  const handleDisconnectGoogleAccount = async () => {
    setLoading(true);
    setConnectionError(null);

    try {
      // Disconnect Google account using our service
      const result = await accountLinkingService.disconnectGoogleAccount();

      if (!result.connected) {
        console.log('SettingsPage: Google account disconnected successfully');
        // Update the connection state through the hook
        checkDriveConnection();
        toast.success(result.message || 'Google account disconnected successfully', {
          duration: 5000,
        });
        // Refresh the connection status
        await checkGoogleConnection();
      } else {
        throw new Error(result.message || 'Failed to disconnect Google account');
      }
    } catch (error: any) {
      console.error('Error disconnecting Google account:', error);
      const errorMessage = error.message || 'Failed to disconnect Google account. Please try again later.';
      setConnectionError(errorMessage);
      toast.error(errorMessage, {
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-slate-900 mb-2">Settings</h1>
        <p className="text-slate-600">Manage your account preferences and system settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <Card className="lg:col-span-2 p-6 border-0 shadow-sm space-y-6">
          <div>
            <h2 className="text-slate-900 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-green-600" />
              Profile Settings
            </h2>

            <div className="flex items-start gap-6 mb-6 pb-6 border-b border-slate-200">
              <Avatar className="w-20 h-20">
                {avatarFile ? (
                  <img src={URL.createObjectURL(avatarFile)} alt="Avatar preview" className="w-full h-full object-cover rounded-full" />
                ) : user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <AvatarFallback className="bg-green-100 text-green-800 text-xl">
                    {userData.firstName?.charAt(0)}{userData.lastName?.charAt(0)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-slate-900">{userData.firstName} {userData.lastName}</h3>
                  <Badge variant="secondary" className={`border ${getRoleBadgeColor()}`}>
                    {userRole}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 mb-3">{userData.email}</p>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label htmlFor="avatar-upload">
                    <Button variant="outline" size="sm" asChild>
                      <span className="cursor-pointer">
                        {avatarFile ? 'Avatar Selected' : 'Change Avatar'}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-700 mb-2">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={userData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={userData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={userData.email}
                  onChange={handleInputChange}
                  disabled
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                {/* Department field - in a real implementation, this would be fetched from user profile */}
                <label className="block text-sm text-slate-700 mb-2">Department</label>
                <input
                  type="text"
                  name="department"
                  value="Environmental Science" /* Hardcoded for demo */
                  onChange={() => {}} /* No-op for demo */
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  readOnly
                />
              </div>

              <div>
                {/* Bio field - editable for all users */}
                <label className="block text-sm text-slate-700 mb-2">Bio</label>
                <textarea
                  rows={3}
                  name="bio"
                  value={userData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                ></textarea>
              </div>

              <Button
                className="bg-green-700 hover:bg-green-800 text-white"
                onClick={handleSaveChanges}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>

          {/* Security */}
          <div className="pt-6 border-t border-slate-200">
            <h2 className="text-slate-900 mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5 text-green-600" />
              Security
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-700 mb-2">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-700 mb-2">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <Button variant="outline" onClick={handleChangePassword} disabled={loading}>
                {loading ? 'Changing...' : 'Change Password'}
              </Button>

              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-slate-900">Two-Factor Authentication</p>
                      <p className="text-xs text-slate-600">Add an extra layer of security</p>
                    </div>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>
          </div>

          {/* Connected Apps */}
          <div className="pt-6 border-t border-slate-200">
            <h2 className="text-slate-900 mb-6 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-green-600" />
              Connected Apps
            </h2>

            <div className="space-y-4">
              {/* Google Drive Integration */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">Google Drive</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="secondary"
                            className={googleDriveConnected
                              ? "bg-green-100 text-green-800 text-xs border-green-200"
                              : "bg-slate-100 text-slate-600 text-xs border-slate-200"}
                          >
                            {checkingConnection ? 'Checking...' : (googleDriveConnected ? 'Connected' : 'Not Connected')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {googleDriveConnected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDisconnectGoogleAccount}
                        disabled={loading || checkingConnection}
                        className="min-w-[100px]"
                      >
                        {loading ? 'Disconnecting...' : 'Disconnect'}
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleConnectGoogleAccount}
                        disabled={loading || checkingConnection}
                        className="min-w-[100px]"
                      >
                        {loading ? 'Connecting...' : 'Connect'}
                      </Button>
                    )}
                  </div>

                  {connectionError && (
                    <p className="text-sm text-red-600 mt-1">
                      {connectionError}
                    </p>
                  )}

                  <p className="text-xs text-slate-500 mt-1">
                    {checkingConnection 
                      ? 'Checking connection status...' 
                      : googleDriveConnected 
                        ? `Connected as ${userData.email}. You can now save files directly to your Google Drive. Refresh this page if you experience any issues.`
                        : 'Connect your Google account to save files directly to your Google Drive. Make sure to grant all requested permissions.'}
                  </p>
                </div>
              </div>

              {/* OneDrive Integration (Placeholder) */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 opacity-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path
                          fill="#0078D4"
                          d="M21.5 12.5v5.5c0 1.1-.9 2-2 2h-15c-1.1 0-2-.9-2-2v-12c0-1.1.9-2 2-2h9.5v9.5l7-7z"
                        />
                        <path
                          fill="#0078D4"
                          d="M22.5 5.5l-7 7v-7h7z"
                        />
                        <path
                          fill="#0078D4"
                          d="M15.5 12.5v7h-7v-7h7z"
                        />
                        <path
                          fill="#0078D4"
                          d="M8.5 12.5v7h-7v-7h7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-slate-900">Microsoft OneDrive</p>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-400 text-xs mt-1">
                        Coming Soon
                      </Badge>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Connect
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          {/* Appearance */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-slate-900 mb-6 flex items-center gap-2">
              <Moon className="w-5 h-5 text-green-600" />
              Appearance
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm text-slate-900">Dark Mode</p>
                  <p className="text-xs text-slate-600">Switch to dark theme</p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm text-slate-900">Compact View</p>
                  <p className="text-xs text-slate-600">Reduce spacing</p>
                </div>
                <Switch />
              </div>
            </div>
          </Card>

          {/* Notifications */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-slate-900 mb-6 flex items-center gap-2">
              <Bell className="w-5 h-5 text-green-600" />
              Notifications
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-900">Email Notifications</p>
                  <p className="text-xs text-slate-600">Receive updates via email</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-900">Thesis Updates</p>
                  <p className="text-xs text-slate-600">Notify about thesis changes</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-900">Document Comments</p>
                  <p className="text-xs text-slate-600">Alert on new comments</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-900">Schedule Reminders</p>
                  <p className="text-xs text-slate-600">Defense date reminders</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </Card>

          {/* System Info */}
          <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center gap-3 mb-4">
              <Leaf className="w-8 h-8 text-green-700" />
              <div>
                <h3 className="text-slate-900">ENVISys</h3>
                <p className="text-xs text-green-700">Version 1.0.0</p>
              </div>
            </div>
            <p className="text-xs text-green-800 mb-4">
              Environmental Science Thesis Management System
            </p>
            <div className="space-y-2 text-xs text-green-700">
              <p>© 2025 Environmental Science Department</p>
              <p>University Research System</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}