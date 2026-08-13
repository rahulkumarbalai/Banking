import React, { useEffect, useState } from 'react';
import { Typography, Box, List, ListItem, ListItemText, ListItemAvatar, Avatar, Chip, IconButton, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/store';
import type { User } from '../services/types';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // get users (already sorted by totalDeposited descending in api)
    setUsers(api.getUsers());
  }, []);

  return (
    <Box sx={{ pb: 2, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>Members Directory</Typography>
      
      <Card>
        <CardContent sx={{ p: 0 }}>
          <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
            {users.map((user, index) => (
              <ListItem 
                key={user.id} 
                divider={index !== users.length - 1}
                sx={{ py: 2, cursor: 'pointer', transition: 'background-color 0.2s', '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' } }}
                onClick={() => navigate(`/users/${user.id}`)}
                secondaryAction={
                  <IconButton edge="end" aria-label="details">
                    <ChevronRightIcon />
                  </IconButton>
                }
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: index === 0 ? 'primary.main' : 'grey.300', color: index === 0 ? 'white' : 'text.primary', fontWeight: 'bold' }}>
                    {index + 1}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={<Typography variant="h6" sx={{ fontWeight: 'bold' }} color="text.primary">{user.name}</Typography>} 
                  secondary={
                    <Typography component="span" variant="body2" color="text.secondary">
                      Deposits: ₹{user.totalDeposited.toLocaleString()}
                    </Typography>
                  } 
                />
                {user.totalLent > 0 && (
                  <Chip label={`Owes: ₹${user.totalLent}`} color="error" size="small" sx={{ mr: 2 }} />
                )}
              </ListItem>
            ))}
            {users.length === 0 && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No members found. Go to Add Member to create one.
                </Typography>
              </Box>
            )}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};
