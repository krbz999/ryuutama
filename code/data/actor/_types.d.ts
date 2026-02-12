import { AbilityData } from "./templates/_types";
import "./templates/_types";

declare module "./traveler.mjs" {
  export default interface TravelerData {
    abilities: {
      strength: AbilityData;
      dexterity: AbilityData;
      intelligence: AbilityData;
      spirit: AbilityData;
    };
    advancements: Map<string, any>;
    background: {
      appearance: string;
      hometown: string;
      notes: string;
    };
    capacity: {
      bonus: number;
      container: number;
      max: number;
      pct: number;
      penalty: number;
      value: number;
    };
    classes: Record<string, RyuutamaItem>;
    defense: {
      armor: number | null;
      dodge: number;
      gear: number;
      modifiers: {
        magical: number | null;
        physical: number | null;
      };
      total: number;
    };
    details: {
      color: number;
      exp: {
        max: number;
        pct: number;
        value: number;
      };
      level: number;
      type: Record<string, number>;
    };
    equipped: {
      accessory: RyuutamaItem | null;
      armor: RyuutamaItem | null;
      cape: RyuutamaItem | null;
      hat: RyuutamaItem | null;
      shield: RyuutamaItem | null;
      shoes: RyuutamaItem | null;
      staff: RyuutamaItem | null;
      weapon: RyuutamaItem | null;
    };
    fumbles: {
      value: number | null;
    };
    gold: {
      value: number;
    };
    magic: {
      incantation: {
        max: number;
        pct: number;
        value: number;
      };
      seasons: Set<string>;
    };
    mastered: {
      terrain: Set<string>;
      weapons: Set<string>;
      weather: Set<string>;
    };
  };
}
