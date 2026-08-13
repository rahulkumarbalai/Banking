
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { UsersList } from './pages/UsersList';
import { AddUser } from './pages/AddUser';
import { UserDetails } from './pages/UserDetails';
import { Settings } from './pages/Settings';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<UsersList />} />
            <Route path="add-user" element={<AddUser />} />
            <Route path="users/:id" element={<UserDetails />} />
            <Route path="settings" element={<Settings />} /> 
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
