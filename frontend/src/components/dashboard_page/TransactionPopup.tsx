import React, { useState } from 'react';
import './css/TransactionPopup.css';
import JitsiMeetingModal from './JitsiMeeting';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideo } from '@fortawesome/free-solid-svg-icons';

interface TransactionPopupProps {
  onClose: () => void;
  senderEmail: string;
  senderFullName: string;
  onTransactionSuccess: () => void;
}

const TransactionPopup: React.FC<TransactionPopupProps> = ({ onClose, senderEmail, senderFullName, onTransactionSuccess }) => {
  const [receiverEmail, setReceiverEmail] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showJitsiModal, setShowJitsiModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const parsedAmount = parseFloat(amount);

    if (!receiverEmail || !amount) {
      setError('Receiver email and amount are required.');
      setIsLoading(false);
      return;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be a positive number.');
      setIsLoading(false);
      return;
    }

    if (senderEmail === receiverEmail) {
      setError('Cannot send money to yourself.');
      setIsLoading(false);
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('Authentication required. Please log in again.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/transactions/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          "reciever-email": receiverEmail,
          amount: parsedAmount,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message || 'Transaction completed successfully!');
        setReceiverEmail('');
        setAmount('');
        onTransactionSuccess();
      } else {
        setError(data.error || 'Transaction failed. Please try again.');
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('userEmail');
          setError(data.error + ' Please log in again.');
        }
      }
    } catch (err: unknown) {
      console.error('Network error or server unreachable:', err);
      setError('Could not connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenJitsi = () => {
    if (!receiverEmail) {
        setError('Please enter a receiver email to start a video call.');
        return;
    }
    const roomIdentifier = `${senderEmail.split('@')[0]}-${receiverEmail.split('@')[0]}-call`;
    console.log(`Attempting to open Jitsi for room: ${roomIdentifier}`);
    setShowJitsiModal(true);
  };

  const handleCloseJitsi = () => {
    setShowJitsiModal(false);
  };

return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose} disabled={isLoading}>&times;</button>
        <h2>Perform New Transaction</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="receiverEmail">Receiver Email:</label>
            <div className="input-with-jitsi">
                <input
                    type="email"
                    id="receiverEmail"
                    name="receiverEmail"
                    value={receiverEmail}
                    onChange={(e) => setReceiverEmail(e.target.value)}
                    required
                />
                <button
                    type="button"
                    className="jitsi-video-btn"
                    onClick={handleOpenJitsi}
                    disabled={isLoading || !receiverEmail}
                    title="Start a video call with the receiver"
                >
                    <FontAwesomeIcon icon={faVideo} />
                </button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="amount">Amount:</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              step="0.01"
              min="0.01"
            />
          </div>

          {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}
          {successMessage && <p className="success-message" style={{ color: 'green' }}>{successMessage}</p>}

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Money'}
          </button>
        </form>
      </div>

      {showJitsiModal && receiverEmail && (
        <JitsiMeetingModal
          roomName={`${senderEmail.split('@')[0]}-${receiverEmail.split('@')[0]}-call`}
          userInfo={{ displayName: senderFullName, email: senderEmail }}
          onClose={handleCloseJitsi}
        />
      )}
    </div>
  );
};

export default TransactionPopup;