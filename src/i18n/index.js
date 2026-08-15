import { vi } from "./vi.js";
import { en } from "./en.js";
import { ja } from "./ja.js";
import { zh } from "./zh.js";
import { ko } from "./ko.js";

export const LANGS = {
  vi: { flag: "🇻🇳", name: "Tiếng Việt" },
  en: { flag: "🇺🇸", name: "English" },
  ja: { flag: "🇯🇵", name: "日本語" },
  zh: { flag: "🇨🇳", name: "简体中文" },
  ko: { flag: "🇰🇷", name: "한국어" },
};

export const T = { vi, en, ja, zh, ko };

export function useT(lang) {
  return T[lang] || T.vi;
}

