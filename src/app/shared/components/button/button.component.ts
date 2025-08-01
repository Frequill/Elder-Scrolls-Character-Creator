import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      [class]="buttonClass"
      [disabled]="disabled || loading"
      (click)="handleClick($event)"
      [type]="type">
      <span *ngIf="loading" class="loading-spinner"></span>
      <span [class.loading-hidden]="loading">
        <ng-content></ng-content>
      </span>
    </button>
  `,
  styles: [`
    .loading-spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-right: 8px;
    }
    
    .loading-hidden {
      opacity: 0.7;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    button {
      font-family: 'EB Garamond', serif;
      cursor: pointer;
      transition: all 0.3s ease;
      border-radius: 4px;
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
    
    .btn-primary {
      background-color: #764b28;
      color: #f8d87c;
      border: 1px solid #6e5a30;
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      
      &:hover:not(:disabled) {
        background-color: #8e5c32;
        box-shadow: 0 2px 8px rgba(118, 75, 40, 0.3);
      }
    }
    
    .btn-secondary {
      background-color: transparent;
      color: #c4c4c4;
      border: 1px solid #6e5a30;
      padding: 0.5rem 1rem;
      font-size: 1rem;
      
      &:hover:not(:disabled) {
        background-color: rgba(118, 75, 40, 0.3);
        color: #f8d87c;
      }
    }
    
    .btn-danger {
      background-color: #8b2635;
      color: #ffffff;
      border: 1px solid #6e1f2a;
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
      
      &:hover:not(:disabled) {
        background-color: #a12d3f;
        box-shadow: 0 2px 8px rgba(139, 38, 53, 0.3);
      }
    }
    
    .btn-small {
      padding: 0.4rem 0.8rem;
      font-size: 0.9rem;
    }
    
    .btn-large {
      padding: 1rem 2rem;
      font-size: 1.1rem;
    }
  `]
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'danger' = 'primary';
  @Input() size: 'small' | 'normal' | 'large' = 'normal';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Output() clicked = new EventEmitter<MouseEvent>();
  
  get buttonClass(): string {
    const classes = [`btn-${this.variant}`];
    if (this.size !== 'normal') {
      classes.push(`btn-${this.size}`);
    }
    return classes.join(' ');
  }
  
  handleClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit(event);
    }
  }
}
