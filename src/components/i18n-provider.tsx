"use client";

// ---------------------------------------------------------------------------
// I18nProvider — makes the active language + translator available to the tree
// ---------------------------------------------------------------------------
// The server layout reads the "lang" cookie and passes it as `initialLang`.
// Switching language writes the cookie and calls router.refresh() so that
// server components re-render in the new language too.
// ---------------------------------------------------------------------------

import { createContext, useContext, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { translate, type Lang, type TranslationKey } from "@/lib/i18n";

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  initialLang,
  children,
}: {
  initialLang: Lang;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const router = useRouter();

  const setLang = useCallback(
    (next: Lang) => {
      setLangState(next);
      // Persist for ~1 year so the choice sticks across sessions.
      document.cookie = `lang=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
      router.refresh();
    },
    [router],
  );

  const t = useCallback((key: TranslationKey) => translate(lang, key), [lang]);

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
