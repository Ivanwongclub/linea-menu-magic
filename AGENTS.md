# Architecture rules

- Keep the uploaded-model preview at `/model-preview` as a lazy-loaded public page outside the site shell; this isolates inspection of supplied models from editing and catalogue workflows.
- Reference uploaded preview OBJ files through Lovable Assets pointers and normalize cloned geometry only for display; this preserves source files and keeps large models out of the repository.