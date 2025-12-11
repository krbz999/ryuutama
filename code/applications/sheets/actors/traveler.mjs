import RyuutamaActorSheet from "../actor-sheet.mjs";

/**
 * Ryuutama Traveler Sheet.
 * @extends RyuutamaActorSheet
 */
export default class RyuutamaTravelerSheet extends RyuutamaActorSheet {
  /** @override */
  static PARTS = {
    header: {
      template: "systems/ryuutama/templates/sheets/shared/header.hbs",
      templates: ["templates/generic/tab-navigation.hbs"],
    },
    attributes: {
      template: "systems/ryuutama/templates/sheets/traveler-sheet/attributes.hbs",
      classes: ["tab", "standard-form", "scrollable"],
      scrollable: [""],
    },
    skills: {
      template: "systems/ryuutama/templates/sheets/traveler-sheet/skills.hbs",
      classes: ["tab", "standard-form", "scrollable"],
      scrollable: [""],
    },
    spells: {
      template: "systems/ryuutama/templates/sheets/traveler-sheet/spells.hbs",
      classes: ["tab", "standard-form", "scrollable"],
      scrollable: [""],
    },
    inventory: {
      template: "systems/ryuutama/templates/sheets/traveler-sheet/inventory.hbs",
      classes: ["tab", "standard-form", "scrollable"],
      scrollable: [""],
    },
    effects: {
      template: "systems/ryuutama/templates/sheets/shared/effects.hbs",
      classes: ["tab", "standard-form", "scrollable"],
      scrollable: [""],
    },
    notes: {
      template: "systems/ryuutama/templates/sheets/traveler-sheet/notes.hbs",
      classes: ["tab", "standard-form", "scrollable"],
      scrollable: [""],
    },
  };

  /* -------------------------------------------------- */

  /** @override */
  static TABS = {
    primary: {
      tabs: [
        { id: "attributes" },
        { id: "skills" },
        { id: "spells" },
        { id: "inventory" },
        { id: "effects" },
        { id: "notes" },
      ],
      initial: "attributes",
      labelPrefix: "RYUUTAMA.ACTOR.TABS",
    },
    inventory: {
      tabs: [
        { id: "arsenal" },
        { id: "gear" },
        { id: "herbs" },
        { id: "containers" },
      ],
      initial: "arsenal",
      labelPrefix: "RYUUTAMA.ACTOR.INVENTORY_TABS",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _getTabsConfig(group) {
    const config = foundry.utils.deepClone(super._getTabsConfig(group)) ?? null;
    const actor = this.document;
    if ((group === "primary") && !actor.items.documentsByType.spell.length && !actor.system.details.type.magic) {
      config.tabs.findSplice(tab => tab.id === "spells");
    }
    return config;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _configureRenderParts(options) {
    const parts = super._configureRenderParts(options);

    const actor = this.document;
    if (!actor.items.documentsByType.spell.length && !actor.system.details.type.magic) {
      delete parts.spells;
    }

    return parts;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    // Skills.
    context.skills = this.#prepareSkills();

    context.tabs = this._prepareTabs("primary");
    context.inventoryTabs = this._prepareTabs("inventory");

    context.inventorySections = [
      {
        id: "arsenal",
        cssClass: context.inventoryTabs.arsenal.cssClass,
        groups: ["weapon", "shield", "armor"]
          .map(type => this.#prepareInventoryGroup(type, "system.durability.value"))
          .filter(_ => _),
      },
      {
        id: "gear",
        cssClass: context.inventoryTabs.gear.cssClass,
        groups: ["hat", "cape", "shoes", "accessory", "staff"]
          .map(type => this.#prepareInventoryGroup(type, "system.durability.value"))
          .filter(_ => _),
      },
      {
        id: "herbs",
        cssClass: context.inventoryTabs.herbs.cssClass,
        groups: [this.#prepareInventoryGroup("herb")],
      },
      {
        id: "containers",
        cssClass: context.inventoryTabs.containers.cssClass,
        groups: [this.#prepareInventoryGroup("container"), this.#prepareInventoryGroup("animal")],
      },
    ];

    const rollData = this.document.getRollData();
    const enrichment = { relativeTo: this.document, rollData };
    context.enriched = {
      appearance: await CONFIG.ux.TextEditor.enrichHTML(this.document.system.background.appearance, enrichment),
      hometown: await CONFIG.ux.TextEditor.enrichHTML(this.document.system.background.hometown, enrichment),
      notes: await CONFIG.ux.TextEditor.enrichHTML(this.document.system.background.notes, enrichment),
    };

    context.equipped = this.#prepareEquipped();
    context.weaponImage = this.document.system.equipped.weapon?.img ?? ryuutama.config.weaponUnarmedTypes.unarmed.icon;

    // Capacity
    context.capacityPenalty = game.i18n.format("RYUUTAMA.ACTOR.capacityPenalty", {
      penalty: `&ndash;${this.document.system.capacity.penalty}`,
    });
    context.capacityOverflow = this.document.system.capacity.penalty > 0;

    // Condition & Shape.
    this.#prepareCondition(context);

    // Spells.
    context.spells = this.#prepareSpells(context);

    // Tags.
    context.tags = this.#prepareTags(context);

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare skill item sections.
   * @returns {object[]}
   */
  #prepareSkills() {
    const groups = Map.groupBy(
      this.document.items.documentsByType.skill,
      item => {
        const classIdentifier = item.getFlag(ryuutama.id, "originClass");
        const clsItem = this.document.system.classes[classIdentifier];
        return clsItem ? clsItem : "other";
      },
    );

    const sections = [];

    if (groups.has("other")) {
      sections.push({
        label: game.i18n.localize("RYUUTAMA.TRAVELER.otherSkills"),
        entries: groups.get("other").map(item => ({ document: item })),
      });
      groups.delete("other");
    }

    for (const [classItem, skills] of groups.entries()) {
      sections.unshift({
        label: game.i18n.format("RYUUTAMA.TRAVELER.skillSectionLabel", { name: classItem.name }),
        entries: skills.map(skill => ({ document: skill })),
      });
    }

    return sections;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare statuses and conditions.
   * @param {object} context    Rendering context. **will be mutated**
   */
  #prepareCondition(context) {
    // Tip-top shape / out of shape.
    const condition = this.document.system.condition.value;
    context.conditionShape = {
      active: true,
      ability: ryuutama.config.abilityScores[this.document.system.condition.shape.high]?.label ?? "",
    };
    if (condition >= 10) context.conditionShape.high = true;
    else if (condition <= 2) context.conditionShape.low = true;
    else context.conditionShape.active = false;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare equipped items.
   * @returns {object}
   */
  #prepareEquipped() {
    const equipped = {};
    for (const type of ["weapon", "shield", "armor", "hat", "cape", "shoes", "accessory", "staff"]) {
      const item = this.document.system.equipped[type];
      equipped[type] = {
        item,
        img: item ? item.img : foundry.documents.Item.implementation.DEFAULT_ICON,
        label: game.i18n.localize(`TYPES.Item.${type}`),
        options: this.document.items.documentsByType[type].map(item => ({ value: item.id, label: item.name })),
        value: this.document.system._source.equipped[type],
      };
    }
    if (!this.document.system.canEquipShield) delete equipped.shield;
    return equipped;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare inventory sections.
   * @param {string} type         The item subtype.
   * @param {string} [embedded]   Name of a value that can get updated via sheet interaction.
   * @returns {object|null}
   */
  #prepareInventoryGroup(type, embedded) {
    const items = this.document.items.documentsByType[type];
    if (!items.length) return null;

    const group = {
      label: game.i18n.localize(`TYPES.Item.${type}Pl`),
      items: [],
    };

    for (const item of items) {
      const entry = { document: item };
      if (embedded) {
        const e = entry.embedded = {};
        e.name = embedded;

        const path = e.name.substring(0, e.name.lastIndexOf("."));
        const { value, max } = foundry.utils.getProperty(item, path);
        e.value = value;
        e.max = max;
      }
      group.items.push(entry);
    }

    return group;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare spells.
   * @param {object} context    Rendering context. **will be mutated**
   * @returns {object[]}
   */
  #prepareSpells(context) {
    const groupedBy = Object.groupBy(this.document.items.documentsByType.spell, spell => {
      return spell.system.category.value;
    });

    const sections = [];

    for (const category of Object.keys(ryuutama.config.spellCategories)) {
      const spells = groupedBy[category];
      if (!spells) continue;

      const { low, mid, high } = Object.groupBy(spells, spell => spell.system.spell.level);
      const section = {
        category,
        label: ryuutama.config.spellCategories[category].label,
        groups: [],
      };

      for (const level of [low, mid, high]) {
        if (!level) continue;
        section.groups.push({
          documents: level.map(spell => ({ document: spell })),
        });
      }
      sections.push(section);
    }

    context.incantation = {
      value: sections
        .find(section => section.category === "incantation")?.groups
        .reduce((acc, grp) => acc + grp.documents.length, 0) ?? 0,
      max: this.document.system.incantationSpells,
    };

    context.seasonSpells = Array.from(this.document.system.magic.seasons)
      .map(season => ryuutama.config.spellCategories[season])
      .filter(_ => _);

    return sections;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare the header tags.
   * @param {object} context    Rendering context. **will be mutated**
   * @returns {{ tag: string, tooltip: string }[]}
   */
  #prepareTags(context) {
    const tags = [];

    // Classes.
    const classTag = Object.values(this.document.system.classes).map(item => item.name).join(" / ");
    tags.push({
      tag: classTag.length ? classTag : game.i18n.localize("RYUUTAMA.ACTOR.TAGS.noClass"),
      cssClass: "traveler-classes",
      tooltip: game.i18n.format("RYUUTAMA.ACTOR.TAGS.classes"),
    });

    // Traveler Types.
    for (const [k, v] of Object.entries(this.document.system.details.type)) {
      const label = ryuutama.config.travelerTypes[k]?.label;
      if (!v || !label) continue;
      const tag = label + (v > 1 ? ` &times; ${v}` : "");
      tags.push({
        tag,
        tooltip: game.i18n.format("RYUUTAMA.ACTOR.TAGS.type", { type: label }),
      });
    }

    // Mastered Weapons.
    for (const [k, v] of Object.entries(this.document.system.mastered.weapons)) {
      const label = ryuutama.config.weaponCategories[k]?.labelPlural;
      if (!v || !label) continue;
      const tag = label + (v > 1 ? ` &times; ${v}` : "");
      tags.push({
        tag,
        tooltip: game.i18n.format("RYUUTAMA.ACTOR.TAGS.masteredWeapon", { weapon: label }),
      });
    }

    // Specialized Terrains.
    for (const k of this.document.system.mastered.terrain) {
      const label = ryuutama.config.terrainTypes[k]?.label;
      if (!label) continue;
      tags.push({
        tag: label,
        tooltip: game.i18n.format("RYUUTAMA.ACTOR.TAGS.habitatSpecialty", { habitat: label }),
      });
    }

    // Specialized Weather Conditions.
    for (const k of this.document.system.mastered.weather) {
      const label = ryuutama.config.weatherTypes[k]?.label;
      if (!label) continue;
      tags.push({
        tag: label,
        tooltip: game.i18n.format("RYUUTAMA.ACTOR.TAGS.habitatSpecialty", { habitat: label }),
      });
    }

    // Level up button.
    const levelTag = game.i18n.format("RYUUTAMA.ACTOR.TAGS.level", { level: this.document.system.details.level });
    if (this.document.system.details.level < 10) {
      context.levelUp = { tag: levelTag, tooltip: levelTag };
      if (this.document.system.details.exp.pct === 100) context.levelUp.glow = true;
    } else {
      tags.unshift({ tag: levelTag, tooltip: levelTag });
    }

    return tags;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    for (const input of this.element.querySelectorAll("input.delta[data-name='system.durability.value']")) {
      input.addEventListener("change", event => {
        const item = this.getEmbeddedDocument(event.currentTarget.closest("[data-uuid]").dataset.uuid);
        const value = ryuutama.utils.parseInputDelta(event.currentTarget, item);
        if (value === undefined) return;

        const dur = item.system.durability;
        const spent = dur.max - parseInt(value);
        item.update({ "system.durability.spent": spent });
      });
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onDropItem(event, item) {
    const resolved = await super._onDropItem(event, item);
    if (resolved) return resolved;

    // Equip the item if dropped onto the equipment section.
    if (item.parent !== this.document) return false;
    if (!event.target.closest("section.equipped")) return false;
    if (!(item.type in this.document.system.equipped)) return false;
    await this.document.update({ [`system.equipped.${item.type}`]: item.id });
    return true;
  }
}
