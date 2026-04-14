import ContentSection from "../../components/about/ContentSection";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
import PageBreadcrumb from "@/components/ui/PageBreadcrumb";

const CustomerCare = () => {
  return (
    <>
      <PageBreadcrumb
        segments={[
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
          { label: "Customer Care" },
        ]}
        title="Customer Care"
      />
        <div className="max-w-7xl mx-auto">

          <ContentSection title="Contact Information">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-light text-foreground">Phone</h3>
                <p className="text-muted-foreground">+852 1234 5678</p>
                <p className="text-sm text-muted-foreground">Mon–Fri: 9AM–6PM HKT</p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-light text-foreground">Email</h3>
                <p className="text-muted-foreground">info@wincyc.com</p>
                <p className="text-sm text-muted-foreground">Response within 24 hours</p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-light text-foreground">Live Chat</h3>
                <Button variant="outline">
                  Start Chat
                </Button>
                <p className="text-sm text-muted-foreground">Available during business hours</p>
              </div>
            </div>
          </ContentSection>

          <ContentSection title="Frequently Asked Questions">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="sampling" className="border border-border px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  What are your sampling options and lead times?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  We offer standard sampling (5–7 business days) and express sampling (2–3 business days). Sample fees depend on the product type and customisation level. Contact us for a quote.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="moq" className="border border-border px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  What are your minimum order quantities?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  MOQs vary by product type. Standard trims typically start from 500–1,000 pieces. Custom items may have higher minimums. We can discuss flexible arrangements for new clients.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="customisation" className="border border-border px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  Can I customise colours, finishes, and sizes?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes, we offer full customisation including custom finishes, plating colours, sizes, logo engraving, and bespoke designs. Our team will guide you through the process.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="certifications" className="border border-border px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  What certifications do your products hold?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Our products are certified under GRS, OEKO-TEX Standard 100, ISO 9001, and REACH compliance. We can provide certification documentation upon request.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="shipping" className="border border-border px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  What shipping options are available?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  We ship worldwide via major carriers including DHL, FedEx, and sea freight for bulk orders. Shipping terms are typically FOB or CIF depending on the order.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="quality" className="border border-border px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  How do you ensure product quality?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Every batch undergoes multi-stage quality inspection following AQL 1.5 sampling standards. We also support third-party testing through SGS, Bureau Veritas, and Intertek.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </ContentSection>

          <ContentSection title="Contact Form">
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-light text-foreground">Name</label>
                  <Input placeholder="Enter your name" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-light text-foreground">Company</label>
                  <Input placeholder="Enter your company name" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-light text-foreground">Email</label>
                <Input type="email" placeholder="Enter your email" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-light text-foreground">Subject</label>
                <Input placeholder="e.g. Sample request, Custom enquiry" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-light text-foreground">Message</label>
                <Textarea
                  className="min-h-[120px]"
                  placeholder="Please describe your enquiry in detail"
                />
              </div>

              <Button type="submit" className="w-full sm:w-auto px-12">
                Send Message
              </Button>
            </form>
          </ContentSection>
        </div>
    </>
  );
};

export default CustomerCare;
