
-- Rename "Sustainable Materials Catalog" to "Zip"
UPDATE flipbook_brochures SET title = 'Zip', slug = 'zip' WHERE id = '14e9130e-5c0e-4c95-b730-5c7732c56431';

-- Rename "Hardware Innovations" to "Lace"
UPDATE flipbook_brochures SET title = 'Lace', slug = 'lace' WHERE id = '3f6023d6-9889-413e-b513-f8ce715b4deb';

-- Delete old pages for Sustainable Materials (now Zip)
DELETE FROM flipbook_pages WHERE brochure_id = '14e9130e-5c0e-4c95-b730-5c7732c56431';

-- Delete old pages for Hardware Innovations (now Lace)
DELETE FROM flipbook_pages WHERE brochure_id = '3f6023d6-9889-413e-b513-f8ce715b4deb';

-- Insert Zip pages
INSERT INTO flipbook_pages (brochure_id, image_url, page_number) VALUES
  ('14e9130e-5c0e-4c95-b730-5c7732c56431', '/brochure-pages/z1.jpg', 1),
  ('14e9130e-5c0e-4c95-b730-5c7732c56431', '/brochure-pages/z4.jpg', 2),
  ('14e9130e-5c0e-4c95-b730-5c7732c56431', '/brochure-pages/z5.jpg', 3),
  ('14e9130e-5c0e-4c95-b730-5c7732c56431', '/brochure-pages/z9.jpg', 4);

-- Insert Lace pages
INSERT INTO flipbook_pages (brochure_id, image_url, page_number) VALUES
  ('3f6023d6-9889-413e-b513-f8ce715b4deb', '/brochure-pages/RDEL-12-11901.jpg', 1),
  ('3f6023d6-9889-413e-b513-f8ce715b4deb', '/brochure-pages/RDEL-12-11914.jpg', 2),
  ('3f6023d6-9889-413e-b513-f8ce715b4deb', '/brochure-pages/RDEL-12-11915.jpg', 3),
  ('3f6023d6-9889-413e-b513-f8ce715b4deb', '/brochure-pages/RDEL-12-11916.jpg', 4);
