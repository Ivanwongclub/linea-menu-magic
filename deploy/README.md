# 3D Editor — Docker Compose 部署

前端在服務器上用多階段 Docker build 編譯，再由 Nginx 提供。Supabase
採用官方 `self-hosted/v0.8.3` 固定版本（PostgreSQL 17），來源和修改方式見
[supabase/UPSTREAM.md](supabase/UPSTREAM.md)。網站與 API 使用同一網址。

## 日常部署：本機執行

在項目根目錄執行：

```sh
make deploy
```

流程是 **打包源碼 → SCP 上傳 → 服務器解壓 → 拉取固定版本 Supabase 鏡像 →
Docker build 前端 → 啟動服務及等待健康檢查 → 重新載入後端 functions**。
本機不編譯前端、不上傳 Docker 鏡像。Supabase 使用官方鏡像，項目自己的
Edge Functions 透過掛載源碼執行，重建 functions 容器後生效。

目前預設 `ubuntu@54.179.199.234`、目錄 `/opt/linea3d`，網站是
<http://54.179.199.234>。需要時可覆寫：

```sh
make deploy SERVER=ubuntu@OTHER_IP REMOTE_DIR=/opt/linea3d SSH_KEY=/path/to/key.pem
make package   # 只生成 .deploy/linea3d-src.tar.gz
make upload    # 只打包、上傳；不重啟服務
```

打包排除私鑰、實際環境設定、備份、node_modules、dist 和本機產物，只保留
Supabase 公開設定範本。服務器原有 `deploy/compose.env` 及 Docker named volumes
會繼續使用。日常部署不會執行初始化或匯入資料。

原本三個部署 `.sh` 已合併到根目錄 Makefile。上游 Supabase 的容器 entrypoint
屬於官方運行所需檔案，保持原樣。

## 服務器首次啟動

需要 `make`、Docker Engine、Docker Compose **2.24.4 或更新版本**。不需要在服務器
另外安裝 Node.js、npm 或 PostgreSQL。完整服務建議至少 4 GB RAM；20 GB
磁碟只適合作為初期測試配置，請監察資料、模型檔案和 Docker build cache 的用量。

把此項目源碼放到服務器，例如 `/opt/linea3d`，然後在項目根目錄執行：

```sh
# 只在首次執行；替換成實際對外網址。此例使用目前的主機 IP 和 HTTP 80。
make setup PUBLIC_URL=http://54.179.199.234 WEB_PORT=80

# 在服務器下載 Supabase 鏡像、安裝前端依賴、編譯及啟動。
make rebuild

make status
```

開啟 `http://54.179.199.234`。AWS Security Group 需允許 TCP 80 入站；SSH
使用 TCP 22。HTTP 是暫時部署方式，配置域名後可使用下方 HTTPS 方案。

`make setup` 會生成私人的 `deploy/compose.env`，權限為 `0600`。包括資料庫
密碼、JWT、API keys、Studio 密碼和 URL。**已存在時會拒絕覆寫**，避免令
已有資料庫的密碼或簽名失效。不要重新生成或遺失這個檔案。

原本根目錄 `.env` 是開發用配置，不會複製進 Docker build。前端只獲得
公開 URL 和 anon key；service-role key、資料庫密碼、SSH 金鑰不進入前端鏡像。
更改公開 URL 或 anon key 後，重新執行 `make rebuild`。

## 初始化或遷移資料：二選一

啟動 Supabase 容器本身不會自動覆蓋、清空或導入應用資料。

**A. 從現有雲端搬資料（正式切換使用此方式）**

先按下一節備份及還原。不要先執行 `make db-init`，亦不要把歷史
`supabase/migrations/` 再套到已還原的資料庫。

**B. 全新測試實例，尚未取得來源備份**

```sh
make db-init
```

此命令只接受沒有應用資料表的新實例，以單一交易套用歷史 migrations 和
其必要的目錄參考資料。會有 reference/sample catalogue 資料，**不包含現有
雲端的真實產品完整資料、用戶、設計或上傳檔案**，亦不會建立預設管理員。
如果日後要從雲端搬資料，請另建空白實例作還原及驗證，再切換網站。

## 現有 Supabase 資料遷移

本節命令需要來源項目的資料庫連線資料及 Supabase CLI。來源網站在最終
導出及切換期間要暫停寫入，避免 roles/schema/data 或檔案來自不同時間點。
請先在新的測試實例排練。官方說明：

- [資料庫及帳號還原](https://supabase.com/docs/guides/self-hosting/restore-from-platform)
- [Storage 檔案搬遷](https://supabase.com/docs/guides/self-hosting/copy-from-platform-s3)

使用來源的 direct 或 session-pooler 連線（不要用 transaction pooler）：

```sh
mkdir -p backups/cloud-export
chmod 700 backups backups/cloud-export
# 在本機輸入來源連線字串，避免把密碼寫進 shell history。
read -r SOURCE_DB_URL
supabase db dump --db-url "$SOURCE_DB_URL" -f backups/cloud-export/roles.sql --role-only
supabase db dump --db-url "$SOURCE_DB_URL" -f backups/cloud-export/schema.sql
supabase db dump --db-url "$SOURCE_DB_URL" -f backups/cloud-export/data.sql --use-copy --data-only
unset SOURCE_DB_URL
chmod 600 backups/cloud-export/*.sql

# 只會還原到沒有應用資料表和帳號的目標實例；任何 SQL 錯誤都整筆回滾。
make db-restore BACKUP_DIR=backups/cloud-export

docker compose --env-file deploy/compose.env exec -T db psql -X -U supabase_admin -d postgres < deploy/verify.sql
```

請對比來源及目標的全部應用表筆數、帳號、RLS policies，以及設計 recipe、
版本 snapshot、模型尺寸校準等關鍵欄位。來源與目標的 Auth/Storage 版本或
extension 有差異時，先處理相容性；不要為了通過還原而直接刪除資料。

**Storage 的實際檔案不在資料庫備份裡。** 使用官方指南的 S3/rclone 方法
另行複製，再以 `rclone check --download`、檔案數量及抽樣下載核對內容。
此項目歷史上使用以下 buckets，請以來源的實際清單為準：

```text
product-models   — 3D 模型
design-uploads  — 私人 Logo 等（保持 private）
product-assets
product-images
design-assets
flipbook-assets
```

不要直接把下載的檔案放入 Docker Storage volume，Storage 需要透過 API/S3
建立正確的內部結構。備份中的 Storage metadata 筆數不能證明檔案已搬妥。
來源 S3 access keys 需在原 Supabase 管理介面產生；目標 S3 key 在
`deploy/compose.env`，endpoint 是 `<網站網址>/storage/v1/s3`。

複製完檔案後，可在**目標資料庫**把舊 Storage URL 前綴改成新網址。此步會
修改 URL 字串（包括 JSON 裡的 URL），保留 UUID、路徑、數值和其他內容；先
做好備份，並審閱結果。這一步不會對原雲端資料庫執行任何操作：

```sh
docker compose --env-file deploy/compose.env exec -T db psql -X -U supabase_admin -d postgres \
  --set=old_url=https://OLD_PROJECT.supabase.co \
  --set=new_url=http://54.179.199.234 < deploy/rewrite-storage-urls.sql
```

再驗證：登入、品牌權限、產品列表、OBJ 模型、尺寸及材質、私人 Logo、草稿
保存、重新載入、歷史版本、圖片和電子目錄。新 JWT key 會令舊 session 失效，
用戶需要重新登入。來源雲端在驗收完成前保留，以便回退。

## 功能與服務配置

- 模型上傳可多選一個 OBJ、MTL 和貼圖，或選取整個模型資料夾；子目錄的相對
  路徑會一併解析。原始 OBJ／MTL bytes 保留，顯示用檔案只改寫配套檔案位置。
  「原始材質」保留顏色／透明度／貼圖，部件依 OBJ 的 object/group 或材質分段
  識別，可單獨隱藏、改色。MTL 不會還原 OBJ 沒有匯出的 CAD 圖層；貼圖需要 UV。
- STL 一般只有幾何，編輯器將它作為單一部件；可以改色、加字及量度，亦會讀取
  loader 支援的彩色 STL 擴充。正式產品模型在後台上傳及校準後可保存設計；
  視窗內「本機檔」匯入仍是本次工作階段的編輯，橫幅會標示未儲存。
- `LOVABLE_API_KEY`：如需現有 AI 產品圖片生成功能，在 `deploy/compose.env`
  補入原服務的金鑰，再重建 functions 容器。這項不是自動生成的 Supabase key。
- 預設關閉新用戶註冊。已有帳號的密碼登入可用；邀請、找回密碼及郵件需要配置
  `SMTP_*`。需要公開註冊時才調整 `DISABLE_SIGNUP`，並完成郵件設定。
- 只掛載正式的 `generate-product-images` function。`bootstrap-demo-user`
  不會部署；圖片生成亦要求已登入且具有 catalogue-editor 權限。
- 新圖片記錄使用對外 URL，Docker 內部的 `api-gw` 地址不會寫入圖片欄位。
- 私人檔案、產品讀寫及品牌權限仍由原有 Supabase RLS 管理。
- HTTP IP 部署時，建立 UUID 使用安全的 `getRandomValues` 作相容處理；瀏覽器
  剪貼簿等其他要求 secure context 的功能，需待 HTTPS 才可完整使用。

## Studio 與 SSH 金鑰

Studio 只綁定服務器的 `127.0.0.1:8000`，PostgreSQL 和 pooler 不發布對外端口。
在自己的電腦開 SSH tunnel：

```sh
ssh -i deploy/keys/3deditor-key.pem.cer -L 8000:127.0.0.1:8000 ubuntu@54.179.199.234
```

再開啟本機 `http://localhost:8000`，帳密見服務器的 `deploy/compose.env`
（`DASHBOARD_USERNAME`、`DASHBOARD_PASSWORD`）。

用戶提供的金鑰放在本機項目的 `deploy/keys/`，目錄權限 `0700`、金鑰 `0600`。
整個目錄已排除 Git、Docker context 和部署檔案上傳；不需要把私鑰放到服務器。

## 之後加入 HTTPS

把域名 DNS 指向主機，開放 TCP 80/443，將 `SITE_URL`、`SUPABASE_PUBLIC_URL`
改為 `https://你的域名`，`API_EXTERNAL_URL` 改為該網址加 `/auth/v1`，並更新
`ADDITIONAL_REDIRECT_URLS`，然後執行：

```sh
docker compose --env-file deploy/compose.env \
  -f compose.yaml -f deploy/compose.https.yaml up -d --build --wait
```

Caddy 會申請及續期證書，前端不再直接發布 HTTP 端口。之後操作同一部署時也
要帶同這兩個 `-f`。如果服務器已有 Nginx/Traefik，亦可沿用既有反向代理，
把網站轉發至前端端口並保留 WebSocket、Host 和 X-Forwarded-Proto。

## 重啟、更新與備份

部署後可在服務器執行整合檢查。預設只讀；`--write` 會建立兩個獨立測試帳號、
一份測試設計及私人 Logo，驗證登入、版本保存和跨帳號權限，再清除測試資料。
腳本不會輸出密碼或 service key：

```sh
make smoke
make smoke SMOKE_ARGS="--url http://127.0.0.1 --write"
```

如果前端使用其他端口，修改 `--url`。啟用 Caddy HTTPS 後，使用對外的 HTTPS
網址，而非上面的 HTTP 端口。腳本讀取私人的 `deploy/compose.env` 作測試。

```sh
make status
make logs
make rebuild
```

PostgreSQL、Storage、Studio snippets 和密鑰配置使用 project-scoped Docker
named volumes，停止或重建容器後仍保留。保持 `COMPOSE_PROJECT_NAME` 不變；
換名稱會使用另一套空白 volumes。不要在要保留資料時執行 `down -v`、
`docker volume prune` 或上游 reset 腳本。

定期備份資料庫、Storage 檔案、`deploy/compose.env`、`db-config` volume；
備份存到主機以外，並做還原演練。PostgreSQL 17 的備份請用同版或更新的
PostgreSQL 工具。更新 Supabase 時按整套固定版本排練，避免單獨更換某一服務。
