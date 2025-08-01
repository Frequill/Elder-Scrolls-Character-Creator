export const APP_CONSTANTS = {
  STORAGE_KEYS: {
    OPENAI_API_KEY: 'openai_api_key',
    CHARACTERS: 'elder-scrolls-characters'
  },
  
  API_ENDPOINTS: {
    OPENAI_CHAT: 'https://api.openai.com/v1/chat/completions',
    OPENAI_IMAGES: 'https://api.openai.com/v1/images/generations'
  },
  
  UI_CONSTANTS: {
    MODAL_Z_INDEX: 10001,
    OVERLAY_Z_INDEX: 9999,
    MAX_CHARACTER_NAME_LENGTH: 50,
    TOOLTIP_ANIMATION_DURATION: 300
  },
  
  ERROR_MESSAGES: {
    NO_API_KEY: 'OpenAI API key is required for generating character details.',
    API_CONNECTION_FAILED: 'There was a problem connecting to the OpenAI API.',
    INVALID_RESPONSE: 'Received invalid response from OpenAI API.',
    BILLING_ISSUE: 'Your API key is valid, but no active billing or credits were detected.',
    GENERATION_FAILED: 'Failed to generate content. Please try again.',
    AUTHENTICATION_FAILED: 'Authentication failed: Your API key may be invalid.',
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded: Too many requests or exceeded quota.'
  }
} as const;

export const BREAKPOINTS = {
  MOBILE: '768px',
  TABLET: '1024px',
  DESKTOP: '1200px'
} as const;

export const API_KEY_VALIDATION = {
  PREFIX: 'sk-',
  MIN_LENGTH: 40,
  ERROR_MESSAGES: {
    INVALID_FORMAT: 'Invalid API key format. OpenAI API keys typically start with "sk-" followed by letters and numbers',
    CONNECTION_FAILED: 'API connection failed',
    BILLING_REQUIRED: 'API key is valid, but no active billing/credits were detected. You may need to set up billing.'
  }
} as const;
