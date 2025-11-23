export enum Game {
  Morrowind = 'Morrowind',
  Oblivion = 'Oblivion',
  Skyrim = 'Skyrim'
}

export interface Race {
  name: string;
  description: string;
  gameAvailability: Game[];
}

export interface GameSpecificSkills {
  majorSkills?: string[];
  minorSkills?: string[];
  oblivionMajorSkills?: string[];
  primarySkills?: string[];
  secondarySkills?: string[];
}

export interface CharacterClass {
  name: string;
  description: string;
  skills: string[] | GameSpecificSkills;
  gameAvailability: Game[];
}

export enum CharacterMotivation {
  Power = 'Power',
  Knowledge = 'Knowledge',
  Wealth = 'Wealth',
  Fame = 'Fame',
  Justice = 'Justice',
  Revenge = 'Revenge',
  Freedom = 'Freedom',
  Family = 'Family',
  Love = 'Love',
  Redemption = 'Redemption',
  Survival = 'Survival',
  Adventure = 'Adventure'
}

export interface CharacterOptions {
  sex: string;
  age: string;
  specialization: string;
  armor: string;
  weapons: string[];
  magicPreference: string[];
  deity: string;
  background: string;
  prestige: string;
  motivation: string;
}

export interface Character {
  name?: string;
  game: Game;
  race: Race;
  class: CharacterClass;
  sex?: string;
  age?: string;
  deity?: string;
  background?: string;
  prestige?: string;
  motivation?: string;
  backstory?: string;
  imageUrl?: string;
  adventureGuide?: AdventureGuide;
}

export interface QuestDetails {
  name: string;
  location: string;
  howToStart: string;
  tips?: string;
  significance?: string;
  reward?: string;
}

export interface FactionDetails {
  name: string;
  location: string;
  howToJoin: string;
  tips?: string;
  benefits?: string;
  requirements?: string;
}

export interface AdventureGuide {
  description: string;
  recommendedQuests: QuestDetails[];
  recommendedFactions: FactionDetails[];
  alignment: string;
  playstyle: string;
  roleplayTips?: string;
  daedricQuests?: QuestDetails[];
  specialNotes?: string;
}
