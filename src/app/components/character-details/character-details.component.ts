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
  isGeneratingClassName = false;
  isGeneratingAdventureGuide = false;
  isSaved = false;
  
  // Tracking flags for button labels (Generate vs Regenerate)
  hasGeneratedName = false;
  hasGeneratedClassName = false;
  hasGeneratedBackstory = false;
  hasGeneratedImage = false;
  hasGeneratedAdventureGuide = false;
  
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
    
    // Initialize tracking flags based on existing data
    this.hasGeneratedName = !!this.character.name;
    this.hasGeneratedClassName = !!this.character.class?.name;
    this.hasGeneratedBackstory = !!this.character.backstory;
    this.hasGeneratedImage = !!this.character.imageUrl;
    this.hasGeneratedAdventureGuide = !!this.character.adventureGuide;
    
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
  }

  /**
   * Updates the character name when changed by the user
   */
  updateName(): void {
    if (this.character) {
      // Handle empty name field
      if (!this.characterName.trim() && this.character.name) {
        // If they cleared the name field but had a name before
        this.character.name = '';
        this.characterService.setCurrentCharacter(this.character);
        return;
      }
      
      // If a name was entered, process it
      if (this.characterName.trim()) {
        // Update the name
        this.character.name = this.characterName.trim();
        this.characterService.setCurrentCharacter(this.character);
      }
    }
  }
  
  /**
   * Generates a race and gender appropriate name for the character
   */
  generateName(): void {
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
        
        console.log('Name regeneration - Old name:', oldName, '| New name:', name);
        
        this.characterName = name;
        if (this.character) {
          // Update the name
          this.character.name = name;
          this.characterService.setCurrentCharacter(this.character);
          
          // If backstory exists, update it by replacing the old name with the new name
          if (this.backstory && oldName) {
            console.log('Updating backstory with new name...');
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
        this.hasGeneratedName = true;
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
   * Generates a new class name for the character while keeping the description and skills
   * Automatically updates backstory and adventure guide to use the new class name
   */
  generateClassName(): void {
    if (!this.character) return;
    
    // Reset error states
    this.apiConnectionError = false;
    
    // Check if API key is set
    if (!this.openaiService.getApiKey()) {
      this.apiConnectionError = true;
      this.apiErrorMessage = 'OpenAI API key is required for class name generation.';
      return;
    }
    
    this.isGeneratingClassName = true;
    this.characterService.generateClassName(this.character).subscribe({
      next: (newClassName) => {
        if (!this.character) return;
        
        // Extract the current class name from backstory/adventure guide to ensure we replace the right text
        const oldClassNameFromText = this.extractClassNameFromText(this.backstory || '');
        const oldClassName = oldClassNameFromText || this.character.class.name;
        
        console.log('Class name changed from:', oldClassName, 'to:', newClassName);
        
        // Update the class name
        this.character.class.name = newClassName;
        this.characterService.setCurrentCharacter(this.character);
        
        // Update backstory with new class name
        if (this.backstory && oldClassName) {
          this.backstory = this.characterService.replaceClassNameInBackstory(
            this.backstory,
            oldClassName,
            newClassName
          );
          this.character.backstory = this.backstory;
          this.characterService.setCurrentCharacter(this.character);
        }
        
        // Update adventure guide with new class name
        if (this.character.adventureGuide && oldClassName) {
          this.character.adventureGuide = this.characterService.replaceClassNameInAdventureGuide(
            this.character.adventureGuide,
            oldClassName,
            newClassName
          );
          this.characterService.setCurrentCharacter(this.character);
        }
        
        // Mark as having generated a class name
        this.hasGeneratedClassName = true;
        
        // Don't automatically save - just mark as needing save
        this.isSaved = false;
        this.isGeneratingClassName = false;
      },
      error: (error) => {
        console.error('Error generating class name:', error);
        this.isGeneratingClassName = false;
        this.apiConnectionError = true;
        this.apiErrorMessage = 'Failed to generate class name: ' + 
          (error.message || 'Unknown error occurred');
      }
    });
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
        this.hasGeneratedBackstory = true;
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
        this.hasGeneratedImage = true;
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
        this.hasGeneratedAdventureGuide = true;
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
  
  /**
   * Attempts to extract a character name from a generated backstory
   * @param backstory The character backstory text
   * @returns The extracted name if found, null otherwise
   * @private
   */
  private extractNameFromBackstory(backstory: string): string | null {
    if (!backstory) return null;
    
    // Current format: "You are [Name] the [Race]" pattern
    const youArePattern = /^You are ([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,3}) the/;
    const match = backstory.match(youArePattern);
    
    return match && match[1] ? match[1].trim() : null;
  }
  
  /**
   * Extracts the class name from backstory or adventure guide text
   * Looks for patterns like "as a [ClassName]" or "ClassName by trade"
   * 
   * @param text The backstory or adventure guide text
   * @returns The extracted class name if found, null otherwise
   * @private
   */
  private extractClassNameFromText(text: string): string | null {
    if (!text) return null;
    
    // Common patterns for class names in Elder Scrolls text
    const classPatterns = [
      /(?:as|am|is) (?:a|an) ([A-Z][a-zA-Z]+)/,  // "as a Battlemage", "am a Nightblade"
      /([A-Z][a-zA-Z]+) by (?:trade|profession)/,  // "Spellsword by trade"
      /trained (?:as|to be) (?:a|an) ([A-Z][a-zA-Z]+)/, // "trained as a Crusader"
      /calling (?:as|of) (?:a|an) ([A-Z][a-zA-Z]+)/, // "calling as a Monk"
      /skills of (?:a|an) ([A-Z][a-zA-Z]+)/, // "skills of a Pilgrim"
      /path of (?:the|a|an) ([A-Z][a-zA-Z]+)/, // "path of the Witchhunter"
    ];
    
    for (const pattern of classPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const className = match[1].trim();
        // Filter out common words that aren't class names
        const commonWords = ['the', 'they', 'their', 'them', 'this', 'that', 'There', 'These', 'Those'];
        if (!commonWords.includes(className)) {
          return className;
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
