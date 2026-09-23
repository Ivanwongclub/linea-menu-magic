# WIN-CYC Finish Taxonomy

Controlled vocabulary for the product catalogue CMS. Derived from the WIN-CYC 電鍍色咭 / METAL COLOR CHART, pages P.01–P.04, covering CYC-0001 to CYC-0135.

This document defines the option lists that replace free-text colour and finish fields. Every value below is a fixed record in the CMS. Editors select from these; they never type them.

## Why controlled values

The catalogue currently stores finishes as prose, for example `Polished Nickel, Antique Brass, Gunmetal, Matte Black`. None of those four strings exists in the factory chart, and one of them is genuinely ambiguous: *Matte Black* could mean CYC-0040 MATT DARK NICKEL, which is plated, or CYC-0112 MATT BLACK ENAMEL, which is painted. The two differ in process, cost, and minimum order quantity. A customer selecting *Matte Black* is not placing an order the factory can quote.

Controlled values fix this by making every customer-visible finish resolve to exactly one CYC code.

## Record structure

Each of the 135 finishes is one record. Fields divide into two groups.

**Locked — factory truth, not editable in the CMS:**

| Field | Source |
|---|---|
| `cyc_code` | Chart, verbatim |
| `name_en` | Chart, verbatim |
| `name_zh` | Chart, verbatim |
| `chart_page` | Chart |
| `process_id` | Derived from chart page |
| `base_family_id` `surface_id` `tone_id` `effect_id` `tint_id` `coating_id` `pattern_id` | Parsed from `name_en` |

**Editable — customer-facing:**

| Field | Purpose |
|---|---|
| `marketing_name_en` / `marketing_name_zh` | Display label. One-to-one with a CYC code, so a friendly name always resolves to a producible finish. |
| `swatch_url` | Swatch image |
| `hex_approx` | Fallback colour and filter grouping |
| `status` | `active` / `discontinued` |
| `is_public` | Whether it appears in the public catalogue |
| `notes` | Free text for exceptions |

## The naming grammar

Every chart name is compositional, and the Chinese and English follow the same slot order.

```
中文    [製程] + [叻狀態] + [效果] + [色調] + [基色] + [表面處理]
English [HP]   +           [IMT]  + [tone] + [BASE] + [finish]

掛無叻仿玫瑰金掃尼龍
 掛      hanger plating
  無叻   no lacquer top-coat  (constant across the chart — carries no information)
    仿   imitation            -> tone
  玫瑰金 rose gold            -> base family
 掃尼龍 nylon-brushed         -> surface
= HP IMT BRUSHED ROSE GOLD
```

`無叻` prefixes every electroplated entry and never distinguishes one from another. Treat it as a constant and strip it when building selectors.

## The eight axes

Six axes describe plated finishes. Two more (coating, pattern) apply only to painted finishes, where they replace base family and surface — a painted button shows no base metal. No single record uses more than about five axes; the model is sparse by design.

### 1. Process / 製程

`process` — All 135 records. Used by 135 of 135 records.

| Code | English | 中文 |
|---|---|---|
| `HP` | Hanger Plating | 掛電 |
| `ROLL` | Roll Plating | 滾電 |
| `PAINT` | Painting | 噴漆 |
| `ECO` | Eco Plating | 環保鍍 |

### 2. Base Family / 基色

`base_family` — Plated and eco-plated records only (108 records). Null for painted finishes. Used by 108 of 135 records.

| Code | English | 中文 |
|---|---|---|
| `NICKEL` | Nickel | 叻 |
| `GUN_METAL` | Gun Metal | 槍 |
| `GOLD` | Gold | 真金 |
| `LIGHT_GOLD` | Light Gold | 淺金 |
| `ROSE_GOLD` | Rose Gold | 玫瑰金 |
| `BRASS` | Brass | 青銅 |
| `ANTI_BRASS` | Anti Brass | 青古 |
| `RED_COPPER` | Red Copper | 紅銅 |
| `ANTI_COPPER` | Anti Copper | 紅古 |
| `BLACK_COPPER` | Black Copper | 黑古 |
| `TIN` | Tin | 錫 |
| `ANTI_SILVER` | Anti Silver | 古銀 |
| `ALLOY` | Alloy | 合金 |
| `STAINLESS_STEEL` | Stainless Steel | 不鏽鋼 |
| `RUSTY_STEEL` | Rusty Steel | 鐵鏽 |

### 3. Surface / 表面處理

`surface` — Any record. Null means the chart states no surface treatment. Used by 40 of 135 records.

| Code | English | 中文 |
|---|---|---|
| `BRIGHT` | Bright | 光 |
| `BRUSHED` | Brushed | 掃尼龍 |
| `MATT` | Matt | 啞 |
| `SAND` | Sand | 噴沙 |
| `CIRCLE_BRUSHED` | Circle Brushed | 圈掃尼龍 |

### 4. Tone / 色調

`tone` — Any record. Used by 36 of 135 records.

| Code | English | 中文 |
|---|---|---|
| `IMT` | Imitation | 仿 |
| `DARK` | Dark | 深 |
| `LIGHT` | Light | 淺 |
| `MEDIUM` | Medium | 中 |
| `DEEP` | Deep | 深 |
| `ANTI` | Anti | 古 |
| `ANCIENT` | Ancient | 遠古 |

### 5. Effect / 效果

`effect` — Any record. Used by 14 of 135 records.

| Code | English | 中文 |
|---|---|---|
| `DISTRESS` | Distress | 濺泥 |
| `STONE_WASH` | Stone Wash | 石磨 |
| `OXIDE` | Oxide | 氧化 |
| `BLACK_COVER` | Black Cover | 黑面 |
| `TIN_COVER` | Tin Cover | 錫面 |
| `NICKEL_COVER` | Nickel Cover | 代叻 |
| `CONTRAST` | Contrast | 鴛鴦 |
| `ENAMEL_DIP` | Enamel Dip | 撈油 |
| `IRIDESCENT` | Iridescent | 彩 |
| `SPECKLE` | Speckle | 斑點 |

### 6. Tint / 色相修飾

`tint` — Applied on top of an anti (古) base to shift hue without changing family. Used by 9 of 135 records.

| Code | English | 中文 |
|---|---|---|
| `JAPAN` | Japan | 日本 |
| `COFFEE` | Coffee | 咖啡 |
| `CHOCOLATE` | Chocolate | 朱古力 |
| `PINK` | Pink | 粉紅 |
| `ORANGE` | Orange | 橙 |
| `GUN_METAL` | Gun Metal | 槍 |

### 7. Coating / 塗層

`coating` — Painted records only (P.04, excluding the three eco-plated codes). Used by 27 of 135 records.

| Code | English | 中文 |
|---|---|---|
| `GLOSS_ENAMEL` | Gloss Enamel | 光油 |
| `MATT_ENAMEL` | Matt Enamel | 啞油 |
| `RUBBER` | Rubber | 橡膠油 |
| `PEARL` | Pearl | 珠光油 |
| `EP` | Electrophoresis | 電泳 |
| `GLITTER` | Glitter | 閃粉膠 |
| `VELVET` | Velvet | 絨毛油 |
| `EPOXY` | Epoxy | 滴膠 |
| `CERAMIC` | Ceramic | 陶瓷 |
| `METALLIC` | Metallic | 金屬油 |

### 8. Pattern / 圖案

`pattern` — Painted records only. Used by 7 of 135 records.

| Code | English | 中文 |
|---|---|---|
| `SPRAY_DOT` | Spray Dot | 粉點 |
| `RAINDROP` | Raindrop | 雨點 |
| `CRACKED` | Cracked | 裂紋 |
| `GRADIENT` | Gradient | 陰陽 |
| `SCREEN_PRINT` | Screen Print | 移印 |
| `STONE_WASH` | Stone Wash | 打殘 |
| `IMT_LEATHER` | Imitation Leather | 仿皮 |

## Parsing rules

Facets are parsed from `name_en`, with process taken from the chart page rather than the name.

1. **Longest match first.** `GUN METAL` must resolve before `METAL`; `CIRCLE BRUSHED` before `BRUSHED`; `ANTI BRASS` before `BRASS`.
2. **The 銅/古 distinction is the critical one.** 青銅 brass and 青古 anti brass are different families, as are 紅銅 red copper and 紅古 anti copper. Four families, not two. Matching `BRASS` before `ANTI BRASS` collapses them and is the single most damaging parsing error.
3. **Do not double-count ANTI.** When the base family already carries it — ANTI_BRASS, ANTI_COPPER, ANTI_SILVER — leave `tone` null. Setting both puts every 古 record in the Anti tone bucket and the facet stops discriminating.
4. **Eco is a process, not a coating.** CYC-0133 to CYC-0135 are printed on the painting page because it is titled 噴漆*及環保* — painting *and* eco — but all three have a real base metal and a plating effect. They classify as plated so they surface when a buyer filters for copper or brass.

## Exceptions

Seven records do not parse cleanly. Each carries a ruling in its `notes` field so the decision travels with the data.

| Code | Chart name | Issue | Ruling |
|---|---|---|---|
| CYC-0027 | HP IMT BRUSHED GOLD MACL | MACL is undefined on the chart | `coating = MATT_ENAMEL`, read from 啞油 in the Chinese |
| CYC-0045 | IMT BLACK COPPER / 無叻防黑古 | 防 means anti-tarnish, translated as IMT here and nowhere else | `tone = IMT`; likely a typo for 仿 |
| CYC-0049 | CONTRAST TIN / 無叻鴛鴦錫 | 鴛鴦 is two-tone — genuinely two base colours in one code | `effect = CONTRAST`; the swatch carries what the facets cannot |
| CYC-0060 | OLD ANTI BRASS / 無叻光青古 | 光 means bright, English says OLD | `surface = BRIGHT`, Chinese taken as truth; confirm with WIN-CYC |
| CYC-0069 | GM ANTI COPPER / 無叻槍紅古 | Printed in the P.02 brass block but the name is a copper finish | `base = ANTI_COPPER`, `tint = GUN_METAL`; the name wins over page position |
| CYC-0081 | STONE WASH RED / 無叻石磨紅 | No base family stated in either language | `base = ANTI_COPPER` inferred from neighbours CYC-0080 and CYC-0082 |
| CYC-0095 | GOLDED BRASS / 無叻彩青銅 | 'Golded' is not a word; 彩 means iridescent | `effect = IRIDESCENT`; marketing name diverges from chart English |

Two further chart quirks need no ruling but should not be silently corrected in `name_en`, which is verbatim factory truth: CHOLCOLATE is misspelt on CYC-0067 and CYC-0079, and the P.04 footer reads *don't tonch the color sample*. Fix these in the marketing name only.

## Distribution

| Base family | Records |
|---|---|
| Gold | 15 |
| Nickel | 14 |
| Brass | 13 |
| Anti Copper | 11 |
| Anti Brass | 11 |
| Rose Gold | 9 |
| Light Gold | 8 |
| Red Copper | 8 |
| Gun Metal | 5 |
| Tin | 4 |
| Black Copper | 3 |
| Alloy | 3 |
| Anti Silver | 2 |
| Stainless Steel | 1 |
| Rusty Steel | 1 |

Gold, nickel, and the brass/anti-brass pair account for over half the chart. Six families have three records or fewer, which is worth knowing before deciding what to publish.

## Before publishing

The 135 codes are WIN-CYC's full manufacturing capability, not their sellable range. Some are certainly discontinued or made-to-order. Publishing all of them invites orders that cannot be filled.

Seed every record with `is_public = false`, enable a starter set manually, and give WIN-CYC a one-page list to tick. A catalogue that is too small is a sales conversation; one that is too large is a fulfilment failure.
