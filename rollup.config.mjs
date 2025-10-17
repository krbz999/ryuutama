import postcss from "rollup-plugin-postcss";
import resolve from "@rollup/plugin-node-resolve";
import postcssImport from "postcss-import";
import postcssUrl from "postcss-url";

export default {
  input: "./_main.mjs",
  output: {
    file: "./public/main.mjs",
    format: "esm",
  },
  plugins: [
    resolve(),
    postcss({
      plugins: [
        postcssImport(),
        postcssUrl({
          url: asset => {
            if (!asset.url) return asset.url;
            const yeet = "/systems/ryuutama/";
            if (asset.url.startsWith(yeet)) {
              return asset.url.slice(yeet.length);
            } else {
              console.warn("URL THAT ISN'T IN SYSTEM REPOSITORY:", asset.url);
            }
            return asset.url;
          },
        }),
      ],
      extract: true,
    }),
  ],
};
