import { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppNavigator from './AppNavigator';
import './App.css';

function App() {
  const [loggedInUserEmail, setLoggedInUserEmail] = useState<string | null>(null);
  const [loggedInUserFullName, setLoggedInUserFullName] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const savedEmail = localStorage.getItem('userEmail');
    const savedFullName = localStorage.getItem('fullName');

    if (token && savedEmail && savedFullName) {
      setLoggedInUserEmail(savedEmail);
      setLoggedInUserFullName(savedFullName);
    } else {
      setLoggedInUserEmail(null);
      setLoggedInUserFullName(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('fullName');
    }
    setIsLoadingUser(false);
  }, []);

  const handleSetLoggedInUser = (email: string | null, fullName: string | null) => {
    setLoggedInUserEmail(email);
    setLoggedInUserFullName(fullName);
  };

  return (
    <Router>
      <AppNavigator
        loggedInUserEmail={loggedInUserEmail}
        loggedInUserFullName={loggedInUserFullName}
        setLoggedInUserEmail={handleSetLoggedInUser}
        isLoadingUser={isLoadingUser}
      />
    </Router>
  );
}

export default App;