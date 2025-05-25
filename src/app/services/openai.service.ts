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

  constructor(private http: HttpClient) { 
    // Try to load API key from localStorage
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      this.apiKey = savedApiKey;
    }
  }
  
  // Set and store API key
  setApiKey(key: string): void {
    this.apiKey = key;
    localStorage.setItem('openai_api_key', key);
  }
  
  // Get current API key
  getApiKey(): string {
    return this.apiKey;
  }
  
  // Clear API key
  clearApiKey(): void {
    this.apiKey = '';
    localStorage.removeItem('openai_api_key');
  }
  // Test API connection and check billing status
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
          content: "Hello, this is a test message to verify API connection."
        }
      ],
      max_tokens: 10
    };
    
    return this.http.post<any>(this.chatCompletionsUrl, body, { headers }).pipe(
      map(response => {
        console.log('API test successful:', response);
        // Check if we got a valid response with expected structure
        if (response && response.choices && response.choices.length > 0) {
          // If we received a successful response, it means both the API key is valid 
          // and there is active billing/sufficient credits on the account
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
    // Generate character class and description
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
        
        // Enhanced error handling to provide more specific error messages
        let errorMessage = '';
        if (error.error && error.error.error) {
          errorMessage = error.error.error.message || error.error.error.type;
          
          // Handle specific OpenAI error types
          if (error.error.error.type === 'insufficient_quota' || 
              errorMessage.includes('billing') || 
              errorMessage.includes('quota')) {
            throw new Error('Billing or quota exceeded: ' + errorMessage);
          } else if (error.status === 401) {
            throw new Error('Authentication failed: Your API key may be invalid.');
          } else if (error.status === 429) {
            throw new Error('Rate limit exceeded: Too many requests or exceeded quota. Please check your billing status.');
          }
        }
        
        // Fallback with generic error if no specific error was identified
        throw new Error(errorMessage || 'Failed to generate character class');
      })
    );
  }
  // Generate character backstory
  generateBackstory(character: Character): Observable<string> {
    if (!this.apiKey) {
      return of(`${character.race.name} ${character.class.name} from ${character.game} has a mysterious past...`);
    }
    
    const headers = this.getHeaders();
    
    const prompt = `Create a detailed backstory for an Elder Scrolls character with the following details:
      - Game: ${character.game}
      - Race: ${character.race.name}
      - Class: ${character.class.name}
      - Skills: ${character.class.skills.join(', ')}
      
      Please write a first-person narrative of this character's origin, motivations, and how they came to be an adventurer in the world of ${character.game}. Keep the backstory lore-friendly to the Elder Scrolls universe.`;
    
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
        
        // Enhanced error handling to check for specific errors
        let errorMessage = '';
        if (error.error && error.error.error) {
          errorMessage = error.error.error.message || error.error.error.type;
          
          // Handle specific OpenAI error types
          if (error.error.error.type === 'insufficient_quota' || 
              errorMessage.includes('billing') || 
              errorMessage.includes('quota')) {
            throw new Error('Billing or quota exceeded: ' + errorMessage);
          } else if (error.status === 401) {
            throw new Error('Authentication failed: Your API key may be invalid.');
          } else if (error.status === 429) {
            throw new Error('Rate limit exceeded: Too many requests or exceeded quota. Please check your billing status.');
          }
        }
        
        // If we can't determine a specific error, throw a generic one
        throw new Error(errorMessage || 'Failed to generate character backstory');
      })
    );
  }
    // Generate character image
  generateCharacterImage(character: Character): Observable<string> {
    if (!this.apiKey) {
      return of('/assets/placeholder-character.png');
    }
    
    const headers = this.getHeaders();
    
    const prompt = `A detailed portrait of an Elder Scrolls ${character.race.name} ${character.class.name} from ${character.game}, 
      fantasy style, high detail, in-game style, character portrait`;
    
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
        
        // Enhanced error handling for image generation
        let errorMessage = '';
        if (error.error && error.error.error) {
          errorMessage = error.error.error.message || error.error.error.type;
          
          // Handle specific OpenAI error types
          if (error.error.error.type === 'insufficient_quota' || 
              errorMessage.includes('billing') || 
              errorMessage.includes('quota')) {
            throw new Error('Billing or quota exceeded: ' + errorMessage);
          } else if (error.status === 401) {
            throw new Error('Authentication failed: Your API key may be invalid.');
          } else if (error.status === 429) {
            throw new Error('Rate limit exceeded: Too many requests or exceeded quota. Please check your billing status.');
          }
        }
        
        // Throw a more specific error
        throw new Error(errorMessage || 'Failed to generate character image');
      })
    );
  }
  
  // Helper methods
  private getHeaders(): HttpHeaders {
    return new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${this.apiKey}`);
  }
  
  private buildCharacterPrompt(game: Game, race: Race, options: CharacterOptions): string {
    return `Create a custom Elder Scrolls character class for ${game} with the following details:
      - Race: ${race.name}
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
  
  private getFallbackClass(game: Game): CharacterClass {
    return {
      name: 'Adventurer',
      description: 'A versatile character skilled in various abilities.',
      skills: ['Survival', 'Combat', 'Adaptability'],
      gameAvailability: [game]
    };
  }
}
