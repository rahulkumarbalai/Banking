import React, { useEffect, useState, useCallback } from 'react';
import { Typography, Box, Button, Card, CardContent, Divider, Dialog, DialogTitle, DialogContent, DialogActions, TextField, List, ListItem, ListItemText, Grid, Avatar } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/store';
import type { User, Transaction } from '../services/types';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PaymentIcon from '@mui/icons-material/Payment';
import MoneyIcon from '@mui/icons-material/Money';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';

export const UserDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Modals state
  const [openShare, setOpenShare] = useState(false);
  const [openBorrow, setOpenBorrow] = useState(false);
  const [openRepay, setOpenRepay] = useState(false);
  
  const [amount, setAmount] = useState('');

  const loadData = useCallback(() => {
    if (id) {
      const u = api.getUser(id);
      if (u) {
        setUser(u);
        setTransactions(api.getTransactions(id));
      } else {
        navigate('/users');
      }
    }
  }, [id, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!user) return null;

  const handleDepositShare = () => {
    api.depositShare(user.id, user.monthlyShareAmount);
    setOpenShare(false);
    loadData();
  };

  const handleBorrow = () => {
    const val = parseFloat(amount);
    if (val > 0) {
      try {
        api.borrowMoney(user.id, val);
        setOpenBorrow(false);
        setAmount('');
        loadData();
      } catch (e) {
        alert((e as Error).message);
      }
    }
  };

  const handleRepay = () => {
    const principal = parseFloat(amount);
    if (principal > 0 && principal <= user.totalLent) {
      try {
        const interest = principal * 0.03; 
        
        api.repayLoan(user.id, principal, interest);
        setOpenRepay(false);
        setAmount('');
        loadData();
      } catch (e) {
        alert((e as Error).message);
      }
    } else {
      alert("Invalid principal amount");
    }
  };

  return (
    <Box sx={{ pb: 4, maxWidth: 1000, mx: 'auto' }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/users')} sx={{ mb: 2 }}>Back to Members</Button>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
        <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem' }}>{user.name.charAt(0)}</Avatar>
        <Box>
          <Typography variant="h3" fontWeight="bold">{user.name}</Typography>
          <Typography variant="subtitle1" color="text.secondary">Monthly Share Commitment: ₹{user.monthlyShareAmount}</Typography>
        </Box>
      </Box>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <Card sx={{ height: '100%', bgcolor: 'primary.50' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Total Deposited Shares</Typography>
              <Typography variant="h4" color="primary.main" fontWeight="bold">₹{user.totalDeposited.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card sx={{ height: '100%', bgcolor: 'error.50' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Total Borrowed (Active Loan)</Typography>
              <Typography variant="h4" color="error.main" fontWeight="bold">₹{user.totalLent.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Quick Actions</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Button fullWidth variant="contained" size="large" onClick={() => setOpenShare(true)} startIcon={<PaymentIcon />}>Pay Share</Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button fullWidth variant="outlined" color="secondary" size="large" onClick={() => setOpenBorrow(true)} startIcon={<RequestQuoteIcon />}>Borrow</Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button fullWidth variant="outlined" disabled={user.totalLent <= 0} onClick={() => setOpenRepay(true)} startIcon={<MoneyIcon />}>Repay Loan</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Typography variant="h5" sx={{ mb: 2 }} fontWeight="bold">Transaction History</Typography>
      <Card>
        <List sx={{ p: 0 }}>
          {transactions.map((t, index) => (
            <ListItem key={t.id} divider={index !== transactions.length - 1} sx={{ py: 2 }}>
              <ListItemText 
                primary={
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
                    {t.type}
                  </Typography>
                } 
                secondary={new Date(t.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} 
              />
              <Typography variant="h6" fontWeight="bold" color={t.type === 'borrow' ? 'error.main' : 'primary.main'}>
                {t.type === 'borrow' ? '-' : '+'}₹{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Typography>
            </ListItem>
          ))}
          {transactions.length === 0 && <ListItem><ListItemText primary="No transactions yet" /></ListItem>}
        </List>
      </Card>

      {/* Modals */}
      <Dialog open={openShare} onClose={() => setOpenShare(false)} fullWidth maxWidth="xs">
        <DialogTitle>Pay Monthly Share</DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 1 }}>Deposit your standard <strong>₹{user.monthlyShareAmount}</strong> share for this month?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenShare(false)}>Cancel</Button>
          <Button onClick={handleDepositShare} variant="contained">Confirm Deposit</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openBorrow} onClose={() => setOpenBorrow(false)} fullWidth maxWidth="xs">
        <DialogTitle>Borrow Funds</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Amount to Borrow (₹)" type="number" fullWidth variant="outlined" value={amount} onChange={e => setAmount(e.target.value)} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenBorrow(false)}>Cancel</Button>
          <Button onClick={handleBorrow} variant="contained" color="secondary">Borrow</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openRepay} onClose={() => setOpenRepay(false)} fullWidth maxWidth="xs">
        <DialogTitle>Repay Loan</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
            Repaying incurs a 3% interest charge on the principal amount you pay today.
          </Typography>
          <TextField autoFocus margin="dense" label="Principal Amount to Repay (₹)" type="number" fullWidth variant="outlined" value={amount} onChange={e => setAmount(e.target.value)} />
          {amount && parseFloat(amount) > 0 && (
            <Typography variant="subtitle2" color="error" sx={{ mt: 2 }}>
              + ₹{ (parseFloat(amount) * 0.03).toFixed(2) } Interest (3%)
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenRepay(false)}>Cancel</Button>
          <Button onClick={handleRepay} variant="contained">Repay with Interest</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
