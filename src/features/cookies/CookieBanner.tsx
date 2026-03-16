import { useState, useEffect } from "react";
import { useCookieContext } from "./CookieProvider";
import type { CookieConsent } from "./useCookieConsent";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const categories: {
  key: keyof CookieConsent;
  label: string;
  description: string;
  locked?: boolean;
}[] = [
  {
    key: "necessary",
    label: "Necessary",
    description: "Essential for the website to function. Cannot be disabled.",
    locked: true,
  },
  {
    key: "analytics",
    label: "Analytics",
    description: "Help us understand how visitors interact with our website.",
  },
  {
    key: "marketing",
    label: "Marketing",
    description: "Used to deliver relevant advertisements and track campaign performance.",
  },
  {
    key: "functional",
    label: "Functional",
    description: "Enable enhanced features and personalisation.",
  },
];

export default function CookieBanner() {
  const {
    showBanner,
    showCustomise,
    consent,
    acceptAll,
    rejectAll,
    saveCustom,
    openCustomise,
    closeCustomise,
  } = useCookieContext();

  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [local, setLocal] = useState<CookieConsent>(consent);

  // Sync local toggles when consent or customise panel opens
  useEffect(() => {
    setLocal(consent);
  }, [consent, showCustomise]);

  // Mount / slide-up animation
  useEffect(() => {
    if (showBanner) {
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 400);
      return () => clearTimeout(t);
    }
  }, [showBanner]);

  if (!mounted) return null;

  const toggle = (key: keyof CookieConsent) => {
    if (key === "necessary") return;
    setLocal((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div
      className="fixed z-[200] inset-x-0 bottom-0 lg:bottom-6 lg:left-1/2 lg:-translate-x-1/2 lg:inset-x-auto lg:w-full lg:max-w-2xl transition-transform duration-[400ms]"
      style={{
        transform: visible
          ? "translateY(0)"
          : "translateY(100%)",
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div className="bg-card border-t border-border shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-6 py-5 md:px-10 md:py-6 lg:rounded-[calc(var(--radius)*2)] lg:border lg:border-border lg:shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        {/* Header */}
        <h2 className="font-semibold text-base text-foreground mb-2">
          We value your privacy
        </h2>
        <p className="text-sm text-muted-foreground leading-[1.6] mb-4">
          We use cookies to enhance your browsing experience, serve personalised
          content, and analyse our traffic. By clicking &ldquo;Accept All&rdquo;,
          you consent to our use of cookies.{" "}
          <a
            href="/cookie-policy"
            className="text-foreground underline underline-offset-4 text-sm"
          >
            Cookie Policy
          </a>
        </p>

        {/* Customise panel */}
        <div
          className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
          style={{ maxHeight: showCustomise ? "600px" : "0px" }}
        >
          <div className="pb-4">
            <h3 className="text-sm font-medium mb-4">
              Manage cookie preferences
            </h3>
            {categories.map((cat, i) => (
              <div
                key={cat.key}
                className={`flex justify-between items-start py-3 ${
                  i < categories.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="pr-4">
                  <p className="text-sm font-medium text-foreground">
                    {cat.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {cat.description}
                  </p>
                </div>
                <div className="flex-shrink-0 pt-0.5">
                  {cat.locked ? (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      Always active
                    </span>
                  ) : (
                    <Switch
                      checked={local[cat.key]}
                      onCheckedChange={() => toggle(cat.key)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Button row */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-4">
          {showCustomise ? (
            <>
              <Button
                variant="default"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => saveCustom(local)}
              >
                Save preferences
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={acceptAll}
              >
                Accept All
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={openCustomise}
              >
                Customise
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={rejectAll}
              >
                Reject All
              </Button>
              <Button
                variant="default"
                size="sm"
                className="w-full sm:w-auto"
                onClick={acceptAll}
              >
                Accept All
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
