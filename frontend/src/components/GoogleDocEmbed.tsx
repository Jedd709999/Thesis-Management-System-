import React from 'react'
import Box from '@mui/material/Box'
export default function GoogleDocEmbed({ url, height=600 }:{ url?:string|null, height?:number }){
  if (!url) return <Box sx={{ p:2 }}>No document to display</Box>
  return <Box sx={{ border:'1px solid #ddd', borderRadius:1 }}><iframe title="gdoc" src={url} style={{ width:'100%', height }} /></Box>
}
