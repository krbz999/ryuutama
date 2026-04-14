/**
 * @import { DataFieldContext, TypedObjectFieldOptions } from "@common/data/_types.mjs";
 * @import Collection from "@common/utils/collection.mjs";
 * @import RyuutamaActor from "../../documents/actor.mjs";
 */

const { SchemaField, TypedObjectField } = foundry.data.fields;

/**
 * A subclass of TypedObjectField that initializes as a getter for party members.
 */
export default class MembersField extends TypedObjectField {
  /**
   * @param {TypedObjectFieldOptions} [options]
   * @param {DataFieldContext} [context]
   */
  constructor(options = {}, context = {}) {
    const validateKey = key => foundry.data.validators.isValidId(key);
    super(new SchemaField({}), { ...options, validateKey }, context);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  initialize(value, model, options = {}) {
    if (!value) return value;
    const object = super.initialize(value, model, options);
    return () => Object.entries(object).reduce((acc, [id, data]) => {
      const actor = game.actors.get(id);
      if (ryuutama.data.actor.PartyData.validMember(actor)) acc.set(actor.id, { ...data, actor });
      return acc;
    }, new MembersCollection());
  }
}

/* -------------------------------------------------- */

/**
 * Specialized collection for members of a party.
 * @template {string} K;
 * @template {{ actor: RyuutamaActor }} V
 * @extends {foundry.utils.Collection<K, V>}
 */
export class MembersCollection extends foundry.utils.Collection {
  /**
   * The actors in the party.
   * @type {Collection<string, RyuutamaActor>}
   */
  get actors() {
    return this.reduce((acc, { actor }) => acc.set(actor.id, actor), new foundry.utils.Collection());
  }

  /* -------------------------------------------------- */

  /**
   * The members organized by type.
   * @type {Record<string, { actor: RyuutamaActor }>|null}
   */
  #documentsByType = null;

  /* -------------------------------------------------- */

  /**
   * The members organized by type.
   * @type {Record<string, { actor: RyuutamaActor }>}
   */
  get documentsByType() {
    if (this.#documentsByType) return this.#documentsByType;
    const entries = Object.fromEntries(ryuutama.data.actor.PartyData.ALLOWED_MEMBER_TYPES.map(type => [type, []]));
    this.forEach(m => entries[m.actor._source.type].push(m));
    return this.#documentsByType = entries;
  }
}
