import { useEffect } from "react";
import PageBreadcrumb from "@/components/ui/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCookieContext } from "@/features/cookies/CookieProvider";

const cookieTable = [
  {
    category: "Necessary",
    purpose:
      "Required for core website functionality — login sessions, security, accessibility. Cannot be disabled.",
    examples: "Session tokens, CSRF protection, load balancing",
  },
  {
    category: "Analytics",
    purpose:
      "Help us understand how visitors use our site so we can improve it. Collected data is aggregated and anonymised.",
    examples: "Page views, session duration, traffic sources",
  },
  {
    category: "Marketing",
    purpose:
      "Used to show relevant content and advertisements. May be shared with advertising partners.",
    examples: "Ad targeting, campaign tracking, retargeting",
  },
  {
    category: "Functional",
    purpose:
      "Enable enhanced features and personalised experiences such as language preferences and saved settings.",
    examples: "Language preference, display settings, chat widgets",
  },
];

const browserLinks = [
  { label: "Chrome", href: "https://support.google.com/chrome/answer/95647" },
  { label: "Firefox", href: "https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox" },
  { label: "Safari", href: "https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" },
  { label: "Edge", href: "https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" },
];

const CookiePolicy = () => {
  const { resetConsent } = useCookieContext();

  useEffect(() => {
    document.title = "Cookie Policy - WIN-CYC Group";
  }, []);

  return (
    <>
        <PageBreadcrumb
          segments={[{ label: "Home", href: "/" }, { label: "Cookie Policy" }]}
          title="Cookie Policy"
        />

        <div className="max-w-4xl mx-auto px-6 py-12">
          <p className="text-sm text-muted-foreground mb-12">Last updated: March 2026</p>

          <div className="space-y-12">
            {/* Section 1 */}
            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">What Are Cookies?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Cookies are small text files that are stored on your device when you visit a website.
                They are widely used to make websites work more efficiently and to provide information
                to website owners. Cookies help us recognise your device and remember your preferences
                across visits.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">How We Use Cookies</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                WIN-CYC Group uses cookies for the following purposes. You can manage your preferences
                at any time using our cookie settings panel.
              </p>
              <div className="border border-border rounded-[var(--radius)] overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary hover:bg-secondary">
                      <TableHead className="text-xs uppercase tracking-[0.08em] font-medium text-foreground">
                        Category
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-[0.08em] font-medium text-foreground">
                        Purpose
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-[0.08em] font-medium text-foreground">
                        Examples
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cookieTable.map((row) => (
                      <TableRow key={row.category}>
                        <TableCell className="text-sm font-medium text-foreground align-top whitespace-nowrap">
                          {row.category}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground align-top">
                          {row.purpose}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground align-top">
                          {row.examples}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Managing Your Preferences</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                You can update your cookie preferences at any time by clicking the button below.
                Changes take effect immediately. Note that disabling certain cookies may affect the
                functionality of our website.
              </p>
              <Button variant="outline" onClick={() => resetConsent()}>
                Manage Cookie Settings
              </Button>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Third-Party Cookies</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Some cookies on our site are set by third-party services. These providers have their
                own privacy policies and cookie practices. We encourage you to review their policies
                directly.
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Google Analytics — analytics and performance</li>
                <li>LinkedIn Insight Tag — marketing analytics</li>
                <li>Meta Pixel — advertising and retargeting</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Browser-Level Controls</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                In addition to our cookie settings, you can control cookies directly through your
                browser settings. Most browsers allow you to refuse cookies, delete existing cookies,
                or notify you when new cookies are set. Please note that restricting cookies may
                impact the performance of this website.
              </p>
              <div className="flex flex-wrap gap-4">
                {browserLinks.map((link) => (
                  <Button
                    key={link.label}
                    variant="ghost"
                    size="sm"
                    asChild
                  >
                    <a href={link.href} target="_blank" rel="noopener noreferrer">
                      {link.label}
                    </a>
                  </Button>
                ))}
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-light text-foreground mb-4">Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you have any questions about our use of cookies, please contact us at:
              </p>
              <p className="text-muted-foreground">
                <a
                  href="mailto:info@wincyc.com"
                  className="text-foreground underline underline-offset-4"
                >
                  info@wincyc.com
                </a>
              </p>
            </section>
          </div>
        </div>
    </>
  );
};

export default CookiePolicy;
