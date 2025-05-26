import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Character, CharacterClass, Game, Race, CharacterOptions } from '../models/elder-scrolls.model';

@Injectable({
  providedIn: 'root'
})
export class OpenaiService {
  private apiKey: string = '';
  private chatCompletionsUrl = 'https://api.openai.com/v1/chat/completions';
  private imageGenerationUrl = 'https://api.openai.com/v1/images/generations';
  /**
   * Initializes the service and loads the API key from local storage if available
   * @param http The Angular HttpClient for API communication
   */
  constructor(private http: HttpClient) { 
    this.loadApiKeyFromStorage();
  }
  
  /**
   * Loads saved API key from localStorage if available
   * @private
   */
  private loadApiKeyFromStorage(): void {
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      this.apiKey = savedApiKey;
    }
  }
    /**
   * Sets and stores the API key in local storage
   * @param key The OpenAI API key to store
   */
  setApiKey(key: string): void {
    this.apiKey = key;
    localStorage.setItem('openai_api_key', key);
  }
  
  /**
   * Retrieves the current API key
   * @returns The currently set API key
   */
  getApiKey(): string {
    return this.apiKey;
  }
  
  /**
   * Clears the API key from memory and local storage
   */
  clearApiKey(): void {
    this.apiKey = '';
    localStorage.removeItem('openai_api_key');
  }
  /**
 * Tests the API connection and checks billing status.
 * Validates API key functionality and billing status by making a minimal request.
 * 
 * @returns Observable with the test results, including success status, message, and billing status
 */
  testConnection(): Observable<{success: boolean, message?: string, hasBilling?: boolean}> {
    if (!this.apiKey) {
      return of({success: false, message: 'No API key provided'});
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
        // Check if the response has the expected structure
        if (response && response.choices && response.choices.length > 0) {
          // Successful response indicates valid API key and active billing/credits
          return {success: true, hasBilling: true, message: 'Connection successful with valid billing'};
        } else {
          // Unexpected response format
          return {success: false, message: 'Received invalid response from OpenAI API'};
        }
      }),
      catchError(error => {
        console.error('API test failed:', error);
        let errorMessage = 'Unknown error occurred';
        let hasBilling: boolean | undefined = undefined;
        
        if (error.error && error.error.error) {
          // Handle OpenAI specific error format
          errorMessage = error.error.error.message || error.error.error.type;
          
          // Check for billing-related errors
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
    let errorMessage = '';
    
    if (error.error && error.error.error) {
      errorMessage = error.error.error.message || error.error.error.type;
      
      // Handle specific OpenAI error types
      if (error.error.error.type === 'insufficient_quota' || 
          errorMessage.toLowerCase().includes('billing') || 
          errorMessage.toLowerCase().includes('quota')) {
        return 'Billing or quota exceeded: ' + errorMessage;
      } else if (error.status === 401) {
        return 'Authentication failed: Your API key may be invalid.';
      } else if (error.status === 429) {
        return 'Rate limit exceeded: Too many requests or exceeded quota. Please check your billing status.';
      }
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
    
    const prompt = `Create a detailed backstory for an Elder Scrolls character with the following details:
      - Game: ${character.game}
      - Race: ${character.race.name}
      - Biological Sex: ${characterSex}
      - Class: ${character.class.name}
      - Skills: ${character.class.skills.join(', ')}
      
      Please write a first-person narrative of this character's origin, motivations, and how they came to be an adventurer in the world of ${character.game}. 
      Make sure the backstory reflects the character's biological sex.
      Keep the backstory lore-friendly to the Elder Scrolls universe.`;
    
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
      return of('/assets/placeholder-character.png');
    }
    
    const headers = this.getHeaders();
    
    const prompt = `A detailed upper body portrait of a ${character.sex || 'Male'} ${character.race.name} ${character.class.name} from ${character.game}. 
      The image must be in the exact art style of ${character.game} and look like it could be a character created in the actual ${character.game} game. 
      The character must have no headgear or helmet so their face is clearly visible. 
      Face should be the focus with good lighting to see details. 
      The image should accurately represent ${character.game}'s visual style and the ${character.race.name} race's distinctive features.`;
    
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
    return `Create a custom Elder Scrolls character class for ${game} with the following details:
      - Race: ${race.name}
      - Biological Sex: ${options.sex}
      - Age: ${options.age}
      - Specialization: ${options.specialization}
      - Armor Preference: ${options.armor}
      - Weapon Preferences: ${options.weapons.join(', ')}
      - Background: ${options.background}
      - Prestige: ${options.prestige}
      
      Please create a unique class name, description, and 5-7 skills that would be appropriate for this character in ${game}.
      Return the response in the following JSON format:
      {
        "name": "Class Name",
        "description": "A detailed description of the class and its role in the world.",
        "skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"]
      }`;
  }
  
  /**
   * Provides a fallback character class when API is unavailable
   * 
   * @param game The selected Elder Scrolls game
   * @returns A basic CharacterClass object
   * @private
   */
  private getFallbackClass(game: Game): CharacterClass {
    return {
      name: 'Adventurer',
      description: 'A versatile character skilled in various abilities.',
      skills: ['Survival', 'Combat', 'Adaptability'],
      gameAvailability: [game]
    };
  }
}
