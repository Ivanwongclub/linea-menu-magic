import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero */}
        <section className="py-24 px-6 lg:px-8 bg-secondary">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-subtitle mb-4">Contact Us</p>
            <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-6">
              聯絡我們
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              我們期待與您合作
            </p>
          </div>
        </section>

        {/* Contact Info & Form */}
        <section className="py-24 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
              {/* Contact Info */}
              <div className="lg:col-span-1">
                <h2 className="font-serif text-2xl font-light text-foreground mb-8">
                  聯絡資訊
                </h2>
                
                <div className="space-y-8">
                  <div className="flex items-start space-x-4">
                    <Mail className="w-5 h-5 text-muted-foreground mt-1" strokeWidth={1.5} />
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-1">Email</h3>
                      <a href="mailto:info@wincyc.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        info@wincyc.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <Phone className="w-5 h-5 text-muted-foreground mt-1" strokeWidth={1.5} />
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-1">Phone</h3>
                      <a href="tel:+85212345678" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        +852 1234 5678
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-1" strokeWidth={1.5} />
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-1">Hong Kong Office</h3>
                      <p className="text-sm text-muted-foreground">
                        香港九龍<br />
                        觀塘區
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-1" strokeWidth={1.5} />
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-1">China Factory</h3>
                      <p className="text-sm text-muted-foreground">
                        中國廣東省<br />
                        東莞市
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <Clock className="w-5 h-5 text-muted-foreground mt-1" strokeWidth={1.5} />
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-1">Business Hours</h3>
                      <p className="text-sm text-muted-foreground">
                        週一至週五 Mon-Fri<br />
                        9:00 AM - 6:00 PM (HKT)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-2">
                <h2 className="font-serif text-2xl font-light text-foreground mb-8">
                  獲取報價
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
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