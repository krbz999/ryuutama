export {};

import "./templates/_types";
import Advancement from "../advancement/advancement.mjs";
import AttackModel from "../attack-model.mjs";
import Collection from "@common/utils/collection.mjs";
import CreatureData from "./templates/creature.mjs";
import RyuutamaActor from "../../documents/actor.mjs";
import RyuutamaItem from "../../documents/item.mjs";

declare module "./monster.mjs" {
  export default interface MonsterData {
    attack: AttackModel;
    description: {
      value: string;
    }
    details: {
      category: string;
      dragonica: number | null;
      level: number;
    }
    environment: {
      season: string;
    }
    initiative: {
      value: number;
    }
  }
}

/* -------------------------------------------------- */

declare module "./party.mjs" {
  export default interface PartyData {
    description: {
      value: string;
    }
    members: Collection<string, { actor: RyuutamaActor }>;
  }
}

/* -------------------------------------------------- */

declare module "./traveler.mjs" {
  export default interface TravelerData {
    advancements: Record<string, Advancement> & { documentsByType: Record<string, Advancement[]> };
    background: {
      appearance: string;
      hometown: string;
      notes: string;
    }
    capacity: {
      bonus: number;
    }
    condition: CreatureData["condition"] & {
      rationing: number;
      shape: {
        high: string;
      }
    }
    details: {
      color: number;
      dragonFavor: string;
      exp: {
        value: number;
      }
      level: number;
      type: {
        attack: number;
        technical: number;
        magic: number;
      }
    }
    equipped: {
      accessory: RyuutamaItem | null;
      armor: RyuutamaItem | null;
      cape: RyuutamaItem | null;
      hat: RyuutamaItem | null;
      shield: RyuutamaItem | null;
      shoes: RyuutamaItem | null;
      staff: RyuutamaItem | null;
      weapon: RyuutamaItem | null;
    }
    fumbles: {
      value: number | null;
    }
    gold: {
      value: number;
    }
    magic: {
      seasons: Set<string>;
    }
    mastered: {
      terrain: Set<string>;
      weapons: Set<string>;
      weather: Set<string>;
    }
  }
}
