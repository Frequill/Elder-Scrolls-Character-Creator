import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent {
  constructor(private router: Router) {}

  navigateToCharacterCreation(): void {
    this.router.navigate(['/create-character']);
  }
  
  navigateToSavedCharacters(): void {
    this.router.navigate(['/saved-characters']);
  }
  
  navigateToApiSettings(): void {
    this.router.navigate(['/api-settings']);
  }
}
