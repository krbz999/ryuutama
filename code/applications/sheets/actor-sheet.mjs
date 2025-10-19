import RyuutamaDocumentSheet from "../api/document-sheet.mjs";

/**
 * @import RyuutamaActiveEffect from "../../documents/active-effect.mjs";
 * @import RyuutamaItem from "../../documents/item.mjs";
 * @import DragDrop from "@client/applications/ux/drag-drop.mjs";
 * @import { ContextMenuEntry } from "@client/applications/ux/context-menu.mjs";
 * @import Document from "@common/abstract/document.mjs";
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

    // Effects.
    context.effects = this.#prepareEffects(context);

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare effects.
   * @param {object} context    Rendering context. **will be mutated**
   * @returns {{ enabledEffects: object[], disabledEffects: object[] }}
   */
  #prepareEffects(context) {
    const { enabled = [], disabled = [] } = Object.groupBy(this.document.effects.contents, effect => {
      if (effect.type !== "standard") return "status";
      return effect.disabled ? "disabled" : "enabled";
    });

    return {
      enabledEffects: enabled.map(effect => ({ document: effect })),
      disabledEffects: disabled.map(effect => ({ document: effect, classes: ["inactive"] })),
    };
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

    // Manage effects.
    this._createContextMenu(
      RyuutamaActorSheet.#createActiveEffectContextOptions.bind(this),
      "effects-element .entry",
      { hookName: "Get{}ActiveEffectContextOptions", parentClassHooks: false, fixed: true },
    );
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    this.#dragDrop ??= new CONFIG.ux.DragDrop({
      dragSelector: "inventory-element .entry, effects-element .entry",
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
    const getItem = target => this.getEmbeddedDocument(target.closest("[data-uuid]").dataset.uuid);

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
      {
        group: "system",
        name: "RYUUTAMA.ACTOR.CONTEXT.ITEM.assignSpecialAbility",
        icon: "fa-solid fa-fw fa-star",
        condition: target => {
          if (this.document.type !== "monster") return false;
          const item = getItem(target);
          const isSpecial = this.document.getFlag(ryuutama.id, "specialAbility") === item.id;
          return (item.type === "skill") && !isSpecial;
        },
        callback: target => {
          const item = getItem(target);
          this.document.setFlag(ryuutama.id, "specialAbility", item.id);
        },
      },
    ];

    if (game.release.generation < 14) return options.map(k => ({ ...k, icon: `<i class="${k.icon}"></i>` }));
    return options;
  }

  /* -------------------------------------------------- */

  /**
   * Create context menu options for effects.
   * @this RyuutamaActorSheet
   * @returns {ContextMenuEntry[]}
   */
  static #createActiveEffectContextOptions() {
    const getItem = target => this.getEmbeddedDocument(target.closest("[data-uuid]").dataset.uuid);

    /** @type {ContextMenuEntry[]} */
    const options = [
      {
        name: "RYUUTAMA.ACTOR.CONTEXT.EFFECT.edit",
        icon: "fa-solid fa-fw fa-edit",
        callback: target => getItem(target).sheet.render({ force: true }),
      },
      {
        name: "RYUUTAMA.ACTOR.CONTEXT.EFFECT.delete",
        icon: "fa-solid fa-fw fa-trash",
        callback: target => getItem(target).deleteDialog(),
        condition: () => this.isEditable,
      },
      {
        name: "RYUUTAMA.ACTOR.CONTEXT.EFFECT.disable",
        icon: "fa-solid fa-fw fa-times",
        callback: target => getItem(target).update({ disabled: true }),
        condition: target => this.isEditable && !getItem(target).disabled,
      },
      {
        name: "RYUUTAMA.ACTOR.CONTEXT.EFFECT.enable",
        icon: "fa-solid fa-fw fa-check",
        callback: target => getItem(target).update({ disabled: false }),
        condition: target => this.isEditable && getItem(target).disabled,
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
    const item = this.getEmbeddedDocument(target.closest("[data-uuid]").dataset.uuid);
    const data = item.toDragData();
    event.dataTransfer.setData("text/plain", JSON.stringify(data));
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaActorSheet
   * @param {DragEvent} event   The initiating drag event.
   * @returns {Promise<Document|null>}
   */
  static async #onDrop(event) {
    const { uuid } = CONFIG.ux.TextEditor.getDragEventData(event);
    const document = await fromUuid(uuid);
    if (!document) return null;

    switch (document.documentName) {
      case "Item": return (await this._onDropItem(document, event)) ?? null;
      case "ActiveEffect": return (await this._onDropActiveEffect(document, event)) ?? null;
    }

    return null;
  }

  /* -------------------------------------------------- */

  /**
   * Handle dropping an item onto the actor sheet.
   * @param {RyuutamaItem} item
   * @param {DragEvent} event
   * @returns {Promise<RyuutamaItem|null>}
   */
  async _onDropItem(item, event) {
    if (item.parent === this.document) return null; // TODO: sort?
    const keepId = !this.document.items.has(item.id);
    const itemData = game.items.fromCompendium(item, { keepId });
    return getDocumentClass("Item").create(itemData, { parent: this.document, keepId });
  }

  /* -------------------------------------------------- */

  /**
   * Handle dropping an effect onto the actor sheet.
   * @param {RyuutamaActiveEffect} effect
   * @param {DragEvent} event
   * @returns {Promise<RyuutamaActiveEffect|null>}
   */
  async _onDropActiveEffect(effect, event) {
    if (effect.parent === this.document) return null; // TODO: sort?
    if (effect.parent?.parent === this.document) return null; // own grandchild effect
    const keepId = !this.document.effects.has(effect.id);
    const effectData = effect.toObject();
    effectData.origin = effect.parent?.uuid;
    return getDocumentClass("ActiveEffect").create(effectData, { parent: this.document, keepId });
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaActorSheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #renderItem(event, target) {
    const item = this.getEmbeddedDocument(target.dataset.uuid);
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
