import React from 'react';
import './css/Header.css';

interface HeaderProps {
  onSignUpClick: () => void;
  onLoginClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSignUpClick, onLoginClick }) => {
  return (
    <header className="header">
      <div className="logo">PAY</div>

      <nav className="nav">
        <a href="#">Get Card</a>
        <a href="#">About Us</a>
        <a href="#">Contact Us</a>
      </nav>

      <div className="auth-buttons">
        <button className="login-btn" onClick={onLoginClick}>Log In</button>
        <button className="signup-btn" onClick={onSignUpClick}>Sign Up</button>
      </div>
    </header>
  );
};

export default Header;
