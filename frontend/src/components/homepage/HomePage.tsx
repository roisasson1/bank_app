import { useState } from 'react';
import Header from './Header';
import LandingSection from './LandingSection';
import SignUp from './SignUp';
import Login from './Login';
import PhoneValidation from './PhoneValidation';
import '../../App.css';

interface HomePageProps {
  onLoginSuccess: (email: string, fullName: string) => void;
  onSignUpSuccess: (userId: string, phoneNumber: string, email: string, fullName: string) => void;
  showPhoneValidation: boolean;
  currentUserId: string | null;
  currentPhoneNumber: string | null;
  userEmailAfterSignUp: string | null;
  userFullNameAfterSignUp: string | null;
  onPhoneValidationComplete: (email: string, fullName: string) => void;
  onGoBackToSignUpFromPhoneValidation: () => void;
}

const HomePage: React.FC<HomePageProps> = ({
    onLoginSuccess,
    onSignUpSuccess,
    showPhoneValidation,
    currentUserId,
    currentPhoneNumber,
    userEmailAfterSignUp,
    userFullNameAfterSignUp,
    onPhoneValidationComplete,
    onGoBackToSignUpFromPhoneValidation
  }) => {
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleOpenSignUp = () => {
    setIsSignUpOpen(true);
    setIsLoginOpen(false);
  }

  const handleCloseSignUp = () => {
    setIsSignUpOpen(false);
  }

  const handleOpenLogin = () => {
    setIsLoginOpen(true);
    setIsSignUpOpen(false);
  }

  const handleCloseLogin = () => {
    setIsLoginOpen(false);
  }

  const handleLoginSuccessFromLogin = (email: string, fullName: string) => {
    handleCloseLogin();
    onLoginSuccess(email, fullName);
  };

  return (
    <div className="app-container">
      <Header
        onSignUpClick={handleOpenSignUp}
        onLoginClick={handleOpenLogin}
      />
      <LandingSection onGetStartedClick={handleOpenLogin} />

      {isSignUpOpen && !showPhoneValidation && (
        <SignUp
          onClose={handleCloseSignUp}
          onSignUpSuccess={onSignUpSuccess}
        />
      )}

      {isLoginOpen && (
        <Login
          onClose={handleCloseLogin}
          onSwitchToSignUp={handleOpenSignUp}
          onLoginSuccess={handleLoginSuccessFromLogin}
        />
      )}

      {showPhoneValidation && currentUserId && currentPhoneNumber && userEmailAfterSignUp && userFullNameAfterSignUp && (
        <PhoneValidation
          userId={currentUserId}
          phoneNumber={currentPhoneNumber}
          onGoBackToSignUp={onGoBackToSignUpFromPhoneValidation}
          onValidationComplete={onPhoneValidationComplete}
          initialFullName={userFullNameAfterSignUp}
        />
      )}
    </div>
  );
}

export default HomePage;