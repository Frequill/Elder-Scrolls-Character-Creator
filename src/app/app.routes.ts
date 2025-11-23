import { Routes } from '@angular/router';

export const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./components/landing-page/landing-page.component').then(m => m.LandingPageComponent)
  },
  { 
    path: 'create-character', 
    loadComponent: () => import('./components/character-creation/character-creation.component').then(m => m.CharacterCreationComponent)
  },
  { 
    path: 'character-details', 
    loadComponent: () => import('./components/character-details/character-details.component').then(m => m.CharacterDetailsComponent)
  },
  { 
    path: 'saved-characters', 
    loadComponent: () => import('./components/saved-characters/saved-characters.component').then(m => m.SavedCharactersComponent)
  },
  { 
    path: 'api-settings', 
    loadComponent: () => import('./components/api-settings/api-settings.component').then(m => m.ApiSettingsComponent)
  },
  { path: '**', redirectTo: '' }
];
