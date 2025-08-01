import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CharacterService } from '../../services/character.service';
import { StorageService } from '../../services/storage.service';
import { OpenaiService } from '../../services/openai.service';
import { Character, Game, GameSpecificSkills, AdventureGuide } from '../../models';
import { ParagraphsPipe } from '../../pipes/paragraphs.pipe';
import { DOMUtils } from '../../shared/utils';

@Component({
  selector: 'app-character-details',
  standalone: true,
  imports: [CommonModule, FormsModule, ParagraphsPipe],
  templateUrl: './character-details.component.html',
  styleUrl: './character-details.component.scss'
})
export class CharacterDetailsComponent implements OnInit, OnDestroy {
  character: Character | null = null;
  characterName: string = '';
  backstory: string | null = null;
  characterImage: string | null = null;
  isGeneratingBackstory = false;
  isGeneratingImage = false;
  isGeneratingName = false;
  isGeneratingAdventureGuide = false;
  isSaved = false;
  nameChangeRequiresBackstoryUpdate = false;
  skipNameBackstoryUpdate = false; // Flag to remember if user doesn't want backstory updates
  
  // API error handling properties
  apiConnectionError: boolean = false;
  apiErrorMessage: string = '';
  backstoryApiError: string = '';
  imageApiError: string = '';
  adventureGuideApiError: string = '';
  
  // Track which quest and faction popups are visible
  visibleQuestInfo: { [key: string]: number | null } = {
    regular: null,
    daedric: null
  };
  visibleFactionInfo: number | null = null;
  
  constructor(
    private router: Router,
    private characterService: CharacterService,
    private storageService: StorageService,
    public openaiService: OpenaiService
  ) {}

  private boundHandleOutsideClick: any;
  
  ngOnInit(): void {
    this.character = this.characterService.getCurrentCharacter();
    
    if (!this.character) {
      this.router.navigate(['/create-character']);
      return;
    }
    
    this.characterName = this.character.name || '';
    
    if (this.character.backstory) {
      this.backstory = this.character.backstory;
    }
    
    if (this.character.imageUrl) {
      this.characterImage = this.character.imageUrl;
    }
    
    this.boundHandleOutsideClick = this.handleOutsideClick.bind(this);
    document.body.addEventListener('click', this.boundHandleOutsideClick);
    
    const apiKey = this.openaiService.getApiKey();
    if (!apiKey) {
      this.apiConnectionError = true;
      this.apiErrorMessage = 'OpenAI API key is required for generating character details.';
    } else {
      this.openaiService.testConnection().subscribe({
        next: (result) => {
          if (!result.success) {
            this.apiConnectionError = true;
            this.apiErrorMessage = result.message || 'There was a problem connecting to the OpenAI API.';
          }
        },
        error: () => {}
      });
    }
  }/**
   * Updates the character name when changed by the user
   */  updateName(): void {
    if (this.character) {
      // Store the old name for possible use in backstory/adventure guide updates
      const oldName = this.character.name;
      
      // Handle empty name field
      if (!this.characterName.trim() && this.character.name) {
        // If they cleared the name field but had a name before
        this.character.name = '';
        this.characterService.setCurrentCharacter(this.character);
        return;
      }
      
      // If a name was entered, process it
      if (this.characterName.trim()) {
        // Check if name has changed and backstory or adventure guide exists
        const nameChanged = this.character.name !== this.characterName.trim();
        const hasBackstory = !!this.character.backstory;
        const hasAdventureGuide = !!this.character.adventureGuide;
        
        // Update the name
        this.character.name = this.characterName.trim();
        this.characterService.setCurrentCharacter(this.character);
        
        // If name changed and backstory or adventure guide exists, ask user if they want to update
        if (nameChanged && (hasBackstory || hasAdventureGuide)) {
          // Set flag to remember we had a name change that might need backstory/adventure update
          this.nameChangeRequiresBackstoryUpdate = true;
          this.updateBackstoryForNameChange();
        } else if (nameChanged) {
          // If the name changed but there's no backstory/adventure guide yet, just save the character
          this.saveCharacter();
        }
      }
    }
  }
    /**
   * Generates a race and gender appropriate name for the character
   */  generateName(): void {
    if (!this.character) return;
    
    // Reset error states
    this.apiConnectionError = false;
    
    // Check if API key is set
    if (!this.openaiService.getApiKey()) {
      this.apiConnectionError = true;
      this.apiErrorMessage = 'OpenAI API key is required for name generation.';
      return;
    }
    
    this.isGeneratingName = true;
    this.characterService.generateCharacterName(this.character).subscribe({
      next: (name) => {
        // Get the current full name from either the character object or extract it from the backstory
        // This ensures we capture both first and last names for proper replacement
        let oldName = this.character?.name || '';
        
        // If no name in character object or it's incomplete, try to extract from backstory
        if (!oldName || oldName.split(' ').length < 2) {
          const extractedName = this.extractNameFromBackstory(this.backstory || '');
          if (extractedName && (!oldName || extractedName.length > oldName.length)) {
            oldName = extractedName; // Use the longer, more complete name
          }
        }
        
        this.characterName = name;
        if (this.character) {
          // Update the name
          this.character.name = name;
          this.characterService.setCurrentCharacter(this.character);
          
          // If backstory exists, update it by replacing the old name with the new name
          if (this.backstory && oldName) {
            this.backstory = this.characterService.replaceNameInBackstory(this.backstory, oldName, name);
            this.character.backstory = this.backstory;
            this.characterService.setCurrentCharacter(this.character);
          }// If adventure guide exists, update it by replacing the old name with the new name
          if (this.character.adventureGuide && oldName) {
            this.character.adventureGuide = this.characterService.replaceNameInAdventureGuide(
              this.character.adventureGuide, 
              oldName, 
              name
            );
            this.characterService.setCurrentCharacter(this.character);
          }
          // Don't automatically save - just mark as needing save
          this.isSaved = false;
        }
        this.isGeneratingName = false;
      },
      error: (error) => {
        console.error('Error generating name:', error);
        this.isGeneratingName = false;
        this.apiConnectionError = true;
        this.apiErrorMessage = 'Failed to generate character name: ' + 
          (error.message || 'Unknown error occurred');
      }
    });
  }
  /**
   * Updates the backstory and adventure guide to incorporate the character's name
   */  updateBackstoryForNameChange(): void {
    if (!this.character || !this.character.name) return;
    
    // If user previously opted to skip backstory updates, don't prompt again
    if (this.skipNameBackstoryUpdate) {
      return;
    }
    
    // Store current name as the new name
    const newName = this.character.name;
    
    // First try to extract the complete name (first+last) from the backstory
    let oldName = this.extractNameFromBackstory(this.backstory || '');
    
    // If we couldn't get a name from the backstory but there's a nameChangeRequiresBackstoryUpdate flag,
    // it means we had a previous name that we should use
    if (!oldName && this.nameChangeRequiresBackstoryUpdate) {
      // There was a previous name change that we need to handle
      const previousName = this.characterName !== newName ? this.characterName : '';
      if (previousName && previousName !== newName) {
        oldName = previousName;
      }
    }
    
    // If we still haven't found an old name, check if there's a partial match in the backstory
    // This helps catch cases where only part of a name (first or last) might be in the backstory
    if (!oldName && this.backstory) {
      // Look for both first and last name patterns more aggressively
      const nameMatches = this.backstory.match(/\b([A-Z][a-z]+)\b/g);
      if (nameMatches && nameMatches.length > 0) {
        // Use the first capitalized word that might be a name
        oldName = nameMatches[0];
      }
    }
    
    if (oldName && this.backstory) {
      // Provide options: update, don't update, or don't ask again
      const userChoice = confirm('Would you like to update the backstory and adventure guide to replace the old name with your new name?');
        if (userChoice) {
        // User wants to update the backstory with the new name
        this.backstory = this.characterService.replaceNameInBackstory(this.backstory, oldName, newName);
        
        if (this.character) {
          this.character.backstory = this.backstory;
            // Also update the adventure guide if it exists
          if (this.character.adventureGuide) {
            this.character.adventureGuide = this.characterService.replaceNameInAdventureGuide(
              this.character.adventureGuide,
              oldName,
              newName
            );
          }
          
          this.characterService.setCurrentCharacter(this.character);
          // Mark as changed but don't save automatically
          this.isSaved = false;
        }
      } else {
        // Ask if they want to be prompted in the future
        this.skipNameBackstoryUpdate = !confirm('Would you like to be asked about this again for future name changes?');
      }    } else if (this.character.adventureGuide) {
      // If we couldn't extract a name from backstory but there is an adventure guide
      const userChoice = confirm('Would you like to update the adventure guide with your new name?');
      
      if (userChoice) {
        // Even without oldName from backstory, we can try to update the adventure guide
        // by using the character's previous name
        const previousName = this.character.name !== newName ? this.character.name : '';
        
        if (previousName) {          this.character.adventureGuide = this.characterService.replaceNameInAdventureGuide(
            this.character.adventureGuide,
            previousName,
            newName
          );
          this.characterService.setCurrentCharacter(this.character);
          // Mark as changed but don't save automatically
          this.isSaved = false;
        } else {
          // If no previous name, ask if they want to generate a new backstory/adventure guide
          if (confirm('Would you like to generate a new backstory with your new name?')) {
            this.generateBackstoryWithName();
          }
        }
      } else {
        // Ask if they want to be prompted in the future
        this.skipNameBackstoryUpdate = !confirm('Would you like to be asked about this again for future name changes?');
      }
    } else {
      // If we can't find the old name or there's no backstory, ask if they want to generate a new one
      if (confirm('Would you like to generate a new backstory with your new name?')) {
        this.generateBackstoryWithName();
      } else {
        // Ask if they want to be prompted in the future
        this.skipNameBackstoryUpdate = !confirm('Would you like to be asked about this again for future name changes?');
      }
    }
  }
    /**
   * Generates a backstory that incorporates the character's name
   */
  generateBackstoryWithName(): void {
    if (!this.character) return;
    
    // First, ensure we're using the latest name from the input field
    if (this.characterName && this.characterName.trim()) {
      this.character.name = this.characterName.trim();
      this.characterService.setCurrentCharacter(this.character);
    } else if (!this.character.name) {
      // If no name is set at all, fall back to regular backstory generation
      this.generateBackstory();
      return;
    }
    
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
    this.characterService.generateBackstoryWithName(this.character).subscribe({
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
        }
      }
    });
  }
    /**
   * Generates a backstory for the current character using OpenAI API
   * Handles API errors and billing issues
   * Uses name-specific generation if character has a name
   */  generateBackstory(): void {
    if (!this.character) return;
    
    // Check if we already have a name (either generated or manually entered)
    // and use that name in the backstory if it exists
    if (this.characterName && this.characterName.trim()) {
      // Update character's name from input field
      this.character.name = this.characterName.trim();
      this.characterService.setCurrentCharacter(this.character);
      // Use named backstory generation instead
      this.generateBackstoryWithName();
      return;
    }
    
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
          
          // Try to extract the complete name from the backstory (first + last name)
          const extractedName = this.extractNameFromBackstory(backstory);
          if (extractedName) {
            // Store the complete extracted name in both the UI and the character object
            // This ensures we're storing the full name (first + last) whenever possible
            this.characterName = extractedName;
            this.character.name = extractedName;
          }
          
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
   * Generates an adventure guide for the character
   */
  generateAdventureGuide(): void {
    if (!this.character) return;

    this.isGeneratingAdventureGuide = true;
    this.adventureGuideApiError = '';
    this.apiConnectionError = false;
    
    // Check if API key is set
    if (!this.openaiService.getApiKey()) {
      this.apiConnectionError = true;
      this.apiErrorMessage = 'OpenAI API key is required for adventure guide generation.';
      this.isGeneratingAdventureGuide = false;
      return;
    }
    
    this.characterService.generateAdventureGuide(this.character).subscribe({      next: (adventureGuide) => {
        if (this.character) {
          this.character.adventureGuide = adventureGuide;
          this.characterService.setCurrentCharacter(this.character);
          
          // Mark as changed but don't save automatically
          this.isSaved = false;
        }
        this.isGeneratingAdventureGuide = false;
      },
      error: (error) => {
        console.error('Error generating adventure guide:', error);
        this.isGeneratingAdventureGuide = false;
        
        // Detect possible billing issues
        if (error.message && (
          error.message.toLowerCase().includes('billing') ||
          error.message.toLowerCase().includes('quota') ||
          error.message.toLowerCase().includes('payment') ||
          error.message.toLowerCase().includes('rate limit')
        )) {
          this.adventureGuideApiError = 'API billing/quota issue: ' + (error.message || 'Please check your OpenAI account balance.');
        } else if (error.status === 401) {
          this.adventureGuideApiError = 'Authentication failed: Your API key may be invalid.';
        } else {
          this.adventureGuideApiError = 'API Error: ' + (error.message || 'Failed to generate adventure guide.');
        }
      }
    });
  }
  /**
   * Saves the current character to local storage
   * Ensures character has a name before saving
   * Checks if backstory needs updating before saving
   * Shows a temporary confirmation message
   */
  saveCharacter(): void {
    if (!this.character) return;
    
    if (!this.character.name && this.characterName.trim()) {
      this.character.name = this.characterName.trim();
    }
    
    // If name changed and backstory or adventure guide exists, prompt to update them
    if (this.nameChangeRequiresBackstoryUpdate) {
      // Reset the flag first to prevent potential recursive loops
      this.nameChangeRequiresBackstoryUpdate = false;
      
      // Prompt user to update backstory and adventure guide with the new name
      this.updateBackstoryForNameChange();
      return; // Exit - user will need to save again after making changes
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
  
  /**
   * Attempts to extract a character name from a generated backstory
   * @param backstory The character backstory text
   * @returns The extracted name if found, null otherwise
   * @private
   */  private extractNameFromBackstory(backstory: string): string | null {
    if (!backstory) return null;
    
    // Common first-person introduction patterns - expanded to capture full names with up to 4 components
    const firstPersonPatterns = [
      /I am ([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3})/,       // "I am Name"
      /My name is ([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3})/, // "My name is Name"
      /I,\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3})/,       // "I, Name,"
      /I'm ([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3})/,        // "I'm Name"
      /([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3}) is my name/, // "Name is my name"
      /I call myself ([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3})/, // "I call myself Name"
      /Known as ([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3})/, // "Known as Name"
      /My full name is ([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3})/, // "My full name is Name"
    ];
    
    // Third-person narrative patterns - expanded to capture full names with up to 4 components
    const thirdPersonPatterns = [
      /^([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3}) (?:was|is) (?:a|an)/,  // "Name was/is a/an" (common opening)
      /^([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3}),\s+(?:a|an)/,          // "Name, a/an" (common opening)
      /known as ([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3})/i,             // "known as Name" (case insensitive)
      /called ([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3})/,                // "called Name"
      /named ([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3})/,                 // "named Name"
      /^(?:The )?(?:tale|story) of ([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3})/ // "The tale/story of Name"
    ];
    
    // Check first-person patterns first (more reliable)
    for (const pattern of firstPersonPatterns) {
      const match = backstory.match(pattern);
      if (match && match[1]) {
        // Found a name
        return match[1].trim();
      }
    }
    
    // Then try third-person patterns
    for (const pattern of thirdPersonPatterns) {
      const match = backstory.match(pattern);
      if (match && match[1]) {
        // Skip common words that might be mistakenly matched
        const name = match[1].trim();
        const commonWords = ['the', 'this', 'that', 'their', 'they', 'she', 'he'];
        if (!commonWords.includes(name.toLowerCase())) {
          return name;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Determines if the skills are an array of strings or a GameSpecificSkills object
   */
  isArrayOfStrings(skills: string[] | GameSpecificSkills): boolean {
    return Array.isArray(skills);
  }
  
  /**
   * Checks if the skills structure contains Morrowind-specific skills
   */
  hasMorrowindSkills(skills: string[] | GameSpecificSkills): boolean {
    if (!Array.isArray(skills)) {
      return !!(skills.majorSkills && skills.minorSkills);
    }
    return false;
  }
  
  /**
   * Gets Morrowind major skills
   */
  getMorrowindMajorSkills(skills: string[] | GameSpecificSkills): string[] {
    if (!Array.isArray(skills) && skills.majorSkills) {
      return skills.majorSkills;
    }
    return [];
  }
  
  /**
   * Gets Morrowind minor skills
   */
  getMorrowindMinorSkills(skills: string[] | GameSpecificSkills): string[] {
    if (!Array.isArray(skills) && skills.minorSkills) {
      return skills.minorSkills;
    }
    return [];
  }
  
  /**
   * Checks if the skills structure contains Oblivion-specific skills
   */
  hasOblivionSkills(skills: string[] | GameSpecificSkills): boolean {
    if (!Array.isArray(skills)) {
      return !!skills.oblivionMajorSkills;
    }
    return false;
  }
  
  /**
   * Gets Oblivion major skills
   */
  getOblivionMajorSkills(skills: string[] | GameSpecificSkills): string[] {
    if (!Array.isArray(skills) && skills.oblivionMajorSkills) {
      return skills.oblivionMajorSkills;
    }
    return [];
  }
  
  /**
   * Checks if the skills structure contains Skyrim-specific skills
   */
  hasSkyrimSkills(skills: string[] | GameSpecificSkills): boolean {
    if (!Array.isArray(skills)) {
      return !!(skills.primarySkills && skills.secondarySkills);
    }
    return false;
  }
  
  /**
   * Gets Skyrim primary skills
   */
  getSkyrimPrimarySkills(skills: string[] | GameSpecificSkills): string[] {
    if (!Array.isArray(skills) && skills.primarySkills) {
      return skills.primarySkills;
    }
    return [];
  }
  
  /**
   * Gets Skyrim secondary skills
   */
  getSkyrimSecondarySkills(skills: string[] | GameSpecificSkills): string[] {
    if (!Array.isArray(skills) && skills.secondarySkills) {
      return skills.secondarySkills;
    }
    return [];
  }
  
  /**
   * Safely returns skills as a string array for *ngFor
   */
  getStringSkills(skills: string[] | GameSpecificSkills): string[] {
    if (Array.isArray(skills)) {
      return skills;
    }
    return [];
  }
  toggleQuestInfo(type: 'regular' | 'daedric', index: number, event?: MouseEvent): void {
    DOMUtils.stopEventPropagation(event);
    
    if (this.visibleQuestInfo[type] === index) {
      this.closeAllTooltips();
    } else {
      this.closeAllTooltips();
      this.visibleQuestInfo[type] = index;
      DOMUtils.preventBodyScroll();
    }
  }

  toggleFactionInfo(index: number, event?: MouseEvent): void {
    DOMUtils.stopEventPropagation(event);
    
    if (this.visibleFactionInfo === index) {
      this.closeAllTooltips();
    } else {
      this.closeAllTooltips();
      this.visibleFactionInfo = index;
      DOMUtils.preventBodyScroll();
    }
  }
  
  isQuestInfoVisible(type: 'regular' | 'daedric', index: number): boolean {
    return this.visibleQuestInfo[type] === index;
  }

  isFactionInfoVisible(index: number): boolean {
    return this.visibleFactionInfo === index;
  }
  
  isAnyTooltipVisible(): boolean {
    return this.visibleQuestInfo['regular'] !== null || 
           this.visibleQuestInfo['daedric'] !== null || 
           this.visibleFactionInfo !== null;
  }

  ngOnDestroy(): void {
    if (this.boundHandleOutsideClick) {
      document.body.removeEventListener('click', this.boundHandleOutsideClick);
    }
    DOMUtils.allowBodyScroll();
  }
  private handleOutsideClick(event: MouseEvent): void {
    if (this.isAnyTooltipVisible()) {
      const target = event.target as HTMLElement;
      if (!target.closest('.modal-content') && !target.closest('.quest-link') && !target.closest('.faction-link')) {
        this.closeAllTooltips();
      }
    }
  }

  closeAllTooltips(event?: MouseEvent): void {
    DOMUtils.stopEventPropagation(event);
    
    this.visibleQuestInfo = { regular: null, daedric: null };
    this.visibleFactionInfo = null;
    DOMUtils.allowBodyScroll();
  }

  getCurrentModalData(): { type: 'quest' | 'faction', data: any } | null {
    if (this.visibleQuestInfo['regular'] !== null && this.character?.adventureGuide?.recommendedQuests) {
      const questIndex = this.visibleQuestInfo['regular']!;
      if (questIndex < this.character.adventureGuide.recommendedQuests.length) {
        return {
          type: 'quest',
          data: this.character.adventureGuide.recommendedQuests[questIndex]
        };
      }
    }
    
    if (this.visibleQuestInfo['daedric'] !== null && this.character?.adventureGuide?.daedricQuests) {
      const questIndex = this.visibleQuestInfo['daedric']!;
      if (questIndex < this.character.adventureGuide.daedricQuests.length) {
        return {
          type: 'quest',
          data: this.character.adventureGuide.daedricQuests[questIndex]
        };
      }
    }
    
    if (this.visibleFactionInfo !== null && this.character?.adventureGuide?.recommendedFactions) {
      if (this.visibleFactionInfo < this.character.adventureGuide.recommendedFactions.length) {
        return {
          type: 'faction',
          data: this.character.adventureGuide.recommendedFactions[this.visibleFactionInfo]
        };
      }
    }
    
    return null;
  }
}
