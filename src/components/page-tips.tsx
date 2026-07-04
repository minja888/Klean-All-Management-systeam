"use client";

// Small dismissible "How to use" banner shown at the top of each module page.
// Dismissal is remembered per page in localStorage.
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import type { TranslationKey } from "@/lib/i18n";

export function PageTips({ tipKey }: { tipKey: TranslationKey }) {
  const { t } = useI18n();
  const storageKey = `tips-dismissed:${tipKey}`;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(storageKey) !== "1");
    } catch {
      setVisible(true);
    }
  }, [storageKey]);

  if (!visible) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
      <span aria-hidden>💡</span>
      <div className="flex-1">
        <span className="font-medium">{t("tips.title")}: </span>
        {t(tipKey)}
      </div>
      <button
        onClick={() => {
          try { localStorage.setItem(storageKey, "1"); } catch { /* ignore */ }
          setVisible(false);
        }}
        className="text-blue-400 hover:text-blue-600 text-lg leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
