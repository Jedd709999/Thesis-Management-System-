import React, { useState } from 'react'
import { Box, Typography, Button, Avatar, TextField, Switch, Chip, Card, CardContent, Divider, Grid, IconButton } from '@mui/material'
import { Person, Shield, Link as LinkIcon, DarkMode, ViewComfy, Notifications, Nature, Upload, Edit, Settings } from '@mui/icons-material'
import { useAuth } from '../../hooks/useAuth'

export default function SettingsPage() {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    department: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    thesisUpdates: true,
    documentComments: true,
    scheduleReminders: true
  })

  const [appearanceSettings, setAppearanceSettings] = useState({
    darkMode: false,
    compactView: false
  })

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return { backgroundColor: '#F3E8FF', color: '#7C3AED', border: '1px solid #D8B4FE' }
      case 'ADVISER':
        return { backgroundColor: '#DBEAFE', color: '#2563EB', border: '1px solid #93C5FD' }
      case 'PANEL':
        return { backgroundColor: '#FEF3C7', color: '#D97706', border: '1px solid #FCD34D' }
      default:
        return { backgroundColor: '#DCFCE7', color: '#16A34A', border: '1px solid #86EFAC' }
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNotificationChange = (field: string, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleAppearanceChange = (field: string, value: boolean) => {
    setAppearanceSettings(prev => ({ ...prev, [field]: value }))
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <Box sx={{ p: 4, backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" sx={{ color: '#1E293B', fontWeight: 600, mb: 1 }}>
          Settings
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Settings sx={{ width: 16, height: 16, color: '#10B981' }} />
          <Typography variant="body1" sx={{ color: '#64748B' }}>
            Manage your account preferences and system settings
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Main Settings */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 4 }}>
              {/* Profile Settings */}
              <Box sx={{ mb: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Person sx={{ color: '#10B981' }} />
                  <Typography variant="h5" sx={{ color: '#1E293B', fontWeight: 600 }}>
                    Profile Settings
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, mb: 4, pb: 4, borderBottom: '1px solid #E2E8F0' }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      backgroundColor: '#F0FDF4',
                      color: '#10B981',
                      fontSize: '1.5rem',
                      fontWeight: 600
                    }}
                  >
                    {getInitials(formData.firstName, formData.lastName)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Typography variant="h6" sx={{ color: '#1E293B' }}>
                        {`${formData.firstName} ${formData.lastName}`}
                      </Typography>
                      <Chip
                        label={user?.role || 'STUDENT'}
                        size="small"
                        sx={getRoleBadgeColor(user?.role || 'STUDENT')}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
                      {formData.email}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Upload />}
                      sx={{
                        borderColor: '#E2E8F0',
                        color: '#64748B',
                        '&:hover': {
                          borderColor: '#CBD5E1',
                          backgroundColor: '#F8FAFC'
                        }
                      }}
                    >
                      Change Avatar
                    </Button>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="First Name"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        fullWidth
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': { borderColor: '#CBD5E1' },
                            '&.Mui-focused fieldset': { borderColor: '#10B981' }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Last Name"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        fullWidth
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': { borderColor: '#CBD5E1' },
                            '&.Mui-focused fieldset': { borderColor: '#10B981' }
                          }
                        }}
                      />
                    </Grid>
                  </Grid>

                  <TextField
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': { borderColor: '#CBD5E1' },
                        '&.Mui-focused fieldset': { borderColor: '#10B981' }
                      }
                    }}
                  />

                  <TextField
                    label="Department"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    fullWidth
                    placeholder="Environmental Science"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': { borderColor: '#CBD5E1' },
                        '&.Mui-focused fieldset': { borderColor: '#10B981' }
                      }
                    }}
                  />

                  <TextField
                    label="Bio"
                    multiline
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    fullWidth
                    placeholder="Graduate student researching climate change impacts on biodiversity."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': { borderColor: '#CBD5E1' },
                        '&.Mui-focused fieldset': { borderColor: '#10B981' }
                      }
                    }}
                  />

                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: '#059669',
                      '&:hover': { backgroundColor: '#047857' },
                      alignSelf: 'flex-start',
                      px: 4
                    }}
                  >
                    Save Changes
                  </Button>
                </Box>
              </Box>

              {/* Security Settings */}
              <Box sx={{ pt: 4, borderTop: '1px solid #E2E8F0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Shield sx={{ color: '#10B981' }} />
                  <Typography variant="h5" sx={{ color: '#1E293B', fontWeight: 600 }}>
                    Security Settings
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <TextField
                    label="Current Password"
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                    fullWidth
                    placeholder="Enter current password"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': { borderColor: '#CBD5E1' },
                        '&.Mui-focused fieldset': { borderColor: '#10B981' }
                      }
                    }}
                  />

                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="New Password"
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => handleInputChange('newPassword', e.target.value)}
                        fullWidth
                        placeholder="Enter new password"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': { borderColor: '#CBD5E1' },
                            '&.Mui-focused fieldset': { borderColor: '#10B981' }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Confirm Password"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        fullWidth
                        placeholder="Confirm new password"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': { borderColor: '#CBD5E1' },
                            '&.Mui-focused fieldset': { borderColor: '#10B981' }
                          }
                        }}
                      />
                    </Grid>
                  </Grid>

                  <Button
                    variant="outlined"
                    sx={{
                      borderColor: '#E2E8F0',
                      color: '#64748B',
                      '&:hover': {
                        borderColor: '#CBD5E1',
                        backgroundColor: '#F8FAFC'
                      },
                      alignSelf: 'flex-start'
                    }}
                  >
                    Change Password
                  </Button>

                  <Box sx={{ pt: 2, borderTop: '1px solid #E2E8F0' }}>
                    <Card sx={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Shield sx={{ color: '#10B981' }} />
                            <Box>
                              <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 500 }}>
                                Two-Factor Authentication
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B' }}>
                                Add an extra layer of security
                              </Typography>
                            </Box>
                          </Box>
                          <Switch
                            checked={twoFactorEnabled}
                            onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': {
                                color: '#10B981'
                              },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: '#86EFAC'
                              }
                            }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                </Box>
              </Box>

              {/* Connected Apps */}
              <Box sx={{ pt: 4, borderTop: '1px solid #E2E8F0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <LinkIcon sx={{ color: '#10B981' }} />
                  <Typography variant="h5" sx={{ color: '#1E293B', fontWeight: 600 }}>
                    Connected Apps
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Card sx={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ width: 40, height: 40, backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Box sx={{ width: 24, height: 24, backgroundColor: '#4285F4', borderRadius: '50%' }} />
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 500 }}>
                              Google Workspace
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Chip
                                label="Connected"
                                size="small"
                                sx={{
                                  backgroundColor: '#DCFCE7',
                                  color: '#16A34A',
                                  fontSize: '11px',
                                  height: 20
                                }}
                              />
                              <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                                {formData.email}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{
                            borderColor: '#E2E8F0',
                            color: '#64748B',
                            '&:hover': {
                              borderColor: '#CBD5E1',
                              backgroundColor: '#F8FAFC'
                            }
                          }}
                        >
                          Disconnect
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>

                  <Card sx={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', opacity: 0.6 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ width: 40, height: 40, backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <LinkIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 500 }}>
                              OneDrive
                            </Typography>
                            <Chip
                              label="Not Connected"
                              size="small"
                              sx={{
                                backgroundColor: '#F1F5F9',
                                color: '#64748B',
                                fontSize: '11px',
                                height: 20,
                                mt: 0.5
                              }}
                            />
                          </Box>
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          disabled
                          sx={{
                            borderColor: '#E2E8F0',
                            color: '#94A3B8'
                          }}
                        >
                          Connect
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar Settings */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Appearance */}
            <Card sx={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <DarkMode sx={{ color: '#10B981' }} />
                  <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 600 }}>
                    Appearance
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Card sx={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 500 }}>
                            Dark Mode
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            Switch to dark theme
                          </Typography>
                        </Box>
                        <Switch
                          checked={appearanceSettings.darkMode}
                          onChange={(e) => handleAppearanceChange('darkMode', e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#10B981'
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#86EFAC'
                            }
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>

                  <Card sx={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 500 }}>
                            Compact View
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            Reduce spacing
                          </Typography>
                        </Box>
                        <Switch
                          checked={appearanceSettings.compactView}
                          onChange={(e) => handleAppearanceChange('compactView', e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#10B981'
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#86EFAC'
                            }
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card sx={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Notifications sx={{ color: '#10B981' }} />
                  <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 600 }}>
                    Notifications
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 500 }}>
                        Email Notifications
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Receive updates via email
                      </Typography>
                    </Box>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onChange={(e) => handleNotificationChange('emailNotifications', e.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#10B981'
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#86EFAC'
                        }
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 500 }}>
                        Thesis Updates
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Notify about thesis changes
                      </Typography>
                    </Box>
                    <Switch
                      checked={notificationSettings.thesisUpdates}
                      onChange={(e) => handleNotificationChange('thesisUpdates', e.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#10B981'
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#86EFAC'
                        }
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 500 }}>
                        Document Comments
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Alert on new comments
                      </Typography>
                    </Box>
                    <Switch
                      checked={notificationSettings.documentComments}
                      onChange={(e) => handleNotificationChange('documentComments', e.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#10B981'
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#86EFAC'
                        }
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 500 }}>
                        Schedule Reminders
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Defense date reminders
                      </Typography>
                    </Box>
                    <Switch
                      checked={notificationSettings.scheduleReminders}
                      onChange={(e) => handleNotificationChange('scheduleReminders', e.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#10B981'
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#86EFAC'
                        }
                      }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* System Info */}
            <Card sx={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Nature sx={{ color: '#047857', fontSize: 32 }} />
                  <Box>
                    <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 600 }}>
                      ENVISys
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#047857' }}>
                      Version 1.0.0
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" sx={{ color: '#047857', mb: 2, display: 'block' }}>
                  Environmental Science Thesis Management System
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#047857' }}>
                    © 2025 Environmental Science Department
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#047857' }}>
                    University Research System
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}
