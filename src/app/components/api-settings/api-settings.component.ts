import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { OpenaiService } from '../../services/openai.service';

@Component({
  selector: 'app-api-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './api-settings.component.html',
  styleUrl: './api-settings.component.scss'
})
export class ApiSettingsComponent implements OnInit {
  apiKey: string = '';
  showApiKey: boolean = false;
  apiStatus: boolean | null = null;
  isTestingApi: boolean = false;
  hasBilling: boolean | null = null;
  
  // Model testing properties
  gpt4Status: boolean | null = null;
  dallEStatus: boolean | null = null;
  isTestingGpt4: boolean = false;
  isTestingDallE: boolean = false;
  modelErrorMessage: string = '';

  constructor(
    private router: Router,
    private openaiService: OpenaiService,
    private http: HttpClient
  ) {}
  /**
   * Initializes the component and loads any saved API key
   */
  ngOnInit(): void {
    // Load saved API key if available
    const savedKey = this.openaiService.getApiKey();
    if (savedKey) {
      this.apiKey = savedKey;
    }
  }
  
  /**
   * Toggles the visibility of the API key in the input field
   */
  toggleApiKeyVisibility(): void {
    this.showApiKey = !this.showApiKey;
  }
  
  apiErrorMessage: string = '';
    /**
   * Tests the API connection with the entered key
   * Validates the API key format, saves it, and tests the connection
   */
  testApiConnection(): void {
    const trimmedKey = this.apiKey.trim();
    
    if (!trimmedKey) {
      this.apiStatus = false;
      this.apiErrorMessage = 'Please enter an API key';
      this.hasBilling = null;
      return;
    }
    
    // Basic validation of API key format
    if (!this.isValidOpenAIKey(trimmedKey)) {
      this.apiStatus = false;
      this.apiErrorMessage = 'Invalid API key format. OpenAI API keys typically start with "sk-" followed by letters and numbers';
      this.hasBilling = null;
      return;
    }

    this.isTestingApi = true;
    // Reset status before testing
    this.hasBilling = null;
    // Save the API key
    this.openaiService.setApiKey(trimmedKey);

    // Test the connection
    this.openaiService.testConnection().subscribe({
      next: (result) => {
        this.apiStatus = result.success;
        // Check billing status if available in the response
        if (result.success) {
          this.hasBilling = result.hasBilling ?? null;
        } else if (!result.success && result.message) {
          this.apiErrorMessage = result.message;
          // Check if error is related to billing
          if (result.message.toLowerCase().includes('billing') || 
              result.message.toLowerCase().includes('quota') || 
              result.message.toLowerCase().includes('payment')) {
            this.hasBilling = false;
          }
        }
        this.isTestingApi = false;
      },
      error: (err) => {
        console.error('Subscription error:', err);
        this.apiStatus = false;
        this.apiErrorMessage = 'Connection error occurred';
        this.hasBilling = null;
        this.isTestingApi = false;
      }
    });
  }
  
  /**
   * Navigates back to the home page
   */
  returnToHome(): void {
    this.router.navigate(['/']);
  }
  
  /**
   * Validates that the provided string looks like an OpenAI API key
   * OpenAI API keys typically start with 'sk-' and are 51 characters long
   * 
   * @param key The API key to validate
   * @returns true if the key matches the expected format
   */
  private isValidOpenAIKey(key: string): boolean {
    // Check if the key starts with 'sk-' and is the right length
    return key.startsWith('sk-') && key.length >= 40;
  }
  
  /**
   * Clear the API key from input field and storage
   */
  clearApiKey(): void {
    this.apiKey = '';
    this.apiStatus = null;
    this.apiErrorMessage = '';
    this.hasBilling = null;
    this.gpt4Status = null;
    this.dallEStatus = null;
    this.modelErrorMessage = '';
    this.openaiService.clearApiKey();
  }
  /**
   * Tests access to GPT-4 model with the current API key
   * Makes a minimal API request to verify model availability
   */
  testGpt4Access(): void {
    if (!this.apiKey) {
      this.gpt4Status = false;
      this.modelErrorMessage = 'No API key provided';
      return;
    }
    
    this.isTestingGpt4 = true;
    this.modelErrorMessage = '';
    
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${this.apiKey}`);
    
    // Test GPT-4 access with a minimal request
    const body = {
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: "Test model access"
        }
      ],
      max_tokens: 5
    };
    
    this.http.post<any>('https://api.openai.com/v1/chat/completions', body, { headers }).subscribe({
      next: (response) => {
        this.gpt4Status = true;
        this.isTestingGpt4 = false;
      },
      error: (error) => {
        console.error('GPT-4 test failed:', error);
        this.gpt4Status = false;
        this.isTestingGpt4 = false;
        
        if (error.error && error.error.error) {
          this.modelErrorMessage = error.error.error.message || 'Unknown error testing GPT-4 access';
        } else {
          this.modelErrorMessage = 'Failed to test GPT-4 access';
        }
      }
    });
  }
    /**
   * Tests access to DALL-E 3 model with the current API key
   * Makes a minimal API request to verify model availability
   */
  testDallE3Access(): void {
    if (!this.apiKey) {
      this.dallEStatus = false;
      this.modelErrorMessage = 'No API key provided';
      return;
    }
    
    this.isTestingDallE = true;
    this.modelErrorMessage = '';
    
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${this.apiKey}`);
    
    // Test DALL-E 3 access with a minimal request
    // Using quality "standard" and a simple prompt to minimize costs
    const body = {
      model: "dall-e-3",
      prompt: "Test access to DALL-E 3",
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "url"
    };
    
    this.http.post<any>('https://api.openai.com/v1/images/generations', body, { headers }).subscribe({
      next: (response) => {
        this.dallEStatus = true;
        this.isTestingDallE = false;
      },
      error: (error) => {
        console.error('DALL-E 3 test failed:', error);
        this.dallEStatus = false;
        this.isTestingDallE = false;
        
        if (error.error && error.error.error) {
          this.modelErrorMessage = error.error.error.message || 'Unknown error testing DALL-E 3 access';
        } else {
          this.modelErrorMessage = 'Failed to test DALL-E 3 access';
        }
      }
    });
  }
}
