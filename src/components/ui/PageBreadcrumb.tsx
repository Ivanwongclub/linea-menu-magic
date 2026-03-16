import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbSegment {
  label: string;
  href?: string;
}

interface PageBreadcrumbProps {
  segments: BreadcrumbSegment[];
  title: string;
}

const PageBreadcrumb = ({ segments, title }: PageBreadcrumbProps) => {
  return (
    <div className="pt-8 pb-4 px-6 lg:px-8">
      <div className="max-w-[1200px] mx-auto">
        <Breadcrumb>
          <BreadcrumbList className="text-xs uppercase tracking-[0.06em] text-muted-foreground">
            {segments.map((segment, index) => {
              const isLast = index === segments.length - 1;
              return (
                <span key={index} className="contents">
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="text-xs uppercase tracking-[0.06em]">{segment.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={segment.href || "/"} className="text-xs uppercase tracking-[0.06em]">{segment.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator className="text-muted-foreground" />}
                </span>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-2xl font-light text-foreground mt-4">{title}</h1>
      </div>
    </div>
  );
};

export default PageBreadcrumb;
