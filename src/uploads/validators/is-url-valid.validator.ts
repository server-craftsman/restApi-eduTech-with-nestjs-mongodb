/**
 * Validator for checking if a string is a valid URL
 */
export class IsUrlValid {
  validate(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  defaultMessage(): string {
    return 'Invalid URL format';
  }
}
