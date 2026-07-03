"use client";

// A small EN | SW switch. Uses the i18n context so every label updates at once.
import { useI18n } from "@/components/i18n-provider";
import { LANGUAGES } from "@/lib/i18n";

export function LanguageToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="inline-flex rounded-md border border-gray-300 overflow-hidden text-sm">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          className={
            "px-3 py-1.5 transition-colors " +
            (lang === l.code
              ? "bg-emerald-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50")
          }
          aria-pressed={lang === l.code}
        >
          {l.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
