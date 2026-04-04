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

/* -------------------------------------------------- */

/**
 * Folder where source JSON files should be located relative to the repository folder.
 * @type {string}
 */
const PACK_SRC = "src";

/* -------------------------------------------------- */

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

/* -------------------------------------------------- */

/**
 * Structure of documents and their embedded collections (except token deltas).
 * @type {Record<string, Record<string, string>>}
 */
const documentStructure = {
  Actor: {
    ActiveEffect: "effects",
    Item: "items",
  },
  Cards: {
    Card: "cards",
  },
  Item: {
    ActiveEffect: "effects",
  },
  JournalEntry: {
    JournalEntryCategory: "categories",
    JournalEntryPage: "pages",
  },
  Playlist: {
    PlaylistSound: "sounds",
  },
  Region: {
    RegionBehavior: "behaviors",
  },
  RollTable: {
    TableResult: "results",
  },
  Scene: {
    AmbientLight: "lights",
    AmbientSound: "sounds",
    Drawing: "drawings",
    Note: "notes",
    Region: "regions",
    Level: "levels",
    Tile: "tiles",
    Token: "tokens",
    Wall: "walls",
  },
};

/* -------------------------------------------------- */
/*   Clean Packs                                      */
/* -------------------------------------------------- */

/**
 * Recursively clean data of an entry and embedded documents before extracting or compiling.
 * @param {object} data                   Data for a single entry to clean.
 * @param {object} options
 * @param {string} options.documentName   The document name.
 */
function cleanPackEntry(data, { documentName }) {
  const ownership = documentName === "JournalEntryPage" ? -1 : 0;
  if (data.ownership) data.ownership = { default: ownership };

  const flags = data.flags ?? {};
  delete flags.importSource;
  delete flags.exportSource;

  // Remove mystery-man.svg from Actors
  if (documentName === "Actor") cleanActorArtwork(data);

  // Clean embedded data.
  const embedded = documentStructure[documentName] ?? {};
  for (const [embeddedName, collectionName] of Object.entries(embedded)) {
    const collection = data[collectionName];
    for (const c of collection) cleanPackEntry(c, { documentName: embeddedName });
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

    await extractPack(path.join(PACK_DEST, packInfo.name), dest, {
      log: false,
      clean: true,
      folders: true,
      nedb: false,
      yaml: false,
      jsonOptions: { space: 2 },
      transformEntry: (entry, context = {}) => {
        cleanPackEntry(entry, { documentName: context.documentType });
      },
      transformFolderName: (entry, context = {}) => {
        let name = `${slugify(entry.name)}-${entry._id}`;
        if (context.folder) name = path.join(context, context.folder, name);
        return name;
      },
      transformName: (entry, context = {}) => {
        let name = `${slugify(entry.name)}-${entry._id}.json`;

        if (context.documentType === "Folder") {
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

/* -------------------------------------------------- */

/**
 * Remove falsy or default artwork from image filepath fields on actors.
 * @param {object} data   The actor data. **Will be mutated.**
 */
function cleanActorArtwork(data) {
  const defaultArtwork = "icons/svg/mystery-man.svg";
  if (!data.img || (data.img === defaultArtwork)) data.img = null;
  if (!data.prototypeToken.texture.src || (data.prototypeToken.texture.src === defaultArtwork))
    data.prototypeToken.texture.src = null;
  if (!data.prototypeToken.ring.subject.texture || (data.prototypeToken.ring.subject.texture === defaultArtwork))
    data.prototypeToken.ring.subject.texture = null;
}
