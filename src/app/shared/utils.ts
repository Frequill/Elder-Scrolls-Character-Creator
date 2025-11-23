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

export enum ErrorCategory {
  Billing = 'billing',
  Authentication = 'authentication',
  RateLimit = 'rate-limit',
  Network = 'network',
  Unknown = 'unknown'
}

export interface CategorizedError {
  category: ErrorCategory;
  message: string;
  canRetry: boolean;
  isBillingIssue: boolean;
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

  static categorizeApiError(error: any): CategorizedError {
    const message = this.extractErrorMessage(error);
    const errorText = message.toLowerCase();
    const fullErrorText = JSON.stringify(error).toLowerCase();
    
    // Check for billing/quota issues
    if (errorText.includes('billing') || 
        errorText.includes('quota') || 
        errorText.includes('payment') ||
        errorText.includes('subscription') ||
        errorText.includes('credit') ||
        fullErrorText.includes('billing') ||
        fullErrorText.includes('quota')) {
      return {
        category: ErrorCategory.Billing,
        message: message,
        canRetry: false,
        isBillingIssue: true
      };
    }
    
    // Check for authentication errors
    if (error.status === 401 || errorText.includes('unauthorized') || errorText.includes('authentication')) {
      return {
        category: ErrorCategory.Authentication,
        message: message,
        canRetry: false,
        isBillingIssue: false
      };
    }
    
    // Check for rate limit errors
    if (error.status === 429 || errorText.includes('rate limit')) {
      return {
        category: ErrorCategory.RateLimit,
        message: message,
        canRetry: true,
        isBillingIssue: false
      };
    }
    
    // Check for network errors
    if (error.status === 0 || error.status === 500 || error.status === 502 || error.status === 503) {
      return {
        category: ErrorCategory.Network,
        message: message,
        canRetry: true,
        isBillingIssue: false
      };
    }
    
    // Default to unknown
    return {
      category: ErrorCategory.Unknown,
      message: message,
      canRetry: true,
      isBillingIssue: false
    };
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
