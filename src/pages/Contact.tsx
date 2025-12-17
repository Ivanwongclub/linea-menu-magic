import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";

const Contact = () => {
  const { toast } = useToast();
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation();
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
      title: "訊息已發送",
      description: "感謝您的來信，我們將盡快回覆。",
    });
    setFormData({
      name: "",
      company: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const contactItems = [
    { icon: Mail, title: "Email", content: "info@wincyc.com", href: "mailto:info@wincyc.com", detail: null },
    { icon: Phone, title: "Phone", content: "+852 1234 5678", href: "tel:+85212345678", detail: null },
    { icon: MapPin, title: "Hong Kong Office", content: "香港九龍", detail: "觀塘區", href: null },
    { icon: MapPin, title: "China Factory", content: "中國廣東省", detail: "東莞市", href: null },
    { icon: Clock, title: "Business Hours", content: "週一至週五 Mon-Fri", detail: "9:00 AM - 6:00 PM (HKT)", href: null },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero */}
        <section ref={heroRef} className="py-24 px-6 lg:px-8 bg-secondary overflow-hidden">
          <div className="max-w-4xl mx-auto text-center">
            <p className={`text-subtitle mb-4 transition-all duration-700 ease-out ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>Contact Us</p>
            <h1 className={`font-serif text-4xl md:text-5xl font-light text-foreground mb-6 transition-all duration-700 ease-out ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: '100ms' }}>
              聯絡我們
            </h1>
            <p className={`text-lg text-muted-foreground leading-relaxed transition-all duration-700 ease-out ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: '200ms' }}>
              我們期待與您合作
            </p>
          </div>
        </section>

        {/* Contact Info & Form */}
        <section className="py-24 px-6 lg:px-8 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
              {/* Contact Info */}
              <div className="lg:col-span-1">
                <h2 className={`font-serif text-2xl font-light text-foreground mb-8 transition-all duration-700 ease-out ${
                  infoVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}>
                  聯絡資訊
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
                <h2 className={`font-serif text-2xl font-light text-foreground mb-8 transition-all duration-700 ease-out ${
                  formVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}>
                  獲取報價
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
                      <label className="block text-sm text-foreground mb-2">
                        姓名 Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-border bg-transparent text-foreground text-sm focus:outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-foreground mb-2">
                        公司 Company
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-border bg-transparent text-foreground text-sm focus:outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-foreground mb-2">
                        電郵 Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-border bg-transparent text-foreground text-sm focus:outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-foreground mb-2">
                        電話 Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-border bg-transparent text-foreground text-sm focus:outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-foreground mb-2">
                      查詢主題 Subject *
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-border bg-transparent text-foreground text-sm focus:outline-none focus:border-foreground transition-colors"
                    >
                      <option value="">請選擇 Please select</option>
                      <option value="quote">產品報價 Product Quote</option>
                      <option value="sample">樣品申請 Sample Request</option>
                      <option value="custom">定制查詢 Custom Inquiry</option>
                      <option value="partnership">合作洽談 Partnership</option>
                      <option value="other">其他 Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-foreground mb-2">
                      訊息 Message *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-border bg-transparent text-foreground text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
                      placeholder="請描述您的需求..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-12 py-4 bg-brand-red-accent text-white text-xs tracking-[0.2em] uppercase transition-all duration-300 hover:bg-foreground btn-red-glow"
                  >
                    發送訊息 Send Message
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