# Install production dependencies
npm install @emotion/react @emotion/styled @mui/material @mui/icons-material @mui/x-date-pickers @fullcalendar/react @fullcalendar/daygrid axios react react-dom react-router-dom

# Install development dependencies
npm install -D typescript @types/react @types/react-dom @vitejs/plugin-react @types/node

# Create tsconfig.json if it doesn't exist
if (-not (Test-Path "tsconfig.json")) {
    npx tsc --init --jsx react-jsx --esModuleInterop true --target es2020 --module esnext --moduleResolution node --strict true
}
