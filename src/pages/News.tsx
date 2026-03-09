import Header from "@/components/layout/Header";
import Footer from "@/components/footer/Footer";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";
import { newsItems, categoryOptions, filterOptions } from "@/data/newsData";

type FilterType = "all" | "exhibition" | "news";
type CategoryType = "all" | "industry" | "product" | "certification" | "partnership";

const News = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [activeCategory, setActiveCategory] = useState<CategoryType>("all");
  
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation();
  const { ref: filterRef, isVisible: filterVisible } = useScrollAnimation();
  const { ref: featuredHeaderRef, isVisible: featuredHeaderVisible } = useScrollAnimation();
  const { ref: featuredRef, isVisible: featuredVisible, getDelay: getFeaturedDelay } = useStaggeredAnimation(2, 150);
  const { ref: regularHeaderRef, isVisible: regularHeaderVisible } = useScrollAnimation();
  const { ref: regularRef, isVisible: regularVisible, getDelay: getRegularDelay } = useStaggeredAnimation(8, 100);
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation();

  const filteredItems = newsItems.filter((item) => {
    const typeMatch = activeFilter === "all" || item.type === activeFilter;
    const categoryMatch = activeCategory === "all" || item.category === activeCategory;
    return typeMatch && categoryMatch;
  });

  const filteredFeaturedItems = filteredItems.filter((item) => item.featured);
  const filteredRegularItems = filteredItems.filter((item) => !item.featured);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section - Same style as About page */}
        <section ref={heroRef} className="py-24 px-6 lg:px-8 bg-secondary overflow-hidden">
          <div className="max-w-4xl mx-auto text-center">
            <p className={`text-subtitle mb-4 transition-all duration-700 ease-out ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>News & Events</p>
            <h1 className={`text-4xl md:text-5xl font-bold text-foreground mb-6 transition-all duration-700 ease-out ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: '100ms' }}>
              最新動態
            </h1>
            <p className={`text-lg text-muted-foreground leading-relaxed transition-all duration-700 ease-out ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: '200ms' }}>
              展覽資訊 · 企業新聞 · 行業動態
            </p>
          </div>
        </section>

        {/* Sticky Category Filter Bar */}
        <div ref={filterRef} className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className={`flex flex-col sm:flex-row sm:items-center gap-4 transition-all duration-700 ease-out ${
              filterVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              {/* Type Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground mr-2">類型</span>
                {filterOptions.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setActiveFilter(filter.key)}
                    className={`px-3 py-1.5 text-sm transition-all duration-300 ${
                      activeFilter === filter.key
                        ? "bg-foreground text-background"
                        : "bg-transparent text-foreground hover:bg-secondary border border-border"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              
              {/* Category Filter */}
              <div className="flex items-center gap-2 sm:ml-6">
                <span className="text-xs text-muted-foreground mr-2">分類</span>
                <div className="flex flex-wrap gap-2">
                  {categoryOptions.map((category) => (
                    <button
                      key={category.key}
                      onClick={() => setActiveCategory(category.key)}
                      className={`px-3 py-1.5 text-sm transition-all duration-300 ${
                        activeCategory === category.key
                          ? "bg-foreground text-background"
                          : "bg-transparent text-foreground hover:bg-secondary border border-border"
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Section */}
        {filteredFeaturedItems.length > 0 && (
          <section className="py-16 px-6 lg:px-8 overflow-hidden">
            <div className="max-w-7xl mx-auto">
              <div ref={featuredHeaderRef} className="flex items-center gap-4 mb-8">
                <h2 className={`text-xs font-medium text-muted-foreground uppercase tracking-widest transition-all duration-700 ease-out ${
                  featuredHeaderVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
                }`}>
                  焦點消息
                </h2>
                <div className={`flex-1 h-px bg-border transition-all duration-700 ease-out ${
                  featuredHeaderVisible ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                }`} style={{ transformOrigin: 'left', transitionDelay: '200ms' }} />
              </div>
              
              <div ref={featuredRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredFeaturedItems.map((item, index) => (
                  <Link
                    key={item.id}
                    to={`/news/${item.id}`}
                    className={`group relative overflow-hidden bg-background border border-border hover:border-foreground/20 transition-all duration-500 block ${
                      featuredVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                    }`}
                    style={getFeaturedDelay(index)}
                  >
                    <article>
                      <div className="aspect-[16/9] overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-xs font-medium uppercase tracking-widest text-foreground/70">
                            {item.type === "exhibition" ? "展覽" : "新聞"}
                          </span>
                          <span className="w-6 h-px bg-border" />
                          <span className="text-xs text-muted-foreground">
                            {categoryOptions.find(c => c.key === item.category)?.label}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-1 group-hover:text-foreground/80 transition-colors duration-300">
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {item.subtitle}
                        </p>
                        <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            {item.date}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" />
                            {item.location}
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Regular News Grid */}
        {filteredRegularItems.length > 0 && (
          <section className="py-16 px-6 lg:px-8 bg-secondary overflow-hidden">
            <div className="max-w-7xl mx-auto">
              <div ref={regularHeaderRef} className="flex items-center gap-4 mb-8">
                <h2 className={`text-xs font-medium text-muted-foreground uppercase tracking-widest transition-all duration-700 ease-out ${
                  regularHeaderVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
                }`}>
                  更多消息
                </h2>
                <div className={`flex-1 h-px bg-border transition-all duration-700 ease-out ${
                  regularHeaderVisible ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                }`} style={{ transformOrigin: 'left', transitionDelay: '200ms' }} />
              </div>
              
              <div ref={regularRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRegularItems.map((item, index) => (
                  <Link
                    key={item.id}
                    to={`/news/${item.id}`}
                    className={`group bg-background border border-border hover:border-foreground/20 transition-all duration-500 block ${
                      regularVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                    }`}
                    style={getRegularDelay(index)}
                  >
                    <article>
                      <div className="aspect-[16/10] overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-medium uppercase tracking-widest text-foreground/70">
                            {item.type === "exhibition" ? "展覽" : "新聞"}
                          </span>
                          <span className="w-4 h-px bg-border" />
                          <span className="text-xs text-muted-foreground">
                            {categoryOptions.find(c => c.key === item.category)?.label}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-foreground mb-2 group-hover:text-foreground/80 transition-colors duration-300 line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {item.subtitle}
                        </p>
                        <p className="text-sm text-foreground/70 leading-relaxed mb-4 line-clamp-2">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            {item.date}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" />
                            {item.location}
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <section className="py-24 px-6 lg:px-8">
            <div className="max-w-7xl mx-auto text-center">
              <p className="text-muted-foreground">暫無符合條件的內容</p>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section ref={ctaRef} className="py-16 px-6 lg:px-8 border-t border-border overflow-hidden">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className={`text-xl md:text-2xl font-serif font-light text-foreground mb-2 transition-all duration-700 ease-out ${
              ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              訂閱最新資訊
            </h2>
            <p className={`text-sm text-muted-foreground mb-6 font-light transition-all duration-700 ease-out ${
              ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: '100ms' }}>
              獲取展覽預告、產品發布及行業動態
            </p>
            <Link
              to="/contact"
              className={`inline-flex items-center gap-2 px-6 py-2.5 bg-foreground text-background hover:bg-foreground/90 transition-all duration-300 text-sm ${
                ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: '200ms' }}
            >
              <span>聯絡我們</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default News;