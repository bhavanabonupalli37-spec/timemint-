import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/layout/Layout';
import Landing from './pages/Landing';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import TimetableTable from './pages/Timetable/TimetableTable';
import AddActivity from './pages/Timetable/AddActivity';
import Onboarding from './pages/Auth/Onboarding';
import AIAssistant from './pages/AI/Assistant';
import FocusTimer from './pages/Focus/FocusTimer';
import Settings from './pages/Settings/Settings';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Navigate to="/login" replace />} />
            <Route path="/forgot-password" element={<Navigate to="/login" replace />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/dashboard" element={<TimetableTable />} />
                <Route path="/stats" element={<Dashboard />} />
                <Route path="/timetable" element={<TimetableTable />} />
                <Route path="/add-activity" element={<AddActivity />} />
                <Route path="/ai-assistant" element={<AIAssistant />} />
                <Route path="/focus" element={<FocusTimer />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
