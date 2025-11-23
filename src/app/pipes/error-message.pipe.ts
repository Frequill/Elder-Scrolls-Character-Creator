import { Pipe, PipeTransform } from '@angular/core';
import { CategorizedError, ErrorUtils } from '../shared/utils';

@Pipe({
  name: 'errorMessage',
  standalone: true
})
export class ErrorMessagePipe implements PipeTransform {
  transform(error: any): string {
    if (!error) {
      return 'An unknown error occurred';
    }

    // If it's already a CategorizedError
    if (this.isCategorizedError(error)) {
      return error.message;
    }

    // Otherwise, categorize it first
    const categorized = ErrorUtils.categorizeApiError(error);
    return categorized.message;
  }

  private isCategorizedError(error: any): error is CategorizedError {
    return error && typeof error === 'object' && 'category' in error && 'message' in error;
  }
}
