interface ContentSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const ContentSection = ({ title, children, className = "" }: ContentSectionProps) => {
  return (
    <section className={`py-16 ${className}`}>
      {title && (
        <h2 className="text-3xl font-light text-foreground mb-8">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
};

export default ContentSection;