@echo off
cd frontend
set VITE_API_BASE_URL=http://localhost:8001/api
npm run dev -- --host 0.0.0.0 --port 8080