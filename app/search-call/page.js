import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { Typography } from "@mui/material";
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import StarIcon from '@mui/icons-material/Star';

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
      flexDirection="column"
      minHeight="100vh"
    >
      {/* Form Header and Search Field */}
      <div>
        <Typography variant="h2">Start a Conversation</Typography>
        <Typography variant="h4">
          Select and add an individual you'd like to chat with
        </Typography>
        <TextField id="outlined-search" label="Search User" type="search" />
      </div>

      {/* Avatar List */}
      <div>
        <List
          sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}
          aria-label="contacts"
        >
          <ListItem disablePadding>
            <ListItemButton>
              <ListItemIcon>
                <StarIcon />
              </ListItemIcon>
              <ListItemText primary="Chelsea Otakan" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton>
              <ListItemText inset primary="Eric Hoffman" />
            </ListItemButton>
          </ListItem>
        </List>
      </div>
    </Box>
  );
}


