import React, { useState } from 'react';
import './css/SignUp.css';

interface SignupProps {
  onClose: () => void;
  onSignUpSuccess: (userId: string, phoneNumber: string, email: string, fullName: string) => void;
}

const SignUp: React.FC<SignupProps> = ({ onClose, onSignUpSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email || !password || !phoneNumber || !fullName) {
      setError('All details are required');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError('Invalid email format');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    if (phoneNumber.length < 7 || phoneNumber.length > 10) {
      setError('Phone number must have 7-10 digits');
      return;
    }

    try {
      const response = await fetch(`/api/auth/sign-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, phoneNumber, fullName }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message || 'Sign up successful! Please verify your phone.');
        onSignUpSuccess(data.id, phoneNumber, email, fullName);
      } else {
        setError(data.error || 'Sign up failed.');
      }
    } catch (err: unknown) {
      console.error('Network error or server unreachable:', err);
      setError('Could not connect to the server. Please try again later.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Sign Up</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone Number:</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}
          {successMessage && <p className="success-message" style={{ color: 'green' }}>{successMessage}</p>}
          <button type="submit" className="submit-btn">Register</button>
        </form>
        <button className="close-btn" onClick={onClose}>&times;</button>
      </div>
    </div>
  );
};

export default SignUp;