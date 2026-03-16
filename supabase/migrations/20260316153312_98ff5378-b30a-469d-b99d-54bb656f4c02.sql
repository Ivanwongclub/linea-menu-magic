
DO $$
DECLARE
  product_record RECORD;
  cat_slug TEXT;
  photo_pool INT[];
  base_idx INT;
  product_idx INT := 0;
  prev_cat TEXT := '';
  img_ids INT[];
BEGIN
  DELETE FROM product_images;
  UPDATE products SET thumbnail_url = NULL;

  FOR product_record IN
    SELECT p.id, p.item_code, p.name_en, p.name,
           pc.slug as category_slug
    FROM products p
    LEFT JOIN product_category_map pcm ON pcm.product_id = p.id AND pcm.is_primary = true
    LEFT JOIN product_categories pc ON pc.id = pcm.category_id
    ORDER BY pc.slug, p.sort_order
  LOOP
    cat_slug := COALESCE(product_record.category_slug, 'other');

    IF cat_slug != prev_cat THEN
      product_idx := 0;
      prev_cat := cat_slug;
    END IF;

    CASE cat_slug
      WHEN 'buttons'        THEN photo_pool := ARRAY[1039, 1055, 1062, 1084];
      WHEN 'snap-buttons'   THEN photo_pool := ARRAY[119, 145, 160, 175];
      WHEN 'jeans-buttons'  THEN photo_pool := ARRAY[200, 209, 225, 237];
      WHEN 'shank-buttons'  THEN photo_pool := ARRAY[250, 263, 278, 292];
      WHEN 'beads'          THEN photo_pool := ARRAY[305, 312, 326, 338];
      WHEN 'badges'         THEN photo_pool := ARRAY[342, 355, 366, 380];
      WHEN 'buckles'        THEN photo_pool := ARRAY[399, 401, 416, 429];
      WHEN 'rivets'         THEN photo_pool := ARRAY[435, 447, 452, 468];
      WHEN 'eyelets'        THEN photo_pool := ARRAY[471, 483, 495, 502];
      WHEN 'hook-eyes'      THEN photo_pool := ARRAY[510, 525, 532, 545];
      WHEN 'hardware'       THEN photo_pool := ARRAY[550, 563, 574, 586];
      WHEN 'cord-ends'      THEN photo_pool := ARRAY[593, 600, 611, 628];
      WHEN 'cord-stoppers'  THEN photo_pool := ARRAY[634, 646, 655, 667];
      WHEN 'drawcords'      THEN photo_pool := ARRAY[671, 683, 694, 701];
      WHEN 'toggles'        THEN photo_pool := ARRAY[718, 724, 733, 742];
      WHEN 'webbing'        THEN photo_pool := ARRAY[755, 766, 773, 784];
      WHEN 'zipper-pullers' THEN photo_pool := ARRAY[790, 802, 813, 824];
      WHEN 'patches'        THEN photo_pool := ARRAY[835, 846, 853, 866];
      ELSE                       photo_pool := ARRAY[870, 883, 891, 901];
    END CASE;

    base_idx := product_idx % 4;
    img_ids := ARRAY[
      photo_pool[(base_idx % 4) + 1],
      photo_pool[((base_idx + 1) % 4) + 1],
      photo_pool[((base_idx + 2) % 4) + 1],
      photo_pool[((base_idx + 3) % 4) + 1]
    ];

    UPDATE products
    SET thumbnail_url = 'https://picsum.photos/id/' || img_ids[1] || '/400/400'
    WHERE id = product_record.id;

    INSERT INTO product_images (product_id, url, sort_order, is_primary, alt_text)
    VALUES
      (product_record.id,
       'https://picsum.photos/id/' || img_ids[1] || '/800/800',
       0, true,
       COALESCE(product_record.name_en, product_record.name) || ' — primary view'),
      (product_record.id,
       'https://picsum.photos/id/' || img_ids[2] || '/800/800',
       1, false,
       COALESCE(product_record.name_en, product_record.name) || ' — detail view'),
      (product_record.id,
       'https://picsum.photos/id/' || img_ids[3] || '/800/800',
       2, false,
       COALESCE(product_record.name_en, product_record.name) || ' — angle view'),
      (product_record.id,
       'https://picsum.photos/id/' || img_ids[4] || '/800/800',
       3, false,
       COALESCE(product_record.name_en, product_record.name) || ' — close-up view');

    product_idx := product_idx + 1;
  END LOOP;
END;
$$
