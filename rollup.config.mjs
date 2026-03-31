import postcss from "rollup-plugin-postcss";
import resolve from "@rollup/plugin-node-resolve";
import postcssImport from "postcss-import";
import postcssValueParser from "postcss-value-parser";

function adjustCSSUrls() {
  return {
    postcssPlugin: "rewrite-system-urls",
    Declaration(decl) {
      const parsed = postcssValueParser(decl.value);

      parsed.walk(node => {
        if ((node.type === "function") && (node.value === "url")) {
          const urlNode = node.nodes[0];
          const url = urlNode?.value;
          if (!url?.startsWith("/systems/ryuutama/")) return;
          urlNode.value = url.slice("/systems/ryuutama/".length);
        }
      });

      decl.value = parsed.toString();
    },
  };
}
adjustCSSUrls.postcss = true;

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
        adjustCSSUrls(),
      ],
      extract: true,
    }),
  ],
};
