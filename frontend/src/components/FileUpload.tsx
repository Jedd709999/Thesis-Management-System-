import React from 'react'
import Button from '@mui/material/Button'
export default function FileUpload({ onChange }:{ onChange:(f:File)=>void }){
  return <label><input type="file" style={{ display:'none' }} onChange={(e)=>{ const f = e.target.files && e.target.files[0]; if (f) onChange(f) }} /><Button variant="contained" component='span'>Upload</Button></label>
}
