import fs from "fs";
import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { compilePack, extractPack } from "@foundryvtt/foundryvtt-cli";

/**
 * Folder where the compiled compendium packs should be located relative to the repository folder.
 * @type {string}
 */
const PACK_DEST = "packs";

/**
 * Folder where source JSON files should be located relative to the repository folder.
 * @type {string}
 */
const PACK_SRC = "src";

const argv = yargs(hideBin(process.argv))
  .command(packageCommand())
  .help().alias("help", "h")
  .argv;

function packageCommand() {
  return {
    command: "package [action] [pack]",
    describe: "Manage packages",
    builder: yargs => {
      yargs.positional("action", {
        describe: "The action to perform.",
        type: "string",
        choices: ["unpack", "pack"],
      });
      yargs.positional("pack", {
        describe: "Name of the pack upon which to work.",
        type: "string",
      });
    },
    handler: async argv => {
      const { action, pack } = argv;
      switch (action) {
        case "pack":
          return await compilePacks(pack);
        case "unpack":
          return await extractPacks(pack);
      }
    },
  };
}

/* ----------------------------------------- */
/*  Clean Packs                              */
/* ----------------------------------------- */

/**
 * Removes unwanted flags, permissions, and other data from entries before extracting or compiling.
 * @param {object} data                     Data for a single entry to clean.
 * @param {object} options
 * @param {string} options.documentName         The document name (false positive for folders).
 * @param {boolean} [options.isFolder=false]    Is this a folder document?
 * @param {number} [options.ownership=0]        Value to reset default ownership to.
 */
function cleanPackEntry(data, { documentName, isFolder = false, ownership = 0 }) {
  if (data.ownership) data.ownership = { default: ownership };

  const flags = data.flags ?? {};
  delete flags.importSource;
  delete flags.exportSource;

  for (const k in flags) {
    if (!Object.keys(flags[k]).length) delete flags[k];
  }

  // Remove mystery-man.svg from Actors
  if (!isFolder && (documentName === "Actor") && (data.img === "icons/svg/mystery-man.svg")) {
    data.img = "";
    data.prototypeToken.texture.src = "";
    data.prototypeToken.ring.subject.texture = "";
  }

  // Clean embedded.
  if (!isFolder) {
    if (["Actor", "Item"].includes(documentName)) {
      for (const effect of data.effects) cleanPackEntry(effect, { documentName: "ActiveEffect" });
    }

    if (["Actor"].includes(documentName)) {
      for (const item of data.items) cleanPackEntry(item, { documentName: "Item" });
    }

    if (["JournalEntry"].includes(documentName)) {
      for (const page of data.pages) cleanPackEntry(page, { documentName: "JournalEntryPage", ownership: -1 });
    }

    if (["RollTable"].includes(documentName)) {
      for (const result of data.results) cleanPackEntry(result, { documentName: "TableResult" });
    }

    // Remove sort.
    if (["Actor", "ActiveEffect", "Item", "JournalEntry", "Macro", "Playlist", "RollTable", "Scene"].includes(documentName)) {
      data.sort = 0;
    }

    if (["Scene"].includes(documentName)) {
      const embedded = {
        AmbientLight: "lights",
        AmbientSound: "sounds",
        Drawing: "drawings",
        MeasuredTemplate: "templates",
        Note: "notes",
        Region: "regions",
        Tile: "tiles",
        Token: "tokens",
        Wall: "walls",
      };

      for (const [documentName, collectionName] of Object.entries(embedded)) {
        for (const embedded of data[collectionName]) cleanPackEntry(embedded, { documentName });
      }
    }

    if (["Region"].includes(documentName)) {
      for (const behavior of data.behaviors) cleanPackEntry(behavior, { documentName: "RegionBehavior" });
    }
  }

  if (data._stats) {
    if (data._stats.modifiedTime) data._stats.modifiedTime = null;
    if (data._stats.lastModifiedBy) data._stats.lastModifiedBy = "ryuutama00000000";
  }
}

/* -------------------------------------------------- */
/*   Compile Packs                                    */
/* -------------------------------------------------- */

/**
 * Compile the source JSON files into compendium packs.
 * @param {string} [packName]   Name of pack to compile. If none provided, all packs will be packed.
 *
 * - `npm run db:pack`                  Compile all JSON files into their LevelDB files.
 * - `npm run db:pack -- classes`       Only compile the specified pack.
 */
async function compilePacks(packName) {
  // Determine which source folders to process
  const folders = fs.readdirSync(PACK_SRC, { withFileTypes: true }).filter(file =>
    file.isDirectory() && (!packName || (packName === file.name)),
  );

  for (const folder of folders) {
    const src = path.join(PACK_SRC, folder.name);
    const dest = path.join(PACK_DEST, folder.name);
    console.log(`Compiling pack ${folder.name}`);
    await compilePack(src, dest, { recursive: true, log: true });
  }
}

/* -------------------------------------------------- */
/*   Extract Packs                                    */
/* -------------------------------------------------- */

/**
 * Extract the contents of compendium packs to JSON files.
 * @param {string} [packName]   Name of pack to extract. If none provided, all packs will be unpacked.
 *
 * - `npm run db:unpack                   Extract all compendium LevelDB files into JSON files.
 * - `npm run db:unpack -- classes`       Only extract the contents of the specified compendium.
 */
async function extractPacks(packName) {
  // Load manifest.
  const system = JSON.parse(fs.readFileSync("./system.json", { encoding: "utf8" }));

  // Determine which source packs to process.
  const packs = system.packs.filter(p => !packName || (p.name === packName));

  for (const packInfo of packs) {
    const dest = path.join(PACK_SRC, packInfo.name);
    console.log(`Extracting pack ${packInfo.name}`);

    const isFolder = entry => entry.type === packInfo.type;

    await extractPack(path.join(PACK_DEST, packInfo.name), dest, {
      log: false,
      clean: true,
      folders: true,
      nedb: false,
      yaml: false,
      jsonOptions: { space: 2 },
      transformEntry: (entry, context = {}) => {
        cleanPackEntry(entry, { documentName: packInfo.type, isFolder: isFolder(entry) });
      },
      transformFolderName: (entry, context = {}) => {
        let name = `${slugify(entry.name)}-${entry._id}`;
        if (context.folder) name = path.join(context, context.folder, name);
        return name;
      },
      transformName: (entry, context = {}) => {
        let name = `${slugify(entry.name)}-${entry._id}.json`;

        if (isFolder(entry)) {
          name = path.join(`${slugify(entry.name)}-${entry._id}`, "_folder.json");
        }

        if (context.folder) {
          name = path.join(context.folder, name);
        }
        return name;
      },
    });
  }
}

/* -------------------------------------------------- */

/**
 * Standardize name format.
 * @param {string} name
 * @returns {string}
 */
function slugify(name) {
  return name.toLowerCase().replace("'", "").replace(/[^a-z0-9]+/gi, " ").trim().replace(/\s+|-{2,}/g, "-");
}
