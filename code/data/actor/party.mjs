import BaseData from "./templates/base.mjs";

/**
 * @import { PlaceMembersDialogConfiguration } from "../../applications/apps/actors/place-members-dialog.mjs";
 * @import RegionLayer from "@client/canvas/layers/regions.mjs";
 * @import RyuutamaActor from "../../documents/actor.mjs";
 * @import RyuutamaTokenDocument from "../../documents/token.mjs";
 */

const { HTMLField, SchemaField, TypedObjectField } = foundry.data.fields;

export default class PartyData extends BaseData {
  /** @inheritdoc */
  static defineSchema() {
    return {
      description: new SchemaField({
        value: new HTMLField(),
      }),
      members: new TypedObjectField(
        new SchemaField({}),
        { validateKey: key => foundry.data.validators.isValidId(key) },
      ),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.ACTOR.PARTY",
  ];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    if ((await super._preCreate(data, options, user)) === false) return false;

    const update = foundry.utils.mergeObject({
      prototypeToken: {
        actorLink: true,
        disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
        sight: {
          enabled: false,
        },
      },
    }, data, { insertKeys: false, insertValues: false, overwrite: true });
    this.parent.updateSource(update);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareBaseData() {
    super.prepareBaseData();

    Object.defineProperty(this, "members", {
      enumerable: true,
      get() {
        return Object.entries(this._source.members).reduce((acc, [id, data]) => {
          const actor = game.actors.get(id);
          if (this.validMember(actor)) acc.set(actor.id, { ...data, actor });
          return acc;
        }, new foundry.utils.Collection());
      },
    });
  }

  /* -------------------------------------------------- */

  /**
   * Is a given actor valid to be a member of this party?
   * @param {RyuutamaActor} actor
   * @returns {boolean}
   */
  validMember(actor) {
    return (actor instanceof foundry.documents.Actor) && ["traveler"].includes(actor.type)
      && !actor.inCompendium && !actor.isToken;
  }

  /* -------------------------------------------------- */

  /**
   * Add members to the party.
   * @param {RyuutamaActor[]} [actors]    The actors to add.
   * @returns {Promise<RyuutamaActor>}    A promise that resolves to the updated party actor.
   */
  async addMembers(actors = []) {
    actors = new Set(actors.filter(this.validMember)).filter(actor => !this.members.has(actor.id));
    const ids = [...this.members.keys(), ...actors.map(a => a.id)];
    const update = Object.entries(this.toObject().members).reduce((acc, [id, src]) => {
      if (ids.includes(id)) acc[id] = src;
      return acc;
    }, {});
    ids.forEach(id => update[id] = {});
    await this.parent.update({ "system.members": _replace(update) });
    return this.parent;
  }

  /* -------------------------------------------------- */

  /**
   * Remove members from the party.
   * @param {RyuutamaActor[]} [actors]    The actors to remove.
   * @returns {Promise<RyuutamaActor>}    A promise that resolves to the updated party actor.
   */
  async removeMembers(actors = []) {
    const update = {};
    actors.forEach(actor => {
      if (this.validMember(actor) && this.members.has(actor.id)) update[actor.id] = _del;
    });
    await this.parent.update({ "system.members": update });
    return this.parent;
  }

  /* -------------------------------------------------- */

  /**
   * Place down the members of this party.
   * @param {object} [options]
   * @param {boolean} [options.configure=true]      Display a configuration dialog?
   * @param {PlaceMembersDialogConfiguration} [options.configuration]
   * @returns {Promise<RyuutamaTokenDocument[]>}    A promise that resolves to the created tokens.
   */
  async placeMembers({ configure = true, configuration } = {}) {
    const sheet = this.parent.sheet;

    configuration = foundry.utils.mergeObject({
      createCombatants: !!game.combat,
      members: this.members.filter(m => !m.actor.getActiveTokens().length).map(m => m.actor.id),
      selectArea: true,
    }, configuration);

    if (configure) {
      const configured = await ryuutama.applications.apps.actors.PlaceMembersDialog.create({
        configuration, document: this.parent,
        parentWindow: sheet.window.windowId,
      });
      if (!configured) return null;
    }

    if (!configuration.members.length) return [];

    const isMaximized = !sheet.window.windowId && sheet.rendered && !sheet.minimized;
    if (isMaximized) await sheet.minimize();

    const promises = configuration.members.map(
      id => this.members.get(id).actor.getTokenDocument({}, { parent: canvas.scene }),
    );
    const tokenData = (await Promise.all(promises)).map(token => token.toObject());
    let tokens = [];

    // Place a region and spawn tokens randomly within.
    if (configuration.selectArea) {
      const minRadius = Math.ceil(Math.sqrt(this.members.size / 2)) * canvas.grid.size;
      const regionData = {
        color: game.user.color.css,
        displayMeasurements: false,
        levels: [canvas.level.id],
        name: _loc("RYUUTAMA.ACTOR.PARTY.PLACE_MEMBERS.partyMembers"),
        restriction: {
          enabled: true,
          type: "move",
        },
        shapes: [new foundry.data.CircleShapeData({
          radius: minRadius,
          type: "circle", x: 0, y: 0,
        })],
      };

      /** @type {RegionLayer} */
      const layer = canvas.regions;

      /** @type {foundry.documents.RegionDocument} */
      const region = await layer.placeRegion(regionData, { create: false, onRotate: ({ event, shape }) => {
        if (event.ctrlKey) {
          shape.updateSource({ radius: Math.max(shape.radius - canvas.grid.size * Math.sign(event.delta), minRadius) });
          return false;
        }
      } });
      if (region) tokens = await region.spawnTokens(tokenData, { snap: true, avoidOccupied: true });
    }

    // Select each token's position.
    else {
      const names = Iterator.from(tokenData.map(t => t.name));

      const notification = ui.notifications.info("RYUUTAMA.ACTOR.PARTY.PLACE_MEMBERS.notification", {
        format: { name: names.next().value },
        pct: 0,
        progress: true,
      });

      const updateNotification = ({ index, count }) => {
        const { value: name, done } = names.next();
        notification.update({
          message: _loc(`RYUUTAMA.ACTOR.PARTY.PLACE_MEMBERS.notification${done ? "Done" : ""}`, { name }),
          pct: (index + 1) / count,
        });
        if (done) notification.element?.classList.add("success");
      };

      tokens = await canvas.tokens.placeTokens(tokenData, {
        create: true, preConfirm: updateNotification, preSkip: updateNotification,
      });
    }

    // Create combatants.
    if (tokens.length && configuration.createCombatants) {
      await getDocumentClass("Token").createCombatants(tokens, { combat: game.combat });
    }

    if (isMaximized) await sheet.maximize();

    return tokens;
  }

  /* -------------------------------------------------- */

  /**
   * Grant every party member a fumble point.
   * @returns {Promise<RyuutamaActor[]>}    A promise that resolves to the updated actors.
   */
  async grantFumblePoint() {
    const actors = this.members
      .map(m => m.actor)
      .filter(a => a.type === "traveler");
    const updates = actors.map(actor => {
      return { _id: actor.id, "system.fumbles.value": actor.system.fumbles.value + 1 };
    });
    return getDocumentClass("Actor").updateDocuments(updates);
  }
}
