import { Check, ChevronDown, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/features/i18n/I18nProvider";

const LANGUAGE_OPTIONS = [
  { value: "en", short: "EN", key: "i18n.en" },
  { value: "zh-Hant", short: "繁", key: "i18n.zhHant" },
  { value: "zh-Hans", short: "簡", key: "i18n.zhHans" },
] as const;

interface LanguageSwitcherProps {
  compact?: boolean;
}

const LanguageSwitcher = ({ compact = false }: LanguageSwitcherProps) => {
  const { language, setLanguage, t } = useI18n();
  const current = LANGUAGE_OPTIONS.find((option) => option.value === language) ?? LANGUAGE_OPTIONS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("i18n.switchLanguage")}
          title={t("i18n.switchLanguage")}
          className={`inline-flex items-center rounded-sm border border-border/70 text-foreground hover:border-foreground/40 hover:text-foreground transition-colors ${
            compact ? "h-9 gap-1 px-2.5 text-xs" : "h-8 gap-1.5 px-2 text-[11px]"
          }`}
        >
          <Globe className={compact ? "h-4.5 w-4.5" : "h-4 w-4"} strokeWidth={1.9} />
          <span className="font-medium tracking-[0.08em] uppercase">{current.short}</span>
          <ChevronDown className={compact ? "h-3.5 w-3.5" : "h-3 w-3"} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px] p-1">
        {LANGUAGE_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setLanguage(option.value)}
            className="flex items-center justify-between gap-3 px-2.5 py-2 text-xs"
          >
            <div className="flex items-center gap-2.5">
              <span className="min-w-[24px] text-[10px] font-medium tracking-[0.12em] uppercase text-muted-foreground">
                {option.short}
              </span>
              <span className="text-foreground">{t(option.key)}</span>
            </div>
            {option.value === language ? <Check className="h-3.5 w-3.5 text-foreground" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
