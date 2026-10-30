export const MIN_PASSWORD_LENGTH = 8;

export function isPasswordLongEnough(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}

export function assertPasswordLongEnough(password: string): void {
  if (!isPasswordLongEnough(password)) {
    throw new Error(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    );
  }
}
