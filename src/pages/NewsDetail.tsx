import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/footer/Footer";
import { ArrowLeft, Calendar, MapPin, Share2, Facebook, Twitter, Linkedin, Mail, ChevronRight } from "lucide-react";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";
import { newsItems, categoryOptions } from "@/data/newsData";
import { Button } from "@/components/ui/button";

const NewsDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation();
  const { ref: contentRef, isVisible: contentVisible } = useScrollAnimation();
  const { ref: galleryRef, isVisible: galleryVisible, getDelay: getGalleryDelay } = useStaggeredAnimation(3, 150);
  const { ref: relatedRef, isVisible: relatedVisible, getDelay: getRelatedDelay } = useStaggeredAnimation(3, 150);
  
  const newsItem = newsItems.find(item => item.id === Number(id));
  
  if (!newsItem) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-24 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">Article Not Found</h1>
            <p className="text-muted-foreground mb-8">The article you are looking for does not exist or has been removed.</p>
            <Link to="/news" className="inline-flex items-center gap-2 text-foreground hover:text-foreground/80 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to News
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  const relatedNews = newsItems
    .filter(item => item.id !== newsItem.id && item.category === newsItem.category)
    .slice(0, 3);
  
  const categoryLabel = categoryOptions.find(c => c.key === newsItem.category)?.label;
  
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = newsItem.title;
  
  const socialLinks = [
    { icon: Facebook, label: "Facebook", url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
    { icon: Twitter, label: "Twitter", url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}` },
    { icon: Linkedin, label: "LinkedIn", url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}` },
    { icon: Mail, label: "Email", url: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareUrl)}` },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Image */}
        <section ref={heroRef} className="relative h-[50vh] min-h-[400px] overflow-hidden">
          <img
            src={newsItem.image}
            alt={newsItem.title}
            className={`w-full h-full object-cover transition-all duration-1000 ease-out ${
              heroVisible ? 'scale-100 opacity-100' : 'scale-110 opacity-0'
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          
          <button
            onClick={() => navigate("/news")}
            className={`absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-background/90 backdrop-blur-sm text-foreground hover:bg-background transition-all duration-500 ${
              heroVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to News</span>
          </button>
        </section>

        {/* Content */}
        <section className="py-16 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <article ref={contentRef} className="lg:col-span-8">
                <nav className={`flex items-center gap-2 text-xs text-muted-foreground mb-6 transition-all duration-700 ease-out ${
                  contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}>
                  <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
                  <ChevronRight className="w-3 h-3" />
                  <Link to="/news" className="hover:text-foreground transition-colors">News</Link>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-foreground">{newsItem.title}</span>
                </nav>
                
                <div className={`flex items-center gap-3 mb-4 transition-all duration-700 ease-out ${
                  contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`} style={{ transitionDelay: '100ms' }}>
                  <span className="text-xs text-muted-foreground">{categoryLabel}</span>
                </div>
                
                <h1 className={`text-3xl md:text-4xl font-bold text-foreground mb-2 transition-all duration-700 ease-out ${
                  contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`} style={{ transitionDelay: '150ms' }}>
                  {newsItem.title}
                </h1>
                <p className={`text-lg text-muted-foreground mb-6 transition-all duration-700 ease-out ${
                  contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`} style={{ transitionDelay: '200ms' }}>
                  {newsItem.subtitle}
                </p>
                
                <div className={`flex items-center gap-6 text-sm text-muted-foreground mb-8 pb-8 border-b border-border transition-all duration-700 ease-out ${
                  contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`} style={{ transitionDelay: '250ms' }}>
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {newsItem.date}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {newsItem.location}
                  </span>
                </div>
                
                <div className={`prose prose-lg max-w-none transition-all duration-700 ease-out ${
                  contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`} style={{ transitionDelay: '300ms' }}>
                  {newsItem.content.map((paragraph, index) => (
                    <p key={index} className="text-foreground/80 leading-relaxed mb-6">
                      {paragraph}
                    </p>
                  ))}
                </div>
                
                {newsItem.gallery && newsItem.gallery.length > 0 && (
                  <div ref={galleryRef} className="mt-12">
                    <h3 className="text-xl font-semibold text-foreground mb-6">Gallery</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {newsItem.gallery.map((image, index) => (
                        <div 
                          key={index} 
                          className={`aspect-[4/3] overflow-hidden transition-all duration-500 ease-out ${
                            galleryVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                          }`}
                          style={getGalleryDelay(index)}
                        >
                          <img
                            src={image}
                            alt={`${newsItem.title} - Image ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
              
              <aside className="lg:col-span-4">
                <div className="sticky top-24 space-y-8">
                  <div className="p-6 bg-secondary">
                    <div className="flex items-center gap-2 mb-4">
                      <Share2 className="w-4 h-4 text-foreground" />
                      <h3 className="text-sm font-medium text-foreground">Share this article</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      {socialLinks.map((social) => (
                        <a
                          key={social.label}
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 flex items-center justify-center border border-border bg-background hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-300"
                          aria-label={`Share on ${social.label}`}
                        >
                          <social.icon className="w-4 h-4" />
                        </a>
                      ))}
                    </div>
                  </div>
                  
                  {relatedNews.length > 0 && (
                    <div ref={relatedRef}>
                      <h3 className="text-sm font-medium text-foreground uppercase tracking-widest mb-4">Related Articles</h3>
                      <div className="space-y-4">
                        {relatedNews.map((item, index) => (
                          <Link
                            key={item.id}
                            to={`/news/${item.id}`}
                            className={`group block p-4 border border-border hover:border-foreground/20 transition-all duration-500 ${
                              relatedVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                            }`}
                            style={getRelatedDelay(index)}
                          >
                            <div className="flex gap-4">
                              <div className="w-20 h-16 flex-shrink-0 overflow-hidden">
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                                  {categoryOptions.find(c => c.key === item.category)?.label}
                                </span>
                                <h4 className="text-sm font-medium text-foreground group-hover:text-foreground/80 transition-colors line-clamp-2 mt-1">
                                  {item.title}
                                </h4>
                                <p className="text-[10px] text-muted-foreground mt-1">{item.date}</p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="p-6 bg-foreground text-background">
                    <h3 className="text-lg font-semibold mb-2">Stay Updated</h3>
                    <p className="text-sm text-background/70 mb-4">Get product updates and company news</p>
                    <Link to="/contact">
                      <Button variant="outline-inverse" className="w-full">
                        Contact Us
                      </Button>
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default NewsDetail;
