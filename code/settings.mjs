const { BooleanField, ForeignDocumentField, NumberField, SchemaField, StringField } = foundry.data.fields;

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
      terrain: new StringField({ required: true, choices: () => ryuutama.config.terrainTypes, initial: "grassland" }),
      weather: new StringField({ required: true, choices: () => ryuutama.config.weatherTypes, initial: "clearSkies" }),
    }),
    default: { terrain: "grassland", weather: "clearSkies" },
    config: false,
    onChange: () => ui.habitat.render(),
  });

  // Journey management.
  game.settings.register(ryuutama.id, "JOURNEY_MANAGEMENT", {
    name: "Journey Management",
    scope: "world",
    requiresReload: false,
    type: JourneyManagementData,
    config: false,
    onChange: () => game.settings.journeyManager.render(),
  });

  // Migration version.
  game.settings.register(ryuutama.id, "MIGRATION_VERSION", {
    name: "Migration Version",
    scope: "world",
    requiresReload: false,
    type: new StringField({ required: true, blank: true }),
    config: false,
  });

  migrateSettings();
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

class JourneyManagementData extends foundry.abstract.DataModel {
  /** @override */
  static defineSchema() {
    return {
      camping: new SchemaField({
        primary: new StringField(),
        result: new NumberField(),
        support: new StringField(),
        supported: new BooleanField(),
      }),
      condition: new SchemaField({
        ignore: new BooleanField(),
      }),
      consumption: new SchemaField({}),
      direction: new SchemaField({
        ignore: new BooleanField(),
        primary: new StringField(),
        result: new NumberField(),
        support: new StringField(),
        supported: new BooleanField(),
      }),
      travel: new SchemaField({
        ignore: new BooleanField(),
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

/* -------------------------------------------------- */

/**
 * Perform migration on settings.
 */
function migrateSettings() {
  // Current habitat now only stores strings, not arrays of strings.
  const data = game.settings.storage.get("world").find(k => k.key === `${ryuutama.id}.CURRENT_HABITAT`)?.value;
  for (const k of ["weather", "terrain"]) if (data?.[k]?.includes?.(",")) data[k] = data[k].split(",")[0].trim();
}
