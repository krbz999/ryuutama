/**
 * @import RegionDocument from "@client/documents/region.mjs";
 */

const { DocumentUUIDField, NumberField, SchemaField } = foundry.data.fields;

export default class StandardData extends foundry.abstract.TypeDataModel {
  /** @override */
  static defineSchema() {
    return {
      battlefield: new SchemaField({
        backAlly: new DocumentUUIDField({ type: "Region", embedded: true }),
        backEnemy: new DocumentUUIDField({ type: "Region", embedded: true }),
        front: new DocumentUUIDField({ type: "Region", embedded: true }),
      }),
      // TODO: consider ArrayField of objects such that each object can be named?
      // objects: new SchemaField({
      //   value: new NumberField({ integer: true, nullable: false, min: 0, initial: 5 }),
      //   max: new NumberField({ integer: true, nullable: false, min: 0, initial: 5 }),
      // }),
    };
  }

  /* -------------------------------------------------- */

  /**
   * The back area for allies.
   * @type {RegionDocument|null}
   */
  get allyBackArea() {
    const uuid = this.battlefield.backAlly;
    if (!uuid || uuid.startsWith("Compendium")) return null;
    return fromUuidSync(uuid);
  }

  /* -------------------------------------------------- */

  /**
   * The back area for enemies.
   * @type {RegionDocument|null}
   */
  get enemyBackArea() {
    const uuid = this.battlefield.backEnemy;
    if (!uuid || uuid.startsWith("Compendium")) return null;
    return fromUuidSync(uuid);
  }

  /* -------------------------------------------------- */

  /**
   * The front area.
   * @type {RegionDocument|null}
   */
  get frontArea() {
    const uuid = this.battlefield.front;
    if (!uuid || uuid.startsWith("Compendium")) return null;
    return fromUuidSync(uuid);
  }
}
