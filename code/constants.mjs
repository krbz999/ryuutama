import Prelocalization from "./helpers/prelocalization.mjs";

/**
 * @import {
 * AbilityScoreConfig, AnimalModifierConfig, AnimalTypeConfig, CheckTypeConfig, DamageRollPropertyConfig,
 * HerbTypeConfig, ItemModifierConfig, ItemSizeConfig, MonsterCategoryConfig, RationModifierConfig,
 * RationTypeConfig, SeasonConfig, SpecialStatusEffectConfig, SpellCategoryConfig, SpellActivationTypeConfig,
 * SpellDurationTypeConfig, SpellLevelConfig, SpellRangeTypeConfig, StatusEffectConfig, TerrainTypeConfig,
 * TravelerTypeConfig, UnarmedConfiguration, WeaponTypeConfig, WeatherTypeConfig,
 * } from "./_types.mjs";
 */

/**
 * @enum {Record<string, AbilityScoreConfig>}
 */
export const ABILITY_SCORES = {
  strength: {
    label: "RYUUTAMA.ABILITIES.strength",
    abbreviation: "RYUUTAMA.ABILITIES.strengthAbbr",
    icon: "systems/ryuutama/assets/official/icons/stats/strength.svg",
  },
  dexterity: {
    label: "RYUUTAMA.ABILITIES.dexterity",
    abbreviation: "RYUUTAMA.ABILITIES.dexterityAbbr",
    icon: "systems/ryuutama/assets/official/icons/stats/dexterity.svg",
  },
  intelligence: {
    label: "RYUUTAMA.ABILITIES.intelligence",
    abbreviation: "RYUUTAMA.ABILITIES.intelligenceAbbr",
    icon: "systems/ryuutama/assets/official/icons/stats/intelligence.svg",
  },
  spirit: {
    label: "RYUUTAMA.ABILITIES.spirit",
    abbreviation: "RYUUTAMA.ABILITIES.spiritAbbr",
    icon: "systems/ryuutama/assets/official/icons/stats/spirit.svg",
  },
};
Prelocalization.prelocalize(ABILITY_SCORES, { properties: ["label", "abbreviation"], deepFreeze: true });
