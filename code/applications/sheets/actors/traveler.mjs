import RyuutamaActorSheet from "../actor-sheet.mjs";

/**
 * @import RyuutamaActiveEffect from "../../../documents/active-effect.mjs";
 * @import RyuutamaActor from "../../../documents/actor.mjs";
 */

/**
 * Ryuutama Traveler Sheet.
 * @extends RyuutamaActorSheet
 */
export default class RyuutamaTravelerSheet extends RyuutamaActorSheet {
  /** @override */
  static DEFAULT_OPTIONS = {
    position: {
      width: 680,
      height: 800,
    },
    actions: {
      adjustFumbles: RyuutamaTravelerSheet.#adjustFumbles,
    },
  };

  /* -------------------------------------------------- */

  /** @override */
  static PARTS = {
    sidebar: {
      template: "systems/ryuutama/templates/sheets/traveler-sheet/sidebar.hbs",
    },
    navigation: {
      template: "systems/ryuutama/templates/sheets/traveler-sheet/navigation.hbs",
      templates: ["templates/generic/tab-navigation.hbs"],
    },
    attributes: {
      template: "systems/ryuutama/templates/sheets/traveler-sheet/attributes.hbs",
      classes: ["tab", "scrollable"],
      scrollable: [""],
    },
    spells: {
      template: "systems/ryuutama/templates/sheets/traveler-sheet/spells.hbs",
      templates: ["systems/ryuutama/templates/sheets/traveler-sheet/search.hbs"],
      classes: ["tab"],
      scrollable: [".spells"],
    },
    inventory: {
      template: "systems/ryuutama/templates/sheets/traveler-sheet/inventory.hbs",
      templates: ["systems/ryuutama/templates/sheets/traveler-sheet/search.hbs"],
      classes: ["tab"],
      scrollable: [".inventory"],
    },
    effects: {
      template: "systems/ryuutama/templates/sheets/traveler-sheet/effects.hbs",
      classes: ["tab", "scrollable"],
      scrollable: [""],
    },
    notes: {
      template: "systems/ryuutama/templates/sheets/traveler-sheet/notes.hbs",
      templates: ["templates/generic/tab-navigation.hbs"],
      classes: ["tab", "scrollable"],
      scrollable: [""],
    },
  };

  /* -------------------------------------------------- */

  /** @override */
  static TABS = {
    primary: {
      tabs: [
        { id: "attributes", tooltip: "RYUUTAMA.ACTOR.TABS.attributes", icon: "fa-solid fa-fw fa-file" },
        { id: "spells", tooltip: "RYUUTAMA.ACTOR.TABS.spells", icon: "fa-solid fa-fw fa-hat-wizard" },
        { id: "inventory", tooltip: "RYUUTAMA.ACTOR.TABS.inventory", icon: "fa-solid fa-fw fa-box" },
        { id: "effects", tooltip: "RYUUTAMA.ACTOR.TABS.effects", icon: "fa-solid fa-fw fa-sun" },
        { id: "notes", tooltip: "RYUUTAMA.ACTOR.TABS.notes", icon: "fa-solid fa-fw fa-pen" },
      ],
      initial: "attributes",
    },
    notes: {
      tabs: [
        { id: "appearance" },
        { id: "hometown" },
        { id: "notes" },
      ],
      initial: "appearance",
      labelPrefix: "RYUUTAMA.ACTOR.TRAVELER.noteTabs",
    },
  };

  /* -------------------------------------------------- */

  /** @override */
  static SEARCH = {
    inventory: {
      locked: [
        {
          field: "type",
          operator: foundry.applications.ux.SearchFilter.OPERATORS.CONTAINS,
          value: () => Object.entries(CONFIG.Item.dataModels).filter(([, m]) => m.metadata.inventory).map(([k]) => k),
        },
      ],
      filters: [
        {
          id: "type",
          field: "type",
          operator: foundry.applications.ux.SearchFilter.OPERATORS.CONTAINS,
          value: () => Object.entries(CONFIG.Item.dataModels).filter(([, m]) => m.metadata.inventory).map(([k]) => k),
        },
      ],
    },
    spells: {
      locked: [
        {
          field: "type",
          operator: foundry.applications.ux.SearchFilter.OPERATORS.EQUALS,
          value: "spell",
        },
      ],
      filters: [
        {
          id: "category",
          field: "system.category.value",
          operator: foundry.applications.ux.SearchFilter.OPERATORS.CONTAINS,
          value: () => Object.keys(ryuutama.config.spellCategories),
        },
        {
          id: "level",
          field: "system.spell.level",
          operator: foundry.applications.ux.SearchFilter.OPERATORS.CONTAINS,
          value: () => Object.keys(ryuutama.config.spellLevels),
        },
      ],
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _getTabsConfig(group) {
    /** @type {RyuutamaActor} */
    const actor = this.document;
    const hideSpells = (group === "primary")
      && !actor.items.documentsByType.spell.length && !actor.system.details.type.magic;

    if ((this.tabGroups.primary === "spells") && hideSpells) delete this.tabGroups.primary;
    const config = foundry.utils.deepClone(super._getTabsConfig(group));
    if (hideSpells) config.tabs.findSplice(tab => tab.id === "spells");
    return config;
  }

  /* -------------------------------------------------- */
  /*   Context preparation                              */
  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    // Tabs.
    context.tabs = this._prepareTabs("primary");
    context.notes = this._prepareTabs("notes");

    // Abilities.
    context.abilities = this.#prepareAbilities();

    // Defense Points.
    context.armor = this.#prepareArmor();

    // Capacity.
    context.capacity = this.#prepareCapacity();

    // Condition & Shape.
    context.condition = this.#prepareCondition();

    // Notes.
    context.descriptions = await this.#prepareDescriptions(context);

    // Effects.
    context.effects = this.#prepareEffects(context);

    // Equipped items.
    context.equipment = this.#prepareEquipment();

    // Experience.
    context.exp = this.#prepareExp(context);

    // Fumbles.
    context.fumbles = this.#prepareFumbles();

    // Types, terrain specialties, weather specialties.
    context.imageTags = this.#prepareImageTags();

    // Inventory.
    context.inventory = this.#prepareInventory(context);

    // Skills.
    context.skills = this.#prepareSkills();

    // Spells.
    context.spells = this.#prepareSpells(context);

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare abilities context.
   * @returns {object[]}
   */
  #prepareAbilities() {
    const abilities = [];
    for (const ability of Object.keys(ryuutama.config.abilityScores)) {
      abilities.push({
        ...ryuutama.config.abilityScores[ability],
        ability,
        value: this.document.system.abilities[ability],
      });
    }
    return abilities;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare defense points context.
   * @returns {object}
   */
  #prepareArmor() {
    const { modifiers, total } = this.document.system.defense;
    const format = key => {
      const v = modifiers[key];
      if (!v) return null;
      return game.i18n.format(`RYUUTAMA.ACTOR.TRAVELER.damageReduction${key.capitalize()}`, {
        value: ryuutama.utils.formatNumber(v),
      });
    };

    const init = game.combat?.combatants.find(c => c.actor === this.parent)?.initiative ?? null;

    return {
      dp: {
        value: total,
        breakdown: [
          game.i18n.format("RYUUTAMA.ACTOR.TRAVELER.defensePoints", { value: total }),
          format("physical"),
          format("magical"),
        ].filter(_ => _).map(s => `<p>${s}</p>`).join(""),
      },
      dv: {
        value: this.document.system.defenseValue || "—",
        breakdown: [
          game.i18n.format("RYUUTAMA.ACTOR.TRAVELER.shieldDodge", { value: this.document.system.defense.dodge }),
          game.i18n.format("RYUUTAMA.ACTOR.TRAVELER.initiative", { value: this.document.system.combatantInitiative ?? "—" }),
        ].filter(_ => _).map(s => `<P>${s}</p>`).join(""),
      },
    };
  }

  /* -------------------------------------------------- */

  /**
   * Prepare capacity context.
   * @returns {object}
   */
  #prepareCapacity() {
    const { penalty, value, max, pct } = this.document.system.capacity;
    return { value, max, pct, overflow: penalty > 0 };
  }

  /* -------------------------------------------------- */

  /**
   * Prepare condition context.
   * @returns {object}
   */
  #prepareCondition() {
    const condition = this.document.system.condition.value;
    const ctx = {
      ability: ryuutama.config.abilityScores[this.document.system.condition.shape.high]?.label ?? "−",
      high: condition >= 10,
      low: condition <= 2,
    };
    ctx.label = game.i18n.format(
      ctx.high ? "RYUUTAMA.ACTOR.TRAVELER.conditionHigh" : "RYUUTAMA.ACTOR.TRAVELER.conditionLow",
      { ability: ctx.ability });
    ctx.active = ctx.high || ctx.low;
    if (ctx.high) ctx.abilityIcon = ryuutama.config.abilityScores[this.document.system.condition.shape.high]?.icon;
    return ctx;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare descriptions context.
   * @param {object} context    Rendering context.
   * @returns {Promise<{
   *   collapsed: boolean, field: DataField, enriched: string, section: string, source: string, value: string,
   * }[]>}
   */
  async #prepareDescriptions(context) {
    const sections = [];

    for (const key of ["appearance", "hometown", "notes"]) {
      const collapsed = context.collapsed[key];
      const field = this.document.system.schema.getField(`background.${key}`);
      const section = key;
      const value = this.document.system.background[key];
      const enriched = await CONFIG.ux.TextEditor.enrichHTML(value, {
        relativeTo: this.document,
        rollData: context.rollData,
      });
      const source = this.document.system._source.background[key];
      sections.push({ collapsed, field, section, value, enriched, source });
    }

    return sections;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare effects context.
   * @param {object} context    Rendering context.
   * @returns {{ sections: object[] }}
   */
  #prepareEffects(context) {
    const sections = {
      temporary: {
        label: "RYUUTAMA.ACTOR.temporaryEffects",
        create: false,
        attributeLabel: "RYUUTAMA.ACTOR.TRAVELER.effectDuration",
        attribute: "duration.label",
      },
      active: {
        label: "RYUUTAMA.ACTOR.activeEffects",
        create: true,
        disabled: false,
        attributeLabel: "RYUUTAMA.ACTOR.TRAVELER.effectSource",
        attribute: "sourceName",
      },
      inactive: {
        label: "RYUUTAMA.ACTOR.disabledEffects",
        create: true,
        disabled: true,
        attributeLabel: "RYUUTAMA.ACTOR.TRAVELER.effectSource",
        attribute: "sourceName",
      },
    };

    for (const s of Object.values(sections)) {
      s.label = game.i18n.localize(s.label);
      s.attributeLabel = game.i18n.localize(s.attributeLabel);
      s.controlWidgets = s.create && this.isInteractive ? `
      <a data-action="createEffect" data-disabled="${s.disabled}">
        <i class="fa-solid fa-fw fa-plus" inert></i>
      </a>` : null;
      s.entries = [];
    }

    /**
     * Should a delete button be displayed?
     * @param {RyuutamaActiveEffect} effect
     * @returns {boolean}
     */
    const canDelete = effect => {
      if (!context.isInteractive || context.disabled) return false;
      return effect.parent === this.document;
    };

    for (const effect of this.document.allApplicableEffects()) {
      if (effect.type !== "standard") continue;
      const key = !effect.active ? "inactive" : effect.isTemporary ? "temporary" : "active";
      const section = sections[key];
      section.entries.push({
        document: effect,
        dataset: { "effect-context": "" },
        attribute: `<span>${foundry.utils.getProperty(effect, section.attribute)}</span>`,
        buttons: [
          canDelete(effect) ? { action: "deleteEffect", icon: "fa-solid fa-trash" } : null,
        ],
      });
    }

    return { sections: Object.values(sections) };
  }

  /* -------------------------------------------------- */

  /**
   * Prepare equipped items context.
   * @returns {object[]}
   */
  #prepareEquipment() {
    const equipped = {};
    for (const type of ["weapon", "shield", "armor", "hat", "cape", "shoes", "accessory", "staff"]) {
      const item = this.document.system.equipped[type];
      equipped[type] = {
        item, type,
        label: game.i18n.localize(`TYPES.Item.${type}`),
      };
    }
    if (!this.document.system.canEquipShield) delete equipped.shield;
    return Object.values(equipped);
  }

  /* -------------------------------------------------- */

  /**
   * Prepare experience context.
   * @param {object} context    Rendering context.
   * @returns {object}
   */
  #prepareExp(context) {
    const level = this.document.system.details.level;
    const exp = this.document.system.details.exp;
    return {
      ...exp,
      arrow: exp.pct === 100,
      button: !context.disabled && context.isInteractive && (level < 10),
      hideBar: level === 10,
      tag: level,
      tooltip: game.i18n.format("RYUUTAMA.ACTOR.TAGS.level", { level }),
    };
  }

  /* -------------------------------------------------- */

  /**
   * Prepare fumble context.
   * @returns {object}
   */
  #prepareFumbles() {
    const value = this.document.system.fumbles.value;
    const label = this.document.system.schema.getField("fumbles.value").label;
    const digits = Math.log10(value || 1) + 1;
    const disableDown = !this.isInteractive || !value;
    const disableUp = !this.isInteractive;
    return { label, value, digits, disableDown, disableUp };
  }

  /* -------------------------------------------------- */

  /**
   * Prepare icon tags.
   * @returns {{ label: string, icon: string, isSVG: boolean, dataset?: Record<string, string> }[]}
   */
  #prepareImageTags() {
    // CLASSES
    const classes = Object.values(this.document.system.classes).map(item => {
      return {
        label: item.name,
        icon: item.img,
        isSVG: false,
        dataset: {
          "tooltip-html": CONFIG.ux.TooltipManager.constructHTML({ uuid: item.uuid }),
          uuid: item.uuid,
          "item-context": "",
        },
      };
    });

    // TYPES
    const types = Object.entries(this.document.system.details.type)
      .flatMap(([type, value]) => {
        const { icon, label } = ryuutama.config.travelerTypes[type];
        return Array(value).fill({ icon, label, isSVG: icon.endsWith(".svg"), dataset: { "tooltip-text": label } });
      });

    // TERRAIN & WEATHER
    const habitats = [];
    for (const k of this.document.system.mastered.terrain) {
      const { label, iconSmall } = ryuutama.config.terrainTypes[k] ?? {};
      if (label && iconSmall) habitats.push({
        isSVG: iconSmall.endsWith(".svg"),
        icon: iconSmall,
        label: game.i18n.format("RYUUTAMA.ACTOR.TAGS.specialtyTerrain", { terrain: label }),
        dataset: { "tooltip-text": label },
      });
    }

    for (const k of this.document.system.mastered.weather) {
      const { label, icon } = ryuutama.config.weatherTypes[k] ?? {};
      if (label && icon) habitats.push({
        icon,
        isSVG: icon.endsWith(".svg"),
        label: game.i18n.format("RYUUTAMA.ACTOR.TAGS.specialtyWeather", { weather: label }),
        dataset: { "tooltip-text": label },
      });
    }

    // WEAPONS
    const weapons = [];
    for (const k of this.document.system.mastered.weapons) {
      const { label, icon } = ryuutama.config.weaponCategories[k] ?? {};
      if (!icon) continue;
      weapons.push({
        icon,
        label: game.i18n.format("RYUUTAMA.ACTOR.TAGS.masteredWeapon", { weapon: label }),
        isSVG: icon.endsWith(".svg"),
        dataset: { "tooltip-text": label },
      });
    }

    return [
      classes,
      types,
      weapons,
      habitats,
    ].flat();
  }

  /* -------------------------------------------------- */

  /**
   * Prepare inventory sections.
   * @param {object} context    Rendering context.
   * @returns {{ search: object, groups: object[] }}
   */
  #prepareInventory(context) {
    const catMode = this.search.currentCategorizationMode("inventory");

    const makeDur = item => {
      const id = `${context.rootId}-${item.id}-durability`;
      const name = "system.durability.value";
      const value = foundry.utils.getProperty(item, name);
      return `
      <span class="values">
        <input type="text" id="${id}" class="delta" data-name="${name}" value="${value}">
        <span class="sep">/</span>
        <span class="max">${item.system.durability.max}</span>
      </span>`;
    };

    const makeMenuOption = type => {
      const state = this.search.get("inventory", "type", type);
      return {
        sort: CONFIG.Item.dataModels[type].metadata.sort,
        cssClass: [state === 1 ? "active" : null, state === -1 ? "inactive" : null].filterJoin(" "),
        id: "type",
        label: game.i18n.localize(`TYPES.Item.${type}Pl`),
        option: type,
      };
    };

    const makeButtons = item => {
      const buttons = [];

      if (context.isInteractive && !context.disabled)
        buttons.push({ action: "deleteItem", icon: "fa-solid fa-trash" });

      if (context.isInteractive && context.disabled && (this.document.system.equipped[item.type] === item))
        buttons.push({ action: "unequipItem", icon: "fa-solid fa-shield" });

      return buttons;
    };

    const makeSection = (type, props = true) => {
      const items = this.document.items.documentsByType[type];
      if (!items.length) return null;
      const durability = props && CONFIG.Item.dataModels[type].schema.has("durability");
      return {
        sort: CONFIG.Item.dataModels[type].metadata.sort,
        durability,
        labelPlural: game.i18n.localize(`TYPES.Item.${type}Pl`),
        attributeLabel: durability ? game.i18n.localize("RYUUTAMA.ACTOR.durability") : null,
        items: items.map(item => ({
          document: item,
          attribute: durability ? makeDur(item) : null,
          dataset: { "item-context": "" },
          buttons: makeButtons(item),
        })),
      };
    };

    const menuOptions = [];
    const groups = [];
    const sortMode = this.search.currentSortMode("inventory");

    for (const type of Object.keys(CONFIG.Item.dataModels)) {
      if (type === CONST.BASE_DOCUMENT_TYPE) continue;
      if (!CONFIG.Item.dataModels[type].metadata?.inventory) continue;

      menuOptions.push(makeMenuOption(type));
      if (catMode === ryuutama.applications.ux.RyuutamaSearchManager.CATEGORIZATION_MODES.GROUPED) {
        const section = makeSection(type);
        if (section) groups.push(section);
      } else {
        if (!groups.length) groups.push({ labelPlural: game.i18n.localize("DOCUMENT.Items"), items: [] });
        for (const item of this.document.items.documentsByType[type]) {
          groups[0].items.push({
            document: item,
            dataset: { "item-context": "" },
            buttons: makeButtons(item),
          });
        }
      }
    }

    groups.sort((a, b) => {
      const sort = a.sort - b.sort;
      if (sort) return sort;
      return a.labelPlural.localeCompare(b.labelPlural);
    });

    for (const group of groups) group.items.sort((a, b) => {
      switch (sortMode) {
        case ryuutama.applications.ux.RyuutamaSearchManager.SORT_MODES.ALPHABETIC:
          return a.document.name.localeCompare(b.document.name);
        case ryuutama.applications.ux.RyuutamaSearchManager.SORT_MODES.MANUAL:
          return a.document.sort - b.document.sort;
      }
    });

    menuOptions.sort((a, b) => a.sort - b.sort);

    const key = "inventory";
    const search = {
      key,
      allowCategorizationToggle: true,
      categoryCssClass: catMode === 1 ? "boxes-stacked" : "box",
      cssClass: sortMode === "m" ? "1-9" : "a-z",
      placeholder: game.i18n.format("SIDEBAR.Search", { types: game.i18n.localize("DOCUMENT.Items") }),
      expanded: this.expandedFilters.has(key),
      options: menuOptions,
    };

    return { search, groups };
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
        entries: groups.get("other").map(item => ({ document: item, dataset: { "item-context": "" } })),
      });
      groups.delete("other");
    }

    for (const [classItem, skills] of groups.entries()) {
      sections.unshift({
        label: game.i18n.format("RYUUTAMA.TRAVELER.skillSectionLabel", { name: classItem.name }),
        entries: skills.map(skill => ({ document: skill, dataset: { "item-context": "" } })),
      });
    }

    return sections;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare spells.
   * @param {object} context    Rendering context.
   * @returns {{ search: object, groups: object[] }}
   */
  #prepareSpells(context) {
    const ignoreSection = category => {
      switch (category) {
        case "incantation": return !this.document.system.magic.incantation.max;
        default: return !this.document.system.magic.seasons.has(category);
      }
    };

    const sortMode = this.search.currentSortMode("spells");
    const menuOptions = [];
    const sections = [];
    const byCategory = Object.groupBy(this.document.items.documentsByType.spell, spell => spell.system.category.value);
    for (const category of Object.keys(ryuutama.config.spellCategories)) {
      const items = byCategory[category] ?? [];
      if (!items.length && ignoreSection(category)) continue;
      const { label, icon } = ryuutama.config.spellCategories[category];
      const byLevel = Object.groupBy(items, spell => spell.system.spell.level);
      const section = {
        label,
        key: category,
        documents: [],
        attributeLabel: game.i18n.localize("RYUUTAMA.ACTOR.spellLevel"),
      };
      for (const level of ["low", "mid", "high"]) {
        const spells = byLevel[level] ?? [];
        section.documents.push(...spells.map(spell => ({
          document: spell,
          buttons: [
            context.isInteractive && !context.disabled ? { action: "deleteItem", icon: "fa-solid fa-trash" } : null,
            context.isInteractive && context.disabled ? { action: "castSpell", icon: "fa-solid fa-play" } : null,
          ],
          dataset: { "item-context": "" },
          attribute: `<span class="spell-level ${level} ${category}"></span>`,
        })));
      }
      section.documents.sort((a, b) => {
        switch (sortMode) {
          case ryuutama.applications.ux.RyuutamaSearchManager.SORT_MODES.ALPHABETIC:
            return a.document.name.localeCompare(b.document.name);
          case ryuutama.applications.ux.RyuutamaSearchManager.SORT_MODES.MANUAL:
            return a.document.sort - b.document.sort;
        }
      });
      sections.push(section);

      const inc = this.document.system.magic.incantation;
      if (category === "incantation")
        section.controlWidgets = `
        <span data-tooltip="RYUUTAMA.ACTOR.TRAVELER.incantationLearned">
          ${inc.value} / ${inc.max}
        </span>`;
      else if (this.document.system.magic.seasons.has(category))
        section.controlWidgets = `<img src="${icon}" data-tooltip="RYUUTAMA.ACTOR.TRAVELER.seasonAffinity">`;
    }

    for (const key of Object.keys(ryuutama.config.spellCategories)) {
      const state = this.search.get("spells", "category", key);
      menuOptions.push({
        cssClass: [state === 1 ? "active" : null, state === -1 ? "inactive" : null].filterJoin(" "),
        id: "category",
        label: ryuutama.config.spellCategories[key].label,
        option: key,
      });
    }

    for (const level of ["low", "mid", "high"]) {
      const state = this.search.get("spells", "level", level);
      menuOptions.push({
        cssClass: [state === 1 ? "active" : null, state === -1 ? "inactive" : null].filterJoin(" "),
        id: "level",
        label: ryuutama.config.spellLevels[level].label,
        option: level,
      });
    }

    const key = "spells";
    const search = {
      key,
      allowCategorizationToggle: false,
      cssClass: sortMode === "m" ? "1-9" : "a-z",
      placeholder: game.i18n.format("SIDEBAR.Search", { types: game.i18n.localize("TYPES.Item.spellPl") }),
      expanded: this.expandedFilters.has(key),
      options: menuOptions,
    };

    return { search, groups: sections };
  }

  /* -------------------------------------------------- */
  /*   Rendering                                        */
  /* -------------------------------------------------- */

  /** @inheritdoc */
  _replaceHTML(result, content, options) {
    if (!this.document.items.documentsByType.spell.length && !this.document.system.details.type.magic) {
      this.element.querySelector("[data-application-part=spells]")?.remove();
    }
    // Apply tooltip-direction to navigation.
    if (result.navigation) result.navigation.dataset.tooltipDirection = "UP";
    super._replaceHTML(result, content, options);
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
    if (!event.target.closest("[data-application-part=sidebar] .equipped")) return false;
    if (!(item.type in this.document.system.equipped)) return false;
    await this.document.update({ [`system.equipped.${item.type}`]: item.id });
    return true;
  }

  /* -------------------------------------------------- */
  /*   Event Handlers                                   */
  /* -------------------------------------------------- */

  /**
   * @this RyuutamaTravelerSheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #adjustFumbles(event, target) {
    const delta = target.dataset.direction === "UP" ? 1 : -1;
    this.document.update({ "system.fumbles.value": this.document.system.fumbles.value + delta });
  }
}
