import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Box, Typography, TextField, Button, Paper, Grid, IconButton, InputAdornment } from '@mui/material'
import { Leaf, Mail, Lock, ArrowRight } from 'lucide-react'
import { login, saveTokens, fetchProfile } from '../../api/authService'
import { AuthContext } from '../../context/AuthContext'
import { useTheme } from '@mui/material/styles'

export default function LoginPage(){
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [error,setError]=useState('')
  const navigate = useNavigate()
  const { setUser } = useContext(AuthContext)
  const theme = useTheme()
  
  const handle = async (e:any)=>{
    e.preventDefault()
    try {
      const tokens = await login(email,password)
      saveTokens(tokens)
      const profile = await fetchProfile()
      setUser(profile)
      navigate('/', { replace:true })
    } catch (err:any){ setError(err?.response?.data?.detail || 'Login failed') }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left Side - Eco Panel */}
      <Grid 
        item 
        xs={12} 
        md={6}
        sx={{
          display: { xs: 'none', md: 'flex' },
          background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 50%, #14532d 100%)',
          p: 6,
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background decoration */}
        <Box sx={{
          position: 'absolute',
          top: 80,
          left: 80,
          width: 256,
          height: 256,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          filter: 'blur(48px)'
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: 80,
          right: 80,
          width: 384,
          height: 384,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          filter: 'blur(48px)'
        }} />

        {/* Logo Section */}
        <Box sx={{ position: 'relative', zIndex: 10 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, color: 'white' }}>
            <Box sx={{
              width: 48,
              height: 48,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(8px)'
            }}>
              <Leaf style={{ width: 28, height: 28, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                Eco Thesis
              </Typography>
              <Typography variant="body2" sx={{ color: '#C8E6C9', fontSize: '14px' }}>
                Environmental Science Management System
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Features Section */}
        <Box sx={{ position: 'relative', zIndex: 10, mt: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{
                width: 40,
                height: 40,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(8px)'
              }}>
                <span style={{ fontSize: '20px' }}>🌱</span>
              </Box>
              <Box>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 500 }}>
                  Collaborative Research
                </Typography>
                <Typography variant="body2" sx={{ color: '#A5D6A7', fontSize: '14px' }}>
                  Work together on environmental studies
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{
                width: 40,
                height: 40,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(8px)'
              }}>
                <span style={{ fontSize: '20px' }}>🌍</span>
              </Box>
              <Box>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 500 }}>
                  Document Management
                </Typography>
                <Typography variant="body2" sx={{ color: '#A5D6A7', fontSize: '14px' }}>
                  Integrated with Google Workspace
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{
                width: 40,
                height: 40,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(8px)'
              }}>
                <span style={{ fontSize: '20px' }}>💧</span>
              </Box>
              <Box>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 500 }}>
                  Defense Scheduling
                </Typography>
                <Typography variant="body2" sx={{ color: '#A5D6A7', fontSize: '14px' }}>
                  Smart conflict detection system
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{ position: 'relative', zIndex: 10 }}>
          <Typography variant="body2" sx={{ color: '#C8E6C9', fontSize: '14px' }}>
            © 2025 Environmental Science Department
          </Typography>
        </Box>
      </Grid>

      {/* Right Side - Login Form */}
      <Grid 
        item 
        xs={12} 
        md={6}
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
          backgroundColor: '#F8FAF9'
        }}
      >
        <Paper
          elevation={8}
          sx={{
            width: '100%',
            maxWidth: 480,
            p: 6,
            borderRadius: 4,
            border: 'none',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Box sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              backgroundColor: '#E8F5E9',
              borderRadius: 4,
              mb: 3
            }}>
              <Leaf style={{ width: 32, height: 32, color: '#2E7D32' }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#1A202C', mb: 2 }}>
              Welcome Back
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748B' }}>
              Sign in to access your thesis workspace
            </Typography>
          </Box>

          {/* Form */}
          <Box component="form" onSubmit={handle} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              placeholder="Enter your email address"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Mail style={{ width: 20, height: 20, color: '#94A3B8' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: '#4CAF50',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#4CAF50',
                    borderWidth: 2,
                  },
                },
              }}
              required
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              placeholder="Enter your password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock style={{ width: 20, height: 20, color: '#94A3B8' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: '#4CAF50',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#4CAF50',
                    borderWidth: 2,
                  },
                },
              }}
              required
            />

            {error && (
              <Typography color="error" sx={{ textAlign: 'center', fontSize: '14px' }}>
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                py: 3,
                backgroundColor: '#2E7D32',
                '&:hover': {
                  backgroundColor: '#1B5E20',
                },
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '16px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2
              }}
            >
              Sign In to Eco Thesis
              <ArrowRight style={{ width: 16, height: 16 }} />
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button
                sx={{
                  color: '#2E7D32',
                  textTransform: 'none',
                  fontSize: '14px',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    textDecoration: 'underline'
                  }
                }}
              >
                Forgot your password?
              </Button>
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Box>
  )
}
