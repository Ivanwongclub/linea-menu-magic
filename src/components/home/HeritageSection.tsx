import { Link } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import heritageCraftsmanship from "@/assets/heritage-craftsmanship.jpg";

const HeritageSection = () => {
  const { ref: contentRef, isVisible: contentVisible } = useScrollAnimation({ threshold: 0.2 });
  const { ref: imageRef, isVisible: imageVisible } = useScrollAnimation({ threshold: 0.3 });

  return (
    <section className="py-24 px-6 lg:px-8 bg-secondary overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div ref={contentRef} className="order-2 lg:order-1">
            <p 
              className={`text-subtitle mb-4 transition-all duration-700 ease-out ${
                contentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
              }`}
            >
              Heritage
            </p>
            <h2 
              className={`font-serif text-3xl md:text-4xl font-light text-foreground mb-6 transition-all duration-700 ease-out ${
                contentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
              }`}
              style={{ transitionDelay: '100ms' }}
            >
              品牌傳承
            </h2>
            
            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <p 
                className={`transition-all duration-700 ease-out ${
                  contentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
                }`}
                style={{ transitionDelay: '200ms' }}
              >
                自1979年創立以來，WIN-CYC GROUP 秉持「匠心傳承」的理念，專注於服裝輔料的研發與製造。
              </p>
              <p 
                className={`transition-all duration-700 ease-out ${
                  contentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
                }`}
                style={{ transitionDelay: '300ms' }}
              >
                四十餘年來，我們從香港起步，發展成為擁有國際認證的環球供應商，服務遍及歐美、日本及亞太地區的知名品牌。
              </p>
              <p 
                className={`transition-all duration-700 ease-out ${
                  contentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
                }`}
                style={{ transitionDelay: '400ms' }}
              >
                每一顆鈕扣、每一條拉鏈，都承載著我們對品質的執著與對工藝的敬意。
              </p>
            </div>

            <div 
              className={`mt-8 transition-all duration-700 ease-out ${
                contentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
              }`}
              style={{ transitionDelay: '500ms' }}
            >
              <Link
                to="/about"
                className="group inline-flex items-center text-sm tracking-wider text-foreground link-elegant"
              >
                Discover More
                <svg 
                  className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Visual Element */}
          <div ref={imageRef} className="order-1 lg:order-2">
            <div className="relative">
              <div 
                className={`aspect-[4/5] overflow-hidden transition-all duration-1000 ease-out ${
                  imageVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
              >
                <img 
                  src={heritageCraftsmanship} 
                  alt="Artisan craftsmanship - hands working with garment accessories" 
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
              <div 
                className={`absolute -bottom-6 -left-6 w-32 h-32 border border-border bg-background flex items-center justify-center transition-all duration-700 ease-out ${
                  imageVisible ? 'opacity-100 translate-x-0 translate-y-0' : 'opacity-0 translate-x-4 translate-y-4'
                }`}
                style={{ transitionDelay: '400ms' }}
              >
                <div className="text-center">
                  <span className="font-serif text-4xl text-foreground">45</span>
                  <p className="text-xs text-muted-foreground tracking-wider mt-1">Years</p>
                </div>
              </div>
              {/* Decorative corner */}
              <div 
                className={`absolute -top-4 -right-4 w-24 h-24 border-t-2 border-r-2 border-border transition-all duration-700 ease-out ${
                  imageVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                }`}
                style={{ transitionDelay: '600ms' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeritageSection;