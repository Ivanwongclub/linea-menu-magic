import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { Product } from '@/features/products/types';
import { toast } from 'sonner';

interface SearchProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  existingProductIds: Set<string>;
  onAdded: () => void;
}

interface SearchResult {
  id: string;
  name: string;
  name_en: string | null;
  item_code: string | null;
  thumbnail_url: string | null;
  slug: string;
}

export default function SearchProductDialog({
  open,
  onOpenChange,
  teamId,
  existingProductIds,
  onAdded,
}: SearchProductDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const pattern = `%${q}%`;
    const { data } = await supabase
      .from('products')
      .select('id, name, name_en, item_code, thumbnail_url, slug')
      .eq('status', 'active')
      .eq('is_public', true)
      .or(`name.ilike.${pattern},name_en.ilike.${pattern},item_code.ilike.${pattern}`)
      .limit(20);
    setResults(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  const handleAdd = async (product: SearchResult) => {
    setAdding(product.id);
    const { error } = await supabase.from('user_library_items').insert({
      product_id: product.id,
      team_id: teamId,
    });
    if (error) {
      toast.error('Failed to add product');
    } else {
      toast.success(`${product.name_en || product.name} added to component library`);
      onAdded();
    }
    setAdding(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Component to Library</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or code..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
            autoFocus
          />
        </div>

        <div className="max-h-80 overflow-y-auto space-y-1">
          {loading && (
            <p className="text-xs text-muted-foreground text-center py-4">Searching...</p>
          )}
          {!loading && query && results.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No products found</p>
          )}
          {results.map((p) => {
            const alreadyAdded = existingProductIds.has(p.id);
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 p-2 rounded-[var(--radius)] hover:bg-secondary transition-colors"
              >
                <div className="w-10 h-10 shrink-0 rounded bg-secondary overflow-hidden">
                  {p.thumbnail_url ? (
                    <img src={p.thumbnail_url} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[7px] text-muted-foreground font-mono">
                      {p.item_code?.slice(0, 6)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name_en || p.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{p.item_code}</p>
                </div>
                {alreadyAdded ? (
                  <Button variant="ghost" size="sm" disabled className="gap-1 text-xs">
                    <Check className="w-3.5 h-3.5" />
                    Added
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-xs"
                    disabled={adding === p.id}
                    onClick={() => handleAdd(p)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
