import React, { useState } from 'react';
import './css/PhoneValidation.css';

interface PhoneValidationProps {
  onGoBackToSignUp: () => void;
  onValidationComplete: (email: string, fullName: string) => void;
  userId: string;
  phoneNumber: string;
  initialFullName: string;
}

const PhoneValidation: React.FC<PhoneValidationProps> = ({
  onGoBackToSignUp,
  onValidationComplete,
  userId,
  phoneNumber,
  initialFullName
}) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const lastFourDigits = phoneNumber.length >= 4 ? phoneNumber.slice(-4) : phoneNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (passcode.length !== 6 || !/^\d{6}$/.test(passcode)) {
      setError('Please enter a 6-digit passcode.');
      return;
    }

    try {
      const response = await fetch(`/api/auth/sign-up/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, code: passcode }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message || 'Phone number verified successfully!');
        if (data.accessToken) {
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('userEmail', data.email);
          localStorage.setItem('fullName', data.fullName);
        }

        const returnedFullName = data.fullName || initialFullName || localStorage.getItem('fullName') || '';
        onValidationComplete(data.email, returnedFullName);
      } else {
        setError(data.error || 'OTP verification failed. Please try again.');
      }
    } catch (err: unknown) {
      console.error('Network error or server unreachable:', err);
      setError('Could not connect to the server. Please try again later.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onGoBackToSignUp}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Verify Phone Number</h2>
        <p>A 6-digit passcode has been sent to your phone number ending in **{lastFourDigits}.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="passcode">Enter Passcode:</label>
            <input
              type="text"
              id="passcode"
              name="passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              required
              maxLength={6}
              pattern="\d{6}"
              title="Please enter a 6-digit code"
            />
          </div>

          {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}
          {successMessage && <p className="success-message" style={{ color: 'green' }}>{successMessage}</p>}

          <button type="submit" className="submit-btn">Verify</button>
        </form>
        <button className="close-btn" onClick={onGoBackToSignUp}>&times;</button>
      </div>
    </div>
  );
};

export default PhoneValidation;