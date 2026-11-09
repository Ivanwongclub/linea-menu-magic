import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useCookieContext } from "@/features/cookies/CookieProvider";

const STAGING_ORIGIN = "https://wincyc.tunebrighthk.com";
const MEASUREMENT_ID = "G-NJBNK6KK07";
const DISABLE_TAG = `ga-disable-${MEASUREMENT_ID}`;
const PRIVATE_PATH = /^\/(?:admin(?:\/|$)|designer-studio\/(?:login|designs|workspace|dashboard|compose|present|editor)(?:\/|$))/i;
const DENIED_CONSENT = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
} as const;

const browser = window as Window & {
  dataLayer?: unknown[];
  gtag?: typeof gtag;
  [DISABLE_TAG]?: boolean;
};

let tagLoaded = false;
let previousPage: string | undefined;

function gtag(..._args: unknown[]) {
  // The Google tag processes the arguments object from its data layer.
  // eslint-disable-next-line prefer-rest-params
  (browser.dataLayer ??= []).push(arguments);
}

function trackPage(pageLocation: string) {
  const page = { page_location: pageLocation, page_referrer: previousPage ?? "" };
  const wasDisabled = browser[DISABLE_TAG];
  browser[DISABLE_TAG] = false;

  if (!tagLoaded) {
    browser.gtag = gtag;
    gtag("consent", "default", DENIED_CONSENT);
  }
  if (!tagLoaded || wasDisabled) {
    gtag("consent", "update", { analytics_storage: "granted" });
  }
  gtag("set", page);
  if (!tagLoaded) {
    gtag("js", new Date());
    gtag("config", MEASUREMENT_ID, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    document.head.append(script);
    tagLoaded = true;
  }

  gtag("event", "page_view", { ...page, send_to: MEASUREMENT_ID });
  previousPage = pageLocation;
}

export default function StagingAnalytics() {
  const { pathname } = useLocation();
  const { status, consent } = useCookieContext();
  const hasConsent = status !== "pending" && consent.analytics === true;

  useEffect(() => {
    if (window.location.origin !== STAGING_ORIGIN) return;

    const isNewDesign = /^\/designer-studio\/editor\/new\/?$/i.test(pathname);
    if (!hasConsent || (!isNewDesign && PRIVATE_PATH.test(pathname))) {
      if (tagLoaded && !browser[DISABLE_TAG]) {
        browser[DISABLE_TAG] = true;
        gtag("consent", "update", DENIED_CONSENT);
      }
      previousPage = undefined;
      return;
    }

    const pageLocation = `${STAGING_ORIGIN}${pathname}`;
    if (pageLocation !== previousPage) trackPage(pageLocation);
  }, [hasConsent, pathname]);

  return null;
}
