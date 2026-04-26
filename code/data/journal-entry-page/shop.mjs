const {
  BooleanField, DocumentUUIDField, NumberField, ObjectField,
  SchemaField, SetField, StringField, TypedObjectField,
} = foundry.data.fields;

export default class ShopData extends foundry.abstract.TypeDataModel {
  /** @inheritdoc */
  static defineSchema() {
    return {
      stock: new SchemaField({
        items: new TypedObjectField(new StockItem(), { validateKey: key => foundry.data.validators.isValidId(key) }),
        filter: new ObjectField(),
      }),
      modifiers: new TypedObjectField(
        new SchemaField({
          ignore: new BooleanField(), // ignore the change to the item's price from this modifier
        }),
      ),
      price: new SchemaField({
        modifier: new NumberField({ nullable: true, min: 0.1, step: 0.1, initial: null }),
      }),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.PAGE.SHOP",
  ];

  /* -------------------------------------------------- */

  /**
   * Items that can be sold at a shop.
   * @type {Set<string>}
   */
  static ALLOWED_ITEMS = new Set([
    "accessory",
    "animal",
    "armor",
    "cape",
    "container",
    "hat",
    "herb",
    "shield",
    "shoes",
    "staff",
    "weapon",
  ]);

  /* -------------------------------------------------- */

  async createStockItem(id) {
    const item = await this.stock.items[id].item;
    if (!item) return null;

    const modifiers = this.stock.items[id].modifierOptions.reduce((acc, { value }) => {
      const enabled = value in this.stock.items[id].modifiers;
      if (enabled) acc.push(value);
      return acc;
    }, []);

    const { ignored = [], applied = [] } = Object.groupBy(
      modifiers, m => this.stock.items[id].modifiers[m].ignored ? "ignored" : "applied",
    );

    const clone = item.clone({ system: { modifiers: applied } }, { keepId: true });
    const itemData = game.items.fromCompendium(clone, { clearFolder: true });
    itemData.system.modifiers.push(...ignored);
    itemData.system.modifiers.sort((a, b) => a.localeCompare(b));
    itemData.system.modifiers = Array.from(new Set(itemData.system.modifiers));
    if (ignored.length) foundry.utils.setProperty(itemData, "flags.ryuutama.ignoredModifiers", ignored);

    return itemData;
  }

  /* -------------------------------------------------- */

  /**
   * Create data for an enriched tooltip.
   * @returns {Promise<HTMLCollection>}
   */
  async richTooltip() {
    const text = this.parent.text.content;
    const context = { rollData: this.parent.getRollData?.(), relativeTo: this.parent };
    const enriched = await CONFIG.ux.TextEditor.enrichHTML(text, context);
    Object.assign(context, { enriched, page: this.parent });
    const htmlString = await foundry.applications.handlebars.renderTemplate(
      "systems/ryuutama/templates/ui/pages/tooltip.hbs", context,
    );
    return foundry.utils.parseHTML(`<div>${htmlString}</div>`).children;
  }
}

/* -------------------------------------------------- */

class StockItem extends SchemaField {
  constructor(fields, options = {}, context = {}) {
    fields = {
      uuid: new DocumentUUIDField({ type: "Item", embedded: false }),
      modifiers: new TypedObjectField(
        new SchemaField({
          ignore: new BooleanField(), // ignore the change to the item's price from this modifier
        }),
      ),
      price: new SchemaField({
        override: new NumberField({ nullable: true, initial: null, min: 0, integer: true }),
        modifier: new NumberField({ nullable: true, min: 0.1, step: 0.1, initial: null }),
      }),
    };
    super(fields, options, context);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  initialize(value, model, options = {}) {
    const object = super.initialize(value, model, options);

    Object.defineProperties(object, {
      item: {
        get: () => fromUuid(object.uuid).then(item => ShopData.ALLOWED_ITEMS.has(item?.type) ? item : null),
      },
      modifierOptions: {
        get: () => {
          const item = fromUuidSync(object.uuid);
          let config;
          if (item?.type === "animal") {
            config = ryuutama.config.animalModifiers;
          } else if (ryuutama.data.fields.EquipmentField.EQUIPMENT_ORDER.includes(item?.type)) {
            config = ryuutama.config.itemModifiers;
          }

          if (config) {
            return Object.entries(config).map(([value, { label }]) => ({ value, label }));
          }

          return [];
        },
      },
    });

    return object;
  }
}
