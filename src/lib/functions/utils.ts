export function getCurrentUrl(): string {
    return typeof window !== 'undefined' ? window.location.href : '';
  }