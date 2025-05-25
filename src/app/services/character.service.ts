import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Character, Game, Race, CharacterClass, RACES, CLASSES } from '../models/elder-scrolls.model';
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
}
