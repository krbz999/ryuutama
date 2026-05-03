/**
 * @import { DatabaseWriteOperation } from "@common/abstract/_types.mjs";
 * @import RyuutamaActor from "../documents/actor.mjs";
 * @import RyuutamaItem from "../documents/item.mjs";
 */

const {
  BooleanField, DocumentUUIDField, EmbeddedDataField, NumberField,
  SchemaField, SetField, StringField, TypedObjectField,
} = foundry.data.fields;

/**
 * An embedded model for items that perform actions.
 */
export default class ActionsModel extends foundry.abstract.DataModel {
  /** @inheritdoc */
  static defineSchema() {
    return {
      damage: new SchemaField({
        formula: new ryuutama.data.fields.FormulaField(),
        properties: new SetField(new StringField()),
      }),
      effects: new EmbeddedDataField(EffectsModel),
      healing: new SchemaField({
        formula: new ryuutama.data.fields.FormulaField(),
        properties: new SetField(new StringField()),
      }),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    "RYUUTAMA.ITEM.ACTIONS",
  ];

  /* -------------------------------------------------- */

  /**
   * The item on which this is embedded.
   * @type {RyuutamaItem}
   */
  get item() {
    return this.parent.parent;
  }

  /* -------------------------------------------------- */

  /**
   * Format all data to message parts.
   * @returns {Promise<Record<string, object>>}
   */
  async toMessagePartData() {
    const parts = [];

    // Damage
    const damage = await this.toDamagePartData();
    if (damage) parts.push(damage);

    // Healing
    const healing = await this.toHealingPartData();
    if (healing) parts.push(healing);

    // Effects
    const effects = await this.toEffectsPartData();
    if (effects) parts.push(effects);

    return Object.fromEntries(parts.map(part => [foundry.utils.randomID(), part]));
  }

  /* -------------------------------------------------- */

  /**
   * Format effects to part data.
   * @returns {Promise<object|null>}
   */
  async toEffectsPartData() {
    return {
      type: "effect",
      itemUuid: this.item.uuid,
    };
  }

  /* -------------------------------------------------- */

  /**
   * Format damage to part data.
   * @returns {Promise<object|null>}
   */
  async toDamagePartData() {
    if (!this.damage.formula) return null;
    const partData = { type: "damage", rolls: [] };
    const properties = this.item.system.getRollOptions("damage").union(this.damage.properties);
    const options = Object.fromEntries(Array.from(properties).map(p => [p, true]));
    const roll = new ryuutama.dice.DamageRoll(this.damage.formula, this.item.getRollData(), options);
    await roll.evaluate();
    partData.rolls.push(roll);
    return partData;
  }

  /* -------------------------------------------------- */

  /**
   * Format healing to part data.
   * @returns {Promise<object|null>}
   */
  async toHealingPartData() {
    if (!this.healing.formula) return null;
    const partData = { type: "healing", rolls: [] };
    const options = {};
    const roll = new ryuutama.dice.HealingRoll(this.healing.formula, this.item.getRollData(), options);
    await roll.evaluate();
    partData.rolls.push(roll);
    return partData;
  }

  /* -------------------------------------------------- */

  /**
   * Apply effects.
   * @param {RyuutamaActor[]} [actors]
   * @returns {Promise<void>}
   */
  async applyEffects(actors) {
    if (!actors?.length) {
      actors = new Set(canvas.tokens.controlled.map(token => token.actor).filter(_ => _));
    }

    const batches = [];
    const toApply = await this.effects.toBatches(actors);
    if (toApply) batches.push(...toApply);
    await foundry.documents.modifyBatch(batches);
  }
}

/* -------------------------------------------------- */

/**
 * Data model which is responsible for data related to effects, riders, and application.
 */
class EffectsModel extends foundry.abstract.DataModel {
  /** @inheritdoc */
  static defineSchema() {
    const validateEffect = uuid => {
      if (!uuid) return;
      if (!uuid.startsWith("Compendium.")) {
        throw new Error(_loc("RYUUTAMA.ITEM.ACTIONS.WARNINGS.effectPack"));
      }
    };

    const validateItem = uuid => {
      if (!uuid) return;
      if (!uuid.startsWith("Compendium.")) {
        throw new Error(_loc("RYUUTAMA.ITEM.ACTIONS.WARNINGS.itemPack"));
      }

      const item = fromUuidSync(uuid);
      if (!item) return;

      const valid = [
        "weapon", "shield", "armor", "hat", "cape", "shoes",
        "accessory", "staff", "herb", "container", "animal",
      ].includes(item.type);
      if (!valid) {
        throw new Error(_loc("RYUUTAMA.ITEM.ACTIONS.WARNINGS.itemType", {
          type: _loc(CONFIG.Item.typeLabels[item.type]),
        }));
      }
    };

    const statusKeys = Object.values(ryuutama.CONST.STATUS_EFFECTS);

    return {
      config: new SchemaField({
        duration: new SchemaField({
          units: new StringField({ choices: CONST.ACTIVE_EFFECT_DURATION_UNITS, initial: "seconds", required: true }),
          value: new NumberField({ integer: true, min: 0, nullable: true, required: true }),
        }),
        riders: new SchemaField({
          items: new SetField(new DocumentUUIDField({ type: "Item", embedded: false, validate: validateItem })),
        }),
        self: new BooleanField({ required: true, initial: false }),
        uuids: new SetField(new DocumentUUIDField({ type: "ActiveEffect", embedded: false, validate: validateEffect })),
      }),
      statuses: new TypedObjectField(
        new SchemaField({
          strength: new NumberField({ min: 2, max: 20, integer: true, nullable: true, placeholder: "4", initial: 4 }),
        }),
        { validateKey: key => statusKeys.includes(key) },
      ),
    };
  }

  /* -------------------------------------------------- */

  /**
   * Will an effect created have a duration override?
   * @type {boolean}
   */
  get hasDuration() {
    return this.config.duration.value > 0;
  }

  /* -------------------------------------------------- */

  /**
   * Should a duration tracking effect be created in lieu of a primary effect?
   * @type {boolean}
   */
  get _createPlaceholderDurationEffect() {
    if (!this.hasDuration) return false;
    return !this.config.uuids.size;
  }

  /* -------------------------------------------------- */

  /**
   * Will application of the config create a primary effect or duration tracking effect?
   * @type {boolean}
   */
  get hasPrimaryEffect() {
    return this._createPlaceholderDurationEffect || this.config.uuids.some(uuid => fromUuidSync(uuid));
  }

  /* -------------------------------------------------- */

  /**
   * Fetch rider items and effects.
   * @returns {Promise<{ items: object[] }>}
   */
  async #retrieveRiders() {
    const { Item = [] } = await Promise.all([
      ...Array.from(this.config.riders.items).map(uuid => fromUuid(uuid)),
    ]).then(results => Object.groupBy(results.filter(_ => _), rider => rider.documentName));
    const items = await getDocumentClass("Item").createWithContents(Item);

    return { items };
  }

  /* -------------------------------------------------- */

  /**
   * Prepare the batches of database operations to apply effects, riders, and statuses.
   * @param {Iterable<RyuutamaActor>} actors
   * @returns {Promise<DatabaseWriteOperation[]|null>}
   */
  async toBatches(actors) {
    const batches = [];
    const effects = await this.#toBatchesConfiguration(actors);
    const statuses = await this.#toBatchesStatuses(actors);

    if (effects) batches.push(...effects);
    if (statuses) batches.push(...statuses);

    return batches.length ? batches : null;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare batches of the effect alongside dependency relations to apply.
   * @param {Iterable<RyuutamaActor>} actors
   * @returns {Promise<object[]|null>}
   */
  async #toBatchesConfiguration(actors) {
    if (!this.hasPrimaryEffect) return null;

    const item = this.parent.item;
    if (this.config.self) actors = [item.actor];

    const makeDependency = async () => {
      if (this._createPlaceholderDurationEffect) {
        const ActiveEffect = getDocumentClass("ActiveEffect");
        const dependency = new ActiveEffect({
          name: _loc("RYUUTAMA.ITEM.ACTIONS.durationEffectName", { item: item.name }),
          img: item.img,
          type: "standard",
          description: `<p>@Embed[${item.uuid} cite=false]</p>`,
          duration: { ...this.config.duration },
        });
        return foundry.utils.mergeObject(dependency.toObject(), { origin: item.uuid });
      }

      let dependency;
      const choices = Array.from(this.config.uuids).map(uuid => fromUuidSync(uuid)).filter(_ => _);
      if (!choices.length) return null;

      if (choices.length > 1) {
        const options = choices.map((c, i) => {
          return { value: c.uuid, label: c.name, uuid: c.uuid, checked: !i };
        });
        const result = await foundry.applications.api.Dialog.input({
          content: await foundry.applications.handlebars.renderTemplate(
            "systems/ryuutama/templates/chat/effect-select.hbs", {
              options,
              rootId: foundry.utils.randomID(),
            },
          ),
          window: {
            title: "RYUUTAMA.ITEM.ACTIONS.selectEffect",
            icon: "fa-solid fa-person-rays",
          },
        });
        dependency = await fromUuid(result?.dependency);
      } else {
        dependency = await fromUuid(choices[0].uuid);
      }

      if (!dependency) return null;
      return foundry.utils.mergeObject(dependency.toObject(), {
        "_stats.compendiumSource": dependency.uuid,
        duration: this.hasDuration ? { ...this.config.duration } : {},
        origin: item.uuid,
      });
    };

    const dependency = await makeDependency();
    if (!dependency) return null;

    const { items } = await this.#retrieveRiders();
    const batches = [];

    for (const parent of actors) {
      const id = foundry.utils.randomID();
      const uuid = foundry.utils.buildUuid({ id, parent, documentName: "ActiveEffect" });

      batches.push({
        parent,
        action: "create",
        data: [foundry.utils.mergeObject(dependency, { _id: id }, { inplace: false })],
        documentName: "ActiveEffect",
        keepId: true,
        noHook: true,
      }, {
        parent,
        action: "create",
        data: items,
        dependencyUuid: uuid,
        documentName: "Item",
        keepId: true, // allowed due to `createWithContents`
        noHook: true,
      });
    }

    return batches.length ? batches : null;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare batches of statuses to apply to actors.
   * @param {Iterable<RyuutamaActor>} actors
   * @returns {Promise<object[]|null>}
   */
  async #toBatchesStatuses(actors) {
    const batches = [];
    const ActiveEffect = getDocumentClass("ActiveEffect");

    const byStatus = {};

    for (const parent of actors) {
      const toCreate = [];
      const toUpdate = [];
      for (const [status, { strength }] of Object.entries(this.statuses)) {
        const effect = byStatus[status] ??= await ActiveEffect.fromStatusEffect(status, { strength });
        if (parent.effects.has(effect.id)) {
          const str = parent.effects.get(effect.id).system.strength;
          if (str < strength) toUpdate.push({ _id: effect.id, system: _replace(effect.toObject().system) });
        } else {
          toCreate.push(effect.toObject());
        }
      }

      if (toCreate.length) batches.push({
        parent,
        action: "create",
        data: toCreate,
        documentName: "ActiveEffect",
        keepId: true,
        noHook: true,
      });

      if (toUpdate.length) batches.push({
        parent,
        action: "update",
        documentName: "ActiveEffect",
        noHook: true,
        updates: toUpdate,
      });
    }
    return batches.length ? batches : null;
  }
}
