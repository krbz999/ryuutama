import RyuutamaBaseActorSheet from "./base.mjs";

/**
 * @import RyuutamaActor from "../../../documents/actor.mjs";
 */

export default class RyuutamaPartySheet extends RyuutamaBaseActorSheet {
  /** @override */
  static DEFAULT_OPTIONS = {
    actions: {
      consumeRation: RyuutamaPartySheet.#consumeRation,
      placeMembers: RyuutamaPartySheet.#placeMembers,
      removeMember: RyuutamaPartySheet.#removeMember,
      showMember: RyuutamaPartySheet.#showMember,
    },
  };

  /* -------------------------------------------------- */

  /** @override */
  static PARTS = {
    header: {
      template: "systems/ryuutama/templates/sheets/actors/party/header.hbs",
    },
    navigation: {
      template: "templates/generic/tab-navigation.hbs",
    },
    members: {
      template: "systems/ryuutama/templates/sheets/actors/party/members.hbs",
      classes: ["tab"],
      scrollable: [".contents"],
    },
    rations: {
      template: "systems/ryuutama/templates/sheets/actors/party/rations.hbs",
      classes: ["tab"],
      scrollable: [".contents"],
    },
    details: {
      template: "systems/ryuutama/templates/sheets/actors/party/details.hbs",
      classes: ["tab"],
      scrollable: [".contents"],
    },
  };

  /* -------------------------------------------------- */

  /** @override */
  static TABS = {
    primary: {
      tabs: [
        { id: "members" },
        { id: "rations" },
        { id: "details" },
      ],
      initial: "members",
      labelPrefix: "RYUUTAMA.ACTOR.TABS",
    },
  };

  /* -------------------------------------------------- */

  /**
   * External actors who re-render this application.
   * @type {Set<RyuutamaActor>}
   */
  #appActors = new Set();

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.header = await this.#prepareHeader();
    context.members = await this.#prepareMembers();
    context.rations = await this.#prepareRations();
    context.details = await this.#prepareDetails();

    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare details context.
   * @returns {Promise<object>}
   */
  async #prepareDetails() {
    const value = this.document.system._source.description.value;
    const enriched = await CONFIG.ux.TextEditor.enrichHTML(value, {
      rollData: this.document.getRollData(),
      relativeTo: this.document,
    });
    return {
      isOwner: this.document.isOwner,
      description: { value, enriched },
    };
  }

  /* -------------------------------------------------- */

  /**
   * Prepare header context.
   * @returns {Promise<object>}
   */
  async #prepareHeader() {
    const members = this.document.system.members;
    const { value, max } = members.reduce((acc, { actor }) => {
      const { value, max } = actor.system.resources.stamina;
      return { value: acc.value + value, max: acc.max + max };
    }, { value: 0, max: 0 });
    const pct = max ? Math.floor(value / max * 100) : 100;
    return {
      canPlaceMembers: game.user.isGM && canvas?.ready && members.size,
      hp: {
        value, max,
        pct: Math.clamp(pct, -100, 100),
        fill: Math.abs(pct),
        id: this.id,
        negative: pct < 0,
      },
    };
  }

  /* -------------------------------------------------- */

  /**
   * Prepare members context.
   * @returns {Promise<object[]>}
   */
  async #prepareMembers() {
    const members = [];
    for (const member of this.document.system.members) {
      const ctx = { ...member };
      const { stamina: hp, mental: mp } = member.actor.system.resources;
      Object.assign(ctx, {
        hp, mp,
        rootId: [this.id, member.actor.id].join("-"),
        canView: member.actor.testUserPermission(game.user, "OBSERVER"),
      });
      members.push(ctx);
    }
    return members;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare rations context.
   * @returns {Promise<{ type: string, rations: object[] }[]>}
   */
  async #prepareRations() {
    const rations = {};

    const makeTooltip = (actor, container, ration) => {
      return [
        `<p>${ration.label}</p>`,
        `<p>${_loc("TYPES.Item.container")}: ${container.name}</p>`,
        `<p>${_loc("RYUUTAMA.ACTOR.PARTY.actorOwner")}: ${actor.name}</p>`,
      ].filterJoin("");
    };

    for (const { actor } of this.document.system.members) {
      for (const container of actor.items.documentsByType.container) {
        for (const type of Object.keys(ryuutama.config.rationTypes)) {
          rations[type] ??= { type, label: ryuutama.config.rationTypes[type].label, rations: [] };
          for (const ration of container.system.rations[type]) {
            rations[type].rations.push({
              ...ration, actor, container,
              cssClass: [ration.modifier].filterJoin(" "),
              disabled: !container.isOwner || !this.isEditable,
              icon: ryuutama.config.rationTypes[type].icon,
              tooltip: makeTooltip(actor, container, ration),
            });
          }
        }
      }
    }
    return Object.values(rations);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);
    for (const actor of this.#appActors) delete actor.apps[this.id];
    this.#appActors.clear();
    for (const { actor } of this.document.system.members) {
      actor.apps[this.id] = this;
      this.#appActors.add(actor);
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onClose(options) {
    for (const actor of this.#appActors) delete actor.apps[this.id];
    this.#appActors.clear();
    return super._onClose(options);
  }

  /* -------------------------------------------------- */

  /** @override */
  async _onDropActor(event, actor) {
    await this.document.system.addMembers([actor]);
    return true;
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaPartySheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #consumeRation(event, target) {
    const { containerUuid, rationId } = target.closest(".ration").dataset;
    const container = fromUuidSync(containerUuid);
    container.system.removeRation(rationId);
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaPartySheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static async #placeMembers(event, target) {
    const isMaximized = this.rendered && !this.minimized;
    if (isMaximized) await this.minimize();
    await this.document.system.placeMembers();
    if (isMaximized) this.maximize();
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaPartySheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #removeMember(event, target) {
    const id = target.closest("[data-member-id]").dataset.memberId;
    const actor = game.actors.get(id);
    this.document.system.removeMembers([actor]);
  }

  /* -------------------------------------------------- */

  /**
   * @this RyuutamaPartySheet
   * @param {PointerEvent} event    The initiating click event.
   * @param {HTMLElement} target    The capturing html element that defined the [data-action].
   */
  static #showMember(event, target) {
    const id = target.closest("[data-member-id]").dataset.memberId;
    const actor = game.actors.get(id);
    actor.sheet.render({ force: true });
  }
}
