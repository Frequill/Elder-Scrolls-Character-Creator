import { Injectable } from '@angular/core';
import { Character } from '../models';
import { APP_CONSTANTS } from '../shared/constants';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly STORAGE_KEY = APP_CONSTANTS.STORAGE_KEYS.CHARACTERS;
  constructor() { }

  saveCharacter(character: Character): void {
    // Generate a unique ID if the character doesn't have a name
    const characterId = character.name || `${character.race.name}-${character.class.name}-${Date.now()}`;
    
    const characters = this.getAllCharacters();
    characters[characterId] = character;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(characters));
  }
  getAllCharacters(): Record<string, Character> {
    const charactersJson = localStorage.getItem(this.STORAGE_KEY);
    return charactersJson ? JSON.parse(charactersJson) : {};
  }

  getCharacterById(id: string): Character | null {
    const characters = this.getAllCharacters();
    return characters[id] || null;  }

  deleteCharacterById(id: string): void {
    const characters = this.getAllCharacters();
    if (characters[id]) {
      delete characters[id];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(characters));
    }
  }

  clearAllCharacters(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
