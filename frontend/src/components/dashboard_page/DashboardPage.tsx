import React, { useState, useEffect, useCallback } from 'react';
import './css/DashboardPage.css';
import Header from './Header';
import TransactionPopup from './TransactionPopup';
import { io } from 'socket.io-client';

const socket = io(`${import.meta.env.VITE_API_DEV_URL}`, {
    transports: ['websocket', 'polling'],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});

interface TransactionData {
    amount: number;
    participant: string;
    date: string;
    time: string;
}

interface DashboardPageProps {
    currentUserEmail: string;
    currentUserFullName: string;
    onSignOut: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ currentUserEmail, currentUserFullName, onSignOut }) => {
    const [isTransactionPopupOpen, setIsTransactionPopupOpen] = useState(false);
    const [balance, setBalance] = useState<number | null>(null);
    const [transactions, setTransactions] = useState<TransactionData[]>([]);
    const [error, setError] = useState<string | null>(null);

    const fetchBalance = useCallback(async () => {
        if (!currentUserEmail) {
            console.log('fetchBalance: currentUserEmail is null, skipping fetch.');
            return;
        }
        console.log('Fetching balance for:', currentUserEmail);

        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('Authentication required. Please log in again.');
            onSignOut();
            return;
        }

        try {
            const response = await fetch(`/api/balance`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (response.ok) {
                setBalance(data.balance);
                setError(null);
                console.log('Balance fetched successfully:', data.balance);
            } else {
                setError(data.error || 'Failed to fetch balance.');
                console.error('Failed to fetch balance:', data.error);

                // if accessToken expired
                if (response.status === 401 || response.status === 403) {
                    onSignOut();
                }
            }
        } catch (err: unknown) {
            console.error('Error fetching balance:', err);
            setError('Could not connect to the server to fetch balance.');
        }
    }, [currentUserEmail, onSignOut]);

    const fetchTransactions = useCallback(async () => {
        if (!currentUserEmail) {
            console.log('fetchTransactions: currentUserEmail is null, skipping fetch.');
            return;
        }
        console.log('Fetching transactions for:', currentUserEmail);

        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('Authentication required. Please log in again.');
            onSignOut();
            return;
        }

        try {
            const response = await fetch(`/api/transactions?limit=5`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (response.ok) {
                setTransactions(data || []);
                setError(null);
                console.log('Transactions fetched successfully:', data);
            } else {
                setError(data.error || 'Failed to fetch transactions.');
                console.error('Failed to fetch transactions:', data.error);
                if (response.status === 401 || response.status === 403) {
                    onSignOut();
                }
            }
        } catch (err: unknown) {
            console.error('Error fetching transactions:', err);
            setError('Could not connect to the server to fetch transactions.');
        }
    }, [currentUserEmail, onSignOut]);

    useEffect(() => {
        if (currentUserEmail) {
            fetchBalance();
            fetchTransactions();
            let isRegistered = false;

            const registerUser = () => {
                if (!isRegistered) {
                    console.log('Registering user:', currentUserEmail);
                    socket.emit('register', currentUserEmail); // sends event to socket server
                    isRegistered = true;
                }
            };

            if (socket.connected) {
                registerUser();
            }

            // successful socket connection
            socket.on('connect', () => {
                console.log('Connected to Socket.IO server!');
                registerUser();
            });

            // connection has been lost
            socket.on('disconnect', () => {
                console.log('Disconnected from Socket.IO server.');
                isRegistered = false;
            });

            // connection error event
            socket.on('connect_error', (err: unknown) => {
                console.error('Socket.IO connection error:', err);
                setError('Error connecting to real-time notifications.');
            });

            // new transaction event
            socket.on('transaction:new', (notification) => {
                console.log('Notification received:', notification);
                fetchBalance();
                fetchTransactions();
                alert(`Transaction Alert: ${notification.message}`);
            });

            // ensuring a clean socket disconnection
            return () => {
                socket.off('connect');
                socket.off('registered');
                socket.off('disconnect');
                socket.off('connect_error');
                socket.off('transaction:new');
            };

        } else {
            console.warn('DashboardPage: currentUserEmail is empty. Forcing sign out.');
            onSignOut();
        }
    }, [currentUserEmail, fetchBalance, fetchTransactions, onSignOut]);

    const handleOpenTransactionPopup = () => {
        setIsTransactionPopupOpen(true);
    };

    const handleCloseTransactionPopup = () => {
        setIsTransactionPopupOpen(false);
    };

    const handleTransactionSuccess = () => {
        handleCloseTransactionPopup();

        // refresh data
        fetchBalance();
        fetchTransactions();
    };

    return (
        <div className="dashboard-container">
            <Header onSignOut={onSignOut}/>
            <main className="dashboard-content">
                <h2 className="welcome-message">Welcome back, {currentUserFullName || 'User'}!</h2>

                <div className="summary-cards">
                    {error && <p className="error-message" style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

                    <div className="card balance-card">
                        <h3>Current Balance</h3>
                        <p>{balance !== null ? `$${balance.toFixed(2)}` : 'Loading...'}</p>
                        <button className="transfer-btn" onClick={handleOpenTransactionPopup}>Send Money</button>
                    </div>
                    <div className="card income-card">
                        <h3>Total Income</h3>
                        <p>${transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0).toFixed(2)}</p>
                    </div>
                    <div className="card outcome-card">
                        <h3>Total Outcome</h3>
                        <p>${Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)).toFixed(2)}</p>
                    </div>
                </div>

                <section className="recent-transactions">
                    <h2>Recent Transactions</h2>
                    <div className="transactions-list">
                        {transactions.length > 0 ? (
                            transactions.map((transaction, index) => (
                                <div key={index} className="transaction-item">
                                    <span className="transaction-name">{transaction.participant}</span>
                                    <span className="transaction-date">{transaction.date} {transaction.time}</span>
                                    <span className={`transaction-amount ${transaction.amount < 0 ? 'negative' : 'positive'}`}>
                                        {transaction.amount < 0 ? `-$${Math.abs(transaction.amount).toFixed(2)}` : `+$${transaction.amount.toFixed(2)}`}
                                    </span>
                                    <span className="transaction-status completed">Completed</span>
                                </div>
                            ))
                        ) : (
                            <p>No recent transactions.</p>
                        )}
                    </div>
                </section>
            </main>
            {isTransactionPopupOpen && (
                <TransactionPopup
                    onClose={handleCloseTransactionPopup}
                    senderEmail={currentUserEmail}
                    senderFullName={currentUserFullName}
                    onTransactionSuccess={handleTransactionSuccess}
                />
            )}
        </div>
    );
};

export default DashboardPage;