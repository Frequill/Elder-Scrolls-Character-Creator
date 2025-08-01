import { CharacterClass, Game } from './character.model';

export const CLASSES: CharacterClass[] = [
  {
    name: 'Warrior',
    description: 'A master of melee combat skilled in armor and weapons.',
    skills: {
      majorSkills: ['Long Blade', 'Axe', 'Heavy Armor', 'Medium Armor', 'Block'],
      minorSkills: ['Armorer', 'Blunt Weapon', 'Athletics', 'Acrobatics', 'Speechcraft'],
      oblivionMajorSkills: ['Blade', 'Blunt', 'Heavy Armor', 'Block', 'Armorer', 'Athletics', 'Hand to Hand'],
      primarySkills: ['One-handed', 'Two-handed', 'Heavy Armor', 'Block'],
      secondarySkills: ['Smithing', 'Speech', 'Enchanting']
    },
    gameAvailability: [Game.Morrowind, Game.Oblivion, Game.Skyrim]
  },
  {
    name: 'Mage',
    description: 'A practitioner of the arcane arts focusing on spell casting.',
    skills: {
      majorSkills: ['Destruction', 'Alteration', 'Illusion', 'Mysticism', 'Restoration'],
      minorSkills: ['Conjuration', 'Enchant', 'Alchemy', 'Unarmored', 'Short Blade'],
      oblivionMajorSkills: ['Destruction', 'Alteration', 'Illusion', 'Mysticism', 'Restoration', 'Conjuration', 'Alchemy'],
      primarySkills: ['Destruction', 'Alteration', 'Illusion', 'Restoration'],
      secondarySkills: ['Conjuration', 'Enchanting', 'Speechcraft']
    },
    gameAvailability: [Game.Morrowind, Game.Oblivion, Game.Skyrim]
  },
  {
    name: 'Thief',
    description: 'A master of stealth, lockpicking, and pickpocketing.',
    skills: {
      majorSkills: ['Sneak', 'Security', 'Light Armor', 'Short Blade', 'Marksman'],
      minorSkills: ['Acrobatics', 'Athletics', 'Speechcraft', 'Mercantile', 'Hand-to-hand'],
      oblivionMajorSkills: ['Sneak', 'Security', 'Light Armor', 'Acrobatics', 'Blade', 'Marksman', 'Speechcraft'],
      primarySkills: ['Sneak', 'Lockpicking', 'Pickpocket', 'Light Armor'],
      secondarySkills: ['Speech', 'One-handed', 'Archery']
    },
    gameAvailability: [Game.Morrowind, Game.Oblivion, Game.Skyrim]
  },
  {
    name: 'Assassin',
    description: 'Specializes in stealth, poison, and taking targets down quietly.',
    skills: {
      majorSkills: ['Sneak', 'Short Blade', 'Light Armor', 'Marksman', 'Acrobatics'],
      minorSkills: ['Alchemy', 'Security', 'Illusion', 'Athletics', 'Unarmored'],
      oblivionMajorSkills: ['Blade', 'Sneak', 'Light Armor', 'Marksman', 'Acrobatics', 'Security', 'Alchemy'],
      primarySkills: ['Sneak', 'One-handed', 'Alchemy', 'Light Armor'],
      secondarySkills: ['Archery', 'Pickpocket', 'Illusion']
    },
    gameAvailability: [Game.Morrowind, Game.Oblivion, Game.Skyrim]
  },
  {
    name: 'Battlemage',
    description: 'Combines magic with combat prowess for a deadly combination.',
    skills: {
      majorSkills: ['Destruction', 'Conjuration', 'Alteration', 'Heavy Armor', 'Long Blade'],
      minorSkills: ['Mysticism', 'Enchant', 'Restoration', 'Alchemy', 'Block'],
      oblivionMajorSkills: ['Destruction', 'Conjuration', 'Alteration', 'Heavy Armor', 'Blade', 'Mysticism', 'Restoration'],
      primarySkills: ['Destruction', 'Conjuration', 'Heavy Armor', 'One-handed'],
      secondarySkills: ['Enchanting', 'Restoration', 'Block']
    },
    gameAvailability: [Game.Morrowind, Game.Oblivion, Game.Skyrim]
  },
  {
    name: 'Scout',
    description: 'A wilderness expert skilled in archery and survival.',
    skills: {
      majorSkills: ['Marksman', 'Light Armor', 'Sneak', 'Athletics', 'Medium Armor'],
      minorSkills: ['Alchemy', 'Acrobatics', 'Spear', 'Short Blade', 'Block'],
      oblivionMajorSkills: ['Marksman', 'Light Armor', 'Sneak', 'Athletics', 'Acrobatics', 'Blade', 'Alchemy'],
      primarySkills: ['Archery', 'Light Armor', 'Sneak', 'Alchemy'],
      secondarySkills: ['One-handed', 'Lockpicking', 'Speech']
    },
    gameAvailability: [Game.Morrowind, Game.Oblivion, Game.Skyrim]
  },
  {
    name: 'Spellsword',
    description: 'Balances swordplay with magical abilities.',
    skills: {
      majorSkills: ['Long Blade', 'Destruction', 'Restoration', 'Alteration', 'Block'],
      minorSkills: ['Medium Armor', 'Enchant', 'Mysticism', 'Illusion', 'Athletics'],
      oblivionMajorSkills: ['Blade', 'Block', 'Destruction', 'Restoration', 'Alteration', 'Light Armor', 'Illusion'],
      primarySkills: ['One-handed', 'Destruction', 'Restoration', 'Alteration'],
      secondarySkills: ['Enchanting', 'Block', 'Light Armor']
    },
    gameAvailability: [Game.Morrowind, Game.Oblivion, Game.Skyrim]
  },
  {
    name: 'Nightblade',
    description: 'Combines stealth with magic for deadly surprise attacks.',
    skills: {
      majorSkills: ['Short Blade', 'Illusion', 'Sneak', 'Light Armor', 'Destruction'],
      minorSkills: ['Mysticism', 'Alteration', 'Security', 'Acrobatics', 'Athletics'],
      oblivionMajorSkills: ['Blade', 'Sneak', 'Illusion', 'Destruction', 'Light Armor', 'Alteration', 'Security'],
      primarySkills: ['Sneak', 'Illusion', 'One-handed', 'Destruction'],
      secondarySkills: ['Light Armor', 'Pickpocket', 'Alteration']
    },
    gameAvailability: [Game.Morrowind, Game.Oblivion, Game.Skyrim]
  }
];
