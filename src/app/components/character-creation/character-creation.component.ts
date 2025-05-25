import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CharacterService } from '../../services/character.service';
import { 
  Game, 
  Race, 
  CharacterClass, 
  Character, 
  CharacterOptions,
  AGE_OPTIONS,
  SPECIALIZATION_OPTIONS,
  ARMOR_OPTIONS,
  WEAPON_OPTIONS,
  BACKGROUND_OPTIONS,
  PRESTIGE_OPTIONS
} from '../../models/elder-scrolls.model';
import { OpenaiService } from '../../services/openai.service';

@Component({
  selector: 'app-character-creation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './character-creation.component.html',
  styleUrl: './character-creation.component.scss'
})
export class CharacterCreationComponent implements OnInit {
  // Game selection options
  games = Object.values(Game);
  selectedGame: Game | null = null;
  
  // API connection status
  apiConnectionError: boolean = false;
  apiErrorMessage: string = '';
  billingIssueDetected: boolean = false;
  
  // Race selection options 
  races: Race[] = [];
  selectedRace: Race | null = null;
  
  // Creation steps: 1 = Game Selection, 2 = Race Selection, 3 = Character Options
  creationStep = 1;
  
  // Character options for class generation
  ageOptions = AGE_OPTIONS;
  specializationOptions = SPECIALIZATION_OPTIONS;
  armorOptions: string[] = [];
  weaponOptions: string[] = [];
  backgroundOptions = BACKGROUND_OPTIONS;
  prestigeOptions = PRESTIGE_OPTIONS;
  
  characterOptions: CharacterOptions = {
    age: '',
    specialization: '',
    armor: '',
    weapons: [],
    background: '',
    prestige: ''
  };
  
  isGeneratingClass = false;
  constructor(
    private router: Router,
    private characterService: CharacterService,
    public openaiService: OpenaiService
  ) {}  ngOnInit(): void {
    this.characterService.clearCurrentCharacter();
    
    // Check if API key is set
    // We don't automatically redirect to avoid an endless loop if user comes back
    // Instead we show the notification banner to make it clear API key is needed
    const apiKey = this.openaiService.getApiKey();
    if (!apiKey) {
      console.warn('No OpenAI API key found. Some features will be limited.');
    } else {
      // If API key exists, test connectivity silently in the background
      this.openaiService.testConnection().subscribe({
        next: (result) => {
          if (!result.success) {
            // We have an API key but it's not working
            this.apiConnectionError = true;
            this.apiErrorMessage = result.message || 'There was a problem connecting to the OpenAI API.';
          } else if (result.hasBilling === false) {
            // API key is valid but no billing/credits detected
            this.apiConnectionError = true;
            this.billingIssueDetected = true;
            this.apiErrorMessage = 'Your API key is valid, but no active billing or credits were detected.';
          }
        },
        error: (err) => {
          // Don't show error UI on silent check
          console.error('API connectivity check failed:', err);
        }
      });
    }
  }

  /**
   * Step 1: Select the game and prepare for race selection
   */
  selectGame(game: Game): void {
    this.selectedGame = game;
    this.races = this.characterService.getRacesByGame(game);
    this.selectedRace = null;
    
    // Update armor and weapon options based on selected game
    this.armorOptions = ARMOR_OPTIONS[game];
    this.weaponOptions = WEAPON_OPTIONS[game];
    
    // Reset character options
    this.characterOptions = {
      age: '',
      specialization: '',
      armor: '',
      weapons: [],
      background: '',
      prestige: ''
    };
    
    this.creationStep = 2;
  }

  /**
   * Step 2: Select the race and proceed to character options
   */
  selectRace(race: Race): void {
    this.selectedRace = race;
    this.creationStep = 3;
  }
  
  // Character options selection methods
  selectAge(age: string): void {
    this.characterOptions.age = age;
  }
  
  selectSpecialization(specialization: string): void {
    this.characterOptions.specialization = specialization;
  }
  
  selectArmor(armor: string): void {
    this.characterOptions.armor = armor;
  }
  
  toggleWeaponSelection(weapon: string): void {
    if (this.isWeaponSelected(weapon)) {
      // Remove weapon if already selected
      this.characterOptions.weapons = this.characterOptions.weapons.filter(w => w !== weapon);
    } else {
      // Add weapon if not selected
      this.characterOptions.weapons.push(weapon);
    }
  }
  
  isWeaponSelected(weapon: string): boolean {
    return this.characterOptions.weapons.includes(weapon);
  }
  
  selectBackground(background: string): void {
    this.characterOptions.background = background;
  }
  
  selectPrestige(prestige: string): void {
    this.characterOptions.prestige = prestige;
  }
  
  /**
   * Check if all character options are selected
   */
  isCharacterOptionsComplete(): boolean {
    return (
      !!this.characterOptions.age &&
      !!this.characterOptions.specialization &&
      !!this.characterOptions.armor &&
      this.characterOptions.weapons.length > 0 &&
      !!this.characterOptions.background &&
      !!this.characterOptions.prestige
    );
  }
  /**
   * Generate a class based on character options
   */
  generateClass(): void {
    if (!this.selectedGame || !this.selectedRace || !this.isCharacterOptionsComplete()) {
      return;
    }
    
    // Reset any previous error states
    this.apiConnectionError = false;
    this.apiErrorMessage = '';
    this.billingIssueDetected = false;
    
    // Check if API key is set
    if (!this.openaiService.getApiKey()) {
      // No alert anymore - we'll show the notification banner
      this.apiConnectionError = true;
      this.apiErrorMessage = 'OpenAI API key is required for character generation.';
      return;
    }
    
    this.isGeneratingClass = true;
    
    this.openaiService.generateCharacterClass(this.selectedGame, this.selectedRace, this.characterOptions)
      .subscribe({
        next: (generatedClass: CharacterClass) => {
          // Create character object
          const character: Character = {
            race: this.selectedRace!,
            class: generatedClass,
            game: this.selectedGame!
          };
          
          this.characterService.setCurrentCharacter(character);
          this.isGeneratingClass = false;
          
          // Navigate to character details page
          this.router.navigate(['/character-details']);
        },
        error: (error: any) => {
          console.error('Error generating class:', error);
          this.isGeneratingClass = false;
          
          // Check for specific error types
          this.apiConnectionError = true;
          
          // Detect possible billing issues
          if (error.message && (
              error.message.toLowerCase().includes('billing') ||
              error.message.toLowerCase().includes('quota') ||
              error.message.toLowerCase().includes('payment') ||
              error.message.toLowerCase().includes('credit') ||
              error.message.toLowerCase().includes('rate limit')
          )) {
            this.billingIssueDetected = true;
            this.apiErrorMessage = error.message || 'API error: Your account may have billing or credit issues.';
          } else if (error.status === 401) {
            this.apiErrorMessage = 'Authentication failed: Your API key may be invalid.';
          } else {
            this.apiErrorMessage = error.message || 'An error occurred connecting to the OpenAI API.';
          }
          
          // Fallback: Create a basic class
          const fallbackClass: CharacterClass = {
            name: 'Adventurer',
            description: 'A versatile character skilled in various abilities.',
            skills: ['Survival', 'Combat', 'Adaptability'],
            gameAvailability: [this.selectedGame!]
          };
          
          const character: Character = {
            race: this.selectedRace!,
            class: fallbackClass,
            game: this.selectedGame!
          };
          
          this.characterService.setCurrentCharacter(character);
          this.router.navigate(['/character-details']);
        }
      });
  }

  /**
   * Navigation: Go back to previous step or home
   */
  goBack(): void {
    if (this.creationStep > 1) {
      this.creationStep--;
    } else {
      this.router.navigate(['/']);
    }
  }

  /**
   * Navigate to the API settings page
   */
  navigateToApiSettings(): void {
    this.router.navigate(['/api-settings']);
  }
  
  /**
   * Return to the home page
   */
  returnToHome(): void {
    this.router.navigate(['/']);
  }
}
