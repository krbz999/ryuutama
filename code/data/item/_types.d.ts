export {};

import "./templates/_types";
import ActionsModel from "../actions-model.mjs";
import BaseData from "./templates/base.mjs";

declare module "./accessory.mjs" {
  export default interface AccessoryData {}
}

/* -------------------------------------------------- */

declare module "./animal.mjs" {
  export default interface AnimalData {
    capacity: {
      max: number | null;
      riders: number | null;
    }
    category: {
      value: string;
    }
    modifiers: Set<string>;
    price: {
      value: number | null;
    }
  }
}

/* -------------------------------------------------- */

declare module "./armor.mjs" {
  export default interface ArmorData {
    armor: {
      defense: number | null;
      penalty: number | null;
    }
  }
}

/* -------------------------------------------------- */

declare module "./cape.mjs" {
  export default interface CapeData {}
}

/* -------------------------------------------------- */

declare module "./class.mjs" {
  export default interface ClassData {
    skills: Set<{ uuid: string }>;
    tier: 1 | 2;
  }
}

/* -------------------------------------------------- */

declare module "./container.mjs" {
  export default interface ContainerData {
    capacity: {
      max: number | null;
      water: number | null;
      value: number;
      total: number | null;
      pct: number;
    }
    price: {
      value: number;
    }
    properties: Set<"waterContainer">;
    rations: Record<string, { type: string, modifier?: string }>;
    size: {
      value: 1 | 3 | 5;
    }
    weight: number;
  }
}

/* -------------------------------------------------- */

declare module "./hat.mjs" {
  export default interface HatData {}
}

/* -------------------------------------------------- */

declare module "./herb.mjs" {
  export default interface HerbData {
    category: {
      value: string;
    }
    description: BaseData["description"] & {
      effect: string;
    }
    price: {
      value: number | null;
    }
    terrain: {
      details: string;
      level: 1 | 2 | 3 | 4 | 5;
      type: string;
    }
  }
}

/* -------------------------------------------------- */

declare module "./shield.mjs" {
  export default interface ShieldData {
    armor: {
      defense: number | null;
      dodge: number | null;
      penalty: number | null;
    }
  }
}

/* -------------------------------------------------- */

declare module "./shoes.mjs" {
  export default interface ShoesData {}
}

/* -------------------------------------------------- */

declare module "./skill.mjs" {
  export default interface SkillData {}
}

/* -------------------------------------------------- */

declare module "./spell.mjs" {
  export default interface SpellData {
    actions: ActionsModel;
    category: {
      value: "incantation" | "spring" | "summer" | "autumn" | "winter";
    }
    spell: {
      activation: {
        cast: "normal" | "ritual";
        mental: number | null;
      }
      duration: {
        custom: string;
        type: string;
        value: number;
      }
      level: "low" | "mid" | "high";
      range: {
        value: string;
      }
      target: {
        custom: string;
      }
    }
  }
}

/* -------------------------------------------------- */

declare module "./staff.mjs" {
  export default interface StaffData {}
}

/* -------------------------------------------------- */

declare module "./weapon.mjs" {
  export default interface WeaponData {
    accuracy: {
      abilities: string[];
      bonus: number | null;
    }
    category: {
      value: string;
    }
    damage: {
      ability: string;
      bonus: number | null;
    }
  }
}
