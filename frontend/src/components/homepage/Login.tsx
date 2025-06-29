import React, { useState } from 'react';
import './css/Login.css';

interface LoginProps {
  onClose: () => void;
  onSwitchToSignUp: () => void;
  onLoginSuccess: (email: string, fullName: string) => void;
}

const Login: React.FC<LoginProps> = ({ onClose, onSwitchToSignUp, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSwitch = () => {
    onClose();
    onSwitchToSignUp();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_DEV_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      console.log('Login API response data:', data);

      if (response.ok) {
        console.log('Login successful:', data.message);
        if (data.accessToken) {
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('userEmail', email);
          localStorage.setItem('fullName', data.fullName);
        }
        onClose();
        onLoginSuccess(email, data.fullName);
      } else {
        setError(data.error || 'Login failed. Please try again.');
      }
    } catch (err: unknown) {
      console.error('Network error or server unreachable:', err);
      setError('Could not connect to the server. Please try again later.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Log In</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="loginEmail">Email:</label>
            <input
              type="email"
              id="loginEmail"
              name="loginEmail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="loginPassword">Password:</label>
            <input
              type="password"
              id="loginPassword"
              name="loginPassword"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}
          <button type="submit" className="submit-btn">Log In</button>
        </form>
        <p className="switch-form-text">
          Not registered yet? <span className="switch-link" onClick={handleSwitch}>Sign Up</span>
        </p>
        <button className="close-btn" onClick={onClose}>&times;</button>
      </div>
    </div>
  );
};

export default Login;