type PatternType = 'grid' | 'dots' | 'lines' | 'cross' | 'diagonal';

type CategoryTheme = {
  bg: string;
  fg: string;
  pattern: PatternType;
  symbol: string;
  label: string;
};

type ProductVariation = {
  density: number;
  symbolOffsetX: number;
  symbolOffsetY: number;
  symbolScale: number;
  rotation: number;
  accentOpacity: number;
};

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getCategoryTheme(slug?: string, name?: string): CategoryTheme {
  const s = (slug ?? '').toLowerCase();
  const n = (name ?? '').toLowerCase();
  const match = (keywords: string[]) => keywords.some((k) => s.includes(k) || n.includes(k));

  if (match(['shank'])) return { bg: '#F2EEE8', fg: '#3D2B1A', pattern: 'cross', symbol: '◉', label: 'SHANK BUTTON' };
  if (match(['snap'])) return { bg: '#EEEEF2', fg: '#1A1A3D', pattern: 'dots', symbol: '⊕', label: 'SNAP BUTTON' };
  if (match(['jeans', 'jean', 'denim'])) return { bg: '#E8EEF4', fg: '#1A2D4A', pattern: 'diagonal', symbol: '⬤', label: 'JEANS BUTTON' };
  if (match(['button', 'btn'])) return { bg: '#F5F5F3', fg: '#1A1A1A', pattern: 'grid', symbol: '◉', label: 'BUTTON' };

  if (match(['bead'])) return { bg: '#FDF6EC', fg: '#8B6914', pattern: 'dots', symbol: '●●●', label: 'BEADS' };
  if (match(['badge'])) return { bg: '#EEF2F8', fg: '#1A2D5A', pattern: 'cross', symbol: '◈', label: 'BADGE' };
  if (match(['patch'])) return { bg: '#F4EEE8', fg: '#5C3A1A', pattern: 'grid', symbol: '▣', label: 'PATCH' };

  if (match(['buckle'])) return { bg: '#ECECEC', fg: '#2D2D2D', pattern: 'diagonal', symbol: '⬒', label: 'BUCKLE' };
  if (match(['rivet'])) return { bg: '#EFEAE4', fg: '#4A3728', pattern: 'dots', symbol: '●', label: 'RIVET' };
  if (match(['eyelet'])) return { bg: '#ECEFF2', fg: '#283445', pattern: 'cross', symbol: '◎', label: 'EYELET' };
  if (match(['hook', 'eye'])) return { bg: '#EEF0ED', fg: '#2C3B2B', pattern: 'lines', symbol: '⌁', label: 'HOOK & EYE' };
  if (match(['hardware', 'metal'])) return { bg: '#E9ECEF', fg: '#263238', pattern: 'lines', symbol: '⬡', label: 'HARDWARE' };

  if (match(['cord-end', 'cord end'])) return { bg: '#F3EFE8', fg: '#5A4B3D', pattern: 'diagonal', symbol: '∥', label: 'CORD END' };
  if (match(['cord-stopper', 'stopper'])) return { bg: '#EDEFF4', fg: '#2F3E5C', pattern: 'grid', symbol: '⬢', label: 'CORD STOPPER' };
  if (match(['drawcord', 'draw string'])) return { bg: '#EEF4ED', fg: '#2E4A33', pattern: 'lines', symbol: '≈', label: 'DRAWCORD' };
  if (match(['toggle'])) return { bg: '#F5F0E8', fg: '#5A3B22', pattern: 'cross', symbol: '⟐', label: 'TOGGLE' };
  if (match(['webbing', 'strap', 'tape'])) return { bg: '#ECEFF4', fg: '#22304A', pattern: 'grid', symbol: '▤', label: 'WEBBING' };

  if (match(['zipper', 'puller', 'closure'])) return { bg: '#ECEBEF', fg: '#332A3E', pattern: 'diagonal', symbol: '⫶', label: 'ZIPPER PULLER' };

  if (match(['lace'])) return { bg: '#FBF4F0', fg: '#6B3D32', pattern: 'dots', symbol: '✶', label: 'LACE' };
  if (match(['label'])) return { bg: '#F2F4F6', fg: '#2E3B47', pattern: 'lines', symbol: '▭', label: 'LABEL' };
  if (match(['elastic'])) return { bg: '#EEF4F2', fg: '#2B4A43', pattern: 'cross', symbol: '≈', label: 'ELASTIC' };
  if (match(['resin', 'plastic'])) return { bg: '#F4EFF8', fg: '#44305A', pattern: 'dots', symbol: '◌', label: 'RESIN' };
  if (match(['cotton'])) return { bg: '#F9F7F1', fg: '#4D4639', pattern: 'grid', symbol: '✦', label: 'COTTON' };
  if (match(['nylon', 'poly'])) return { bg: '#EFF2F8', fg: '#2C3555', pattern: 'diagonal', symbol: '⟡', label: 'NYLON' };

  return { bg: '#EEF0F2', fg: '#26303A', pattern: 'grid', symbol: '◧', label: 'TRIM PRODUCT' };
}

function getProductVariation(productName?: string, itemCode?: string, slug?: string, categoryName?: string): ProductVariation {
  const seed = `${itemCode ?? ''}|${productName ?? ''}|${slug ?? ''}|${categoryName ?? ''}`;
  const hash = hashString(seed || 'trim');

  return {
    density: 6 + (hash % 7),
    symbolOffsetX: ((hash >> 2) % 52) - 26,
    symbolOffsetY: ((hash >> 4) % 52) - 26,
    symbolScale: 0.84 + (((hash >> 6) % 30) / 100),
    rotation: ((hash >> 8) % 26) - 13,
    accentOpacity: 0.12 + (((hash >> 10) % 18) / 100),
  };
}

function buildPattern(size: number, theme: CategoryTheme, variation: ProductVariation): string {
  const stroke = `${theme.fg}22`;
  const fill = `${theme.fg}1E`;
  const step = Math.max(22, Math.floor(size / (variation.density + 5)));
  const parts: string[] = [];

  if (theme.pattern === 'grid') {
    for (let x = 0; x <= size; x += step) {
      parts.push(`<path d="M ${x} 0 V ${size}" stroke="${stroke}" stroke-width="1"/>`);
    }
    for (let y = 0; y <= size; y += step) {
      parts.push(`<path d="M 0 ${y} H ${size}" stroke="${stroke}" stroke-width="1"/>`);
    }
  }

  if (theme.pattern === 'dots') {
    const r = Math.max(2, Math.floor(step / 10));
    for (let x = Math.floor(step / 2); x <= size; x += step) {
      for (let y = Math.floor(step / 2); y <= size; y += step) {
        parts.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`);
      }
    }
  }

  if (theme.pattern === 'lines') {
    for (let y = 0; y <= size; y += step) {
      parts.push(`<path d="M 0 ${y} H ${size}" stroke="${stroke}" stroke-width="1.2"/>`);
    }
  }

  if (theme.pattern === 'cross') {
    const arm = Math.max(4, Math.floor(step / 4));
    for (let x = Math.floor(step / 2); x <= size; x += step) {
      for (let y = Math.floor(step / 2); y <= size; y += step) {
        parts.push(`<path d="M ${x - arm} ${y} H ${x + arm}" stroke="${stroke}" stroke-width="1.1"/>`);
        parts.push(`<path d="M ${x} ${y - arm} V ${x === x ? y + arm : y}" stroke="${stroke}" stroke-width="1.1"/>`);
      }
    }
  }

  if (theme.pattern === 'diagonal') {
    for (let i = -size; i <= size * 2; i += step) {
      parts.push(`<path d="M ${i} 0 L ${i - size} ${size}" stroke="${stroke}" stroke-width="1.1"/>`);
    }
  }

  return parts.join('');
}

export function getProductPlaceholderUrl(
  productName?: string,
  itemCode?: string,
  categorySlug?: string,
  categoryName?: string,
  size = 800,
): string {
  const safeSize = Math.max(128, Math.min(size, 1600));
  const theme = getCategoryTheme(categorySlug, categoryName);
  const variation = getProductVariation(productName, itemCode, categorySlug, categoryName);
  const pattern = buildPattern(safeSize, theme, variation);

  const safeName = escapeXml(productName ?? 'Trim Product');
  const safeCode = escapeXml(itemCode ?? 'N/A');
  const centerX = safeSize / 2 + variation.symbolOffsetX;
  const centerY = safeSize / 2 + variation.symbolOffsetY;
  const footerTop = safeSize - Math.max(96, Math.floor(safeSize * 0.19));
  const labelSize = Math.max(12, Math.floor(safeSize * 0.04));
  const codeSize = Math.max(11, Math.floor(safeSize * 0.033));
  const symbolSize = Math.max(68, Math.floor(safeSize * 0.18));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${safeSize}" height="${safeSize}" viewBox="0 0 ${safeSize} ${safeSize}">
  <rect width="100%" height="100%" fill="${theme.bg}"/>
  <g>${pattern}</g>
  <g opacity="${variation.accentOpacity.toFixed(2)}">
    <circle cx="${safeSize * 0.18}" cy="${safeSize * 0.2}" r="${Math.floor(safeSize * 0.1)}" fill="${theme.fg}"/>
    <circle cx="${safeSize * 0.84}" cy="${safeSize * 0.22}" r="${Math.floor(safeSize * 0.07)}" fill="${theme.fg}"/>
  </g>
  <g transform="translate(${centerX} ${centerY}) rotate(${variation.rotation}) scale(${variation.symbolScale})">
    <text x="0" y="0" text-anchor="middle" dominant-baseline="middle" fill="${theme.fg}" opacity="0.24" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${symbolSize}">${escapeXml(theme.symbol)}</text>
  </g>
  <rect x="0" y="${footerTop}" width="${safeSize}" height="${safeSize - footerTop}" fill="#FFFFFFC8"/>
  <text x="${Math.floor(safeSize * 0.06)}" y="${footerTop + Math.floor((safeSize - footerTop) * 0.42)}" fill="${theme.fg}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${labelSize}" letter-spacing="1">${escapeXml(theme.label)}</text>
  <text x="${Math.floor(safeSize * 0.06)}" y="${footerTop + Math.floor((safeSize - footerTop) * 0.75)}" fill="${theme.fg}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${codeSize}">${safeCode}</text>
  <title>${safeName}</title>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getProductThumbnailUrl(
  productName?: string,
  itemCode?: string,
  categorySlug?: string,
  categoryName?: string,
): string {
  return getProductPlaceholderUrl(productName, itemCode, categorySlug, categoryName, 400);
}
