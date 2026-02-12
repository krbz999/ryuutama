export function registerFonts() {
  Object.assign(CONFIG.fontDefinitions, {
    "Carrois Gothic": {
      editor: true,
      fonts: [
        { urls: ["systems/ryuutama/assets/fonts/Carrois_Gothic_SC/CarroisGothicSC-Regular.ttf"] },
      ],
    },
    Gabriela: {
      editor: true,
      fonts: [
        { urls: ["systems/ryuutama/assets/fonts/Gabriela/Gabriela-Regular.ttf"] },
      ],
    },
    Raleway: {
      editor: true,
      fonts: [
        { urls: ["systems/ryuutama/assets/fonts/Raleway/Raleway-VariableFont_wght.ttf"] },
      ],
    },
    Radley: {
      editor: true,
      fonts: [
        { urls: ["systems/ryuutama/assets/fonts/Radley/Radley-Regular.ttf"] },
        { urls: ["systems/ryuutama/assets/fonts/Radley/Radley-Regular.ttf"], style: "italic" },
      ],
    },
  });
}
