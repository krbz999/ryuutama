const { ForeignDocumentField, SchemaField, SetField, StringField } = foundry.data.fields;

export default function registerSettings() {
  // Storing the primary party's id.
  game.settings.register(ryuutama.id, "PRIMARY_PARTY", {
    name: "Primary Party",
    scope: "world",
    requiresReload: false,
    type: PrimaryPartyModel,
    default: null,
    config: false,
    onChange: () => ui.actors.render(),
  });

  // Current habitat.
  game.settings.register(ryuutama.id, "CURRENT_HABITAT", {
    name: "Current Habitat",
    scope: "world",
    requiresReload: false,
    type: new SchemaField({
      terrain: new SetField(
        new StringField({ choices: () => ryuutama.config.terrainTypes }),
        { label: "RYUUTAMA.SETTINGS.CURRENT_HABITAT.terrain" },
      ),
      weather: new SetField(
        new StringField({ choices: () => ryuutama.config.weatherTypes }),
        { label: "RYUUTAMA.SETTINGS.CURRENT_HABITAT.weather" },
      ),
    }),
    default: { terrain: [], weather: [] },
    config: false,
    onChange: () => ui.habitat.render(),
  });

  // Migration version.
  game.settings.register(ryuutama.id, "MIGRATION_VERSION", {
    name: "Migration Version",
    scope: "world",
    requiresReload: false,
    type: new StringField({ required: true, blank: true }),
    config: false,
  });
}

/* -------------------------------------------------- */

class PrimaryPartyModel extends foundry.abstract.DataModel {
  /** @inheritdoc */
  static defineSchema() {
    return {
      actor: new ForeignDocumentField(foundry.documents.BaseActor, {
        blank: true,
        validate: id => !game.actors || (game.actors.get(id)?.type === "party"),
        validationError: "This is not a valid id for a Party-type actor.",
      }),
    };
  }
}

/* -------------------------------------------------- */

/**
 * Set migration version.
 * If there is a migration in the future, this can be removed,
 * and instead checked against a flag in the system manifest.
 */
Hooks.once("ready", () => {
  if (!game.user.isActiveGM) return;
  game.settings.set(ryuutama.id, "MIGRATION_VERSION", game.system.version);
});
