export interface Theme {
  name: string;
  description: string;
  colors: Record<string, string>;
}

export const dailyThemes: Theme[] = [
  // 0: Ahad (Sunday) - Nuansa Qubah Shakhrah (Dome of the Rock - Gold & Royal Blue)
  {
    name: "Qubah Shakhrah",
    description: "Kubah Shakhrah, Yerusalem (Emas & Biru Royal)",
    colors: {
      "50": "#fefbf3",
      "100": "#faf2dd",
      "200": "#f3e1b7",
      "300": "#ebcd8f",
      "400": "#e3b663",
      "500": "#d89d34",
      "600": "#be8325",
      "700": "#9e671c",
      "800": "#1e3a8a",
      "900": "#172554",
      "950": "#0f172a"
    }
  },
  // 1: Senin (Monday) - Nuansa Nabawi (Masjid Nabawi - Green & White)
  {
    name: "Nabawi",
    description: "Masjid Nabawi, Madinah (Hijau Kubah & Putih)",
    colors: {
      "50": "#e6f7f3",
      "100": "#c3ebdf",
      "200": "#9be0cb",
      "300": "#6ed4b4",
      "400": "#46c79d",
      "500": "#1bb685",
      "600": "#008a63",
      "700": "#006b4d",
      "800": "#005039",
      "900": "#003726",
      "950": "#002216"
    }
  },
  // 2: Selasa (Tuesday) - Nuansa Sahara (Sahara Desert - Terracotta & Sand)
  {
    name: "Sahara",
    description: "Gurun Sahara (Jingga Senja & Krem Pasir)",
    colors: {
      "50": "#fdf6ed",
      "100": "#faebd3",
      "200": "#f3d3a3",
      "300": "#ebb971",
      "400": "#e39d3f",
      "500": "#cf8325",
      "600": "#b06a19",
      "700": "#8f5210",
      "800": "#6e3c0b",
      "900": "#4f2806",
      "950": "#3a1b02"
    }
  },
  // 3: Rabu (Wednesday) - Nuansa Andalusia (Masjid Kordoba - Teal & Brick)
  {
    name: "Andalusia",
    description: "Andalusia, Spanyol (Teal Mediterania & Krem Bata)",
    colors: {
      "50": "#e0f2f1",
      "100": "#b2dfdb",
      "200": "#80cbc4",
      "300": "#4db6ac",
      "400": "#26a69a",
      "500": "#008080",
      "600": "#006d6d",
      "700": "#005757",
      "800": "#004242",
      "900": "#002d2d",
      "950": "#001f1f"
    }
  },
  // 4: Kamis (Thursday) - Nuansa Haramain (Kiswah Ka'bah - Charcoal & Gold)
  {
    name: "Haramain",
    description: "Baitullah Ka'bah, Makkah (Hitam Kiswah & Emas)",
    colors: {
      "50": "#fdfaf2",
      "100": "#f9f0d7",
      "200": "#eedca9",
      "300": "#e1c476",
      "400": "#d4ab44",
      "500": "#c59220",
      "600": "#9f7214",
      "700": "#404040",
      "800": "#222222",
      "900": "#161616",
      "950": "#0a0a0a"
    }
  },
  // 5: Jumat (Friday) - Nuansa Zamrud (Emerald Green - Friday Blessings)
  {
    name: "Zamrud",
    description: "Berkah Hari Jumat (Hijau Zamrud & Emas)",
    colors: {
      "50": "#eefbf3",
      "100": "#d5f5e1",
      "200": "#abebc6",
      "300": "#7dcea0",
      "400": "#52be80",
      "500": "#27ae60",
      "600": "#1e8449",
      "700": "#196f3d",
      "800": "#145a32",
      "900": "#0f4526",
      "950": "#0a2e19"
    }
  },
  // 6: Sabtu (Saturday) - Nuansa Sufi (Sufism - Sage Green & Pure Slate)
  {
    name: "Sufi",
    description: "Harmoni Kedamaian (Hijau Sage & Abu-Abu Sufi)",
    colors: {
      "50": "#f4f8f4",
      "100": "#e4ece4",
      "200": "#ccdccb",
      "300": "#b0c8b0",
      "400": "#92b291",
      "500": "#789c77",
      "600": "#5d7c5c",
      "700": "#4a6249",
      "800": "#384938",
      "900": "#263226",
      "950": "#192119"
    }
  }
];
