import postcss from "rollup-plugin-postcss";
import resolve from "@rollup/plugin-node-resolve";
import postcssImport from "postcss-import";

export default {
  input: "./_main.mjs",
  output: {
    file: "./public/main.mjs",
    format: "esm",
  },
  plugins: [
    resolve(),
    postcss({
      plugins: [postcssImport()],
      extract: true,
    }),
  ],
};
