const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  email: {
    type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Please fill a valid email address']
  },
    password: {
        type: String,
        required: true,
        minlength: [4, 'Password must be at least 4 characters']
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(v) {
                return v.length >= 7 && v.length <= 10;
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    otp: {
        type: String,
        required: false
    },
    isPhoneVerified: {
        type: Boolean,
        default: false
    },
    accountBalance: {
        type: Number,
        default: 10000.00,
        min: 0
    },
}, {
    timestamps: true
})

module.exports = mongoose.model('User', userSchema);