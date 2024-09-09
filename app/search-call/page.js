'use client';
import * as React from 'react';
import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { Typography } from '@mui/material';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import StarIcon from '@mui/icons-material/Star';

export default function FormPropsTextFields() {
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch user list from your Next.js API route
    async function fetchUsers() {
      try {
        const response = await fetch('/api/fetch-users');
        if (!response.ok) throw new Error('Failed to fetch users');
        const users = await response.json();
        setUserList(users);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  return (
    <Box
      component="form"
      sx={{ '& .MuiTextField-root': { m: 1, width: '35ch' } }}
      noValidate
      autoComplete="off"
      display="flex"
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
      minHeight="100vh"
    >
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Typography variant="h2">Start a Conversation</Typography>
        <Typography variant="h4">
          Select and add an individual you'd like to chat with
        </Typography>
        <TextField
          id="outlined-search"
          label="Search User"
          type="search"
          sx={{ width: '25ch', mt: 2 }}
        />
      </Box>

      {loading && <Typography variant="h6">Loading users...</Typography>}
      {error && <Typography variant="h6" color="error">Error loading users: {error.message}</Typography>}

      <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }} aria-label="contacts">
        {userList.map((user) => (
          <ListItem key={user.id} sx={{ border: '1px solid #ddd', borderRadius: '4px', mb: 1 }}>
            <ListItemButton>
              <ListItemIcon>
                <StarIcon />
              </ListItemIcon>
              <ListItemText primary={`${user.firstName} ${user.lastName}`} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
