import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  BottomNavigation,
  BottomNavigationAction,
  useMediaQuery,
  useTheme,
  IconButton
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SettingsIcon from '@mui/icons-material/Settings';
import MenuIcon from '@mui/icons-material/Menu';

const drawerWidth = 240;

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
    { label: 'Members', path: '/users', icon: <PeopleIcon /> },
    { label: 'Add Member', path: '/add-user', icon: <PersonAddIcon /> },
    { label: 'Settings', path: '/settings', icon: <SettingsIcon /> },
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" color="primary" sx={{ fontWeight: 'bold' }}>
          NEON BANK
        </Typography>
      </Toolbar>
      <List>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton 
              selected={location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      <div className="animated-bg">
        <ul className="particles">
            <li></li>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
        </ul>
      </div>
      
      {/* App Bar (Mobile & Desktop) */}
      <AppBar 
        position="fixed" 
        sx={{ 
          width: { md: `calc(100% - ${drawerWidth}px)` }, 
          ml: { md: `${drawerWidth}px` } 
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon>menu</MenuIcon>
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {navItems.find(item => location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)))?.label || 'Banking'}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, 
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid #e0e0e0' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { md: `calc(100% - ${drawerWidth}px)` },
          pb: { xs: 10, md: 3 }, // padding for bottom nav on mobile
          pt: { xs: 10, md: 10 }, // padding for appbar
          zIndex: 1
        }}
      >
        <Outlet />
      </Box>

      {/* Bottom Navigation for Mobile */}
      {isMobile && (
        <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000, borderTop: '1px solid #e0e0e0' }}>
          <BottomNavigation
            showLabels
            value={location.pathname === '/' ? 0 : location.pathname.startsWith('/users') ? 1 : location.pathname === '/add-user' ? 2 : 3}
            onChange={(_, newValue) => {
              navigate(navItems[newValue].path);
            }}
          >
            <BottomNavigationAction label="Home" icon={<DashboardIcon />} />
            <BottomNavigationAction label="Members" icon={<PeopleIcon />} />
            <BottomNavigationAction label="Add" icon={<PersonAddIcon />} />
            <BottomNavigationAction label="Settings" icon={<SettingsIcon />} />
          </BottomNavigation>
        </Box>
      )}
    </Box>
  );
};
