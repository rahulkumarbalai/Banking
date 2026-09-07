
import { useState, useMemo, createContext, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import { getTheme } from './theme';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { UsersList } from './pages/UsersList';
import { AddUser } from './pages/AddUser';
import { UserDetails } from './pages/UserDetails';
import { Settings } from './pages/Settings';
import { Transactions } from './pages/Transactions';
import { Agentation } from 'agentation';

export const ColorModeContext = createContext({ toggleColorMode: () => {} });

function App() {
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  
  useEffect(() => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [mode]);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    [],
  );

  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<UsersList />} />
              <Route path="add-user" element={<AddUser />} />
              <Route path="users/:id" element={<UserDetails />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="settings" element={<Settings />} /> 
            </Route>
          </Routes>
        </BrowserRouter>
        {import.meta.env.DEV && <Agentation />}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
