import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import {Typography, IconButton, Button } from "@mui/material";

export default function FormPropsTextFields() {
  return (
    <Box
      component="form"
      sx={{ '& .MuiTextField-root': { m: 1, width: '25ch' } }}
      noValidate
      autoComplete="off"

      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      >


      <div>
      
      
      <Typography variant="h2">Start a Converstation</Typography>
      <Typography variant="h4">Select add an individual you'd like to chat with</Typography>

      <TextField id="outlined-search" 
      label="Search User" 
      type="search" />
    </div>
    </Box>
    
);
}