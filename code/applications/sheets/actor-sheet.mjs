import RyuutamaDocumentSheet from "../api/document-sheet.mjs";

/**
 * @import RyuutamaItem from "../../documents/item.mjs";
 * @import DragDrop from "@client/applications/ux/drag-drop.mjs";
 * @import { ContextMenuEntry } from "@client/applications/ux/context-menu.mjs";
 */

/**
 * Base actor sheet.
 * @extends RyuutamaDocumentSheet
 */
export default class RyuutamaActorSheet extends RyuutamaDocumentSheet {
  /** @override */
  static DEFAULT_OPTIONS = {
    actions: {
      advance: RyuutamaActorSheet.#advance,
      configure: RyuutamaActorSheet.#configure,
      configurePrototypeToken: RyuutamaActorSheet.#configurePrototypeToken,
      renderItem: RyuutamaActorSheet.#renderItem,
      rollCheck: RyuutamaActorSheet.#rollCheck,
      toggleStatus: RyuutamaActorSheet.#toggleStatus,
    },
    window: {
      controls: [{
        action: "configurePrototypeToken",
        icon: "fa-solid fa-circle-user",
        label: "TOKEN.TitlePrototype",
        ownership: "OWNER",
      }],
    },
  };

  /* -------------------------------------------------- */

  /**
   * A reference to the DragDrop instance, reused across re-renders.
   * @type {DragDrop}
   */
  #dragDrop;

  /* -------------------------------------------------- */

  /** @override */
  get title() {
    return this.document.name;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _getHeaderControls() {
    const controls = super._getHeaderControls();
    if (!this.isEditable || this.document.isToken) {
      controls.findSplice(c => c.action === "configurePrototypeToken");
    }
    return controls;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    // Abilities.
    context.abilities = Object.keys(ryuutama.config.abilityScores).map(abi => {
      return {
        ability: abi,
        icon: ryuutama.config.abilityScores[abi].icon,
        label: ryuutama.config.abilityScores[abi].abbreviation,
        value: this.document.system.abilities[abi],
      };
    });

    // Status effects.
    const immunities = this.document.system.condition.immunities;
    const affected = this.document.system.condition.statuses;
    context.statuses = Object.entries(ryuutama.config.statusEffects).map(([status, data]) => {
      const { img, name, _id } = data;
      const immune = immunities.has(status);
      const effect = this.document.effects.get(_id);
      const strength = affected[status] ?? 0;
      const suppressed = !!effect && !strength;
      return {
        img, name, status, immune, effect, strength, suppressed,
        active: strength > 0,
        label: suppressed
          ? game.i18n.format("RYUUTAMA.ACTOR.statusSuppressed", { strength: effect.system.strength.value })
          : immune
            ? game.i18n.localize("RYUUTAMA.ACTOR.statusImmune")
            : strength,
      };
    });

    // Armor.
    const modifiers = this.document.system.defense.modifiers;
    context.armor = {
      total: this.document.system.defense.total,
      hasTags: !!modifiers.physical || !!modifiers.magical,
      tags: {
        physical: modifiers.physical ? modifiers.physical.signedString() : null,
        magical: modifiers.magical ? modifiers.magical.signedString() : null,
      },
    };

    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preFirstRender(context, options) {
    await super._preFirstRender(context, options);

    await foundry.applications.handlebars.loadTemplates({
      abilities: "systems/ryuutama/templates/sheets/shared/abilities.hbs",
      defense: "systems/ryuutama/templates/sheets/shared/defense.hbs",
      resources: "systems/ryuutama/templates/sheets/shared/resources.hbs",
      statuses: "systems/ryuutama/templates/sheets/shared/statuses.hbs",
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);

    // Manage items.
    this._createContextMenu(
      RyuutamaActorSheet.#createItemContextOptions.bind(this),
      "inventory-element .entry, .equipped [data-item-id]",
      { hookName: "get{}ItemContextOptions", parentClassHooks: false, fixed: true },
    );
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    this.#dragDrop ??= new CONFIG.ux.DragDrop({
      dragSelector: "inventory-element .entry",
      dropSelector: null,
      permissions: {
        dragstart: RyuutamaActorSheet.#canDragstart.bind(this),
        drop: RyuutamaActorSheet.#canDrop.bind(this),
      },
      callbacks: {
        dragstart: RyuutamaActorSheet.#onDragstart.bind(this),
        drop: RyuutamaActorSheet.#onDrop.bind(this),
      },
    });
    this.#dragDrop.bind(this.element);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _processFormData(event, form, formData) {
    formData = super._processFormData(event, form, formData);

    for (const resource of ["stamina", "mental"]) {
      if (foundry.utils.hasProperty(formData, `system.resources.${resource}.value`)) {
        const value = foundry.utils.getProperty(formData, `system.resources.${resource}.value`);
        const { max } = this.document.system.resources[resource];
        foundry.utils.setProperty(formData, `system.resources.${resource}.spent`, max - value);
      }
    }

    return formData;
  }

  /* -------------------------------------------------- */

  /**
   * Create context menu options for items.
   * @this RyuutamaActorSheet
   * @returns {ContextMenuEntry[]}
   */
  static #createItemContextOptions() {
    const getItem = target => this.document.items.get(target.dataset.itemId);

    /** @type {ContextMenuEntry[]} */
    const options = [
      {
        name: "RYUUTAMA.ACTOR.CONTEXT.ITEM.view",
        icon: "fa-solid fa-fw fa-eye",
        callback: target => getItem(target).sheet.render({ force: true, mode: 1 }),
      },
      {
        name: "RYUUTAMA.ACTOR.CONTEXT.ITEM.edit",
        icon: "fa-solid fa-fw fa-edit",
        callback: target => getItem(target).sheet.render({ force: true, mode: 0 }),
      },
      {
        name: "RYUUTAMA.ACTOR.CONTEXT.ITEM.delete",
        icon: "fa-solid fa-fw fa-trash",
        callback: target => getItem(target).deleteDialog(),
        condition: () => this.isEditable,
      },
      {
        group: "system",
        name: "RYUUTAMA.ACTOR.CONTEXT.ITEM.equip",
        icon: "fa-solid fa-fw fa-shield",
        condition: target => {
          if (!this.isEditable || (this.document.type !== "traveler")) return false;
          const item = getItem(target);
          if ((item.type === "shield") && !this.document.system.canEquipShield) return false;
          else if (!this.document.system.schema.fields.equipped.has(item.type)) return false;
          const equipped = this.document.system.equipped[item.type];
          return equipped !== item;
        },
        callback: target => {
          const item = getItem(target);
          this.document.update({ [`system.equipped.${item.type}`]: item.id });
        },
      },
      {
        group: "system",
        name: "RYUUTAMA.ACTOR.CONTEXT.ITEM.unequip",
        icon: "fa-solid fa-fw fa-shield-alt",
        condition: target => {
          const item = getItem(target);
          return this.isEditable && (this.document.type === "traveler")
            && (this.document.system.equipped[item.type] === item);
        },
        callback: target => {
          const item = getItem(target);
          this.document.update({ [`system.equipped.${item.type}`]: null });
        },
      },
    ];

    if (game.release.generation < 14) return options.map(k => ({ ...k, icon: `<i class="${k.icon}"></i>` }));
    return options;
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaActorSheet
   * @param {string} selector   The css selector on which the drag event is targeted.
   * @returns {boolean}         Whether the user may initiate a drag event from this element.
   */
  static #canDragstart(selector) {
    return true;
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaActorSheet
   * @param {string} selector   The css selector on which the drag event is targeted.
   * @returns {boolean}         Whether the user may finalize a drag event onto this element.
   */
  static #canDrop(selector) {
    if (!this.isEditable) return false;
    return true;
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaActorSheet
   * @param {DragEvent} event   The initiating drag event.
   */
  static #onDragstart(event) {
    const target = event.currentTarget;
    if ("link" in event.target.dataset) return;

    /** @type {RyuutamaItem} */
    const item = this.document.items.get(target.dataset.itemId);
    const data = item.toDragData();
    event.dataTransfer.setData("text/plain", JSON.stringify(data));
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaActorSheet
   * @param {DragEvent} event   The initiating drag event.
   */
  static async #onDrop(event) {
    const { type, uuid } = CONFIG.ux.TextEditor.getDragEventData(event);
    if (type !== "Item") return;
    const item = await fromUuid(uuid);
    if (item.parent === this.document) return; // TODO: sort?

    const keepId = !this.document.items.has(item.id);
    const itemData = game.items.fromCompendium(item, { keepId });
    getDocumentClass("Item").create(itemData, { parent: this.document, keepId });
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaActorSheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #renderItem(event, target) {
    const item = this.document.items.get(target.dataset.itemId, { strict: true });
    item.sheet.render({ force: true, mode: 1 });
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaActorSheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #rollCheck(event, target) {
    const type = target.dataset.check;
    this.document.system.rollCheck({ type });
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaActorSheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #configure(event, target) {
    const options = { document: this.document };
    let application;
    switch (target.dataset.config) {
      case "ability":
        options.ability = target.dataset.ability;
        application = new ryuutama.applications.apps.AbilityConfig(options);
        break;
      case "attack":
        application = new ryuutama.applications.apps.AttackConfig(options);
        break;
      case "condition":
        application = new ryuutama.applications.apps.ConditionConfig(options);
        break;
      case "defense":
        application = new ryuutama.applications.apps.DefenseConfig(options);
        break;
      case "resource":
        options.resource = target.dataset.resource;
        application = new ryuutama.applications.apps.ResourceConfig(options);
        break;
    }
    if (!application) return;
    application.render({ force: true });
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaActorSheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #toggleStatus(event, target) {
    const status = target.dataset.status;
    this.document.toggleStatusEffect(status);
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaActorSheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #configurePrototypeToken(event, target) {
    new CONFIG.Token.prototypeSheetClass({
      prototype: this.document.prototypeToken,
      position: {
        left: Math.max(this.position.left - 560 - 10, 10),
        top: this.position.top,
      },
    }).render({ force: true });
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaActorSheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #advance(event, target) {
    this.document.system.advance();
  }
}
