import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";
import PageBreadcrumb from "@/components/ui/PageBreadcrumb";

const Contact = () => {
  const { toast } = useToast();
  const { ref: infoRef, isVisible: infoVisible, getDelay: getInfoDelay } = useStaggeredAnimation(5, 100);
  const { ref: formRef, isVisible: formVisible } = useScrollAnimation();
  
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Sent",
      description: "Thank you for your enquiry. We will respond as soon as possible.",
    });
    setFormData({ name: "", company: "", email: "", phone: "", subject: "", message: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const contactItems = [
    { icon: Mail, title: "Email", content: "info@wincyc.com", href: "mailto:info@wincyc.com", detail: null },
    { icon: Phone, title: "Phone", content: "+852 1234 5678", href: "tel:+85212345678", detail: null },
    { icon: MapPin, title: "Hong Kong Office", content: "Kowloon, Hong Kong", detail: "Kwun Tong District", href: null },
    { icon: MapPin, title: "China Factory", content: "Guangdong, China", detail: "Dongguan", href: null },
    { icon: Clock, title: "Business Hours", content: "Mon–Fri", detail: "9:00 AM – 6:00 PM (HKT)", href: null },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        <PageBreadcrumb
          segments={[
            { label: "Home", href: "/" },
            { label: "Contact" },
          ]}
          title="Contact Us"
        />

        {/* Contact Info & Form */}
        <section className="py-24 px-6 lg:px-8 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
              {/* Contact Info */}
              <div className="lg:col-span-1">
                <h2 className={`text-2xl font-semibold text-foreground mb-8 transition-all duration-700 ease-out ${
                  infoVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}>
                  Contact Information
                </h2>
                
                <div ref={infoRef} className="space-y-8">
                  {contactItems.map((item, index) => (
                    <div 
                      key={item.title}
                      className={`flex items-start space-x-4 transition-all duration-500 ease-out ${
                        infoVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
                      }`}
                      style={getInfoDelay(index)}
                    >
                      <item.icon className="w-5 h-5 text-muted-foreground mt-1" strokeWidth={1.5} />
                      <div>
                        <h3 className="text-sm font-medium text-foreground mb-1">{item.title}</h3>
                        {item.href ? (
                          <a href={item.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            {item.content}
                          </a>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {item.content}
                            {item.detail && <><br />{item.detail}</>}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Form */}
              <div ref={formRef} className="lg:col-span-2">
                <h2 className={`text-2xl font-semibold text-foreground mb-8 transition-all duration-700 ease-out ${
                  formVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}>
                  Get a Quote
                </h2>
                
                <form 
                  onSubmit={handleSubmit} 
                  className={`space-y-6 transition-all duration-700 ease-out ${
                    formVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                  }`}
                  style={{ transitionDelay: '150ms' }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-foreground mb-2">Name *</label>
                      <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 border border-border bg-transparent text-foreground text-sm focus:outline-none focus:border-foreground transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm text-foreground mb-2">Company</label>
                      <input type="text" name="company" value={formData.company} onChange={handleChange} className="w-full px-4 py-3 border border-border bg-transparent text-foreground text-sm focus:outline-none focus:border-foreground transition-colors" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-foreground mb-2">Email *</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-3 border border-border bg-transparent text-foreground text-sm focus:outline-none focus:border-foreground transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm text-foreground mb-2">Phone</label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 border border-border bg-transparent text-foreground text-sm focus:outline-none focus:border-foreground transition-colors" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-foreground mb-2">Subject *</label>
                    <select name="subject" value={formData.subject} onChange={handleChange} required className="w-full px-4 py-3 border border-border bg-transparent text-foreground text-sm focus:outline-none focus:border-foreground transition-colors">
                      <option value="">Please select</option>
                      <option value="quote">Product Quote</option>
                      <option value="sample">Sample Request</option>
                      <option value="custom">Custom Inquiry</option>
                      <option value="partnership">Partnership</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-foreground mb-2">Message *</label>
                    <textarea name="message" value={formData.message} onChange={handleChange} required rows={6} className="w-full px-4 py-3 border border-border bg-transparent text-foreground text-sm focus:outline-none focus:border-foreground transition-colors resize-none" placeholder="Describe your requirements..." />
                  </div>

                  <button type="submit" className="px-12 py-4 bg-primary text-primary-foreground text-xs tracking-[0.2em] uppercase rounded-full transition-all duration-300 hover:bg-primary-hover">
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Contact;
