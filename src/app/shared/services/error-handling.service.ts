import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ErrorUtils } from '../utils';
import { APP_CONSTANTS } from '../constants';

export interface AppError {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
  timestamp: Date;
  dismissible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlingService {
  private errorsSubject = new BehaviorSubject<AppError[]>([]);
  public errors$ = this.errorsSubject.asObservable();
  
  private nextId = 1;
  
  showError(message: string, dismissible: boolean = true): string {
    return this.addError({
      id: this.generateId(),
      message,
      type: 'error',
      timestamp: new Date(),
      dismissible
    });
  }
  
  showWarning(message: string, dismissible: boolean = true): string {
    return this.addError({
      id: this.generateId(),
      message,
      type: 'warning',
      timestamp: new Date(),
      dismissible
    });
  }
  
  showInfo(message: string, dismissible: boolean = true): string {
    return this.addError({
      id: this.generateId(),
      message,
      type: 'info',
      timestamp: new Date(),
      dismissible
    });
  }
  
  showSuccess(message: string, dismissible: boolean = true): string {
    return this.addError({
      id: this.generateId(),
      message,
      type: 'success',
      timestamp: new Date(),
      dismissible
    });
  }
  
  handleApiError(error: any, context: string = ''): string {
    const message = ErrorUtils.extractErrorMessage(error);
    const fullMessage = context ? `${context}: ${message}` : message;
    return this.showError(fullMessage);
  }
  
  dismissError(id: string): void {
    const currentErrors = this.errorsSubject.value;
    const updatedErrors = currentErrors.filter(error => error.id !== id);
    this.errorsSubject.next(updatedErrors);
  }
  
  clearAllErrors(): void {
    this.errorsSubject.next([]);
  }
  
  private addError(error: AppError): string {
    const currentErrors = this.errorsSubject.value;
    const updatedErrors = [...currentErrors, error];
    this.errorsSubject.next(updatedErrors);
    
    // Auto-dismiss success messages after 5 seconds
    if (error.type === 'success' && error.dismissible) {
      setTimeout(() => this.dismissError(error.id), 5000);
    }
    
    return error.id;
  }
  
  private generateId(): string {
    return `error_${this.nextId++}`;
  }
}
