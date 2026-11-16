# CMS Admin Account Setup

公司安排初始 CMS 管理員時，請用本文件與同目錄腳本。  
When provisioning the first CMS admin, use this guide and the scripts beside it.

## 這是什麼 / What this is

| 項目 | 說明 |
| --- | --- |
| 用途 | 讓指定 Auth 用戶進入 `/admin`，並可寫入產品目錄／表面處理等資料 |
| 資料表 | `public.catalogue_editors` |
| 檢查函式 | `public.user_is_catalogue_editor(auth.uid())` |
| 為何要 DB／service role | 此表**沒有**給一般登入用戶的 INSERT／UPDATE／DELETE RLS；首次授權必須用 elevated 權限 |

**不是**一般買家帳號。買家設計稿（`designs` 等）多數不需要這項授權。

## 檔案

| 路徑 | 用途 |
| --- | --- |
| [`sql/grant-cms-admin.sql`](sql/grant-cms-admin.sql) | 可在 Supabase SQL Editor 或 `psql` 執行的授權 SQL |
| [`scripts/grant-cms-admin.mjs`](scripts/grant-cms-admin.mjs) | 用 **service role** 授權（可選順便建 Auth 用戶） |

## 操作步驟（建議）

### A. SQL（Dashboard / DBA）

1. 確認目標人員已有 Auth 用戶  
   - Supabase → **Authentication → Users**，或請對方先完成一次註冊／登入。
2. 開啟 [`sql/grant-cms-admin.sql`](sql/grant-cms-admin.sql)。
3. 把兩處 `REPLACE_WITH_ADMIN_EMAIL@example.com` 改成實際電郵。
4. 以專案擁有者／DBA 身分在 **SQL Editor** 執行（或 `psql` 連線後執行）。
5. 確認 SELECT 驗證查詢有回傳一列（`user_id` / `email` / `granted_at`）。
6. 該用戶開啟網站 `/admin/login` 登入；應可進入產品／taxonomy／finishes CMS。

### B. Node script（service role）

在專案根目錄（需已 `npm i`，且本機有 `@supabase/supabase-js`）：

```sh
SUPABASE_URL="https://YOUR_PROJECT.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY" \
CMS_ADMIN_EMAIL="person@company.com" \
node deploy/scripts/grant-cms-admin.mjs
```

若 Auth 用戶尚不存在，可同時建立（電郵視為已確認）：

```sh
SUPABASE_URL="https://YOUR_PROJECT.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY" \
CMS_ADMIN_EMAIL="person@company.com" \
CMS_ADMIN_PASSWORD="ChooseAStrongPassword" \
node deploy/scripts/grant-cms-admin.mjs
```

可選：同一人亦需要 Designer Studio staff（跨品牌設計權限）：

```sh
ALSO_DESIGNER_STAFF=1 \
SUPABASE_URL="..." \
SUPABASE_SERVICE_ROLE_KEY="..." \
CMS_ADMIN_EMAIL="person@company.com" \
node deploy/scripts/grant-cms-admin.mjs
```

成功時 stdout 會印 JSON：`ok: true`、`catalogueEditor: true`。

**切勿**把 `SERVICE_ROLE_KEY` 或密碼 commit 進 Git。

## 授權後可做什麼

Catalogue editor 可寫入（摘要）：

- `products`、`product_images`
- taxonomy／mapping（categories、materials、industries、certifications、tags…）
- `finishes` 與相關 lookup
- `product_finishes`、`product_colours`、`product_size_variants` 等
- Storage：`product-assets`、`product-models`

詳見 migrations：

- `supabase/migrations/20260903120000_catalogue_rls_hardening.sql`
- `supabase/migrations/20260903130000_catalogue_schema_m1.sql`

## 撤銷

在 SQL Editor：

```sql
delete from public.catalogue_editors c
using auth.users u
where c.user_id = u.id
  and lower(u.email) = lower('person@company.com');
```

## 驗證清單

- [ ] Auth 用戶存在且可登入  
- [ ] `catalogue_editors` 有該 `user_id`  
- [ ] `/admin` 不再顯示「不是 catalogue editor」  
- [ ] 可建立／更新一筆測試產品或 finish（非 production 請用 staging）

## 聯絡注意

若驗證查詢 0 列：先查 `auth.users` 電郵是否完全一致（大小寫已用 `lower()` 比對），以及用戶是否在正確的 Supabase project。
