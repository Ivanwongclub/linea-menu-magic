import { Link } from "react-router-dom";

const HeritageSection = () => {
  return (
    <section className="py-24 px-6 lg:px-8 bg-secondary">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="order-2 lg:order-1">
            <p className="text-subtitle mb-4">Heritage</p>
            <h2 className="font-serif text-3xl md:text-4xl font-light text-foreground mb-6">
              品牌傳承
            </h2>
            
            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <p>
                自1979年創立以來，WIN-CYC GROUP 秉持「匠心傳承」的理念，專注於服裝輔料的研發與製造。
              </p>
              <p>
                四十餘年來，我們從香港起步，發展成為擁有國際認證的環球供應商，服務遍及歐美、日本及亞太地區的知名品牌。
              </p>
              <p>
                每一顆鈕扣、每一條拉鏈，都承載著我們對品質的執著與對工藝的敬意。
              </p>
            </div>

            <div className="mt-8">
              <Link
                to="/about"
                className="inline-flex items-center text-sm tracking-wider text-foreground link-elegant"
              >
                Discover More
                <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Visual Element */}
          <div className="order-1 lg:order-2">
            <div className="relative">
              <div className="aspect-[4/5] bg-muted" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 border border-border bg-background flex items-center justify-center">
                <div className="text-center">
                  <span className="font-serif text-4xl text-foreground">45</span>
                  <p className="text-xs text-muted-foreground tracking-wider mt-1">Years</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeritageSection;