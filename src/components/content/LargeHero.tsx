import heroImage from "@/assets/hero-image.jpg";
import OptimizedImage from "@/components/ui/OptimizedImage";

const LargeHero = () => {
  return (
    <section className="w-full mb-16 px-6">
      <div className="w-full aspect-[16/9] mb-3 overflow-hidden">
        <OptimizedImage 
          src={heroImage} 
          alt="Modern jewelry collection" 
          priority="eager"
          sizes="100vw"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="">
        <h2 className="text-sm font-normal text-foreground mb-1">
          Modern Heritage
        </h2>
        <p className="text-sm font-light text-foreground">
          Contemporary jewelry crafted with timeless elegance
        </p>
      </div>
    </section>
  );
};

export default LargeHero;
