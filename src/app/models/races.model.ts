import { Race, Game } from './character.model';

export const RACES: Race[] = [
  {
    name: 'Altmer (High Elf)',
    description: 'The High Elves are the most magically gifted of all races.',
    gameAvailability: [Game.Morrowind, Game.Oblivion, Game.Skyrim]
  },
  {
    name: 'Argonian',
    description: 'The Argonians are amphibious reptilian people with natural resistance to disease and the ability to breathe underwater.',
    gameAvailability: [Game.Morrowind, Game.Oblivion, Game.Skyrim]
  },
  {
    name: 'Bosmer (Wood Elf)',
    description: 'The Wood Elves are nimble and quick, making them excellent archers and scouts.',
    gameAvailability: [Game.Morrowind, Game.Oblivion, Game.Skyrim]
  },
  {
    name: 'Breton',
    description: 'Bretons are a hybrid race with both human and elven ancestry, giving them a natural affinity for magic and spell resistance.',
    gameAvailability: [Game.Morrowind, Game.Oblivion, Game.Skyrim]
  },
  {
    name: 'Dunmer (Dark Elf)',
    description: 'The Dark Elves are known for their intelligence, agility, and natural affinity with fire.',
    gameAvailability: [Game.Morrowind, Game.Oblivion, Game.Skyrim]
  },
  {
    name: 'Imperial',
    description: 'Natives of Cyrodiil, Imperials are well-educated and skilled diplomats known for their discipline and training.',
    gameAvailability: [Game.Morrowind, Game.Oblivion, Game.Skyrim]
  },
  {
    name: 'Khajiit',
    description: 'The cat-like Khajiit are known for their stealth, agility, and night vision.',
    gameAvailability: [Game.Morrowind, Game.Oblivion, Game.Skyrim]
  },
  {
    name: 'Nord',
    description: 'The Nords are a tall and fair-haired people from Skyrim who are strong, willful, and resistant to cold.',
    gameAvailability: [Game.Morrowind, Game.Oblivion, Game.Skyrim]
  },
  {
    name: 'Orc',
    description: 'Orcs are known for their remarkable strength and endurance.',
    gameAvailability: [Game.Morrowind, Game.Oblivion, Game.Skyrim]
  },
  {
    name: 'Redguard',
    description: 'Redguards are the most naturally talented warriors in Tamriel with great athleticism and combat proficiency.',
    gameAvailability: [Game.Morrowind, Game.Oblivion, Game.Skyrim]
  }
];
