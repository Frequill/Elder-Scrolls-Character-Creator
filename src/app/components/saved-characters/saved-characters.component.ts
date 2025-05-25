import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { CharacterService } from '../../services/character.service';
import { Character } from '../../models/elder-scrolls.model';

@Component({
  selector: 'app-saved-characters',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './saved-characters.component.html',
  styleUrl: './saved-characters.component.scss'
})
export class SavedCharactersComponent implements OnInit {
  characters: { id: string; character: Character }[] = [];

  constructor(
    private router: Router,
    private storageService: StorageService,
    private characterService: CharacterService
  ) {}
  ngOnInit(): void {
    this.loadCharacters();
  }

  loadCharacters(): void {
    const charactersObj = this.storageService.getAllCharacters();
    this.characters = Object.entries(charactersObj).map(([id, character]) => ({
      id,
      character    }));
  }

  loadCharacter(character: Character): void {
    this.characterService.setCurrentCharacter(character);
    this.router.navigate(['/character-details']);  }

  deleteCharacter(id: string, event: Event): void {
    event.stopPropagation(); // Prevent the click from bubbling up to the parent
    if (confirm('Are you sure you want to delete this character?')) {
      this.storageService.deleteCharacterById(id);
      this.loadCharacters();
    }  }

  returnToHome(): void {
    this.router.navigate(['/']);
  }

  createNewCharacter(): void {
    this.router.navigate(['/create-character']);
  }
}
