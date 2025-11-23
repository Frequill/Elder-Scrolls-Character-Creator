import { Pipe, PipeTransform } from '@angular/core';
import { Game, GameSpecificSkills } from '../models';

export interface SkillsDisplay {
  type: 'simple' | 'morrowind' | 'oblivion' | 'skyrim';
  skills?: string[];
  majorSkills?: string[];
  minorSkills?: string[];
  oblivionMajorSkills?: string[];
  primarySkills?: string[];
  secondarySkills?: string[];
}

@Pipe({
  name: 'skillsDisplay',
  standalone: true
})
export class SkillsDisplayPipe implements PipeTransform {
  transform(skills: string[] | GameSpecificSkills, game?: Game): SkillsDisplay {
    if (Array.isArray(skills)) {
      return {
        type: 'simple',
        skills
      };
    }

    // Check for Morrowind skills
    if (skills.majorSkills && skills.minorSkills) {
      return {
        type: 'morrowind',
        majorSkills: skills.majorSkills,
        minorSkills: skills.minorSkills
      };
    }

    // Check for Oblivion skills
    if (skills.oblivionMajorSkills) {
      return {
        type: 'oblivion',
        oblivionMajorSkills: skills.oblivionMajorSkills
      };
    }

    // Check for Skyrim skills
    if (skills.primarySkills && skills.secondarySkills) {
      return {
        type: 'skyrim',
        primarySkills: skills.primarySkills,
        secondarySkills: skills.secondarySkills
      };
    }

    // Fallback to simple array
    return {
      type: 'simple',
      skills: []
    };
  }
}
