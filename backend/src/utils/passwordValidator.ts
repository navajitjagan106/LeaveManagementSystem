export interface PasswordValidationResult {
    valid: boolean;
    errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = [];

    if (!password || password.length < 8)
        errors.push("At least 8 characters");
    if (!/[A-Z]/.test(password))
        errors.push("At least one uppercase letter");
    if (!/[a-z]/.test(password))
        errors.push("At least one lowercase letter");
    if (!/[0-9]/.test(password))
        errors.push("At least one number");

    if (!/[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?]/.test(password))
        errors.push("At least one special character");

    return { valid: errors.length === 0, errors };
}
