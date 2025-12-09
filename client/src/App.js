import './App.css';
import { Routes, Route, Navigate , useLocation } from "react-router-dom";
import { useEffect, useState } from 'react';
import axios from 'axios';
import Home from './Components/Home';
import Footer from './Components/Footer';
import Assets from './Components/Assets';
import Settings from './Components/Settings';
import Trade from './Components/Trade';
import Signin from './Components/Signin';
import Signup from './Components/Signup';
import AdminDeposits from './Components/AdminDeposits';
import AdminReferrals from './Components/AdminReferrals';
import { NotifyProvider } from './Components/Notify';


function PrivateRoute({ children, isAuthed, authChecked }) {
  if (!authChecked) return null;
  return isAuthed ? children : <Navigate to="/Signin" replace />;
}

function App() {
  axios.defaults.baseURL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:3400`;
  axios.defaults.withCredentials = true;
  const [isAuthed, setIsAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const location = useLocation();

  useEffect(() => {
    (async () => {
      try {
        await axios.get('/api/v1/users/profile');
        setIsAuthed(true);
      } catch {
        setIsAuthed(false);
      } finally {
        setAuthChecked(true);
      }
    })();
  }, []);

  useEffect(() => {
    const refresh = async () => {
      setAuthChecked(false);
      try {
        await axios.get('/api/v1/users/profile');
        setIsAuthed(true);
      } catch {
        setIsAuthed(false);
      } finally {
        setAuthChecked(true);
      }
    };
    const handler = () => refresh();
    window.addEventListener('auth:refresh', handler);
    return () => window.removeEventListener('auth:refresh', handler);
  }, []);

  // էջեր որտեղ footer / navbar չպետք է երևա
  const hideForAuthPages = ["/Signin", "/Signup"];

  if (!authChecked) return null;

  return (
    <NotifyProvider>
      <Routes>
        <Route path="/Signin" element={isAuthed ? <Navigate to="/" replace /> : <Signin />} />
        <Route path="/Signup" element={isAuthed ? <Navigate to="/" replace /> : <Signup />} />

        <Route 
          path="/" 
          element={
            <PrivateRoute isAuthed={isAuthed} authChecked={authChecked}>
              <Home />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/trade" 
          element={
            <PrivateRoute isAuthed={isAuthed} authChecked={authChecked}>
              <Trade />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/assets" 
          element={
            <PrivateRoute isAuthed={isAuthed} authChecked={authChecked}>
              <Assets />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <PrivateRoute isAuthed={isAuthed} authChecked={authChecked}>
              <Settings />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/admin/deposits" 
          element={
            <PrivateRoute isAuthed={isAuthed} authChecked={authChecked}>
              <AdminDeposits />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/admin/referrals" 
          element={
            <PrivateRoute isAuthed={isAuthed} authChecked={authChecked}>
              <AdminReferrals />
            </PrivateRoute>
          } 
        />
      </Routes>
      {/* footer կամ navbar ՌԵՆԴԵՐԻՆԳ */}
      {isAuthed && !hideForAuthPages.includes(location.pathname) && (
        <Footer />
      )}
      
    </NotifyProvider>
  );
}

export default App;
