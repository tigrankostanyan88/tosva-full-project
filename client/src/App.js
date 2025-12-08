import './App.css';
import { Routes, Route, Navigate , useLocation } from "react-router-dom";
import Home from './Components/Home';
import Footer from './Components/Footer';
import Assets from './Components/Assets';
import Settings from './Components/Settings';
import Trade from './Components/Trade';
import Signin from './Components/Signin';
import Signup from './Components/Signup';


function PrivateRoute({ children }) {
  const user = localStorage.getItem("user");
  return user ? children : <Navigate to="/Signin" replace />;
}

function App() {
  const user = localStorage.getItem("user");  
  const location = useLocation();

  // էջեր որտեղ footer / navbar չպետք է երևա
  const hideForAuthPages = ["/Signin", "/Signup"];

  return (
    <>
      <Routes>
        <Route path="/Signin" element={<Signin />} />
        <Route path="/Signup" element={<Signup />} />

        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/trade" 
          element={
            <PrivateRoute>
              <Trade />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/assets" 
          element={
            <PrivateRoute>
              <Assets />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          } 
        />
      </Routes>
      {/* footer կամ navbar ՌԵՆԴԵՐԻՆԳ */}
      {user && !hideForAuthPages.includes(location.pathname) && (
        <Footer />
      )}
      
    </>
  );
}

export default App;
