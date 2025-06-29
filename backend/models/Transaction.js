const mongoose = require('mongoose');

const transactionSchema = mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0.01
    },
    description: {
        type: String,
        default: ''
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);
