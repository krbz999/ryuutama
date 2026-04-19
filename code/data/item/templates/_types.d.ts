export {};

declare module "./base.mjs" {
  export default interface BaseData {
    description: {
      value: string;
    }
    identifier: string;
    source: {
      book: string;
      custom: string;
    }
  }
}

/* -------------------------------------------------- */

declare module "./gear.mjs" {
  export default interface GearData {
    gear: {
      check: number;
      custom: string;
    }
  }
}


/* -------------------------------------------------- */

declare module "./physical.mjs" {
  export default interface PhysicalData {
    durability: {
      max: number;
      multiplier: number;
      spent: number;
      value: number;
    }
    modifiers: Set<string>;
    price: {
      magical: number;
      multiplier: number;
      saleable: boolean;
      sell: number;
      value: number;
    }
    size: {
      value: 1 | 3 | 5;
    }
    storage: string | null;
  }
}

/* -------------------------------------------------- */

declare module "./storage.mjs" {
  export default interface StorageData {
    capacity: {
      max: number;
    }
    price: {
      value: number;
    }
  }
}
