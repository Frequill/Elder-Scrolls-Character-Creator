import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Character, Game, Race, CharacterClass, RACES, CLASSES, AdventureGuide } from '../models';
import { OpenaiService } from './openai.service';

@Injectable({
  providedIn: 'root'
})
export class CharacterService {
  private currentCharacterSubject = new BehaviorSubject<Character | null>(null);
  public currentCharacter$ = this.currentCharacterSubject.asObservable();
  constructor(private openaiService: OpenaiService) { }

  getRacesByGame(game: Game): Race[] {
    return RACES.filter(race => race.gameAvailability.includes(game));
  }

  getClassesByGame(game: Game): CharacterClass[] {
    return CLASSES.filter(characterClass => characterClass.gameAvailability.includes(game));  }

  setCurrentCharacter(character: Character): void {
    this.currentCharacterSubject.next(character);
  }

  getCurrentCharacter(): Character | null {
    return this.currentCharacterSubject.value;  }

  clearCurrentCharacter(): void {
    this.currentCharacterSubject.next(null);
  }

  generateBackstory(character: Character): Observable<string> {
    return this.openaiService.generateBackstory(character);  }

  generateCharacterImage(character: Character): Observable<string> {
    return this.openaiService.generateCharacterImage(character);
  }

  generateCharacterName(character: Character): Observable<string> {
    return this.openaiService.generateCharacterName(character);
  }
  
  generateBackstoryWithName(character: Character): Observable<string> {
    return this.openaiService.generateBackstoryWithName(character);
  }
  replaceNameInBackstory(backstory: string, oldName: string, newName: string): string {
    return this.openaiService.replaceNameInBackstory(backstory, oldName, newName);
  }
  
  replaceNameInAdventureGuide(adventureGuide: AdventureGuide, oldName: string, newName: string): AdventureGuide {
    return this.openaiService.replaceNameInAdventureGuide(adventureGuide, oldName, newName);
  }

  generateClassName(character: Character): Observable<string> {
    return this.openaiService.generateClassName(character);
  }

  replaceClassNameInBackstory(backstory: string, oldClassName: string, newClassName: string): string {
    return this.openaiService.replaceClassNameInBackstory(backstory, oldClassName, newClassName);
  }

  replaceClassNameInAdventureGuide(adventureGuide: AdventureGuide, oldClassName: string, newClassName: string): AdventureGuide {
    return this.openaiService.replaceClassNameInAdventureGuide(adventureGuide, oldClassName, newClassName);
  }

  generateAdventureGuide(character: Character): Observable<AdventureGuide> {
    return this.openaiService.generateAdventureGuide(character);
  }
}
