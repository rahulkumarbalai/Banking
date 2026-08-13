import React, { useState } from 'react';
import { Typography, Box, TextField, Button, Snackbar, Alert, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/store';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

export const AddUser: React.FC = () => {
  const [name, setName] = useState('');
  const [monthlyShare, setMonthlyShare] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !monthlyShare) {
      setError('Please fill in all fields');
      return;
    }
    const shareAmount = parseFloat(monthlyShare);
    if (isNaN(shareAmount) || shareAmount <= 0) {
      setError('Please enter a valid monthly share amount');
      return;
    }

    try {
      api.addUser(name, shareAmount);
      setSuccess(true);
      setTimeout(() => navigate('/users'), 1500);
    } catch (err) {
      setError((err as Error).message || 'Failed to add user');
    }
  };

  return (
    <Box sx={{ maxWidth: 500, margin: '0 auto', pb: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, textAlign: 'center', fontWeight: 'bold' }}>Add New Member</Typography>
      
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Full Name"
              variant="outlined"
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ mb: 3 }}
            />
            
            <TextField
              fullWidth
              label="Monthly Share Amount (₹)"
              variant="outlined"
              type="number"
              value={monthlyShare}
              onChange={(e) => setMonthlyShare(e.target.value)}
              sx={{ mb: 4 }}
            />
            
            <Button 
              fullWidth 
              type="submit" 
              variant="contained" 
              color="primary" 
              size="large"
              startIcon={<PersonAddIcon />}
            >
              Add Member
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
      </Snackbar>

      <Snackbar open={success} autoHideDuration={4000} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success">Member added successfully!</Alert>
      </Snackbar>
    </Box>
  );
};
