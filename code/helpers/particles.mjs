/**
 * @import {
 * ParticleGeneratorAnchor,
 * ParticleGeneratorAnchorPoint,
 * ParticleGeneratorArea,
 * ParticleGeneratorBehavior,
 * ParticleGeneratorBehaviorId,
 * ParticleGeneratorClipOptions,
 * ParticleGeneratorConfiguration,
 * ParticleGeneratorConstraintMode,
 * ParticleGeneratorFadeOptions,
 * ParticleGeneratorFollowOptions,
 * ParticleGeneratorMode,
 * ParticleGeneratorOrbitOptions,
 * ParticleGeneratorPoint,
 * ParticleGeneratorRange,
 * ParticleGeneratorVelocityOptions,
 * } from "@client/canvas/animation/particle-generator.mjs";
 *
 * @import { VFXSingleAttackData } from "@client/canvas/vfx/components/vfx-single-attack-component.mjs";
 * @import { VFXParticleGeneratorData } from "@client/canvas/vfx/components/vfx-particle-generator-component.mjs";
 * @import { VFXScrollingTextData } from "@client/canvas/vfx/components/vfx-scrolling-text-component.mjs";
 * @import { VFXShakeData } from "@client/canvas/vfx/components/vfx-shake-component.mjs";
 */

export async function test() {
  const [source, target] = Array.from(game.user.targets);

  const asset = "assets/jb2a/Generic-x-Marker-x-MarkerBubble_01_Regular_Rainbow_Thumb.webp";
  const proj = "assets/jb2a/Generic-x-Template-x-Line-x-Generic-x-Piercing_Generic01_01_Regular_Orange_Thumb.webp";
  const explosions = Array.fromRange(9).map(n => `assets/images/explosion/explosion${n.paddedString(2)}.png`);

  const effect = new foundry.canvas.vfx.VFXEffect({
    name: "Arrow Shot",
    components: {
      /** @type {VFXSingleAttackData} */
      flight: {
        type: "singleAttack",
        path: [
          { ...source.center },
          { ...target.center },
        ],
        charge: {
          texture: asset,
          duration: 1500,
          animations: [{ function: "drawBack", params: {} }],
          /** @type {import("@client/canvas/vfx/_types.mjs").VFXPositionalSoundData} */
          sound: {
            align: foundry.canvas.vfx.constants.SOUND_ALIGNMENT.END,
            easing: true,
            radius: 60,
            src: "assets/sounds/its-britney-bitch.mp3",
            volume: 1,
            walls: true,
          },
        },
        projectile: {
          texture: proj,
          speed: 30, // feet per second; duration computed from path length
          animations: [{ function: "followPath", params: {} }],
        },
        // impact: {
        //   texture: explo,
        //   duration: 400,
        //   /** @type {import("@client/canvas/vfx/_types.mjs").VFXPositionalSoundData} */
        //   sound: {
        //     align: foundry.canvas.vfx.constants.SOUND_ALIGNMENT.END,
        //     easing: true,
        //     radius: 60,
        //     src: "assets/sounds/wilhelm-scream.ogg",
        //     volume: 1,
        //     walls: true,
        //   },
        // },
        pathType: {
          type: "arc",
        },
      },
      /** @type {VFXScrollingTextData} */
      sourceText: {
        type: "scrollingText",
        origin: { ...source.center },
        content: "It's Britney, bitch.",
        duration: 1500,
        scrollDirection: CONST.TEXT_ANCHOR_POINTS.TOP,
        textStyle: {
          fill: "#ff0000",
          fontSize: 30,
          fontWeight: "bold",
        },
      },
      /** @type {VFXShakeData} */
      shake: {
        type: "shake",
        target: "stage",
        duration: 800,
        maxDisplacement: 50,
        returnSpeed: 0.1,
        seed: null,
        smoothness: .5,
      },
      /** @type {VFXParticleGeneratorData} */
      sparks: {
        type: "particleGenerator",
        textures: explosions,
        mode: "effect",
        count: 40,
        area: {
          x: target.center.x - 100,
          y: target.center.y - 100,
          width: 200,
          height: 200,
        },
        lifetime: { min: 1000, max: 1500 },
        fade: { in: 500, out: 500 },
        // alpha: { min: 1, max: 1 },
        scale: { min: .2, max: .3 },
        // velocity: {
        //   angle: 45,
        //   speed: 40,
        // },
        // rotationSpeed: 180,
        blend: 0,
        elevation: 100,
        sort: 0,
        duration: 1500,
        initial: .25,
        perFrame: 5,
        config: {
          drift: {
            enabled: true,
            intensity: .4,
          },
        },
      },
      /** @type {VFXScrollingTextData} */
      targetText: {
        type: "scrollingText",
        origin: target.center,
        content: "Ouch!",
        duration: 1000,
        distance: 500,
        textAnchor: CONST.TEXT_ANCHOR_POINTS.TOP,
        scrollDirection: CONST.TEXT_ANCHOR_POINTS.TOP,
        jitter: 1,
        textStyle: {
          fill: "#16187e",
          fontSize: 60,
          fontWeight: "bold",
        },
      },
    },
    timeline: [
      { component: "flight", position: 0 },
      { component: "sourceText", position: "flight.chargeStart" },
      { component: "shake", position: "flight.impactStart" },
      { component: "sparks", position: "flight.impactStart" },
      { component: "targetText", position: "flight.impactStart" },
    ],
  });

  return effect.play();
}
