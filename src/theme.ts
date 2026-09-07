import { createTheme, responsiveFontSizes } from '@mui/material/styles';

export const getTheme = (mode: 'light' | 'dark') => {
  const isDark = mode === 'dark';
  const baseTheme = createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#afc6ff' : '#2563eb', // Stitch primary vs light primary
      },
      secondary: {
        main: isDark ? '#4edea3' : '#10b981', // Stitch secondary vs light secondary
      },
      background: {
        default: 'transparent',
        paper: isDark ? 'rgba(39, 42, 50, 0.6)' : 'rgba(255, 255, 255, 0.7)', 
      },
      text: {
        primary: isDark ? '#e1e2ed' : '#0f172a',
        secondary: isDark ? '#c2c6d7' : '#475569',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h3: {
        fontWeight: 700,
        color: isDark ? '#e1e2ed' : '#0f172a',
      },
      h4: {
        fontWeight: 700,
        color: isDark ? '#e1e2ed' : '#0f172a',
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
      subtitle1: {
        color: isDark ? '#c2c6d7' : '#475569',
        fontWeight: 500,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      }
    },
    shape: {
      borderRadius: 20, 
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            padding: '10px 24px',
            borderRadius: '12px',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:active': {
              transform: 'scale(0.95)', 
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            background: isDark ? 'linear-gradient(135deg, rgba(39, 42, 50, 0.6) 0%, rgba(25, 27, 35, 0.4) 100%)' : 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(240, 244, 248, 0.4) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '@media (hover: hover) and (pointer: fine)': {
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.1)',
              }
            },
            '@media (hover: none)': {
              '&:active': {
                transform: 'scale(0.98)',
              }
            }
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? 'rgba(29, 31, 39, 0.75)' : 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            color: isDark ? '#e1e2ed' : '#0f172a',
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0px 1px 10px rgba(0,0,0,0.03)',
          }
        }
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            background: isDark ? 'rgba(39, 42, 50, 0.8)' : 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRight: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.4)',
          }
        }
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            background: isDark ? 'rgba(39, 42, 50, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.4)',
            height: '65px',
          }
        }
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            background: isDark ? 'rgba(39, 42, 50, 0.9)' : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.1)',
          }
        }
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.2s, transform 0.2s',
            borderRadius: '12px',
            margin: '4px 8px',
            width: 'calc(100% - 16px)',
            '@media (hover: none)': {
              '&:active': {
                transform: 'scale(0.98)',
              }
            }
          }
        }
      }
    },
  });

  return responsiveFontSizes(baseTheme);
};
