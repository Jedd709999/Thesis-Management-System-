import { createTheme } from '@mui/material/styles'

// ENVISys Design System Theme
const envisysTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#15803d', // Primary Green (green-700)
      light: '#86efac', // Light Green (green-300)
      dark: '#14532d', // Dark Green (green-900)
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#2563eb', // Blue (blue-600) for Adviser badges
      light: '#dbeafe', // Blue-100
      dark: '#1e40af', // Blue-800
      contrastText: '#ffffff',
    },
    success: {
      main: '#15803d', // Primary Green for success states
      light: '#dcfce7', // Green-50
      dark: '#166534', // Green-800
      contrastText: '#ffffff',
    },
    info: {
      main: '#2563eb', // Blue-600
      light: '#dbeafe',
      dark: '#1e40af',
    },
    warning: {
      main: '#d97706', // Amber-600
      light: '#fef3c7', // Amber-50
      dark: '#92400e', // Amber-800
    },
    error: {
      main: '#dc2626', // Red-600
      light: '#fee2e2', // Red-50
      dark: '#991b1b', // Red-800
    },
    background: {
      default: '#f8fafc', // Page Background (slate-50)
      paper: '#ffffff', // Card/Paper (white)
    },
    text: {
      primary: '#0f172a', // Primary Text (slate-900)
      secondary: '#475569', // Secondary Text (slate-600)
      disabled: '#64748b', // Muted Text (slate-500)
    },
    divider: '#e2e8f0', // Default Border (slate-200)
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontSize: '30px', // text-3xl
      fontWeight: 600, // semibold
      lineHeight: '36px',
      color: '#0f172a',
    },
    h2: {
      fontSize: '18px', // text-lg
      fontWeight: 600, // semibold
      lineHeight: '28px',
      color: '#0f172a',
    },
    h3: {
      fontSize: '16px', // text-base
      fontWeight: 600, // semibold
      lineHeight: '24px',
      color: '#0f172a',
    },
    h4: {
      fontSize: '14px', // text-sm
      fontWeight: 600, // semibold
      lineHeight: '20px',
      color: '#0f172a',
    },
    body1: {
      fontSize: '14px', // text-sm
      fontWeight: 400, // normal
      lineHeight: '20px',
      color: '#475569',
    },
    body2: {
      fontSize: '12px', // text-xs
      fontWeight: 400, // normal
      lineHeight: '16px',
      color: '#64748b',
    },
    button: {
      fontSize: '14px',
      fontWeight: 500,
      textTransform: 'none',
    },
    caption: {
      fontSize: '12px',
      fontWeight: 400,
      lineHeight: '16px',
      color: '#64748b',
    },
  },
  spacing: 8, // Base spacing unit
  shape: {
    borderRadius: 8, // Default border radius
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          fontWeight: 500,
          fontSize: '14px',
          textTransform: 'none',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          transition: 'all 150ms ease',
        },
        contained: {
          backgroundColor: '#15803d',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#166534',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
          },
        },
        outlined: {
          backgroundColor: 'transparent',
          border: '1px solid #e2e8f0',
          color: '#475569',
          '&:hover': {
            backgroundColor: '#f8fafc',
            borderColor: '#cbd5e1',
          },
        },
        text: {
          backgroundColor: 'transparent',
          color: '#475569',
          '&:hover': {
            backgroundColor: '#f8fafc',
          },
        },
        sizeLarge: {
          padding: '12px 24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          border: 'none',
          borderRadius: 8,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          padding: '24px',
          transition: 'all 150ms ease',
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 0,
          '&:last-child': {
            paddingBottom: 0,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          height: '64px',
          boxShadow: 'none',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '64px',
          paddingLeft: '24px',
          paddingRight: '24px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#ffffff',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#cbd5e1',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#15803d',
              borderWidth: '2px',
            },
          },
          '& .MuiOutlinedInput-input': {
            padding: '12px 16px',
            fontSize: '14px',
            color: '#0f172a',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontSize: '12px',
          fontWeight: 500,
          padding: '2px 8px',
          border: '1px solid',
        },
        colorPrimary: {
          backgroundColor: '#dcfce7',
          color: '#166534',
          borderColor: '#bbf7d0',
        },
        colorSecondary: {
          backgroundColor: '#dbeafe',
          color: '#1e40af',
          borderColor: '#bfdbfe',
        },
        colorError: {
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          borderColor: '#fecaca',
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        root: {
          '& .MuiBadge-badge': {
            fontSize: '12px',
            fontWeight: 500,
            height: '20px',
            minWidth: '20px',
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontSize: '14px',
          fontWeight: 500,
        },
        circular: {
          borderRadius: '50%',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px',
          transition: 'all 150ms ease',
          '&:hover': {
            backgroundColor: '#f8fafc',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        },
        elevation2: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        },
        elevation3: {
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          border: '1px solid #e2e8f0',
          borderRadius: 8,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#f8fafc',
          '& .MuiTableCell-head': {
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#475569',
            padding: '16px 24px',
            borderBottom: '1px solid #e2e8f0',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
          borderBottom: '1px solid #e2e8f0',
          fontSize: '14px',
          color: '#0f172a',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#f8fafc',
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: '8px',
          borderRadius: '9999px',
          backgroundColor: '#e2e8f0',
        },
        bar: {
          backgroundColor: '#15803d',
          borderRadius: '9999px',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          '& .MuiTab-root': {
            textTransform: 'none',
            fontSize: '14px',
            fontWeight: 500,
            color: '#475569',
            padding: '12px 16px',
            minHeight: '48px',
            '&.Mui-selected': {
              color: '#15803d',
            },
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#15803d',
            height: '2px',
          },
        },
      },
    },
  },
})

export default envisysTheme
