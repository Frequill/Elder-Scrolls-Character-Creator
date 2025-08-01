import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DOMUtils } from '../../utils';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="handleOverlayClick($event)">
      <div class="modal-content" 
           [style.width]="width"
           [style.max-width]="maxWidth"
           [style.max-height]="maxHeight"
           (click)="$event.stopPropagation()">
        <div class="modal-header" *ngIf="title">
          <h3>{{ title }}</h3>
          <button class="close-btn" (click)="close()" *ngIf="showCloseButton">×</button>
        </div>
        <div class="modal-body">
          <ng-content></ng-content>
        </div>
        <div class="modal-footer" *ngIf="showFooter">
          <ng-content select="[slot=footer]"></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, 0.4);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    
    .modal-content {
      position: relative;
      background-color: rgb(40, 32, 22);
      border: 2px solid rgba(248, 216, 124, 0.8);
      border-radius: 8px;
      padding: 1.5rem;
      overflow-y: auto;
      opacity: 1;
      color: #ffffff;
      cursor: default;
      
      box-shadow: 
        0 8px 24px rgba(0, 0, 0, 0.8),
        0 0 30px rgba(196, 164, 95, 0.2),
        0 0 0 2px rgba(248, 216, 124, 0.5);
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      
      h3 {
        color: #f8d87c;
        margin: 0;
        font-size: 1.2rem;
      }
    }
    
    .close-btn {
      background: none;
      border: none;
      color: #c4c4c4;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:hover {
        color: #f8d87c;
      }
    }
    
    .modal-body {
      color: #ffffff;
    }
    
    .modal-footer {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(196, 164, 95, 0.3);
    }
  `]
})
export class ModalComponent implements OnInit, OnDestroy {
  @Input() isOpen: boolean = false;
  @Input() title: string = '';
  @Input() width: string = '500px';
  @Input() maxWidth: string = '90vw';
  @Input() maxHeight: string = '85vh';
  @Input() showCloseButton: boolean = true;
  @Input() showFooter: boolean = false;
  @Input() preventBodyScroll: boolean = true;
  @Output() closed = new EventEmitter<void>();
  
  ngOnInit(): void {
    if (this.isOpen && this.preventBodyScroll) {
      DOMUtils.preventBodyScroll();
    }
  }
  
  ngOnDestroy(): void {
    if (this.preventBodyScroll) {
      DOMUtils.allowBodyScroll();
    }
  }
  
  ngOnChanges(): void {
    if (this.preventBodyScroll) {
      if (this.isOpen) {
        DOMUtils.preventBodyScroll();
      } else {
        DOMUtils.allowBodyScroll();
      }
    }
  }
  
  handleOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
  
  close(): void {
    if (this.preventBodyScroll) {
      DOMUtils.allowBodyScroll();
    }
    this.closed.emit();
  }
}
