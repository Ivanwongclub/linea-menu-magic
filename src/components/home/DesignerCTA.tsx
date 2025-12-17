import { Link } from "react-router-dom";

const DesignerCTA = () => {
  return (
    <section className="py-24 px-6 lg:px-8 bg-foreground text-primary-foreground">
      <div className="max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center space-x-2 mb-8">
          <span className="w-8 h-px bg-primary-foreground/30" />
          <span className="text-xs tracking-[0.2em] uppercase text-primary-foreground/60">
            Exclusive
          </span>
          <span className="w-8 h-px bg-primary-foreground/30" />
        </div>

        {/* Heading */}
        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light mb-6">
          Designer Studio
        </h2>
        <h3 className="font-serif text-xl md:text-2xl font-light text-primary-foreground/80 mb-8">
          設計師工作室
        </h3>

        {/* Description */}
        <p className="text-primary-foreground/70 leading-relaxed max-w-2xl mx-auto mb-12">
          登入專屬工作室，瀏覽完整輔料庫存，優化您的設計工作流程。
          <br />
          <span className="text-sm">
            Access our comprehensive trim library to streamline your workflow.
          </span>
        </p>

        {/* CTA */}
        <Link
          to="/designer-studio"
          className="inline-block px-12 py-4 border border-primary-foreground text-primary-foreground text-xs tracking-[0.2em] uppercase transition-all duration-300 hover:bg-primary-foreground hover:text-foreground"
        >
          進入工作室
        </Link>
      </div>
    </section>
  );
};

export default DesignerCTA;