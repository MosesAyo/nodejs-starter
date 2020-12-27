const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const UserSchema = new Schema({
    fullname: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    country:{
        type: String,
        required: true
    },
    state:{
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires:{
        type: Number
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = User = mongoose.model('users', UserSchema);