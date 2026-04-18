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

declare module "./physical.mjs" {
  export default interface PhysicalData {
    container: RyuutamaItem | Promise<RyuutamaItem> | null;
    durability: {
      spent: number;
    }
    modifiers: Set<string>;
    price: {
      value: number;
    }
    size: {
      value: number;
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
