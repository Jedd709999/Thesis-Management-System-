import React from 'react'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Navbar from '../components/Navbar'

export default function Dashboard(){
  return (
    <>
      <Navbar />
      <Container sx={{ mt:4 }}>
        <Typography variant="h4">Dashboard</Typography>
      </Container>
    </>
  )
}
