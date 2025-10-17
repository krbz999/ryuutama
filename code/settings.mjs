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
    onChange: value => onChangeHabitat(value),
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
 * Create a button above the Players to configure the current habitat.
 */
Hooks.once("renderPlayers", (players) => {
  if (!game.user.isGM) return;

  /** @type {HTMLButtonElement} */
  const element = players.element.ownerDocument.createElement("BUTTON");
  element.type = "button";
  element.classList.add("faded-ui");
  element.id = "ryuutama-current-habitat";

  const value = game.settings.get(ryuutama.id, "CURRENT_HABITAT");
  onChangeHabitat(value, element);

  players.element.insertAdjacentElement("beforebegin", element);

  element.addEventListener("click", configureHabitat);
});

/* -------------------------------------------------- */

/**
 * Prompt a dialog to configure the habitat setting.
 * @returns {Promise<void>}
 */
async function configureHabitat() {
  const fields = [];
  const current = game.settings.get(ryuutama.id, "CURRENT_HABITAT");
  for (const field of game.settings.settings.get("ryuutama.CURRENT_HABITAT").type) {
    fields.push(
      field.toFormGroup(
        { localize: true, classes: ["stacked"] },
        { value: current[field.name], type: "checkboxes", sort: true },
      ),
    );
  }

  let habitat = await foundry.applications.api.Dialog.input({
    content: fields.map(field => field.outerHTML).join(""),
    window: {
      title: "RYUUTAMA.SETTINGS.CURRENT_HABITAT.title",
    },
  });
  if (!habitat) return;

  habitat = foundry.utils.expandObject(habitat)[ryuutama.id].CURRENT_HABITAT;

  game.settings.set(ryuutama.id, "CURRENT_HABITAT", habitat);
}

/* -------------------------------------------------- */

/**
 * Respond to the habitat setting being changed, or the creation of the button.
 * @param {{ terrain: Set<string>, weather: Set<string>}} value   Value to derive a label from.
 * @param {HTMLButtonElement} [button]                            The button, if being created.
 */
function onChangeHabitat(value, button = null) {
  if (!game.user.isGM) return;
  button ??= document.getElementById("ryuutama-current-habitat");

  let { terrain, weather } = value;

  let text = `<h4>${game.i18n.localize("RYUUTAMA.SETTINGS.CURRENT_HABITAT.current")}</h4>`;

  const targetNumber =
    Math.max(0, ...[...value.terrain].map(t => ryuutama.config.terrainTypes[t].level).filter(_ => _))
    + Math.max(0, ...[...value.weather].map(w => ryuutama.config.weatherTypes[w].modifier).filter(_ => _));

  if (targetNumber) text += `<span class="topography">${
    game.i18n.format("RYUUTAMA.SETTINGS.CURRENT_HABITAT.targetNumber", { number: targetNumber })
  }</span>`;

  const formatter = game.i18n.getListFormatter();

  terrain = terrain.map(key => ryuutama.config.terrainTypes[key]?.label).filter(_ => _);
  if (terrain.size) text += `<span class="terrain">${formatter.format(terrain)}</span>`;

  weather = weather.map(key => ryuutama.config.weatherTypes[key]?.label).filter(_ => _);
  if (weather.size) text += `<span class="weather">${formatter.format(weather)}</span>`;

  button.innerHTML = text;
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
