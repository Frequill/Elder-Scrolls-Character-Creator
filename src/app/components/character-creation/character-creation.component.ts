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
  SEX_OPTIONS,
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
  games = Object.values(Game);
  selectedGame: Game | null = null;
  
  apiConnectionError: boolean = false;
  apiErrorMessage: string = '';
  billingIssueDetected: boolean = false;
  
  races: Race[] = [];
  selectedRace: Race | null = null;
    creationStep = 1;
  
  sexOptions = SEX_OPTIONS;
  ageOptions = AGE_OPTIONS;
  specializationOptions = SPECIALIZATION_OPTIONS;
  armorOptions: string[] = [];
  weaponOptions: string[] = [];
  backgroundOptions = BACKGROUND_OPTIONS;
  prestigeOptions = PRESTIGE_OPTIONS;
    characterOptions: CharacterOptions = {
    sex: '',
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
    
    // Check API key status and display banner if needed
    const apiKey = this.openaiService.getApiKey();
    if (!apiKey) {
      console.warn('No OpenAI API key found. Some features will be limited.');
    } else {
      // Verify API key validity in the background
      this.openaiService.testConnection().subscribe({
        next: (result) => {
          if (!result.success) {
            this.apiConnectionError = true;
            this.apiErrorMessage = result.message || 'There was a problem connecting to the OpenAI API.';
          } else if (result.hasBilling === false) {
            this.apiConnectionError = true;
            this.billingIssueDetected = true;
            this.apiErrorMessage = 'Your API key is valid, but no active billing or credits were detected.';
          }
        },
        error: (err) => {
          console.error('API connectivity check failed:', err);
        }
      });
    }
  }
  /**
   * Updates available races and options based on the selected game
   * 
   * @param game The selected Elder Scrolls game
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
      sex: '',
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
   * 
   * @param race The selected character race
   */  selectRace(race: Race): void {
    this.selectedRace = race;
    this.creationStep = 3;
  }
    
  /**
   * Sets the character's biological sex
   * @param sex Selected biological sex
   */
  selectSex(sex: string): void {
    this.characterOptions.sex = sex;
  }
    
  /**
   * Sets the character's age
   * @param age Selected age group
   */
  selectAge(age: string): void {
    this.characterOptions.age = age;
  }
  
  /**
   * Sets the character's specialization
   * @param specialization Selected specialization category
   */
  selectSpecialization(specialization: string): void {
    this.characterOptions.specialization = specialization;
  }
    selectArmor(armor: string): void {
    this.characterOptions.armor = armor;
  }
  
  /**
   * Toggles weapon selection state
   */
  toggleWeaponSelection(weapon: string): void {
    if (this.isWeaponSelected(weapon)) {
      // Remove if selected
      this.characterOptions.weapons = this.characterOptions.weapons.filter(w => w !== weapon);
    } else {
      // Add weapon if not selected
      this.characterOptions.weapons.push(weapon);
    }
  }
  
  /**
   * Checks if a weapon is currently selected
   * 
   * @param weapon The weapon to check
   * @returns true if the weapon is selected
   */
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
   * Validates if all character options are selected
   */  isCharacterOptionsComplete(): boolean {
    return (
      !!this.characterOptions.sex &&
      !!this.characterOptions.age &&
      !!this.characterOptions.specialization &&
      !!this.characterOptions.armor &&
      this.characterOptions.weapons.length > 0 &&
      !!this.characterOptions.background &&
      !!this.characterOptions.prestige
    );
  }
  
  /**
   * Generates a character class based on the selected options
   * Uses OpenAI API to create a custom class with appropriate skills
   */
  generateClass(): void {
    if (!this.selectedGame || !this.selectedRace || !this.isCharacterOptionsComplete()) {
      return;
    }
    
    // Reset error states
    this.apiConnectionError = false;
    this.apiErrorMessage = '';
    this.billingIssueDetected = false;
    
    if (!this.openaiService.getApiKey()) {
      this.apiConnectionError = true;
      this.apiErrorMessage = 'OpenAI API key is required for character generation.';
      return;
    }
    
    this.isGeneratingClass = true;
      this.openaiService.generateCharacterClass(this.selectedGame, this.selectedRace, this.characterOptions)
      .subscribe({
        next: (generatedClass: CharacterClass) => {          const character: Character = {
            race: this.selectedRace!,
            class: generatedClass,
            game: this.selectedGame!,
            sex: this.characterOptions.sex
          };
          
          this.characterService.setCurrentCharacter(character);
          this.isGeneratingClass = false;
          this.router.navigate(['/character-details']);
        },
        error: (error: any) => {
          console.error('Error generating class:', error);
          this.isGeneratingClass = false;          this.apiConnectionError = true;
          
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
          
          // Create fallback class for offline use
          const fallbackClass: CharacterClass = {
            name: 'Adventurer',
            description: 'A versatile character skilled in various abilities.',
            skills: ['Survival', 'Combat', 'Adaptability'],
            gameAvailability: [this.selectedGame!]
          };
            const character: Character = {
            race: this.selectedRace!,
            class: fallbackClass,
            game: this.selectedGame!,
            sex: this.characterOptions.sex
          };
          
          this.characterService.setCurrentCharacter(character);
          this.router.navigate(['/character-details']);
        }
      });
  }
  goBack(): void {
    if (this.creationStep > 1) {
      this.creationStep--;
    } else {
      this.router.navigate(['/']);
    }
  }

  navigateToApiSettings(): void {
    this.router.navigate(['/api-settings']);
  }
  
  returnToHome(): void {
    this.router.navigate(['/']);
  }
}
