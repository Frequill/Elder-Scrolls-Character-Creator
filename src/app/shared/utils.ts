export class StringUtils {
  static escapeRegexSpecialChars(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  static createWordBoundaryRegex(text: string, flags: string = 'gi'): RegExp {
    const escaped = this.escapeRegexSpecialChars(text);
    return new RegExp(`\\b${escaped}\\b`, flags);
  }

  static cleanResponseText(text: string): string {
    return text.replace(/["']/g, '').replace(/\.$/, '').trim();
  }

  static extractJsonFromText(text: string): string | null {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : null;
  }
}

export class ValidationUtils {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static sanitizeInput(input: string, maxLength?: number): string {
    let sanitized = input.trim();
    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    return sanitized;
  }
}

export class ErrorUtils {
  static extractErrorMessage(error: any): string {
    if (error?.error?.error?.message) {
      return error.error.error.message;
    }
    if (error?.message) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unknown error occurred';
  }

  static isBillingError(error: any): boolean {
    const errorText = JSON.stringify(error).toLowerCase();
    return errorText.includes('billing') || 
           errorText.includes('quota') || 
           errorText.includes('payment') ||
           errorText.includes('subscription') ||
           errorText.includes('credit');
  }
}

export class DOMUtils {
  static preventBodyScroll(): void {
    document.body.classList.add('tooltip-open');
  }

  static allowBodyScroll(): void {
    document.body.classList.remove('tooltip-open');
  }

  static stopEventPropagation(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  static scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  static isElementInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
}

export class ArrayUtils {
  static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  static getRandomElement<T>(array: T[]): T | undefined {
    return array.length > 0 ? array[Math.floor(Math.random() * array.length)] : undefined;
  }

  static chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

export class LoggerUtils {
  private static isDevelopment = true; // Set to false in production builds

  static error(message: string, error?: any, context?: string): void {
    const fullMessage = context ? `[${context}] ${message}` : message;
    console.error(fullMessage, error);
    
    // In production, you might want to send errors to a logging service
    if (!this.isDevelopment) {
      // TODO: Implement production error logging
    }
  }

  static warn(message: string, context?: string): void {
    const fullMessage = context ? `[${context}] ${message}` : message;
    console.warn(fullMessage);
  }

  static info(message: string, context?: string): void {
    if (this.isDevelopment) {
      const fullMessage = context ? `[${context}] ${message}` : message;
      console.info(fullMessage);
    }
  }

  static debug(message: string, data?: any, context?: string): void {
    if (this.isDevelopment) {
      const fullMessage = context ? `[${context}] ${message}` : message;
      console.debug(fullMessage, data);
    }
  }
}
