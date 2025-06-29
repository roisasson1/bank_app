const express = require('express');
const { sendMoney, getBalance, getTransactionsHistory } = require('../controllers/transactionController');

const router = express.Router();

router.get('/balance', getBalance);
router.get('/transactions', getTransactionsHistory);
router.post('/transactions/send', sendMoney);

module.exports = router;