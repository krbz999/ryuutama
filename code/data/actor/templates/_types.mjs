/**
 * @typedef AbilityData
 * @property {number} value   The die size of the ability.
 */

/**
 * @typedef ResourceData
 * @property {object} bonuses
 * @property {number|null} bonuses.flat     A flat bonus to the resource.
 * @property {number|null} bonuses.level    A bonus to the resource for each level of the creature.
 * @property {number} max                   The base resource maximum.
 * @property {number} spent                 How much of the resource has been spent.
 */

/**
 * @typedef CreatureModel
 * @property {object} abilities
 * @property {AbilityData} abilities.strength
 * @property {AbilityData} abilities.dexterity
 * @property {AbilityData} abilities.intelligence
 * @property {AbilityData} abilities.spirit
 * @property {object} condition
 * @property {string[]} condition.immunities    The status effects the creature is immune to.
 * @property {object} condition.shape
 * @property {string} condition.shape.high      The ability that is improved when in Top Shape.
 * @property {number} condition.value           The creature's current condition.
 * @property {object} defense
 * @property {number|null} defense.armor      Baseline defense/armor.
 * @property {object} defense.modifiers
 * @property {number|null} defense.modifiers.magical    Damage modification to magical damage received.
 * @property {number|null} defense.modifiers.physical    Damage modification to physical damage received.
 * @property {object} resources
 * @property {ResourceData} resources.mental    The creature's MP.
 * @property {ResourceData} resources.stamina   The creature's HP.
 */

/**
 * @typedef {CreatureModel} MonsterModel
 * @property {object} attack
 * @property {string} attack.accuracy         The formula used for accuracy checks.
 * @property {string} attack.damage           The formula used for damage checks.
 * @property {object} description
 * @property {string} description.value       Monster description.
 * @property {object} description.special     Special ability data.
 * @property {string} description.special.name    Name of the special ability.
 * @property {string} description.special.value   Description of the special ability.
 * @property {object} details
 * @property {string} details.category        The monster category.
 * @property {number} details.dragonica       The monster's entry number in the magical monster encyclopedia.
 * @property {number} details.level           The monster level.
 * @property {object} environment
 * @property {string} environment.season      The time of year during which the monster is most active.
 * @property {object} initiative
 * @property {number} initiative.value
 */

/**
 * @typedef {CreatureModel} TravelerModel
 * @property {object} background
 * @property {string} background.appearance   Character's appearance.
 * @property {string} background.hometown     Character's hometown details.
 * @property {string} background.notes        Other assorted notes.
 * @property {object} details
 * @property {string|null} details.color    The character's image color.
 * @property {number} details.exp           Accumulated experience points.
 * @property {number} details.level         The character's level.
 * @property {object} equipped
 * @property {string|null} equipped.weapon      Equipped weapon.
 * @property {string|null} equipped.armor       Equipped armor.
 * @property {string|null} equipped.shield      Equipped shield.
 * @property {string|null} equipped.shoes       Equipped shoes.
 * @property {string|null} equipped.cape        Equipped cape.
 * @property {string|null} equipped.staff       Equipped staff.
 * @property {string|null} equipped.hat         Equipped hat.
 * @property {string|null} equipped.accessory   Equipped accessory.
 * @property {object} fumbles
 * @property {number} fumbles.value   Accumulated fumble points.
 * @property {object} gold
 * @property {number} gold.value    Accumulated gold.
 */

/* -------------------------------------------------- */

/**
 * @typedef DamageConfiguration
 * @property {number} value         The damage total.
 * @property {boolean} [magical]    Is this magical damage, e.g., from a spell?
 */
