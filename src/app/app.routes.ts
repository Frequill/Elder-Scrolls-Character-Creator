import { Routes } from '@angular/router';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { CharacterCreationComponent } from './components/character-creation/character-creation.component';
import { CharacterDetailsComponent } from './components/character-details/character-details.component';
import { SavedCharactersComponent } from './components/saved-characters/saved-characters.component';
import { ApiSettingsComponent } from './components/api-settings/api-settings.component';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'create-character', component: CharacterCreationComponent },
  { path: 'character-details', component: CharacterDetailsComponent },
  { path: 'saved-characters', component: SavedCharactersComponent },
  { path: 'api-settings', component: ApiSettingsComponent },
  { path: '**', redirectTo: '' }
];
