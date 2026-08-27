/**
 * Utility functions for Indian phone number normalization and E.164 formatting.
 */

export interface PhoneValidationResult {
  isValid: boolean;
  formattedPhone?: string; // Valid E.164 format e.g. "+918852924002"
  clean10Digits?: string;   // Exactly 10 digits e.g. "8852924002"
  error?: string;
}

/**
 * Validates and formats a phone number into strict E.164 format for India (+91XXXXXXXXXX).
 * - Strips spaces, dashes, parentheses, dots, symbols
 * - Handles leading zeros, +91, 91, or multiple accidental duplicate prefixes (e.g. 9191..., +9191...)
 * - Validates exactly 10 digits starting with 6, 7, 8, or 9
 */
export function formatAndValidateIndianPhone(rawPhone: string | null | undefined): PhoneValidationResult {
  if (!rawPhone || !rawPhone.trim()) {
    return {
      isValid: false,
      error: 'Please enter your mobile phone number.',
    };
  }

  // 1. Remove all spaces, dashes, parentheses, dots, and plus signs
  let cleaned = rawPhone.trim().replace(/[\s\-\(\)\.\+\,]/g, '');

  // 2. Remove leading zeros if present
  cleaned = cleaned.replace(/^0+/, '');

  // 3. Remove duplicate or repeated '91' country code prefixes if user typed e.g. 91918852924002 or +91918852924002
  while (cleaned.startsWith('91') && cleaned.length > 10) {
    cleaned = cleaned.substring(2);
    cleaned = cleaned.replace(/^0+/, '');
  }

  // 4. Validate exact 10 digits
  if (!/^\d+$/.test(cleaned)) {
    return {
      isValid: false,
      error: 'Phone number must contain numbers only.',
    };
  }

  if (cleaned.length < 10) {
    return {
      isValid: false,
      error: `Phone number is too short (${cleaned.length}/10 digits). Please enter a complete 10-digit number.`,
    };
  }

  if (cleaned.length > 10) {
    return {
      isValid: false,
      error: `Phone number has too many digits (${cleaned.length} digits). Please enter a 10-digit mobile number.`,
    };
  }

  // 5. Valid Indian mobile numbers must start with 6, 7, 8, or 9
  if (!/^[6-9]/.test(cleaned)) {
    return {
      isValid: false,
      error: 'Invalid Indian mobile number. Mobile numbers must start with 6, 7, 8, or 9.',
    };
  }

  const formattedPhone = `+91${cleaned}`;
  return {
    isValid: true,
    formattedPhone,
    clean10Digits: cleaned,
  };
}
