import React from 'react';
import '../homepage/css/Header.css';

interface DashboardHeaderProps {
  onSignOut: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({onSignOut}) => {
  return (
    <header className="header">
      <div className="logo">PAY</div>

      <nav className="nav">
        <a href="#">Overview</a>
        <a href="#">Transactions</a>
        <a href="#">Cards</a>
      </nav>

      <div className="auth-buttons">
        <button className="signup-btn" onClick={onSignOut}>Sign Out</button>
      </div>
    </header>
  );
};

export default DashboardHeader;