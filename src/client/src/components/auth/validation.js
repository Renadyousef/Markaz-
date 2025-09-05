/** front end validations validation.js 
 * 
 1. Password Strength

 */

export function validatePassword(password) {
  // At least 8 characters, 1 uppercase, 1 digit, 1 special character
  const re = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  return re.test(password);
}

/**
 * 
 2. Name Validation

Ensure names contain only letters (Arabic letters)
 and no numbers or special characters
 */

export function validateName(name) {
  const re = /^[\u0621-\u064A\s]+$/; // Arabic letters and spaces
  return re.test(name);
}

export function validateEmail(email) {
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
}

