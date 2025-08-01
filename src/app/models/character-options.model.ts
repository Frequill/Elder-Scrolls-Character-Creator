import { Game, Race, CharacterClass } from './character.model';

export const SEX_OPTIONS = ['Male', 'Female'];

export const AGE_OPTIONS = ['Young Adult', 'Adult', 'Middle Age', 'Elder'];

export const SPECIALIZATION_OPTIONS = ['Combat', 'Magic', 'Stealth'];

export const ARMOR_OPTIONS = {
  [Game.Morrowind]: ['Light Armor', 'Medium Armor', 'Heavy Armor', 'Unarmored'],
  [Game.Oblivion]: ['Light Armor', 'Heavy Armor'],
  [Game.Skyrim]: ['Light Armor', 'Heavy Armor']
};

export const WEAPON_OPTIONS = {
  [Game.Morrowind]: [
    'Short Blade', 'Long Blade', 'Axe', 'Blunt Weapon', 'Spear', 
    'Bow', 'Crossbow', 'Thrown Weapon', 'Hand-to-hand'
  ],
  [Game.Oblivion]: [
    'Blade', 'Blunt', 'Hand to Hand', 'Marksman'
  ],
  [Game.Skyrim]: [
    'One-handed', 'Two-handed', 'Archery'
  ]
};

export const BACKGROUND_OPTIONS = [
  'Noble', 'Commoner', 'Criminal', 'Scholar', 'Merchant', 'Soldier', 
  'Pilgrim', 'Hermit', 'Outcast', 'Wanderer'
];

export const PRESTIGE_OPTIONS = [
  'Unknown', 'Local Hero', 'Regional Champion', 'Famous', 'Legendary'
];

export const MAGIC_OPTIONS = {
  [Game.Morrowind]: [
    'Destruction', 'Alteration', 'Illusion', 'Conjuration', 'Mysticism', 'Restoration', 'Enchant', 'Alchemy'
  ],
  [Game.Oblivion]: [
    'Destruction', 'Alteration', 'Illusion', 'Conjuration', 'Mysticism', 'Restoration', 'Alchemy'
  ],
  [Game.Skyrim]: [
    'Destruction', 'Alteration', 'Illusion', 'Conjuration', 'Restoration', 'Enchanting', 'Alchemy'
  ]
};

export const DEITY_OPTIONS = {
  [Game.Morrowind]: [
    'The Nine Divines', 'Tribunal', 'Daedric Princes', 'Azura', 'Boethiah', 'Mephala', 
    'Almsivi', 'Ancestors', 'None'
  ],
  [Game.Oblivion]: [
    'Akatosh', 'Arkay', 'Dibella', 'Julianos', 'Kynareth', 'Mara', 'Stendarr', 'Talos', 'Zenithar',
    'Daedric Princes', 'None'
  ],
  [Game.Skyrim]: [
    'Akatosh', 'Arkay', 'Dibella', 'Julianos', 'Kynareth', 'Mara', 'Stendarr', 'Talos', 'Zenithar',
    'Nordic Pantheon', 'Daedric Princes', 'None'
  ]
};
