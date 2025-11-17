import { createTheme } from '@mui/material/styles'

// Eco-inspired color palette with sustainable design elements
const ecoTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2E7D32', // Deep forest green
      light: '#4CAF50', // Light green
      dark: '#1B5E20', // Dark green
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#8D6E63', // Earth brown
      light: '#A1887F', // Light brown
      dark: '#5D4037', // Dark brown
      contrastText: '#ffffff',
    },
    success: {
      main: '#66BB6A', // Fresh green
      light: '#81C784',
      dark: '#4CAF50',
    },
    info: {
      main: '#26A69A', // Teal green
      light: '#4DB6AC',
      dark: '#00897B',
    },
    warning: {
      main: '#FFB74D', // Warm orange
      light: '#FFCC80',
      dark: '#FFA726',
    },
    error: {
      main: '#E57373', // Soft red
      light: '#EF9A9A',
      dark: '#EF5350',
    },
    background: {
      default: '#F1F8E9', // Very light green
      paper: '#FFFFFF',
    },
    text: {
      primary: '#263238', // Dark blue-gray
      secondary: '#546E7A', // Medium blue-gray
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
      color: '#1B5E20',
    },
    h2: {
      fontWeight: 600,
      color: '#2E7D32',
    },
    h3: {
      fontWeight: 600,
      color: '#388E3C',
    },
    h4: {
      fontWeight: 500,
      color: '#43A047',
    },
    h5: {
      fontWeight: 500,
      color: '#4CAF50',
    },
    h6: {
      fontWeight: 500,
      color: '#66BB6A',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 500,
          padding: '8px 16px',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #66BB6A 0%, #388E3C 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
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
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
        elevation2: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
        elevation3: {
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#4CAF50',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#2E7D32',
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
  },
})

export default ecoTheme
