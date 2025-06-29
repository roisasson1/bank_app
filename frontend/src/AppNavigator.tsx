import React, { useEffect, useState, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import HomePage from './components/homepage/HomePage';
import DashboardPage from './components/dashboard_page/DashboardPage';

interface AppNavigatorProps {
  loggedInUserEmail: string | null;
  loggedInUserFullName: string | null;
  setLoggedInUserEmail: (email: string | null, fullName: string | null) => void;
  isLoadingUser: boolean;
}

const AppNavigator: React.FC<AppNavigatorProps> = ({ loggedInUserEmail, loggedInUserFullName, setLoggedInUserEmail, isLoadingUser }) => {
  const navigate = useNavigate();

  const [showPhoneValidationFlow, setShowPhoneValidationFlow] = useState(false);
  const [currentUserIdForValidation, setCurrentUserIdForValidation] = useState<string | null>(null);
  const [currentPhoneNumberForValidation, setCurrentPhoneNumberForValidation] = useState<string | null>(null);
  const [userEmailAfterSignUp, setUserEmailAfterSignUp] = useState<string | null>(null);
  const [userFullNameAfterSignUp, setUserFullNameAfterSignUp] = useState<string | null>(null);

  const handleUserLogin = useCallback((email: string, fullName: string) => {
    setLoggedInUserEmail(email, fullName);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('fullName', fullName);
  }, [setLoggedInUserEmail]);

  const handleUserLogout = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        try {
            await fetch(`/api/auth/logout`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            console.log('Successfully notified backend about logout.');
        } catch (error) {
            console.error('Error sending logout request to backend:', error);
        }
    }
    setLoggedInUserEmail(null, null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('fullName');
    navigate('/');

    setShowPhoneValidationFlow(false);
    setCurrentUserIdForValidation(null);
    setCurrentPhoneNumberForValidation(null);
    setUserEmailAfterSignUp(null);
    setUserFullNameAfterSignUp(null);
  }, [setLoggedInUserEmail, navigate]);

  const handleSignUpSuccess = useCallback((userId: string, phoneNumber: string, email: string, fullName: string) => {
    setCurrentUserIdForValidation(userId);
    setCurrentPhoneNumberForValidation(phoneNumber);
    setUserEmailAfterSignUp(email);
    setUserFullNameAfterSignUp(fullName);
    setShowPhoneValidationFlow(true);
  }, []);

  const handlePhoneValidationComplete = useCallback((email: string, fullName: string) => {
    setShowPhoneValidationFlow(false);
    setCurrentUserIdForValidation(null);
    setCurrentPhoneNumberForValidation(null);
    setUserEmailAfterSignUp(null);
    setUserFullNameAfterSignUp(null);
    handleUserLogin(email, fullName);
  }, [handleUserLogin]);

  const handleGoBackToSignUpFromPhoneValidation = useCallback(() => {
    setShowPhoneValidationFlow(false);
  }, []);

  useEffect(() => {
    if (!isLoadingUser) {
      console.log('AppNavigator useEffect - loggedInUserEmail:', loggedInUserEmail);
      if (loggedInUserEmail) {
        console.log('Navigating to /dashboard');
        if (window.location.pathname !== '/dashboard') {
          navigate('/dashboard');
        }

        setShowPhoneValidationFlow(false);
        setCurrentUserIdForValidation(null);
        setCurrentPhoneNumberForValidation(null);
        setUserEmailAfterSignUp(null);
        setUserFullNameAfterSignUp(null);
      } else {
        console.log('Navigating to /');
        if (window.location.pathname !== '/') {
          navigate('/');
        }
      }
    }
  }, [loggedInUserEmail, navigate, isLoadingUser]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const savedEmail = localStorage.getItem('userEmail');
    const savedFullName = localStorage.getItem('fullName');

    if (token && savedEmail && savedFullName && !loggedInUserEmail) {
      setLoggedInUserEmail(savedEmail, savedFullName);
    } else if (!token && loggedInUserEmail) {
        console.warn('AppNavigator: loggedInUserEmail is set but no accessToken in localStorage. Forcing logout.');
        handleUserLogout();
    }
  }, [loggedInUserEmail, setLoggedInUserEmail, handleUserLogout]);

  if (isLoadingUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '2em' }}>
        Loading user session...
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomePage
            onLoginSuccess={handleUserLogin}
            onSignUpSuccess={handleSignUpSuccess}
            showPhoneValidation={showPhoneValidationFlow}
            currentUserId={currentUserIdForValidation}
            currentPhoneNumber={currentPhoneNumberForValidation}
            userEmailAfterSignUp={userEmailAfterSignUp}
            userFullNameAfterSignUp={userFullNameAfterSignUp}
            onPhoneValidationComplete={handlePhoneValidationComplete}
            onGoBackToSignUpFromPhoneValidation={handleGoBackToSignUpFromPhoneValidation}
          />
        }
      />
      <Route
        path="/dashboard"
        element={
          <DashboardPage
            currentUserEmail={loggedInUserEmail || ''}
            currentUserFullName={loggedInUserFullName || ''}
            onSignOut={handleUserLogout}
          />
        }
      />
    </Routes>
  );
};

export default AppNavigator;