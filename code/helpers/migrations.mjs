/**
 * @import CompendiumCollection from "@client/documents/collections/compendium-collection.mjs";
 */

/**
 * Perform migrations as the active GM, then record the current system version.
 */
Hooks.once("ready", async () => {
  if (!game.user.isActiveGM) return;

  const key = "MIGRATION_VERSION";
  const currentMigrationVersion = game.settings.get(ryuutama.id, key);
  if (currentMigrationVersion) {
    const documentNames = new Set();
    if (foundry.utils.isNewerVersion("2.1.0", currentMigrationVersion)) {
      ["Actor", "ChatMessage", "Item", "Scene"].forEach(d => documentNames.add(d));
    }

    if (documentNames.size) await performMigration(documentNames);
  }
  await game.settings.set(ryuutama.id, key, game.system.version);
});

/* -------------------------------------------------- */

/**
 * Perform migrations on world and packs.
 * @param {Iterable<string>} documentNames
 * @returns {Promise<void>}
 */
export async function performMigration(documentNames) {
  documentNames = [...documentNames];
  const n = ui.notifications.info(`Ryuutama | Migrating data to ${game.system.version}...`, { permanent: true });

  // Migrate world collections.
  try {
    await foundry.documents.modifyBatch(documentNames.map(documentName => {
      const collection = game.collections.get(documentName);
      if (!collection?.size) return null;

      return {
        documentName,
        action: "update",
        diff: false,
        noHook: true,
        parent: null,
        recursive: false,
        render: false,
        updates: collection.map(d => d.toObject()),
      };
    }).filter(_ => _));
  } catch (err) {
    console.error("Ryuutama | Unable to migrate world collections.", err);
  }

  const toMigrate = pack => {
    // return true;
    const { type, packageName, packageType } = pack.metadata;
    if (!documentNames.includes(type)) return false;
    if (packageType === "system") return false;
    if (packageType === "world") return true;
    const m = game.modules.get(packageName);
    return !m.url && !m.manifest;
  };

  for (const pack of game.packs)
    if (toMigrate(pack))
      await migratePack(pack);

  n.remove?.();
  ui.notifications.success(`Ryuutama | Migration of data to ${game.system.version} complete!`, { permanent: true });
}

/* -------------------------------------------------- */

/**
 * Migrate a compendium, forcefully updating its contained data.
 * @param {CompendiumCollection} pack
 * @returns {Promise<void>}
 */
export async function migratePack(pack) {
  if (!pack.index.size) return;

  try {
    const n = ui.notifications.info(`Migrating pack '${pack.metadata.label}...`, { progress: true, pct: 0 });

    const isLocked = pack.locked;
    if (isLocked) await pack.configure({ locked: false });

    let i = 0;
    const ids = Iterator.from(pack.index.map(i => i._id));

    loop: while (true) {
      const set = [...ids.take(25)];
      if (!set.length) break loop;
      const documents = await pack.getDocuments({ _id__in: set });
      const updates = documents.map(d => d.toObject());
      await pack.documentClass.updateDocuments(updates, {
        diff: false, recursive: false, noHook: true, render: false, pack: pack.metadata.id,
      });

      i += set.length;
      n.update({ pct: i / pack.index.size });
    }

    n.element?.classList.add("success");
    if (isLocked) await pack.configure({ locked: true });
  } catch (err) {
    console.error(`Ryuutama | Unable to migrate pack '${pack.metadata.id}'.`, err);
  }
}
