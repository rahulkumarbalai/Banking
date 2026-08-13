import React, { useState } from 'react';
import { Typography, Box, TextField, Button, Alert, Card, CardContent } from '@mui/material';
import { api } from '../services/store';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

export const Settings: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [success, setSuccess] = useState(false);

  const handleAddFunds = () => {
    const val = parseFloat(amount);
    if (val > 0) {
      api.updateLendingPool(val);
      setSuccess(true);
      setAmount('');
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <Box sx={{ maxWidth: 500, margin: '0 auto', pb: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, textAlign: 'center', fontWeight: 'bold' }}>Pool Settings</Typography>
      
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceIcon color="primary" /> Inject Capital
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Manually add external funds to the total lending pool. This is useful for initial setup or external investments.
          </Typography>

          <TextField
            fullWidth
            label="Amount to Add (₹)"
            variant="outlined"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            sx={{ mb: 3 }}
          />
          
          <Button 
            fullWidth 
            variant="contained" 
            size="large"
            onClick={handleAddFunds}
          >
            Add to Pool
          </Button>

          {success && <Alert severity="success" sx={{ mt: 3 }}>Funds added successfully!</Alert>}
        </CardContent>
      </Card>
    </Box>
  );
};
