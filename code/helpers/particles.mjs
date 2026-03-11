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
 */

const { ParticleGenerator } = foundry.canvas.animation;

export const generator = ParticleGenerator;

const fp = "assets/jb2a/Generic-x-UI-x-IconMusicNote_01_Regular_Blue_Thumb.webp";
const fp1 = "assets/jb2a/Generic-x-UI-x-IconMusicNote_01_Regular_Purple_Thumb.webp";

export function test() {
  const token = canvas.tokens.controlled[0];
  let acc = 0;
  const area = { radius: 200 };

  /** @type {ParticleGeneratorConfiguration} */
  const config = {
    mode: "effect",
    manual: true,
    anchor: token,
    anchorPoint: "center",
    // anchorOffset: { x: 50 },
    area,
    elevation: token.document.elevation ?? 0,
    textures: [fp],
    lifetime: 800,
    fade: { in: 500, out: 500 },
    velocity: { x: [-160, 160], y: [-160, 160] },
    rotationSpeed: 180,
    alpha: .5,
    scale: .25,
    blend: PIXI.BLEND_MODES.NORMAL,
    onTick: (dt, generator) => {
      const RATE = 90;
      acc += (dt * RATE) / 1000;
      const n = acc | 0;
      acc -= n;
      if (n > 0) generator.spawnParticles(n, { area });
    },
    // onDeath: (particle, { generator, reason }) => {},
  };

  const gen = new ParticleGenerator(config);
  gen.start();
  return gen;
}
