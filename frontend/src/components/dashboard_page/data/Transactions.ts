export interface Transaction {
  id: string;
  name: string;
  date: string;
  amount: string;
  status: string;
}

export const Transactions: Transaction[] = [
        { id: '1', name: 'Coffee Shop', date: 'Jun 15, 2025', amount: '-$5.50', status: 'Completed' },
        { id: '2', name: 'Salary Deposit', date: 'Jun 10, 2025', amount: '+$2500.00', status: 'Completed' },
        { id: '3', name: 'Online Store', date: 'Jun 08, 2025', amount: '-$75.20', status: 'Pending' },
        { id: '4', name: 'Utility Bill', date: 'Jun 05, 2025', amount: '-$120.00', status: 'Completed' },
        { id: '5', name: 'Investment Gain', date: 'Jun 01, 2025', amount: '+$150.00', status: 'Completed' },
];