const Validator = require('validator');
const isEmpty = require('./is-empty') ;

module.exports = function validateRegisterInput(data) {
    let errors = {};

    data.fullname = !isEmpty(data.fullname) ? data.fullname : '';
    data.email = !isEmpty(data.email) ? data.email : '';
    data.password = !isEmpty(data.password) ? data.password : '';

    // Validate - name characters is not less than two and not more than 30
    if (!Validator.isLength(data.fullname, { min: 2, max: 30})){
        errors.fullname = 'Name must be between 2 and 30 characters';
    }

    if (Validator.isEmpty(data.fullname)) {
        errors.fullname = 'Full name is required';
    }
    
    if (!Validator.isEmail(data.email)) {
        errors.email = 'Email is invalid';
    }
    
    if (Validator.isEmpty(data.email)) {
        errors.email = 'Email field is required';
      }
      
    if (Validator.isEmpty(data.password)) {
        errors.password = 'Password field is required';
    }

    if (!Validator.isLength(data.password, {min: 6, max: 30})) {
        errors.password = 'Password must be at least 6 Characters';
    }

    return {
        errors,
        isValid: isEmpty(errors)
    };
};