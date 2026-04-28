# Active Effects

Effects can perform changes to characters and monsters. The most commonly used attribute keys and their value choices are listed here.

## Abilities

For example `system.abilities.strength.value | Add | 1` to increase the dice denomination of the Strength stat to the next size up, to a maximum of 12. The system handles validating that the stats remain within 4 to 12 for Travelers but allow 2 and 20 for Monsters; `Unit` can be either `-1` or `1` to decrease or increase the size, respectively (with inverted behavior for the `Subtract` change type).

The `Override` change type can be used to force the ability to be any of the valid die sizes (2, 4, 6, 8, 10, 12, and 20), and similarly the `Upgrade` and `Downgrade` change types enforce a minimum or maximum denomination.

The valid ability keys are `strength`, `dexterity`, `intelligence`, and `spirit`.

Attribute Key | Mode | Value
:- | :-: | :-:
`system.abilities.<ability>.value` | Add | Unit
`system.abilities.<ability>.value` | Override | Faces
`system.abilities.<ability>.value` | Upgrade | Faces

## Capacity

Increase the actor's capacity by an amount.

Attribute Key | Mode | Value
:- | :-: | :-:
`system.capacity.bonus` | Add | Integer

## Condition and Statuses

Override the actor's current condition to be equal to the provided integer value, or grant immunity to a given status. The available possible values are `injury`, `poison`, `sickness`, `exhaustion`, `muddled`, and `shock`.

Attribute Key | Mode | Value
:- | :-: | :-:
`system.condition.value` | Override | Integer
`system.condition.immunities` | Add | Status

## Defense & Armor

Add a base defense value. Any equipped armor is added onto this, or add damage reduction (or increase) to physical damage or magical damage.

Attribute Key | Mode | Value
:- | :-: | :-:
`system.defense.armor` | Add | Integer
`system.defense.modifiers.physical` | Add | Integer
`system.defense.modifiers.magical` | Add | Integer

## Resources (HP & MP)

Add a flat bonus to the resource (`stamina` or `mental`) or a bonus that is multiplied by the level of the character.

Attribute Key | Mode | Value
:- | :-: | :-:
`system.resources.<resource>.bonuses.flat` | Add | Integer
`system.resources.<resource>.bonuses.level` | Add | Integer

## Types

Add a Type to a character. Each time a character gains a type (`attack`, `technical`, or `magic`), the benefit of that type increases. Note that this does not immediately grant a choice of a mastered weapon if adding the 'Attack' type, nor does it add a choice of a spell season.

Attribute Key | Mode | Value
:- | :-: | :-:
`system.details.type.<type>` | Add | Integer

## Mastered Terrains, Weapons, and Weather

Add a mastered weapon category, or a topography where the character gains a benefit.

Attribute Key | Mode | Value
:- | :-: | :-:
`system.mastered.terrain` | Add | `<terrain>`
`system.mastered.weapons` | Add | `<weapon>`
`system.mastered.weather` | Add | `<weather>`

The available options for each of these three attributes are found below.

<details>
  <summary>Terrain Types</summary>

  These values can also be found in `ryuutama.config.terrainTypes`.

  Value | Label
  :- | :-
  alpine | Alpine
  deepForest | Deep Forest
  desert | Desert
  grassland | Grassland
  highlands | Highlands
  jungle | Jungle
  mountain | Mountain
  rocky | Rocky Terrain
  swamp | Swamp
  wasteland | Wasteland
  woods | Woods

</details>

<details>
  <summary>Weapon Categories</summary>

  These values can also be found in `ryuutama.config.weaponTypes` with the exception of `unarmed`.

  Value | Label
  :- | :-
  axe | Axe
  blade | Blade
  bow | Bow
  lightBlade | Light Blade
  polearm | Polearm
  unarmed | Unarmed

</details>

<details>
  <summary>Weather Types</summary>

  These values can also be found in `ryuutama.config.weatherTypes`.

  Value | Label
  :- | :-
  blizzard | Blizzard
  clearSkies | Clear Skies
  cloudy | Cloudy
  cold | Cold
  darkness | Darkness
  deepFog | Deep Fog
  fog | Fog
  hardRain | Hard Rain
  hot | Hot
  hurricane | Hurricane
  rain | Rain
  snow | Snow
  strongWind | Strong Wind
  thunderStorm | Thunder Storm

</details>

## Other Properties

In addition, support for the Noble's Weapon Grace skill has special handling with the following attribute.

Attribute Key | Mode | Value
:- | :-: | :-:
`system.properties.weaponGrace` | Add | `<weapon>`

A weapon category added here will be 'mastered' as if having used `system.mastered.weapons`. It already mastered, it will grant the +1 bonus to relevant checks. See above for available values, which are the same as for Mastered Weapons.
