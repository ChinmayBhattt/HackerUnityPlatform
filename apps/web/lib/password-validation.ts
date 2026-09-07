/**
 * Shared password validation rules for client and server.
 *
 * Requirements:
 *  - Minimum 8 characters
 *  - At least one uppercase letter
 *  - At least one lowercase letter
 *  - At least one digit
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  /** 0-4 scale: 0 = very weak, 4 = strong */
  strength: number;
}

const MIN_LENGTH = 8;

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password || password.length < MIN_LENGTH) {
    errors.push(`Password must be at least ${MIN_LENGTH} characters`);
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one digit');
  }

  // Strength score (0-4)
  let strength = 0;
  if (password.length >= MIN_LENGTH) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++; // special chars bonus
  // Cap at 4
  strength = Math.min(strength, 4);

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

export const PASSWORD_STRENGTH_LABELS = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'] as const;
export const PASSWORD_STRENGTH_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#059669'] as const;
