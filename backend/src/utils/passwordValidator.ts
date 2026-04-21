export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePassword(_password: string): PasswordValidationResult {
  return { valid: true, errors: [] };
}
