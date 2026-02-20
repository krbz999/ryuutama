/**
 * @typedef AbilityScoreConfig
 * @property {string} label           Human-readable label.
 * @property {string} abbreviation    Short-form of the label.
 * @property {string} icon            File path to the ability's icon.
 */

/* -------------------------------------------------- */

/**
 * @typedef AnimalTypeConfig
 * @property {string} label         Human-readable label.
 * @property {number} price         Default base price.
 * @property {number} [ride]        Number of people who can ride this animal. If non-zero, it is assumed this grants
 *                                  a +1 bonus to travel checks on topographies of Level 2 or less.
 * @property {number} [capacity]    Carrying capacity of this animal.
 */

/* -------------------------------------------------- */

/**
 * @typedef AnimalModifierConfig
 * @property {string} label         Human-readable label.
 * @property {number} cost          A multiplicative modifier on the base cost.
 * @property {boolean} [additive]   If `true`, the `cost` property is addtive.
 */

/* -------------------------------------------------- */

/**
 * @typedef CheckTypeConfig
 * @property {string} label                                   Human-readable label.
 * @property {Record<string, { string: label }>} [subtypes]   Subtypes of this kind of check.
 */

/* -------------------------------------------------- */

/**
 * @typedef DamageRollPropertyConfig
 * @property {string} label       Human-readable label.
 * @property {string} icon        Icon displayed in chat messages for this property.
 * @property {boolean} [hidden]   Whether damage roll derive this property from the item,
 *                                and so does not show this on the item sheet for configuration.
 */

/* -------------------------------------------------- */

/**
 * @typedef HerbTypeConfig
 * @property {string} label   Human-readable label.
 */

/* -------------------------------------------------- */

/**
 * @typedef ItemModifierConfig
 * The configuration of an item modifier, which modifies the sell price of an item.
 * @property {string} label         Human-readable label.
 * @property {number} cost          A multiplicative modifier on the base cost, if non-magical, otherwise additive.
 * @property {boolean} [hidden]     If `true`, this modifier is not shown on the item sheet unless the item has this
 *                                  modifier and derived data is being shown.
 * @property {boolean} [magical]    If `true`, the `cost` property is additive.
 */

/* -------------------------------------------------- */

/**
 * @typedef ItemSizeConfig
 * @property {string} label   Human-readable label.
 */

/* -------------------------------------------------- */

/**
 * @typedef MonsterCategoryConfig
 * @property {string} label                             Human-readable label.
 * @property {"body"|"mind"|"all"} [statusImmunities]   The type of status effects the monster type is always immune to.
 */

/* -------------------------------------------------- */

/**
 * @typedef RationModifierConfig
 * @property {string} label       Human-readable label.
 * @property {boolean} [prefix]   Applies a prefix when this ration type is viewed.
 */

/* -------------------------------------------------- */

/**
 * @typedef RationTypeConfig
 * @property {string} label               Human-readable label.
 * @property {string} icon                File path of image asset to represent the type.
 * @property {boolean} [allowModifiers]   Does this subtype allow for modifiers/prefixes?
 */

/* -------------------------------------------------- */

/**
 * @typedef SeasonConfig
 * @property {string} label   Human-readable label.
 */

/* -------------------------------------------------- */

/**
 * @typedef SpellCategoryConfig
 * @property {string} label     Human-readable label.
 * @property {string} [icon]    Filepath to an SVG.
 */

/* -------------------------------------------------- */

/**
 * @typedef SpellActivationTypeConfig
 * @property {string} label   Human-readable label.
 */

/* -------------------------------------------------- */

/**
 * @typedef SpellDurationTypeConfig
 * @property {string} label       Human-readable label.
 * @property {boolean} [units]    Does this display units?
 */

/* -------------------------------------------------- */

/**
 * @typedef SpellLevelConfig
 * @property {string} label   Human-readable label.
 */

/* -------------------------------------------------- */

/**
 * @typedef SpellRangeTypeConfig
 * @property {string} label   Human-readable label.
 */

/* -------------------------------------------------- */

/**
 * @typedef StatusEffectConfig
 * @property {string} name              Human-readable label.
 * @property {string} img               The image used for the status effect.
 * @property {string} _id               Unique document id of the status effect.
 * @property {"body"|"mind"} category   The status effect category.
 */

/**
 * @typedef _SpecialStatusEffectConfig
 * @property {boolean} hud        Whether the status is shown on the token HUD.
 * @property {object} [system]    System-specific data.
 */

/**
 * @typedef {StatusEffectConfig & _SpecialStatusEffectConfig} SpecialStatusEffectConfig
 */

/* -------------------------------------------------- */

/**
 * @typedef TerrainTypeConfig
 * @property {string} label                 Human-readable label.
 * @property {number} level                 The terrain level.
 * @property {number} difficulty            Terrain difficulty.
 * @property {string} icon                  Filepath to the terrain icon.
 * @property {string} iconSmall             A smaller, and square, image used for thumbnails.
 * @property {number} [movementModifier]    A modifier to movement speed through this terrain.
 */

/* -------------------------------------------------- */

/**
 * @typedef TravelerTypeConfig
 * @property {string} label   Human-readable label.
 * @property {string} icon    Filepath to the Type icon.
 */

/* -------------------------------------------------- */

/**
 * @typedef UnarmedConfiguration
 * @property {string} label                   Human-readable label.
 * @property {string} [icon]                  Icon displayed when unarmed.
 * @property {object} accuracy
 * @property {string[]} accuracy.abilities    Default abilities used for accuracy checks of unarmed attacks.
 * @property {number} accuracy.bonus          Default bonus for accuracy checks of unarmed attacks.
 * @property {object} damage
 * @property {string} damage.ability          Default ability used for damage checks of unarmed attacks.
 * @property {number} damage.bonus            Default bonus for damage checks of unarmed attacks.
 */

/* -------------------------------------------------- */

/**
 * @typedef WeaponTypeConfig
 * @property {string} label         Human-readable label.
 * @property {string} labelPlural   Pluralized human-readable label.
 * @property {0|1|2} grip           The number of hands needed to wield.
 * @property {string} icon          Artwork for the weapon type.
 * @property {boolean} [ranged]     Can this weapon attack from long range?
 */

/* -------------------------------------------------- */

/**
 * @typedef WeatherCategoryConfig
 * @property {string} label   Human-readable label.
 */

/* -------------------------------------------------- */

/**
 * @typedef WeatherTypeConfig
 * @property {string} label       Human-readable label.
 * @property {number} modifier    The weather modifier for a journey check.
 * @property {string} icon        Filepath for an icon.
 */

/* -------------------------------------------------- */
/*   SEARCH & FILTERING                               */
/* -------------------------------------------------- */

/**
 * @typedef LockedSearchFilter
 * @property {string} field           The document property to compare against.
 * @property {string} operator        A comparison method from `SearchFilter.OPERATORS`.
 * @property {any|() => any} value    A value, array of values, or method that returns such.
 */

/* -------------------------------------------------- */

/**
 * @typedef ConfigurableSearchFilter
 * @property {string} id                  Unique identifier for this specific filter.
 * @property {string} field               The document property to compare against.
 * @property {string} operator            A comparison method from `SearchFilter.OPERATORS`.
 * @property {any[]|() => any[]} value    An array of values, or method that returns such.
 */

/* -------------------------------------------------- */

/**
 * @typedef SearchCategory
 * @property {LockedSearchFilter[]} [locked]
 * @property {ConfigurableSearchFilter[]} [filters]
 */

/* -------------------------------------------------- */

/**
 * @typedef InitializedLockedSearchFilter
 * @property {string} field       The document property to compare against.
 * @property {string} operator    A comparison method from `SearchFilter.OPERATORS`.
 * @property {any|any[]} value    A value or array of values.
 */

/* -------------------------------------------------- */

/**
 * @typedef InitializedConfigurableSearchFilter
 * @property {string} field     The document property to compare against.
 * @property {string} operator    A comparison method from `SearchFilter.OPERATORS`.
 * @property {Map<any, -1|0|1>} value   A mapping of a value to the filter state;
 *                                      -1: Documents that match this are filtered out.
 *                                       0: Documents that match this are not ignored, *unless* another
 *                                          another option in the category is 1.
 *                                       1: Documents are filtered out unless they match this.
 */
