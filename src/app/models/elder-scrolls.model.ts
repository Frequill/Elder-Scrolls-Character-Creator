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

export interface CharacterClass {
  name: string;
  description: string;
  skills: string[];
  gameAvailability: Game[];
}

export interface Character {
  name?: string;
  race: Race;
  class: CharacterClass;
  game: Game;
  sex?: string;
  backstory?: string;
  imageUrl?: string;
}

/**
 * Options for custom character class generation
 */
export interface CharacterOptions {
  sex: string;
  age: string;
  specialization: string;
  armor: string;
  weapons: string[];
  background: string;
  prestige: string;
}

export const SEX_OPTIONS = [
  'Male',
  'Female'
];

export const AGE_OPTIONS = [
  'Young Adult',
  'Adult',
  'Middle Age',
  'Elder'
];

export const SPECIALIZATION_OPTIONS = [
  'Combat',
  'Magic',
  'Stealth'
];

export const ARMOR_OPTIONS = {
  [Game.Morrowind]: ['Heavy', 'Medium', 'Light'],
  [Game.Oblivion]: ['Heavy', 'Light'],
  [Game.Skyrim]: ['Heavy', 'Light']
};

export const WEAPON_OPTIONS = {
  [Game.Morrowind]: [
    'One-handed Sword', 
    'One-handed Axe', 
    'One-handed Mace', 
    'Two-handed Sword', 
    'Two-handed Axe', 
    'Two-handed Mace', 
    'Dagger', 
    'Bow/Marksman', 
    'Spear', 
    'Unarmed'
  ],
  [Game.Oblivion]: [
    'One-handed Sword', 
    'One-handed Axe', 
    'One-handed Mace', 
    'Two-handed Sword', 
    'Two-handed Axe', 
    'Two-handed Mace', 
    'Dagger', 
    'Bow/Marksman', 
    'Unarmed'
  ],
  [Game.Skyrim]: [
    'One-handed Sword', 
    'One-handed Axe', 
    'One-handed Mace', 
    'Two-handed Sword', 
    'Two-handed Axe', 
    'Two-handed Mace', 
    'Dagger', 
    'Bow/Archery'
  ]
};

/**
 * Background options for character creation
 */
export const BACKGROUND_OPTIONS = [
  'Petty Criminal',
  'Outlaw',
  'Knight',
  'Mercenary',
  'Student',
  'Farmer'
];

export const PRESTIGE_OPTIONS = [
  'Unknown',
  'Famous'
];

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

/**
 * Common classes across Elder Scrolls games
 */
export const CLASSES: CharacterClass[] = [
  {
    name: 'Warrior',
    description: 'A master of melee combat skilled in armor and weapons.',
    skills: ['Block', 'Heavy Armor', 'One-handed', 'Two-handed'],
    gameAvailability: [Game.Morrowind, Game.Oblivion, Game.Skyrim]
  },
  {
    name: 'Mage',
    description: 'A practitioner of the arcane arts focusing on spell casting.',
    skills: ['Alteration', 'Conjuration', 'Destruction', 'Illusion', 'Restoration'],
    gameAvailability: [Game.Morrowind, Game.Oblivion, Game.Skyrim]
  },
  {
    name: 'Thief',
    description: 'A master of stealth, lockpicking, and pickpocketing.',
    skills: ['Light Armor', 'Sneak', 'Lockpicking', 'Pickpocket', 'Speech'],
    gameAvailability: [Game.Morrowind, Game.Oblivion, Game.Skyrim]
  },
  {
    name: 'Assassin',
    description: 'Specializes in stealth, poison, and taking targets down quietly.',
    skills: ['Sneak', 'One-handed', 'Alchemy', 'Light Armor'],
    gameAvailability: [Game.Morrowind, Game.Oblivion, Game.Skyrim]
  },
  {
    name: 'Battlemage',
    description: 'Combines magic with combat prowess for a deadly combination.',
    skills: ['Destruction', 'Conjuration', 'Heavy Armor', 'One-handed'],
    gameAvailability: [Game.Morrowind, Game.Oblivion, Game.Skyrim]
  },
  {
    name: 'Scout',
    description: 'A wilderness expert skilled in archery and survival.',
    skills: ['Archery', 'Light Armor', 'Sneak', 'Alchemy'],
    gameAvailability: [Game.Morrowind, Game.Oblivion, Game.Skyrim]
  },
  {
    name: 'Spellsword',
    description: 'Balances swordplay with magical abilities.',
    skills: ['One-handed', 'Destruction', 'Restoration', 'Alteration'],
    gameAvailability: [Game.Morrowind, Game.Oblivion, Game.Skyrim]
  },
  {
    name: 'Nightblade',
    description: 'Combines stealth with magic for deadly surprise attacks.',
    skills: ['Sneak', 'Illusion', 'One-handed', 'Destruction'],
    gameAvailability: [Game.Morrowind, Game.Oblivion, Game.Skyrim]
  }
];
