// DEPRECATED — Dead route. Replaced by /products with Supabase-backed filters.
// Do not delete yet; some old bookmarks may reference /category/:slug.
import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import CategoryHeader from "../components/category/CategoryHeader";
import FilterSortBar from "../components/category/FilterSortBar";
import ProductGrid from "../components/category/ProductGrid";

const Category = () => {
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <>
        <CategoryHeader 
          category={category || 'All Products'} 
        />
        
        <FilterSortBar 
          filtersOpen={filtersOpen}
          setFiltersOpen={setFiltersOpen}
          itemCount={24}
        />
        
        <ProductGrid />
    </>
  );
};

export default Category;