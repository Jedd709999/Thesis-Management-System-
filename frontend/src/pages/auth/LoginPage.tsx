import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Box, Avatar, Typography, TextField, Button } from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { login, saveTokens, fetchProfile } from '../../api/authService'
import { AuthContext } from '../../context/AuthContext'

export default function LoginPage(){
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [error,setError]=useState('')
  const navigate = useNavigate()
  const { setUser } = useContext(AuthContext)
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
    <Container maxWidth="xs">
      <Box sx={{ mt:8, display:'flex', flexDirection:'column', alignItems:'center' }}>
        <Avatar sx={{ m:1, bgcolor:'secondary.main' }}><LockOutlinedIcon/></Avatar>
        <Typography component="h1" variant="h5">Sign in</Typography>
        <Box component="form" onSubmit={handle} sx={{ mt:1 }}>
          <TextField margin="normal" required fullWidth label="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <TextField margin="normal" required fullWidth label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          {error && <Typography color="error">{error}</Typography>}
          <Button type="submit" fullWidth variant="contained" sx={{ mt:2 }}>Sign In</Button>
        </Box>
      </Box>
    </Container>
  )
}
