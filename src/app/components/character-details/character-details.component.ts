import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CharacterService } from '../../services/character.service';
import { StorageService } from '../../services/storage.service';
import { OpenaiService } from '../../services/openai.service';
import { Character } from '../../models/elder-scrolls.model';
import { ParagraphsPipe } from '../../pipes/paragraphs.pipe';

@Component({
  selector: 'app-character-details',
  standalone: true,
  imports: [CommonModule, FormsModule, ParagraphsPipe],
  templateUrl: './character-details.component.html',
  styleUrl: './character-details.component.scss'
})
export class CharacterDetailsComponent implements OnInit {
  character: Character | null = null;
  characterName: string = '';
  backstory: string | null = null;
  characterImage: string | null = null;
  isGeneratingBackstory = false;
  isGeneratingImage = false;
  isSaved = false;
  
  // API error handling properties
  apiConnectionError: boolean = false;
  apiErrorMessage: string = '';
  backstoryApiError: string = '';
  imageApiError: string = '';
  constructor(
    private router: Router,
    private characterService: CharacterService,
    private storageService: StorageService,
    public openaiService: OpenaiService
  ) {}  ngOnInit(): void {
    this.character = this.characterService.getCurrentCharacter();
    
    if (!this.character) {
      this.router.navigate(['/create-character']);
      return;
    }
    
    if (this.character.name) {
      this.characterName = this.character.name;
    }
    
    // If the character has a backstory, display it
    if (this.character.backstory) {
      this.backstory = this.character.backstory;
    }
    
    // If the character has an image, display it
    if (this.character.imageUrl) {
      this.characterImage = this.character.imageUrl;
    }
    
    // Check API key and connectivity in the background
    const apiKey = this.openaiService.getApiKey();
    if (!apiKey) {
      this.apiConnectionError = true;
      this.apiErrorMessage = 'OpenAI API key is required for generating character details.';
    } else {
      // If API key exists, test connectivity silently
      this.openaiService.testConnection().subscribe({
        next: (result) => {
          if (!result.success) {
            // API key exists but does not work
            this.apiConnectionError = true;
            this.apiErrorMessage = result.message || 'There was a problem connecting to the OpenAI API.';
          }
        },
        error: () => {
          // Don't show error UI on silent check
        }
      });
    }
  }  /**
   * Updates the character name when changed by the user
   */
  updateName(): void {
    if (this.character && this.characterName.trim()) {
      this.character.name = this.characterName.trim();
      this.characterService.setCurrentCharacter(this.character);
    }
  }
  
  /**
   * Generates a backstory for the current character using OpenAI API
   * Handles API errors and billing issues
   */
  generateBackstory(): void {
    if (!this.character) return;
    
    // Reset error states
    this.backstoryApiError = '';
    this.apiConnectionError = false;
    
    // Check if API key is set
    if (!this.openaiService.getApiKey()) {
      this.apiConnectionError = true;
      this.apiErrorMessage = 'OpenAI API key is required for backstory generation.';
      return;
    }
    
    this.isGeneratingBackstory = true;
    this.characterService.generateBackstory(this.character).subscribe({
      next: (backstory) => {
        this.backstory = backstory;
        if (this.character) {
          this.character.backstory = backstory;
          this.characterService.setCurrentCharacter(this.character);
        }
        this.isGeneratingBackstory = false;
      },
      error: (error) => {
        console.error('Error generating backstory:', error);
        this.isGeneratingBackstory = false;
        
        // Detect possible billing issues
        if (error.message && (
          error.message.toLowerCase().includes('billing') ||
          error.message.toLowerCase().includes('quota') ||
          error.message.toLowerCase().includes('payment') ||
          error.message.toLowerCase().includes('rate limit')
        )) {
          this.backstoryApiError = 'API billing/quota issue: ' + (error.message || 'Please check your OpenAI account balance.');
        } else if (error.status === 401) {
          this.backstoryApiError = 'Authentication failed: Your API key may be invalid.';
        } else {
          this.backstoryApiError = 'API Error: ' + (error.message || 'Failed to generate backstory.');
        }      }
    });
  }
  
  /**
   * Generates a character portrait image using OpenAI's DALL-E model
   * Handles API errors, billing issues, and uses a placeholder if needed
   */
  generateImage(): void {
    if (!this.character) return;
    
    // Reset error states
    this.imageApiError = '';
    this.apiConnectionError = false;
    
    // Check if API key is set
    if (!this.openaiService.getApiKey()) {
      this.apiConnectionError = true;
      this.apiErrorMessage = 'OpenAI API key is required for image generation.';
      return;
    }
    
    this.isGeneratingImage = true;
    this.characterService.generateCharacterImage(this.character).subscribe({
      next: (imageUrl) => {
        this.characterImage = imageUrl;
        if (this.character) {
          this.character.imageUrl = imageUrl;
          this.characterService.setCurrentCharacter(this.character);
        }
        this.isGeneratingImage = false;
      },
      error: (error) => {
        console.error('Error generating image:', error);
        this.isGeneratingImage = false;
        
        // Detect possible billing issues
        if (error.message && (
          error.message.toLowerCase().includes('billing') ||
          error.message.toLowerCase().includes('quota') ||
          error.message.toLowerCase().includes('payment') ||
          error.message.toLowerCase().includes('rate limit')
        )) {
          this.imageApiError = 'API billing/quota issue: ' + (error.message || 'Please check your OpenAI account balance.');
        } else if (error.status === 401) {
          this.imageApiError = 'Authentication failed: Your API key may be invalid.';
        } else {
          this.imageApiError = 'API Error: ' + (error.message || 'Failed to generate image.');
        }
      }
    });
  }
  
  /**
   * Saves the current character to local storage
   * Ensures character has a name before saving
   * Shows a temporary confirmation message
   */
  saveCharacter(): void {
    if (!this.character) return;
    
    if (!this.character.name && this.characterName.trim()) {
      this.character.name = this.characterName.trim();
    }
    
    this.storageService.saveCharacter(this.character);
    this.isSaved = true;
    
    setTimeout(() => {
      this.isSaved = false;
    }, 2000);
  }
  /**
   * Clears the current character and navigates to character creation
   */
  createNewCharacter(): void {
    this.characterService.clearCurrentCharacter();
    this.router.navigate(['/create-character']);
  }
  
  /**
   * Navigates back to the home page
   */
  returnToHome(): void {
    this.router.navigate(['/']);
  }
  
  /**
   * Navigate to the API settings page
   */
  navigateToApiSettings(): void {
    this.router.navigate(['/api-settings']);
  }
}
