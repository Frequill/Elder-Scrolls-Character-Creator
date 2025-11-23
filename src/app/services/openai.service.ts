import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { 
  Character, 
  CharacterClass, 
  Game, 
  Race, 
  CharacterOptions,
  GameSpecificSkills,
  AdventureGuide,
  QuestDetails,
  FactionDetails,
  CharacterMotivation
 } from '../models';
import { APP_CONSTANTS } from '../shared/constants';
import { StringUtils, ErrorUtils } from '../shared/utils';

@Injectable({
  providedIn: 'root'
})
export class OpenaiService {
  private apiKey: string = '';
  private chatCompletionsUrl = APP_CONSTANTS.API_ENDPOINTS.OPENAI_CHAT;
  private imageGenerationUrl = APP_CONSTANTS.API_ENDPOINTS.OPENAI_IMAGES;
  
  constructor(private http: HttpClient) { 
    this.loadApiKeyFromStorage();
  }
  
  private loadApiKeyFromStorage(): void {
    const savedApiKey = localStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.OPENAI_API_KEY);
    if (savedApiKey) {
      this.apiKey = savedApiKey;
    }
  }
    
  setApiKey(key: string): void {
    this.apiKey = key;
    localStorage.setItem(APP_CONSTANTS.STORAGE_KEYS.OPENAI_API_KEY, key);
  }
  
  getApiKey(): string {
    return this.apiKey;
  }
  
  clearApiKey(): void {
    this.apiKey = '';
    localStorage.removeItem(APP_CONSTANTS.STORAGE_KEYS.OPENAI_API_KEY);
  }

  testConnection(): Observable<{success: boolean, message?: string, hasBilling?: boolean}> {
    if (!this.apiKey) {
      return of({success: false, message: APP_CONSTANTS.ERROR_MESSAGES.NO_API_KEY});
    }
    
    const headers = this.getHeaders();
    
    const body = {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Test message to verify API connection."
        }
      ],
      max_tokens: 10
    };
    
    return this.http.post<any>(this.chatCompletionsUrl, body, { headers }).pipe(
      map(response => {
        if (response && response.choices && response.choices.length > 0) {
          return {success: true, hasBilling: true, message: 'Connection successful with valid billing'};
        } else {
          return {success: false, message: 'Received invalid response from OpenAI API'};
        }
      }),
      catchError(error => {
        console.error('API test failed:', error);
        let errorMessage = 'Unknown error occurred';
        let hasBilling: boolean | undefined = undefined;
        
        if (error.error && error.error.error) {
          errorMessage = error.error.error.message || error.error.error.type;
          
          const errorText = JSON.stringify(error.error).toLowerCase();
          if (errorText.includes('billing') || 
              errorText.includes('quota') || 
              errorText.includes('payment') ||
              errorText.includes('subscription') ||
              errorText.includes('credit')) {
            hasBilling = false;
            errorMessage += ' - Please check your billing status on OpenAI.';
          }
        } else if (error.status === 401) {
          errorMessage = 'Authentication error: Invalid API key or unauthorized access';
        } else if (error.status === 429) {
          errorMessage = 'Rate limit exceeded: Too many requests or exceeded quota. This may indicate billing or credit issues.';
          hasBilling = false;
        } else if (error.status === 500) {
          errorMessage = 'OpenAI server error. Please try again later';
        } else if (error.message) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        return of({success: false, message: errorMessage, hasBilling});
      })
    );
  }
  /**
   * Generates a character class and description based on provided parameters
   * 
   * @param game The selected Elder Scrolls game
   * @param race The selected character race
   * @param options Additional character options
   * @returns An Observable with the generated CharacterClass
   */
  generateCharacterClass(game: Game, race: Race, options: CharacterOptions): Observable<CharacterClass> {
    if (!this.apiKey) {
      return of(this.getFallbackClass(game));
    }
    
    const headers = this.getHeaders();
    const prompt = this.buildCharacterPrompt(game, race, options);
    
    const body = {
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert on Elder Scrolls lore and game mechanics, specializing in creating custom character classes."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7
    };
    
    return this.http.post<any>(this.chatCompletionsUrl, body, { headers }).pipe(
      map(response => {
        const content = response.choices[0].message.content;
        try {
          const parsedClass = JSON.parse(content);
          return {
            name: parsedClass.name,
            description: parsedClass.description,
            skills: parsedClass.skills,
            gameAvailability: [game]
          };
        } catch (error) {
          console.error('Error parsing OpenAI response:', error);
          throw new Error('Failed to parse generated class');
        }
      }),
      catchError(error => {
        console.error('Error generating class:', error);
        
        // Extract and format error message
        let errorMessage = this.extractErrorMessage(error);
        throw new Error(errorMessage || 'Failed to generate character class');
      })
    );
  }
  
  /**
   * Extracts error messages from OpenAI API errors with consistent formatting
   * 
   * @param error The error response from OpenAI API
   * @returns A formatted error message
   * @private
   */
  private extractErrorMessage(error: any): string {
    const errorMessage = ErrorUtils.extractErrorMessage(error);
    
    if (error.error?.error?.type === 'insufficient_quota' || 
        errorMessage.toLowerCase().includes('billing') || 
        errorMessage.toLowerCase().includes('quota')) {
      return `Billing or quota exceeded: ${errorMessage}`;
    } else if (error.status === 401) {
      return APP_CONSTANTS.ERROR_MESSAGES.AUTHENTICATION_FAILED;
    } else if (error.status === 429) {
      return APP_CONSTANTS.ERROR_MESSAGES.RATE_LIMIT_EXCEEDED;
    }
    
    return errorMessage;
  }  /**
   * Generates a character backstory based on character details
   * 
   * @param character The character object with race, class, and game information
   * @returns An Observable with the generated backstory text
   */  generateBackstory(character: Character): Observable<string> {
    if (!this.apiKey) {
      return of(`${character.race.name} ${character.class.name} from ${character.game} has a mysterious past...`);
    }
    
    const headers = this.getHeaders();
    
    // Get the biological sex from character options if available
    const characterSex = character.sex || 'Male'; // Default to Male if not specified
    const characterAge = character.age || 'Adult';
    const characterDeity = character.deity || 'None';
    const characterBackground = character.background || 'Common';
    const characterPrestige = character.prestige || 'Unknown';
    const characterMotivation = character.motivation || 'Adventure';
    
    const prompt = `Create a concise backstory for an Elder Scrolls character with the following details:
      - Game: ${character.game}
      - Race: ${character.race.name}
      - Biological Sex: ${characterSex}
      - Age: ${characterAge}
      - Social Background: ${characterBackground}
      - Fame/Prestige Level: ${characterPrestige}
      - Class: ${character.class.name}
      - Skills: ${this.formatSkillsForPrompt(character.class.skills, character.game)}
      - Deity/Religion: ${characterDeity}
      - Primary Motivation: ${characterMotivation}
      
      Write a THIRD-PERSON narrative (not first-person) in the style of a D&D character biography. 
      
      CRITICAL REQUIREMENTS - FOLLOW THESE EXACTLY:
      - Start with "You are [Character Name] the [race]."
      - Generate a lore-appropriate Elder Scrolls name for the character based on their race
      - Write in third-person perspective (use character's name, "they", "he", or "she" - never use "I" or "my")
      - MUST reflect the character's age (${characterAge}) - mention their approximate age or life stage
      - MUST reflect their social background (${characterBackground}) - this is their origin/upbringing
      - MUST reflect their fame/prestige level (${characterPrestige}) - how well-known or respected they are
      - MUST incorporate their deity/religious beliefs (${characterDeity}) if not "None"
      - MUST center the backstory around their PRIMARY MOTIVATION: ${characterMotivation}
      - The backstory MUST explain WHY this motivation drives them based on their background and experiences
      - Keep it concise (3-4 short paragraphs maximum)
      - Add double line breaks between paragraphs for readability
      - Make it read like a character description/biography, not a journal entry
      - Include origin, key life events, and current situation
      - Reflect the character's biological sex appropriately (use "he/his" for male, "she/her" for female)
      - Keep it lore-friendly to the Elder Scrolls universe
      
      Example tone: "You are James the Imperial. Born into nobility, James was raised with wealth and privilege..."`;
    
    const body = {
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a creative writer specializing in Elder Scrolls lore and character backstories."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8
    };
    
    return this.http.post<any>(this.chatCompletionsUrl, body, { headers }).pipe(
      map(response => response.choices[0].message.content),
      catchError(error => {
        console.error('Error generating backstory:', error);
        const errorMessage = this.extractErrorMessage(error);
        throw new Error(errorMessage || 'Failed to generate character backstory');
      })
    );
  }
  /**
   * Generates a character portrait image using DALL-E 3
   * 
   * @param character The character object with race, class, and game information
   * @returns An Observable with the generated image URL
   */  generateCharacterImage(character: Character): Observable<string> {
    if (!this.apiKey) {
      return of('');
    }
    
    const headers = this.getHeaders();
      // Build race-specific description
    let raceDescription = '';
    switch(character.race.name.toLowerCase()) {
      case 'argonian':
        raceDescription = 'with reptilian features, scales, horns, and a lizard-like appearance exactly as depicted in Elder Scrolls games';
        break;
      case 'khajiit':
        raceDescription = 'with feline features, fur, cat-like face, and distinctive Khajiit appearance from Elder Scrolls games';
        break;
      case 'nord':
        raceDescription = 'with rugged features, fair skin, and strong Nordic features as depicted in Elder Scrolls games';
        break;
      case 'imperial':
        raceDescription = 'with Mediterranean features, light to tan skin, and the classic Imperial appearance from Elder Scrolls games';
        break;
      case 'breton':
        raceDescription = 'with European features, light skin, and the classic Breton appearance from Elder Scrolls games';
        break;
      case 'redguard':
        raceDescription = 'with dark skin, athletic build, and the classic Redguard appearance from Elder Scrolls games';
        break;
      case 'altmer':
      case 'high elf':
        raceDescription = 'with high cheekbones, golden/yellowish skin, elongated features, and tall stature as depicted in Elder Scrolls games';
        break;
      case 'dunmer':
      case 'dark elf':
        raceDescription = 'with ashen gray/blue skin, red eyes, sharp features, and the classic Dunmer appearance from Elder Scrolls games';
        break;
      case 'bosmer':
      case 'wood elf':
        raceDescription = 'with tan skin, smaller stature, pointed ears, and the classic Bosmer appearance from Elder Scrolls games';
        break;
      case 'orc':
        raceDescription = 'with green skin, tusks, muscular build, and the classic Orsimer appearance from Elder Scrolls games';
        break;
      default:
        raceDescription = `with the distinctive physical features of ${character.race.name} race as depicted in ${character.game}`;
    }
    
    // Add game-specific art style
    let gameStyle = '';
    switch(character.game) {
      case 'Morrowind':
        gameStyle = 'in Morrowind\'s distinctive art style with appropriate textures and colors from 2002 Elder Scrolls III';
        break;
      case 'Oblivion':
        gameStyle = 'in Oblivion\'s distinctive art style with appropriate textures and colors from 2006 Elder Scrolls IV';
        break;
      case 'Skyrim':
        gameStyle = 'in Skyrim\'s distinctive art style with appropriate textures and colors from 2011 Elder Scrolls V';
        break;
      default:
        gameStyle = `in ${character.game}'s distinctive Elder Scrolls art style`;
    }    // Determine age appearance descriptor based on character age
    let ageDescriptor = '';
    let ageSpecificDetails = '';
    
    if (character.age) {
      switch(character.age.toLowerCase()) {
        case 'young adult':
          ageDescriptor = 'young, youthful appearance';
          ageSpecificDetails = 'with smooth skin, vibrant eyes, little to no facial lines, and a fresh, energetic appearance';
          break;
        case 'adult':
          ageDescriptor = 'adult';
          ageSpecificDetails = 'with fully developed features typical of an adult of their race';
          break;
        case 'middle age':
          ageDescriptor = 'middle-aged with visible signs of aging';
          ageSpecificDetails = 'with moderate wrinkles around the eyes and mouth, some gray/silver streaks in the hair, slightly weathered skin, and mature facial features';
          break;
        case 'elder':
          ageDescriptor = 'elderly with significant aging features';
          ageSpecificDetails = 'with deep wrinkles, pronounced age lines, gray/white hair, age spots, weathered skin texture, and distinguished elder features appropriate for their race';
          break;
        default:
          ageDescriptor = 'adult';
          ageSpecificDetails = 'with fully developed features typical of an adult of their race';
      }
    }
      const prompt = `A single isolated upper body portrait of a ${character.sex || 'Male'} ${character.race.name} ${raceDescription}, ${ageDescriptor || 'adult'}, as a ${character.class.name} from ${character.game}.
      IMPORTANT: The image must be in the EXACT art style of ${character.game} ${gameStyle} - NOT photorealistic but matching the game's aesthetic.
      DO NOT include ANY text, labels, symbols, or watermarks in the image.
      The image must ONLY contain ONE character with no additional characters, companions, or NPCs.
      The character must look EXACTLY like they could be a character created in the actual ${character.game} game, not a generic fantasy character.
      The character must have no headgear or helmet so their face is clearly visible.
      Face should be the focus with good lighting to see details.
      ${character.age ? `The character MUST clearly appear ${ageDescriptor} ${ageSpecificDetails}.` : ''}
      The image should accurately represent ${character.game}'s visual style and the ${character.race.name} race's distinctive physical features exactly as they appear in Elder Scrolls games.`;
    
    const body = {
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024"
    };
    
    return this.http.post<any>(this.imageGenerationUrl, body, { headers }).pipe(
      map(response => response.data[0].url),
      catchError(error => {
        console.error('Error generating image:', error);
        const errorMessage = this.extractErrorMessage(error);
        throw new Error(errorMessage || 'Failed to generate character image');
      })
    );
  }
  
  /**
   * Generates a lore-appropriate name for a character based on race and sex
   * 
   * @param character The character object with race and sex information
   * @returns An Observable with the generated name
   */  generateCharacterName(character: Character): Observable<string> {
    if (!this.apiKey) {
      return of('Adventurer');
    }
    
    const headers = this.getHeaders();
    
    const characterSex = character.sex || 'Male'; // Default to Male if not specified
    
    const prompt = `Generate a complete lore-friendly Elder Scrolls name for a ${characterSex} ${character.race.name} character from ${character.game}. 
      The name should follow Elder Scrolls naming conventions for the ${character.race.name} race.
      Include both first and last names where appropriate for this race (e.g., Redguards, Imperials, Bretons typically have both).
      For races that use titles or clan names (like Argonians or Khajiit), include those in the full name.
      Return only the complete name without any explanation or additional text.`;
    
    const body = {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert on Elder Scrolls lore and naming conventions for different races. Always provide complete names that follow the lore for each race."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7
    };
    
    return this.http.post<any>(this.chatCompletionsUrl, body, { headers }).pipe(
      map(response => {
        const content = response.choices[0].message.content;
        return StringUtils.cleanResponseText(content);
      }),
      catchError(error => {
        console.error('Error generating name:', error);
        const errorMessage = this.extractErrorMessage(error);
        throw new Error(errorMessage || 'Failed to generate character name');
      })
    );
  }

  /**
   * Generates a new class name while keeping the same class description and skills
   * 
   * @param character The character object with existing class information
   * @returns An Observable with the new class name
   */
  generateClassName(character: Character): Observable<string> {
    if (!this.apiKey) {
      return of(character.class.name);
    }
    
    const headers = this.getHeaders();
    
    const skillsDescription = this.formatSkillsForPrompt(character.class.skills, character.game);
    
    const prompt = `Generate a creative and lore-appropriate Elder Scrolls class name for ${character.game}.
      The class has the following characteristics:
      - Description: ${character.class.description}
      - Skills: ${skillsDescription}
      
      The current class name is "${character.class.name}". Generate a DIFFERENT class name that is equally fitting but uses different words or concepts.
      Create a unique class name that captures the essence of these abilities and fits the Elder Scrolls universe.
      The name should be evocative and memorable, similar to canonical class names like "Nightblade", "Spellsword", or "Battlemage".
      Return only the class name without any explanation or additional text.`;
    
    const body = {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert on Elder Scrolls lore and class naming conventions. Create class names that are creative yet fit seamlessly into the Elder Scrolls universe."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8
    };
    
    return this.http.post<any>(this.chatCompletionsUrl, body, { headers }).pipe(
      map(response => {
        const content = response.choices[0].message.content;
        return StringUtils.cleanResponseText(content);
      }),
      catchError(error => {
        console.error('Error generating class name:', error);
        const errorMessage = this.extractErrorMessage(error);
        throw new Error(errorMessage || 'Failed to generate class name');
      })
    );
  }

  /**
   * Generates a backstory that incorporates the character's name
   * 
   * @param character The complete character object including name
   * @returns An Observable with the generated backstory text
   */  generateBackstoryWithName(character: Character): Observable<string> {
    if (!this.apiKey || !character.name) {
      return this.generateBackstory(character);
    }
    
    const headers = this.getHeaders();
    
    const characterSex = character.sex || 'Male';
    const characterAge = character.age || 'Adult';
    const characterDeity = character.deity || 'None';
    const characterBackground = character.background || 'Common';
    const characterPrestige = character.prestige || 'Unknown';
    const characterMotivation = character.motivation || 'Adventure';
      const prompt = `Create a concise backstory for an Elder Scrolls character named ${character.name} with the following details:
      - Name: ${character.name}
      - Game: ${character.game}
      - Race: ${character.race.name}
      - Biological Sex: ${characterSex}
      - Age: ${characterAge}
      - Social Background: ${characterBackground}
      - Prestige/Fame Level: ${characterPrestige}
      - Deity/Religion: ${characterDeity}
      - Primary Motivation: ${characterMotivation}
      - Class: ${character.class.name}
      - Skills: ${this.formatSkillsForPrompt(character.class.skills, character.game)}
      
      Write a THIRD-PERSON narrative (not first-person) in the style of a D&D character biography.
      
      CRITICAL REQUIREMENTS (YOU MUST FOLLOW THESE):
      - MUST reflect their social background (${characterBackground}) - this is their origin/upbringing, NOT just a generic mention
      - MUST reflect their fame/prestige level (${characterPrestige}) - how well-known or respected they are
      - MUST center the backstory around their PRIMARY MOTIVATION: ${characterMotivation}
      - MUST include their deity/religious affiliation: ${characterDeity}
      - MUST reflect their age appropriately: ${characterAge}
      
      IMPORTANT FORMATTING REQUIREMENTS:
      - Start with "You are ${character.name} the ${character.race.name}."
      - Write in third-person perspective (use "${character.name}", "they", "he", or "she" - never use "I" or "my")
      - Keep it concise (3-4 short paragraphs maximum)
      - Add double line breaks between paragraphs for readability
      - Make it read like a character description/biography, not a journal entry
      - Include origin, key life events, and current situation/motivations
      - Reflect the character's biological sex appropriately (use "he/his" for male, "she/her" for female)
      - Keep it lore-friendly to the Elder Scrolls universe
      
      Example tone: "You are James the Imperial. Once a criminal, James was arrested for petty theft at age 12..."`;
    
    const body = {
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a creative writer specializing in Elder Scrolls lore and character backstories."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8
    };
    
    return this.http.post<any>(this.chatCompletionsUrl, body, { headers }).pipe(
      map(response => response.choices[0].message.content),
      catchError(error => {
        console.error('Error generating backstory with name:', error);
        const errorMessage = this.extractErrorMessage(error);
        throw new Error(errorMessage || 'Failed to generate character backstory');
      })
    );
  }
    /**
   * Creates HTTP headers with authorization for OpenAI API requests
   * 
   * @returns HttpHeaders object with Content-Type and Authorization
   * @private
   */
  private getHeaders(): HttpHeaders {
    return new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${this.apiKey}`);
  }
    /**
   * Constructs a prompt for character class generation based on user selections
   * 
   * @param game The selected Elder Scrolls game
   * @param race The selected character race
   * @param options Additional character options
   * @returns A formatted prompt string for the AI
   * @private
   */  private buildCharacterPrompt(game: Game, race: Race, options: CharacterOptions): string {
    // Base prompt content
    let promptContent = `Create a custom Elder Scrolls character class for ${game} with the following details:
      - Race: ${race.name}
      - Biological Sex: ${options.sex}
      - Age: ${options.age}
      - Specialization: ${options.specialization}
      - Armor Preference: ${options.armor}
      - Weapon Preferences: ${options.weapons.join(', ')}`;
      
    // Add magic preferences if provided
    if (options.magicPreference && options.magicPreference.length > 0) {
      promptContent += `\n      - Magic Preferences: ${options.magicPreference.join(', ')}`;
    }
    
    // Add deity if provided
    if (options.deity) {
      promptContent += `\n      - Deity: ${options.deity}`;
    }
      
    promptContent += `\n      - Background: ${options.background}
      - Prestige: ${options.prestige}\n\n`;
    
    // Different skill systems for each game
    if (game === Game.Morrowind) {
      promptContent += `For Morrowind, a character class should have 5 Major Skills and 5 Minor Skills.
      Major Skills represent the character's primary abilities and start at higher values.
      Minor Skills are secondary abilities that are still important but less specialized.\n\n`;
      
      promptContent += `Return the response in the following JSON format:
      {
        "name": "Class Name",
        "description": "A detailed description of the class and its role in the world.",
        "skills": {
          "majorSkills": ["Major Skill 1", "Major Skill 2", "Major Skill 3", "Major Skill 4", "Major Skill 5"],
          "minorSkills": ["Minor Skill 1", "Minor Skill 2", "Minor Skill 3", "Minor Skill 4", "Minor Skill 5"]
        }
      }`;
    } 
    else if (game === Game.Oblivion) {
      promptContent += `For Oblivion, a character class should have 7 Major Skills.
      Major Skills determine when the character levels up and what attribute bonuses are available.\n\n`;
      
      promptContent += `Return the response in the following JSON format:
      {
        "name": "Class Name",
        "description": "A detailed description of the class and its role in the world.",
        "skills": {
          "oblivionMajorSkills": ["Major Skill 1", "Major Skill 2", "Major Skill 3", "Major Skill 4", "Major Skill 5", "Major Skill 6", "Major Skill 7"]
        }
      }`;
    }
    else if (game === Game.Skyrim) {
      promptContent += `For Skyrim, suggest 3-4 Primary Skills as the core focus and 3-4 Secondary Skills as supplementary abilities.
      Skyrim doesn't have formal class skills, but these recommendations help focus character development.\n\n`;
      
      promptContent += `Return the response in the following JSON format:
      {
        "name": "Class Name",
        "description": "A detailed description of the class and its role in the world.",
        "skills": {
          "primarySkills": ["Primary Skill 1", "Primary Skill 2", "Primary Skill 3", "Primary Skill 4"],
          "secondarySkills": ["Secondary Skill 1", "Secondary Skill 2", "Secondary Skill 3", "Secondary Skill 4"]
        }
      }`;
    }
    
    return promptContent;
  }
    /**
   * Provides a fallback character class when API is unavailable
   * 
   * @param game The selected Elder Scrolls game
   * @returns A basic CharacterClass object with game-specific skills
   */
  getFallbackClass(game: Game): CharacterClass {
    let skills: string[] | GameSpecificSkills;

    switch (game) {
      case Game.Morrowind:
        skills = {
          majorSkills: ['Long Blade', 'Medium Armor', 'Restoration', 'Athletics', 'Speechcraft'],
          minorSkills: ['Alchemy', 'Light Armor', 'Short Blade', 'Marksman', 'Alteration']
        };
        break;
      
      case Game.Oblivion:
        skills = {
          oblivionMajorSkills: ['Blade', 'Block', 'Restoration', 'Light Armor', 'Athletics', 'Marksman', 'Speechcraft']
        };
        break;
      
      case Game.Skyrim:
        skills = {
          primarySkills: ['One-handed', 'Light Armor', 'Restoration', 'Speech'],
          secondarySkills: ['Block', 'Archery', 'Sneak', 'Alchemy']
        };
        break;
        
      default:
        // Basic fallback for any unexpected cases
        skills = ['Survival', 'Combat', 'Adaptability'];
    }
    
    return {
      name: 'Adventurer',
      description: 'A versatile character skilled in various abilities.',
      skills: skills,
      gameAvailability: [game]
    };
  }
  /**
   * Replaces a character's name in an existing backstory with a new name
   * 
   * @param backstory The existing character backstory
   * @param oldName The old character name to replace
   * @param newName The new character name
   * @returns Updated backstory with the new character name
   */  replaceNameInBackstory(backstory: string, oldName: string, newName: string): string {
    if (!backstory || !oldName || !newName) {
      return backstory;
    }
    
    // Split old and new names to handle first/last name scenarios intelligently
    const oldNameParts = oldName.split(' ');
    
    // If the old name has multiple parts (first + last), create a more sophisticated replacement
    if (oldNameParts.length > 1) {
      // Full name match - highest priority
      let updatedBackstory = backstory;
      
      // Create a regex that matches the full old name with word boundaries
      const fullNameRegex = new RegExp(`\\b${oldName}\\b`, 'gi');
      updatedBackstory = updatedBackstory.replace(fullNameRegex, newName);
      
      // Create a regex for first name only matches - if first name is used alone in text
      const firstNameRegex = new RegExp(`\\b${oldNameParts[0]}\\b(?!\\s+${oldNameParts.slice(1).join('\\s+')}\\b)`, 'gi');
      updatedBackstory = updatedBackstory.replace(firstNameRegex, newName.split(' ')[0]);
      
      return updatedBackstory;
    } else {
      // Simple single name replacement using word boundaries
      const nameRegex = new RegExp(`\\b${oldName}\\b`, 'gi');
      return backstory.replace(nameRegex, newName);
    }
  }
  
  /**
   * Replaces a character's name in an existing adventure guide with a new name
   * 
   * @param adventureGuide The existing character adventure guide
   * @param oldName The old character name to replace
   * @param newName The new character name
   * @returns Updated adventure guide with the new character name
   */  
  replaceNameInAdventureGuide(adventureGuide: AdventureGuide, oldName: string, newName: string): AdventureGuide {
    if (!adventureGuide || !oldName || !newName) {
      return adventureGuide;
    }
    
    // Escape special characters in the old name for regex safety
    const escapedOldName = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Create two regex patterns:
    // 1. A strict one with word boundaries for complete words
    const strictNameRegex = new RegExp(`\\b${escapedOldName}\\b`, 'gi');
    // 2. A more flexible one for names that might be part of other words or with possessive forms
    const flexibleNameRegex = new RegExp(escapedOldName, 'gi');
    
    // Helper function to apply both regex replacements
    const applyNameReplacement = (text: string): string => {
      if (!text) return text;
      
      // First try strict replacement
      let result = text.replace(strictNameRegex, newName);
      
      // If no replacements were made and this actually contains the name somewhere
      if (result === text && text.toLowerCase().includes(oldName.toLowerCase())) {
        // Try the more flexible pattern
        result = text.replace(flexibleNameRegex, newName);
      }
      
      return result;
    };
    
    // Process quest details to replace name references
    const processQuestDetails = (quest: QuestDetails): QuestDetails => {
      return {
        name: applyNameReplacement(quest.name),
        location: applyNameReplacement(quest.location),
        howToStart: applyNameReplacement(quest.howToStart),
        significance: quest.significance ? applyNameReplacement(quest.significance) : undefined,
        reward: quest.reward ? applyNameReplacement(quest.reward) : undefined
      };
    };
      // Process faction details to replace name references
    const processFactionDetails = (faction: FactionDetails): FactionDetails => {
      return {
        name: applyNameReplacement(faction.name),
        location: applyNameReplacement(faction.location),
        howToJoin: applyNameReplacement(faction.howToJoin),
        benefits: faction.benefits ? applyNameReplacement(faction.benefits) : undefined,
        requirements: faction.requirements ? applyNameReplacement(faction.requirements) : undefined
      };
    };
    
    // Create a new adventure guide object to avoid mutating the original
    return {
      description: applyNameReplacement(adventureGuide.description),
      recommendedQuests: adventureGuide.recommendedQuests.map(quest => processQuestDetails(quest)),
      recommendedFactions: adventureGuide.recommendedFactions.map(faction => processFactionDetails(faction)),
      alignment: applyNameReplacement(adventureGuide.alignment),
      playstyle: applyNameReplacement(adventureGuide.playstyle),
      roleplayTips: applyNameReplacement(adventureGuide.roleplayTips || ''),
      daedricQuests: adventureGuide.daedricQuests ? 
        adventureGuide.daedricQuests.map(quest => processQuestDetails(quest)) : 
        undefined,
      specialNotes: adventureGuide.specialNotes ? applyNameReplacement(adventureGuide.specialNotes) : undefined
    };
  }

  /**
   * Replaces a character's class name in an existing backstory with a new class name
   * 
   * @param backstory The existing character backstory
   * @param oldClassName The old class name to replace
   * @param newClassName The new class name
   * @returns Updated backstory with the new class name
   */
  replaceClassNameInBackstory(backstory: string, oldClassName: string, newClassName: string): string {
    if (!backstory || !oldClassName || !newClassName) {
      return backstory;
    }
    
    // Use word boundaries to ensure we only replace complete class name matches
    const classNameRegex = new RegExp(`\\b${oldClassName}\\b`, 'gi');
    return backstory.replace(classNameRegex, newClassName);
  }

  /**
   * Replaces a character's class name in an existing adventure guide with a new class name
   * 
   * @param adventureGuide The existing character adventure guide
   * @param oldClassName The old class name to replace
   * @param newClassName The new class name
   * @returns Updated adventure guide with the new class name
   */
  replaceClassNameInAdventureGuide(adventureGuide: AdventureGuide, oldClassName: string, newClassName: string): AdventureGuide {
    if (!adventureGuide || !oldClassName || !newClassName) {
      return adventureGuide;
    }
    
    const classNameRegex = new RegExp(`\\b${oldClassName}\\b`, 'gi');
    
    const applyClassNameReplacement = (text: string): string => {
      if (!text) return text;
      return text.replace(classNameRegex, newClassName);
    };
    
    const processQuestDetails = (quest: QuestDetails): QuestDetails => {
      return {
        name: applyClassNameReplacement(quest.name),
        location: applyClassNameReplacement(quest.location),
        howToStart: applyClassNameReplacement(quest.howToStart),
        tips: quest.tips ? applyClassNameReplacement(quest.tips) : undefined,
        significance: quest.significance ? applyClassNameReplacement(quest.significance) : undefined,
        reward: quest.reward ? applyClassNameReplacement(quest.reward) : undefined
      };
    };
    
    const processFactionDetails = (faction: FactionDetails): FactionDetails => {
      return {
        name: applyClassNameReplacement(faction.name),
        location: applyClassNameReplacement(faction.location),
        howToJoin: applyClassNameReplacement(faction.howToJoin),
        benefits: faction.benefits ? applyClassNameReplacement(faction.benefits) : undefined,
        requirements: faction.requirements ? applyClassNameReplacement(faction.requirements) : undefined
      };
    };
    
    return {
      description: applyClassNameReplacement(adventureGuide.description),
      recommendedQuests: adventureGuide.recommendedQuests.map(quest => processQuestDetails(quest)),
      recommendedFactions: adventureGuide.recommendedFactions.map(faction => processFactionDetails(faction)),
      alignment: applyClassNameReplacement(adventureGuide.alignment),
      playstyle: applyClassNameReplacement(adventureGuide.playstyle),
      roleplayTips: applyClassNameReplacement(adventureGuide.roleplayTips || ''),
      daedricQuests: adventureGuide.daedricQuests ? 
        adventureGuide.daedricQuests.map(quest => processQuestDetails(quest)) : 
        undefined,
      specialNotes: adventureGuide.specialNotes ? applyClassNameReplacement(adventureGuide.specialNotes) : undefined
    };
  }

  /**
   * Helper method to format skills for prompts based on the game-specific structure
   * 
   * @param skills The skills object or array from the character class
   * @param game The current game to determine the skill format
   * @returns A formatted string of skills for inclusion in prompts
   * @private
   */
  private formatSkillsForPrompt(skills: string[] | GameSpecificSkills, game: Game): string {
    if (Array.isArray(skills)) {
      return skills.join(', ');
    }
    
    // Handle game-specific skill structures
    switch (game) {
      case Game.Morrowind:
        if (skills.majorSkills && skills.minorSkills) {
          return `Major: ${skills.majorSkills.join(', ')}; Minor: ${skills.minorSkills.join(', ')}`;
        }
        break;
      case Game.Oblivion:
        if (skills.oblivionMajorSkills) {
          return skills.oblivionMajorSkills.join(', ');
        }
        break;
      case Game.Skyrim:
        if (skills.primarySkills && skills.secondarySkills) {
          return `Primary: ${skills.primarySkills.join(', ')}; Secondary: ${skills.secondarySkills.join(', ')}`;
        }
        break;
    }
    
    // Fallback if the structure doesn't match expected format
    return 'Various skills appropriate to class';
  }
  /**
   * Generates an adventure guide for a character with quest recommendations and roleplaying advice
   * 
   * @param character The character to create an adventure guide for
   * @returns Observable with the generated adventure guide
   */
  generateAdventureGuide(character: Character): Observable<AdventureGuide> {
    if (!this.apiKey) {
      console.error('No API key provided for adventure guide generation');
      return of({
        description: 'To generate an adventure guide, please configure your OpenAI API key.',
        recommendedQuests: [],
        recommendedFactions: [],
        alignment: 'Unknown',
        playstyle: 'Unknown',
        roleplayTips: 'Configure your API key to get personalized roleplay tips.'
      });
    }
    
    const prompt = this.buildAdventureGuidePrompt(character);
    const headers = this.getHeaders();
    
    const body = {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system", 
          content: "You are a helpful Elder Scrolls lore expert and game guide. Your task is to provide roleplaying guidance and adventure recommendations for players based on their character. IMPORTANT: Only recommend factions that actually exist in the specific game the character is from."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7
    };
    
    return this.http.post<any>(this.chatCompletionsUrl, body, { headers }).pipe(
      map(response => {
        // Process the response
        const content = response.choices[0].message.content;
        return this.parseAdventureGuideResponse(content, character.game);
      }),
      catchError(error => {
        console.error('Error generating adventure guide:', error);      return of({
          description: 'Unable to generate adventure guide. Please try again later.',
          recommendedQuests: [],
          recommendedFactions: [],
          alignment: 'Unknown',
          playstyle: 'Flexible',
          roleplayTips: 'Try again later for personalized roleplay tips.'
        });
      })
    );
  }
    /**
   * Builds a prompt for generating an adventure guide based on character details
   * 
   * @param character The character to create a prompt for
   * @returns A string prompt for the OpenAI API
   */  private buildAdventureGuidePrompt(character: Character): string {
    let raceInfo = '';
    let skillsInfo = '';
    let factionInfo = '';
    let backstoryInfo = '';
    let daedricQuestsInfo = '';
    let motivationInfo = '';
    
    if (character.race) {
      raceInfo = `Race: ${character.race.name}\n`;
    }
    
    if (character.class && character.class.skills) {
      skillsInfo = `Skills: ${this.formatSkillsForPrompt(character.class.skills, character.game)}\n`;
    }
    
    if (character.backstory) {
      backstoryInfo = `\nCharacter Backstory: ${character.backstory}\n`;
    }
    
    if (character.motivation) {
      motivationInfo = `\nPrimary Motivation: ${character.motivation}\n`;
    }
    
    // Add game-specific faction lists to ensure accuracy
    switch (character.game) {
      case Game.Morrowind:
        factionInfo = `
Available joinable factions in Morrowind:
- Great Houses (can only join one): House Hlaalu, House Redoran, House Telvanni
- Major Factions: Fighter's Guild, Mages Guild, Thieves Guild, Imperial Legion, Imperial Cult, East Empire Company, Tribunal Temple, Morag Tong
- Minor Factions: Twin Lamps, Bal Molagmer
- Main Quest Factions: The Blades, Ashlanders`;
        
        daedricQuestsInfo = `
Daedric Quests in Morrowind:
- Azura's Quest
- Boethiah's Quest
- Malacath's Quest
- Mehrunes Dagon's Quest
- Mephala's Quest
- Molag Bal's Quest
- Sheogorath's Quest`;
        break;
      case Game.Oblivion:
        factionInfo = `
Available joinable factions in Oblivion:
- Dark Brotherhood, Mages Guild, Fighters Guild, Thieves' Guild, Arena, The Blades`;
        
        daedricQuestsInfo = `
Daedric Quests in Oblivion:
- Azura's Shrine Quest
- Boethiah's Shrine Quest
- Clavicus Vile's Shrine Quest
- Hermaeus Mora's Shrine Quest
- Hircine's Shrine Quest
- Malacath's Shrine Quest
- Mephala's Shrine Quest
- Meridia's Shrine Quest
- Molag Bal's Shrine Quest
- Namira's Shrine Quest
- Nocturnal's Shrine Quest
- Peryite's Shrine Quest
- Sanguine's Shrine Quest
- Sheogorath's Shrine Quest
- Vaermina's Shrine Quest`;
        break;
      case Game.Skyrim:
        factionInfo = `
Available joinable factions in Skyrim:
- The Companions, College of Winterhold, Dark Brotherhood, Thieves Guild
- Civil War (choose one): Imperial Legion OR Stormcloaks
- Dawnguard DLC (choose one): Dawnguard OR Volkihar Vampire Clan
- Minor associations: Bards College, Blades, becoming a Thane in various holds`;
        
        daedricQuestsInfo = `
Daedric Quests in Skyrim:
- A Night to Remember (Sanguine)
- Boethiah's Calling
- Discerning the Transmundane (Hermaeus Mora)
- Ill Met by Moonlight (Hircine)
- Pieces of the Past (Mehrunes Dagon)
- The Black Star (Azura)
- The Break of Dawn (Meridia)
- The Cursed Tribe (Malacath)
- The House of Horrors (Molag Bal)
- The Mind of Madness (Sheogorath)
- The Only Cure (Peryite)
- The Taste of Death (Namira)
- The Whispering Door (Mephala)
- Waking Nightmare (Vaermina)`;
        break;
    }
    
    return `Please create a detailed adventure guide for my ${character.game} character with the following details:
  
Name: ${character.name || 'Unnamed Character'}
${raceInfo}
Class: ${character.class?.name || 'Custom Class'}
${skillsInfo}
${character.sex ? 'Sex: ' + character.sex + '\n' : ''}
${character.age ? 'Age: ' + character.age + '\n' : ''}
${character.deity ? 'Deity: ' + character.deity + '\n' : ''}
${motivationInfo}
${backstoryInfo}

${factionInfo}

${daedricQuestsInfo}

Please provide the response in the following JSON format:
{
  "description": "A few sentences describing the overall playstyle and character approach",
  "recommendedQuests": [    {
      "name": "Quest Name", 
      "location": "City/Area where the quest is found",
      "howToStart": "Detailed step-by-step instructions on finding and starting this quest, including specific NPCs to talk to, items needed, and any prerequisites",
      "tips": "Practical tips for completing this quest that would be helpful for this specific character build",
      "significance": "Why this quest matters to the character based on their backstory/motivation",
      "reward": "Notable rewards that align with this character's build or interests"
    },
    ...more quests (3-5 total)
  ],
  "recommendedFactions": [    {
      "name": "Faction Name",
      "location": "Specific cities/regions where this faction can be found",
      "howToJoin": "Detailed step-by-step instructions on how to join this faction, including specific NPCs to talk to, their locations, any quests required, and best level to join",
      "tips": "Practical tips for rising in the ranks and getting the most out of this faction for this character",
      "benefits": "Benefits of joining this faction that align with the character",
      "requirements": "Requirements or skills needed to join or advance in this faction"
    },
    ...2-4 factions total
  ],
  "alignment": "Whether the character should be law-abiding or criminal, good or evil, and why",
  "playstyle": "Combat style recommendations, tactics, and suggested equipment",
  "roleplayTips": "Specific advice for roleplaying this character based on their backstory and motivation",
  "daedricQuests": [    {
      "name": "Daedric Quest Name", 
      "location": "Where to find the Daedric shrine or start the quest",
      "howToStart": "Detailed step-by-step instructions on how to begin this Daedric quest, including specific locations, level requirements, and any special items needed",
      "tips": "Practical advice for this Daedric quest specific to this character's build and skills",
      "significance": "Why this Daedric quest aligns with the character",
      "reward": "The Daedric artifact or reward and why it's beneficial"
    },
    ...if applicable based on character
  ],
  "specialNotes": "Any additional roleplay or gameplay advice"
}

IMPORTANT GUIDELINES:
1. Only recommend factions from the list provided for ${character.game}. Do not suggest factions that don't exist in ${character.game}.
2. DO NOT recommend faction quests in the "recommendedQuests" section. Faction quests should ONLY be suggested implicitly through the "recommendedFactions" section.
3. For each recommended quest, provide EXTREMELY DETAILED information on exactly how to start it:
   - Specify exact locations, building names, and directions to find them
   - List the names of NPCs to speak with
   - Include any prerequisites or level recommendations
   - Mention any items needed or special conditions
   - Add practical tips for this character's build and skills
4. For faction recommendations, provide step-by-step instructions to find and join:
   - Specify exact building locations within cities
   - Name the specific NPCs who handle recruitment
   - List any entry quests or skill checks required
5. Include Daedric quests only if they align with the character's backstory, deity choice, or motivation.
6. Examine the character's motivation (${character.motivation}) and backstory carefully, and heavily incorporate these elements into your recommendations.
7. Focus on creating a coherent roleplaying experience that feels true to the character's background and motivations.
8. For quest recommendations, focus on side quests, Daedric quests, and main story quests that would be appropriate.
9. If the character worships Daedric princes or has power-seeking motivation, definitely include relevant Daedric quests that provide artifacts aligning with their class/skills.
10. The roleplayTips should specifically reference the character's motivation.
11. Make sure to tailor the quest significance to show how it connects to the character's motivation and backstory.
12. For all quests and factions, include a "tips" field with practical advice specific to this character's build.

Remember to ensure all recommendations are specific to ${character.game} and fit with the character's skills, race, class, and backstory.`;
  }
    /**
   * Parses the API response into a structured AdventureGuide object
   * 
   * @param responseText The raw text response from the API
   * @returns A structured AdventureGuide object
   */  
  private parseAdventureGuideResponse(responseText: string, game?: Game): AdventureGuide {
    try {
      const jsonText = StringUtils.extractJsonFromText(responseText);
      if (!jsonText) {
        throw new Error('No JSON found in response');
      }
      
      const parsedResponse = JSON.parse(jsonText);
        // Process recommended factions and validate if game is provided
      let recommendedFactions: FactionDetails[] = [];
      
      if (Array.isArray(parsedResponse.recommendedFactions)) {        // Check if the factions are already in the FactionDetails format or simple strings
        recommendedFactions = parsedResponse.recommendedFactions.map((faction: string | FactionDetails) => {
          // If it's a simple string, convert to FactionDetails format
          if (typeof faction === 'string') {
            return {
              name: faction,
              location: 'Various locations',
              howToJoin: 'Speak to faction representatives',
              tips: 'No specific tips available for this faction.',
              benefits: 'Access to faction-specific quests and resources',
              requirements: 'Skills that match the faction\'s focus'
            };
          }
          
          // Otherwise, use the provided faction details structure
          return {
            name: faction.name || 'Unknown Faction',
            location: faction.location || 'Various locations',
            howToJoin: faction.howToJoin || 'Speak to faction representatives',
            tips: faction.tips,
            benefits: faction.benefits,
            requirements: faction.requirements
          };
        });
      }
      
      // Validate factions if game is provided
      if (game) {
        recommendedFactions = this.validateFactionsForGame(recommendedFactions, game);
      }
      
      // Process recommended quests to ensure they're in the correct format
      let recommendedQuests: QuestDetails[] = [];
      if (Array.isArray(parsedResponse.recommendedQuests)) {
        // Check if the quests are already in the QuestDetails format or simple strings
        recommendedQuests = parsedResponse.recommendedQuests.map((quest: string | QuestDetails) => {          // If it's a simple string, convert to QuestDetails format
          if (typeof quest === 'string') {
            return {
              name: quest,
              location: 'Various locations',
              howToStart: 'Speak to NPCs throughout the game world',
              tips: 'No specific tips available for this quest.',
              significance: 'This quest aligns with your character\'s journey.',
              reward: 'Experience and gold'
            };
          }
          
          // Otherwise, use the provided quest details structure
          // Ensure all required fields are present
          return {
            name: quest.name || 'Unknown Quest',
            location: quest.location || 'Various locations',
            howToStart: quest.howToStart || 'Speak to NPCs throughout the game world',
            tips: quest.tips,
            significance: quest.significance,
            reward: quest.reward
          };
        });
      }
      
      // Process daedric quests if they exist
      let daedricQuests: QuestDetails[] = [];
      if (Array.isArray(parsedResponse.daedricQuests)) {
        daedricQuests = parsedResponse.daedricQuests.map((quest: string | QuestDetails) => {          if (typeof quest === 'string') {
            return {
              name: quest,
              location: 'Daedric shrine or various locations',
              howToStart: 'Find the associated Daedric shrine or NPC',
              tips: 'No specific tips available for this Daedric quest.',
              significance: 'This Daedric quest aligns with your character\'s motivations.',
              reward: 'A powerful Daedric artifact'
            };
          }
          
          return {
            name: quest.name || 'Unknown Daedric Quest',
            location: quest.location || 'Daedric shrine or various locations',
            howToStart: quest.howToStart || 'Find the associated Daedric shrine or NPC',
            tips: quest.tips,
            significance: quest.significance,
            reward: quest.reward
          };
        });
      }
        return {
        description: parsedResponse.description || 'Adventure awaits in the world of Tamriel!',
        recommendedQuests: recommendedQuests,
        recommendedFactions: recommendedFactions,
        alignment: parsedResponse.alignment || 'Neutral',
        playstyle: parsedResponse.playstyle || 'Versatile',
        roleplayTips: parsedResponse.roleplayTips || 'Role-play according to your character\'s background and personality.',
        daedricQuests: daedricQuests.length > 0 ? daedricQuests : undefined,
        specialNotes: parsedResponse.specialNotes
      };
    } catch (error) {
      console.error('Error parsing adventure guide response:', error);
      
      const description = responseText.substring(0, 200) + '...';
        return {        description: description,
        recommendedQuests: [{
          name: 'Error processing quests',
          location: 'Unknown',
          howToStart: 'Please regenerate the adventure guide.'
        }],
        recommendedFactions: [{
          name: 'Error processing factions',
          location: 'Unknown',
          howToJoin: 'Please regenerate the adventure guide.'
        }],
        alignment: 'Neutral',
        playstyle: 'Versatile',
        roleplayTips: 'Role-play according to your character\'s background and personality.'
      };
    }
  }
    /**
   * Validates faction recommendations against available factions for the specific game
   * 
   * @param factions Array of recommended factions
   * @param game The game to validate against
   * @returns Array of validated factions (removing any that don't exist in the game)
   */  private validateFactionsForGame(factions: FactionDetails[], game: Game): FactionDetails[] {
    const morrowindFactions = [
      'house hlaalu', 'house redoran', 'house telvanni', 
      'fighter\'s guild', 'fighters guild', 'mages guild', 'thieves guild', 
      'imperial legion', 'imperial cult', 'east empire company', 'tribunal temple', 
      'morag tong', 'twin lamps', 'bal molagmer', 'the blades', 'blades', 'ashlanders'
    ];
    
    const oblivionFactions = [
      'dark brotherhood', 'mages guild', 'fighters guild', 'thieves\' guild', 
      'thieves guild', 'arena', 'the blades', 'blades'
    ];
    
    const skyrimFactions = [
      'the companions', 'companions', 'college of winterhold', 'dark brotherhood', 
      'thieves guild', 'imperial legion', 'imperials', 'stormcloaks', 
      'dawnguard', 'volkihar', 'volkihar vampire clan', 'vampires',
      'bards college', 'blades', 'thane'
    ];
    
    let validFactions: string[];
    
    // Determine which list to use based on game
    switch (game) {
      case Game.Morrowind:
        validFactions = morrowindFactions;
        break;
      case Game.Oblivion:
        validFactions = oblivionFactions;
        break;
      case Game.Skyrim:
        validFactions = skyrimFactions;
        break;
      default:
        return factions; // If unknown game, return original list
    }
      // Filter factions, keeping only those that exist in the game
    return factions.filter(faction => {
      // Normalize faction name for comparison (lowercase, remove 'the', etc.)
      const normalizedFactionName = faction.name.toLowerCase()
        .replace(/^the\s+/, '').trim();
      
      // Check if this faction or a close match exists in the valid factions list
      return validFactions.some(validFactionName => 
        normalizedFactionName.includes(validFactionName) || 
        validFactionName.includes(normalizedFactionName)
      );    });
  }
}

