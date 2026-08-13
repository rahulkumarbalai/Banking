import React, { useEffect, useState } from 'react';
import { api } from '../services/store';
import type { GlobalState, Transaction, User } from '../services/types';
import { Link } from 'react-router-dom';
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  List, 
  ListItem, 
  ListItemAvatar, 
  Avatar, 
  ListItemText, 
  Button,
  Divider
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import GroupIcon from '@mui/icons-material/Group';
import SettingsIcon from '@mui/icons-material/Settings';

export const Dashboard: React.FC = () => {
  const [globalState, setGlobalState] = useState<GlobalState>({ totalLendingPool: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchData = () => {
      setGlobalState(api.getGlobalState());
      setTransactions(api.getTransactions().slice(0, 5));
      setUsers(api.getUsers());
    };
    fetchData();
    const interval = setInterval(fetchData, 2000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={3}>
        
        {/* Total Lending Pool */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Lending Pool
              </Typography>
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                ₹{globalState.totalLendingPool.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="body2" sx={{ mt: 2, opacity: 0.8 }}>
                Total funds available for lending across all members.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Grid container spacing={2} sx={{ height: '100%' }}>
            <Grid size={{ xs: 6, md: 12 }}>
              <Card sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                <CardContent sx={{ flex: 1, textAlign: 'center' }}>
                  <Button component={Link} to="/users" variant="text" size="large" fullWidth sx={{ py: 2, flexDirection: 'column' }}>
                    <GroupIcon sx={{ fontSize: 40, mb: 1 }} color="primary" />
                    <Typography>Members</Typography>
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, md: 12 }}>
              <Card sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                <CardContent sx={{ flex: 1, textAlign: 'center' }}>
                  <Button component={Link} to="/settings" variant="text" size="large" fullWidth color="secondary" sx={{ py: 2, flexDirection: 'column' }}>
                    <SettingsIcon sx={{ fontSize: 40, mb: 1 }} />
                    <Typography>Settings</Typography>
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Top Members */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Top Members</Typography>
                <Button component={Link} to="/users" size="small">View All</Button>
              </Box>
              <List>
                {users.slice(0, 4).map((user) => (
                  <ListItem key={user.id} component={Link} to={`/users/${user.id}`} sx={{ textDecoration: 'none', color: 'inherit' }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.light' }}>{user.name.charAt(0)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={user.name} secondary={`Shares: ₹${user.totalDeposited.toLocaleString()}`} />
                  </ListItem>
                ))}
                {users.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                    No members yet.
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Transactions */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent Activity</Typography>
              <List>
                {transactions.map((t, index) => (
                  <React.Fragment key={t.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: t.type === 'borrow' ? 'error.light' : 'success.light' }}>
                          {t.type === 'borrow' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={<Typography sx={{ textTransform: 'capitalize' }}>{t.type}</Typography>} 
                        secondary={new Date(t.date).toLocaleDateString()} 
                      />
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }} color={t.type === 'borrow' ? 'error.main' : 'success.main'}>
                        {t.type === 'borrow' ? '-' : '+'}₹{t.amount.toLocaleString()}
                      </Typography>
                    </ListItem>
                    {index < transactions.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
                {transactions.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                    No recent activity.
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
};
