import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { Typography } from "@mui/material";
import Avatar from '@mui/joy/Avatar';
import List from '@mui/joy/List';
import ListDivider from '@mui/joy/ListDivider';
import ListItem from '@mui/joy/ListItem';
import ListItemDecorator from '@mui/joy/ListItemDecorator';

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
        {['Users'].map((inset) => (
          <div key={inset}>
            <Typography level="body-xs" sx={{ mb: 2 }}>
              <code>{`placement="${inset}"`}</code>
            </Typography>
            <List variant="outlined" sx={{ minWidth: 240, borderRadius: 'sm' }}>
              <ListItem>
                <ListItemDecorator>
                  <Avatar size="sm" src="https://via.placeholder.com/150" />
                </ListItemDecorator>
                Mabel Boyle
              </ListItem>
              <ListItem>
                <ListItemDecorator>
                  <Avatar size="sm" src="https://via.placeholder.com/150" />
                </ListItemDecorator>
                Boyd Burt
              </ListItem>
            </List>
          </div>
        ))}
      </div>
    </Box>
  );
}

