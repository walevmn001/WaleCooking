# P00 — Đề xuất công nghệ (Technology Proposal)

> Đây là **đề xuất có phân tích**, chưa phải cài đặt/triển khai. P00 **không cài đặt** hệ thống.
> Số liệu gói miễn phí được kiểm tra tại thời điểm **11/2026** — nhà cung cấp có thể thay đổi, cần xác minh lại trước khi triển khai.
> Nguồn tham khảo liệt kê ở cuối tài liệu.

## 1. Tiêu chí lựa chọn (bắt buộc)

1. Chi phí vận hành ban đầu thấp.
2. Ưu tiên giải pháp **có gói miễn phí**.
3. Dễ phát triển lâu dài.
4. Mở rộng được khi **số công thức và người dùng tăng**.
5. Bảo mật tốt.
6. **Hỗ trợ SEO** (nội dung công thức cần được index tốt).
7. Có khả năng **sao lưu & phục hồi**.
8. **Tránh phụ thuộc quá mức vào một nhà cung cấp.**
9. Có thể **di chuyển backend hoặc database** khi cần.

> Nguyên tắc xuyên suốt: **không chọn công nghệ chỉ vì phổ biến**; mỗi lựa chọn phải kèm lý do, ưu/nhược điểm, chi phí dự kiến và phương án thay thế.

## 2. Ràng buộc đã xác định
(toàn bộ khảo sát xem [00-khao-sat-moi-truong.md](./00-khao-sat-moi-truong.md))

- Nội dung **content-heavy + SEO** → cần SSR/SSG thật (không thuần SPA).
- Ngôn ngữ mặc định **tiếng Việt**, sẵn sàng i18n → cần i18n routing.
- Yêu cầu **tránh lock-in** → ưu tiên công nghệ **chuẩn mở** (Postgres, S3 API, Auth theo chuẩn).
- Môi trường dev **không có Docker** → tránh bắt buộc container ở giai đoạn đầu.
- Tooling sẵn có: **Node 24 / pnpm 10 / TS**.

## 3. Khuyến nghị tổng thể

> ✅ **ĐÃ CHỐT (P00):** theo xác nhận người dùng — dự án **phi thương mại**, chọn **stack lớp rời**. Phần dưới đây mô tả stack đã chốt.

**Kiến trúc đã chốt (ưu tiên tính di động & chuẩn mở):**

```
Next.js (App Router, TS, SSR/SSG, SEO, i18n)
   │
   ├── Data access:  Prisma ORM  ──►  PostgreSQL (Neon serverless)
   ├── Auth:         Auth.js (NextAuth) + Prisma adapter
   ├── Storage:      Cloudflare R2 (S3-compatible, 0 egress)
   ├── Search:       Postgres Full-Text Search (ban đầu)
   ├── Cache:        ISR/CDN + Upstash Redis (khi cần)
   ├── Admin/CMS:    Payload CMS 3 (chạy trong Next.js) hoặc admin tự viết
   └── Hosting/CI:   Cloudflare Pages/Workers + GitHub Actions
```

**Phương án thay thế "all-in-one" (nhanh hơn, ít lock-in hơn nhưng tiện):**
Supabase (Postgres + Auth + Storage + Edge Functions trong 1 nền tảng).

> Khuyến nghị chính: **stack lớp rời (Neon + R2 + Auth.js)** vì đáp ứng tốt tiêu chí *tránh lock-in* và *di chuyển được*. Nếu ưu tiên tốc độ MVP hơn tính di động, chọn **Supabase all-in-one**.

## 4. Phân tích từng thành phần

### 4.1. Frontend

| | |
| --- | --- |
| **Đề xuất** | **Next.js (App Router) + TypeScript + Tailwind CSS** |
| **Lý do** | SSR/SSG/ISR tốt cho **SEO**; hệ sinh thái lớn; phù hợp site nội dung; `next/font` tối ưu Baloo 2/Nunito; hỗ trợ i18n; 1 framework cho cả UI + API ban đầu. |
| **Ưu điểm** | SEO mạnh, image optimization, routing file-based, cộng đồng lớn, deploy đa nền tảng. |
| **Nhược điểm** | Có learning curve (App Router/Server Components); phụ thuộc React. |
| **Chi phí** | $0 (mã nguồn mở). |
| **Thay thế** | Astro (SEO tốt, ít JS — nhưng kém mạnh về app động); SvelteKit; Remix/React Router; Nuxt (nếu chọn Vue). |

### 4.2. Backend / API

| | |
| --- | --- |
| **Đề xuất** | **Bắt đầu bằng Next.js Route Handlers + Server Actions**; tách dần sang service riêng (**NestJS** hoặc **Fastify**) khi cần. |
| **Lý do** | Giảm số thành phần phải vận hành ở giai đoạn đầu (chi phí thấp); tách service khi tải/đội ngũ tăng. |
| **Ưu điểm** | Ít hạ tầng, deploy đơn giản, chia sẻ type TS với frontend. |
| **Nhược điểm** | Khó tách biên khi lớn; gắn chặt với Next.js nếu không tách sớm. |
| **Chi phí** | $0. |
| **Thay thế** | NestJS / Fastify / Hono (service độc lập); Go/Gin nếu cần hiệu năng cao. |

### 4.3. Database

| | |
| --- | --- |
| **Đề xuất** | **PostgreSQL** — managed qua **Neon (serverless)**, truy cập bằng **Prisma ORM**. |
| **Lý do** | Postgres là **chuẩn mở, di động cao** (giảm lock-in); hỗ trợ JSONB + full-text search; Neon free tier hào phóng, scale-to-zero. |
| **Neon Free (11/2026)** | 100 project; **1 GB storage/project** (tối đa 20 GB tổng); **100 CU-giờ/project/tháng**; autoscale tới 2 CU (~8 GB RAM); **5 GB egress/project**; scale-to-zero sau ~5 phút; instant restore ~6 giờ. Không cần thẻ. |
| **Ưu điểm** | Postgres chuẩn → dễ đổi nhà cung cấp; branching cho preview/migration; không tốn tiền khi idle. |
| **Nhược điểm** | Free giới hạn 1 GB/project; vượt CU-giờ sẽ treo compute tới kỳ sau. |
| **Chi phí** | Free; vượt hạn → Neon Launch: **$0.106/CU-hour**, **$0.35/GB-tháng**. |
| **Thay thế** | **Supabase Postgres** (500 MB DB, 2 project, pause sau ~1 tuần inactivity; Pro $25/tháng); Railway/Render; tự host Postgres; PlanetScale (MySQL). |

### 4.4. Authentication

| | |
| --- | --- |
| **Đề xuất** | **Auth.js (NextAuth)** + Prisma adapter (dùng email/OAuth). |
| **Lý do** | Chuẩn mở, tự chủ dữ liệu user trong DB của mình → **tránh lock-in**; tích hợp sẵn với Next.js/Prisma. |
| **Ưu điểm** | Kiểm soát dữ liệu; hỗ trợ OAuth/credentials; miễn phí. |
| **Nhược điểm** | Tự vận hành/sao lưu phiên & bảo mật; cần cấu hình. |
| **Chi phí** | $0. |
| **Thay thế** | **Supabase Auth** (nhanh, gắn bó Supabase); Clerk/Auth0 (tiện, có free tier nhưng **lock-in + chi phí tăng**); Better Auth. |

### 4.5. Image / File Storage

| | |
| --- | --- |
| **Đề xuất** | **Cloudflare R2** (tương thích **S3 API**). |
| **Lý do** | **Egress $0** — rất quan trọng với site nhiều ảnh món ăn; chuẩn S3 → di động cao. |
| **R2 Free (11/2026)** | **10 GB-tháng** Standard storage; **1 triệu Class A** ops; **10 triệu Class B** ops; **egress miễn phí**. |
| **Chi phí** | Free trong hạn mức; vượt → **$0.015/GB-tháng**, **$4.50/triệu Class A**. |
| **Ưu điểm** | Không phí egress; API chuẩn S3. |
| **Nhược điểm** | Cần cấu hình URL ảnh/CDN; đôi khi yêu cầu thêm phương thức thanh toán dù dùng free. |
| **Thay thế** | Supabase Storage (1 GB free); Backblaze B2 (10 GB free); Cloudinary/S3 (có phí egress). |

### 4.6. Search

| | |
| --- | --- |
| **Đề xuất** | **Postgres Full-Text Search** (`tsvector` + `pg_trgm`) ở giai đoạn đầu. |
| **Lý do** | Không thêm hạ tầng; VN cần lọc theo tên/nguyên liệu/cách chế biến — Postgres đủ cho quy mô đầu. |
| **Ưu điểm** | $0, không thêm service, dữ liệu nhất quán. |
| **Nhược điểm** | Tiếng Việt cần cấu hình tách từ/`unaccent`; kém linh hoạt hơn search engine chuyên dụng. |
| **Chi phí** | $0. |
| **Thay thế** | **Meilisearch/Typesense** (self-host hoặc cloud) khi cần typo-tolerance/ranking nâng cao; Algolia (đắt). |

### 4.7. Cache

| | |
| --- | --- |
| **Đề xuất** | **Next.js ISR + CDN** trước; thêm **Upstash Redis** khi cần (session, rate-limit, cache nóng). |
| **Lý do** | Tận dụng ISR/CDN là miễn phí và đủ cho nội dung công thức ít đổi. |
| **Upstash Free (11/2026)** | **256 MB** dữ liệu; **10 GB/tháng** bandwidth; **500K commands/tháng**. |
| **Chi phí** | Free; vượt → **$0.2/100K commands**. |
| **Thay thế** | Redis tự host; Cloudflare KV; Memcached. |

### 4.8. CMS / Admin

| | |
| --- | --- |
| **Đề xuất** | **Payload CMS 3** (chạy nhúng trong Next.js, giấy phép MIT, tự host) — hoặc admin tự viết bằng Next.js. |
| **Lý do** | Cần nhập/quản lý công thức, nguyên liệu, danh mục; Payload dùng đúng Postgres + TS, **không lock-in**, có UI admin sẵn. |
| **Ưu điểm** | Dùng chung DB/hosting; mở rộng được; mã nguồn mở. |
| **Nhược điểm** | Thêm độ phức tạp ban đầu; phải tự host. |
| **Chi phí** | $0 (self-host). |
| **Thay thế** | Directus (self-host); Strapi; Sanity (SaaS, có lock-in); admin tự code (đơn giản nhất, kiểm soát cao). |

### 4.9. Hosting & Deployment

| | |
| --- | --- |
| **Đề xuất** | Dự án **phi thương mại** → **Vercel Hobby ($0)** là hợp lệ; vẫn có thể chọn **Cloudflare Pages/Workers** nếu muốn không giới hạn băng thông/không phụ thuộc fair-use. |
| **Lý do quan trọng** | **Vercel Hobby ($0) chỉ cho phép dùng cá nhân/phi thương mại** → khớp với quyết định D1. Nếu tương lai chuyển sang thương mại → phải dùng **Vercel Pro ($20/seat/tháng)** hoặc chuyển **Cloudflare**. |
| **Cloudflare (11/2026)** | Free: **không giới hạn sites/requests/bandwidth**; giới hạn theo **20.000 files/site**, **25 MiB/file**. |
| **Vercel (11/2026)** | Hobby $0: ~**100 GB transfer + 1 triệu request/tháng**, **chỉ phi thương mại**. Pro **$20/tháng/seat**, gồm 1 TB transfer + 1 triệu CDN request. |
| **Ưu điểm** | Free tier mạnh; CDN toàn cầu; deploy từ Git; Vercel tối ưu sẵn cho Next.js. |
| **Nhược điểm** | Vercel Hobby giới hạn theo mục đích (nếu đổi sang thương mại phải nâng cấp/chuyển). |
| **Thay thế** | Netlify; Railway/Render (backend); VPS tự quản; Cloudflare Workers (edge runtime). |

### 4.10. Logging & Monitoring

| | |
| --- | --- |
| **Đề xuất** | **Sentry** (lỗi/hiệu năng) + một dịch vụ log (**Axiom** / **Logtail** / Better Stack). |
| **Lý do** | Cần theo dõi lỗi & hiệu năng khi người dùng tăng; đều có gói miễn phí. |
| **Chi phí** | Gói free của các dịch vụ này (**ước tính, cần xác minh lại** — không có số liệu xác nhận trong khảo sát này). |
| **Thay thế** | OpenTelemetry + Grafana Cloud; UptimeRobot cho uptime; Sentry self-host. |

### 4.11. CI/CD

| | |
| --- | --- |
| **Đề xuất** | **GitHub Actions** (repo đã nằm trên GitHub). |
| **Lý do** | Sẵn có, tích hợp trực tiếp repo; free cho repo public; repo private có hạn mức phút free/tháng. |
| **Ưu điểm** | Kiểm thử + build + deploy tự động; version-controlled. |
| **Nhược điểm** | Repo private tiêu tốn phút free → cần theo dõi. |
| **Chi phí** | Free trong hạn mức (repo public: miễn phí). |
| **Thay thế** | GitLab CI; CircleCI; Vercel/Cloudflare CI tích hợp sẵn. |

## 5. Tổng hợp chi phí giai đoạn đầu (dự kiến)

| Thành phần | Phương án đề xuất | Chi phí ban đầu |
| --- | --- | --- |
| Frontend/Backend | Next.js trên Cloudflare Pages/Workers | $0 |
| Database | Neon Free (Postgres) | $0 |
| ORM | Prisma | $0 |
| Auth | Auth.js | $0 |
| Storage | Cloudflare R2 (10 GB free) | $0 |
| Search | Postgres FTS | $0 |
| Cache | ISR/CDN (+ Upstash free nếu cần) | $0 |
| CMS/Admin | Payload CMS (self-host) | $0 |
| Monitoring | Sentry/Axiom free tier | $0 (ước tính) |
| CI/CD | GitHub Actions | $0 |
| **Tổng** | | **≈ $0/tháng** trong hạn mức free |

> ⚠️ Nếu chọn **Vercel Pro** (bắt buộc nếu thương mại) → **+$20/tháng/seat**. Nếu vượt hạn mức Neon/R2/Upstash/Supabase → phát sinh theo bảng giá ở trên.

## 6. Rủi ro & điểm cần quyết định

| # | Vấn đề | Ảnh hưởng | Trạng thái |
| --- | --- | --- | --- |
| 1 | Thương mại hay phi thương mại? | Chọn hosting: Vercel Pro vs Cloudflare | ✅ **Đã chốt: phi thương mại** → Vercel Hobby hợp lệ |
| 2 | Stack rời (Neon+R2+Auth.js) hay all-in-one (Supabase)? | Mức độ lock-in & tốc độ MVP | ✅ **Đã chốt: stack lớp rời** |
| 3 | Việc tách backend riêng (NestJS) — khi nào? | Độ phức tạp vận hành | Chốt ở phase kiến trúc |
| 4 | Icon minh họa riêng & mascot — nguồn tạo asset? | Khối lượng thiết kế | Chốt ở phase giao diện |

## 7. Nguồn tham khảo

- [Supabase Free Tier Limits 2026 (AI Agency Plus)](https://aiagencyplus.com/supabase-free-tier-limits/)
- [Supabase Free Tier Limits 2026 (IT Path Solutions)](https://www.itpathsolutions.com/supabase-free-tier-limits)
- [Vercel Hobby Plan (docs chính thức)](https://vercel.com/docs/plans/hobby)
- [Is Vercel Free? Hobby Limits & Commercial Clause 2026](https://justinmckelvey.com/blog/is-vercel-free)
- [Vercel Free Plan Limits 2026](https://formsubmit.app/blog/vercel-free-plan-limits)
- [Neon plans (docs chính thức)](https://neon.com/docs/introduction/plans)
- [Neon Free plan FAQ](https://neon.com/faqs/managed-postgres-databases-free-tier)
- [Neon vs Upstash free tier comparison](https://freetier.co/compare/neon-serverless-postgres-vs-upstash)
- [Cloudflare R2 Pricing (docs chính thức)](https://developers.cloudflare.com/r2/pricing/)
- [Cloudflare R2 free tier 2026](https://nubbo.app/articles/cloudflare-r2-free-tier/)
