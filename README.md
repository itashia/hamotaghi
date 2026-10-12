# هم‌اتاقی (Hamotaghi)

هم‌اتاقی یک workspace فارسی و راست‌به‌چپ برای مدیریت زندگی مشترک در خوابگاه است. کاربران می‌توانند اتاق بسازند یا با کد دعوت وارد شوند، هزینه‌ها و تسویه‌ها را مدیریت کنند، کارهای دوره‌ای و مسئول هفته را پیگیری کنند، فهرست خرید و اطلاعیه‌ها را نگه دارند و اعضای اتاق را مدیریت کنند. رابط کاربری به صورت وب و دسکتاپ Tauri ارائه می‌شود و داده‌های اصلی از طریق API لاراول ذخیره می‌شوند.

## فناوری و معماری

- **Frontend:** React 19، TypeScript، Vite، Tailwind CSS 4، shadcn/Radix UI، Recharts و Sonner
- **Desktop:** Tauri 2 با Rust؛ تنظیمات آن در `src-tauri/` قرار دارد
- **Backend:** Laravel 13، PHP 8.3+، Laravel Sanctum و SQLite به صورت پیش‌فرض
- **Testing:** Bun Test برای منطق TypeScript و Pest/PHPUnit برای API لاراول
- **ساختار:** frontend در ریشه repository و backend مستقل در `backend/` است. frontend از `VITE_API_URL` برای اتصال به API استفاده می‌کند.

## قابلیت‌ها

- ثبت‌نام، ورود، خروج، بازیابی و تغییر رمز عبور
- احراز هویت session/CSRF برای SPA و bearer token برای کلاینت Tauri
- ساخت اتاق و خوابگاه، دعوت با کد، عضویت، انتقال مالکیت و مدیریت اعضا
- داشبورد، هزینه‌ها، سهم‌بندی تومانی، پیشنهاد تسویه و ثبت تسویه
- کارهای دوره‌ای، چرخش عادلانه مسئولیت‌ها و مسئول هفته
- فهرست خرید، اطلاعیه‌ها، فعالیت‌ها و نشانگر خوانده‌شدن اعلان‌ها
- تقویم و ورودی تاریخ جلالی، تم روشن/تیره و رابط واکنش‌گرا

## پیش‌نیازها

- Bun برای frontend (یا Node.js/npm سازگار با اسکریپت‌های موجود)
- PHP 8.3 یا جدیدتر با SQLite و Composer 2
- Rust و ابزارهای Tauri برای ساخت نسخه دسکتاپ
- Git

## راه‌اندازی محلی

### Backend

```sh
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

API به صورت پیش‌فرض روی `http://localhost:8000` اجرا می‌شود. برای داده آزمایشی محلی، فقط در محیط توسعه `php artisan db:seed` را اجرا کنید. این seed یک حساب آزمایشی و یک اتاق نمونه ایجاد می‌کند؛ اطلاعات ورود و کد دعوت را در `backend/README.md` ببینید.

### Frontend وب

در ریشه repository:

```sh
bun install
cp .env.example .env.local
bun run dev
```

فایل `.env.local` باید فقط شامل مقدار محلی زیر باشد:

```dotenv
VITE_API_URL=http://localhost:8000/api/v1
```

سپس `http://localhost:1420` را باز کنید. originهای frontend باید با `FRONTEND_ORIGINS` و `SANCTUM_STATEFUL_DOMAINS` در `backend/.env` هماهنگ باشند.

### Tauri

برای اجرای دسکتاپ، Rust و ابزار Tauri را نصب کنید و از ریشه پروژه اجرا کنید:

```sh
bun run tauri dev
```

برای بسته قابل انتشار:

```sh
bun run tauri build
```

نسخه بسته‌بندی‌شده باید با یک API قابل دسترس HTTPS ساخته شود؛ مقدار آن را در محیط build با `VITE_API_URL` تنظیم کنید.

## پیکربندی محیط

نمونه‌های امن در `.env.example` و `backend/.env.example` قرار دارند. کلیدها، tokenها و credentialهای واقعی را commit نکنید. مهم‌ترین گزینه‌های backend عبارت‌اند از:

- `FRONTEND_ORIGINS`: originهای دقیق frontend؛ برای درخواست credentialدار wildcard استفاده نکنید.
- `FRONTEND_URL`: آدرس frontend برای لینک‌های بازیابی رمز.
- `SANCTUM_STATEFUL_DOMAINS`: hostname و portهای SPA.
- `SESSION_SECURE_COOKIE=true`: در production با HTTPS فعال شود.
- `VITE_API_URL`: آدرس کامل API شامل `/api/v1`.

پایگاه‌داده پیش‌فرض SQLite در `backend/database/database.sqlite` است و فایل محلی آن در Git نادیده گرفته می‌شود.

## API و احراز هویت

همه endpointها زیر `/api/v1` هستند و پاسخ JSON برمی‌گردانند. خطای validation با status `422` و فیلد `errors`، درخواست بدون احراز هویت با `401` و خطای دسترسی با `403` یا `404` پاسخ داده می‌شود.

| روش      | مسیر                           | کاربرد                             |
| -------- | ------------------------------ | ---------------------------------- |
| `POST`   | `/auth/register`               | ساخت حساب و آغاز session/token     |
| `POST`   | `/auth/login`                  | ورود با email یا شماره موبایل      |
| `POST`   | `/auth/logout`                 | پایان session یا revoke کردن token |
| `GET`    | `/auth/me`                     | حساب فعلی                          |
| `PATCH`  | `/auth/profile`                | ویرایش پروفایل                     |
| `PUT`    | `/auth/password`               | تغییر رمز                          |
| `POST`   | `/auth/forgot-password`        | ارسال لینک بازیابی                 |
| `POST`   | `/auth/reset-password`         | تنظیم رمز با token                 |
| `GET`    | `/rooms/current`               | workspace فعلی                     |
| `POST`   | `/rooms`                       | ساخت خوابگاه و اتاق                |
| `GET`    | `/rooms/invitations/{code}`    | پیش‌نمایش دعوت                     |
| `POST`   | `/rooms/join`                  | ورود با کد دعوت                    |
| `PUT`    | `/rooms/{room}/workspace`      | ذخیره workspace اتاق               |
| `PATCH`  | `/rooms/{room}`                | ویرایش مشخصات اتاق                 |
| `POST`   | `/rooms/{room}/invitation`     | چرخش کد دعوت؛ فقط مالک             |
| `DELETE` | `/rooms/{room}/members/{user}` | حذف عضو؛ فقط مالک                  |
| `POST`   | `/rooms/{room}/leave`          | ترک اتاق                           |
| `POST`   | `/rooms/{room}/activity/read`  | ذخیره نشانگر خوانده‌شدن            |

مرور کامل API، مدل داده و تنظیمات Sanctum در [backend/README.md](backend/README.md) آمده است. هنگام اجرای backend به صورت محلی، مستندات تعاملی Swagger در `http://localhost:8000/docs/api` و JSON تولیدشده OpenAPI در `http://localhost:8000/docs/api.json` در دسترس هستند. داده‌های مالی با مقدار صحیح تومانی ذخیره می‌شوند و scope اتاق از دسترسی به داده‌های اتاق دیگر جلوگیری می‌کند.

## دستورات و کیفیت

در ریشه پروژه:

```sh
bun run dev       # Vite development server
bun run build     # TypeScript check و production build
bun test          # تست‌های TypeScript
bun run preview   # نمایش build تولیدی
```

در backend:

```sh
php artisan migrate
php artisan db:seed       # فقط برای محیط local
php artisan test
vendor/bin/pint --dirty --format agent
```

تست‌های frontend در `tests/` منطق تاریخ جلالی، امور مالی و چرخش مسئولیت‌ها را پوشش می‌دهند. تست feature مربوط به API در `backend/tests/Feature/RoomApiTest.php` قرار دارد و از SQLite درون‌حافظه‌ای استفاده می‌کند.

## ساختار پروژه

```text
.
├── src/                 # React app، featureها، layout و UI primitives
├── tests/               # تست‌های Bun/TypeScript
├── src-tauri/           # Rust/Tauri desktop shell
├── backend/             # Laravel API، migrations، models و tests
├── public/              # assetهای عمومی frontend
├── package.json         # scripts و dependencyهای frontend
└── README.md
```

## استقرار

برای production، backend را روی یک محیط PHP/Laravel با HTTPS، secretهای محیطی امن، mail transport واقعی و database مناسب اجرا کنید؛ مقادیر پیش‌فرض local را برای production استفاده نکنید. پس از اجرای migrationها، frontend را با `bun run build` بسازید و برای desktop از `bun run tauri build` استفاده کنید.

## CI/CD و انتشار خودکار

pipelineهای GitHub Actions در `.github/workflows/` قرار دارند:

- `ci.yml` برای Pull Request و اجرای دستی، نصب dependencyها با cache، فرمت، تست frontend، تست Laravel، بررسی Rust و کنترل همسانی iconها اجرا می‌شود.
- `release.yml` پس از هر push به `main` یا با `workflow_dispatch` اجرا می‌شود. ابتدا formatterها و generatorها را به شکل خودکار اعمال می‌کند، تغییرات تولیدشده را با commit دارای `[skip ci]` به `main` برمی‌گرداند، سپس تست‌ها و build production را اجرا می‌کند.
- build انتشار برای Linux، Windows، macOS x64 و macOS arm64 انجام می‌شود و bundleهای Tauri را به GitHub Release پیوست می‌کند.

نسخه بر اساس Conventional Commits تعیین می‌شود: `feat` یک minor release، `fix` و سایر commitهای معمول یک patch release و `BREAKING CHANGE` یا `!` یک major release ایجاد می‌کند. نسخه در `package.json`، `src-tauri/tauri.conf.json`، `src-tauri/Cargo.toml` و `src-tauri/Cargo.lock` همگام می‌شود، سپس tag و release با release notes خودکار ساخته می‌شود. اگر HEAD قبلاً tag شده باشد، اجرای مجدد release تکراری ایجاد نمی‌کند.

مجوز workflowهای CI فقط `contents: read` است. workflow انتشار به `contents: write` نیاز دارد و از `GITHUB_TOKEN` داخلی استفاده می‌کند؛ secret اضافه‌ای برای buildهای unsigned فعلی لازم نیست. برای توزیع signed در آینده، certificate و secretهای signing باید در GitHub Actions Secrets اضافه شوند و هرگز در repository قرار نگیرند. برای اجرای دستی، از مسیر **Actions → Release → Run workflow** استفاده کنید.

### Iconها

`src-tauri/icon-source.png` نسخه commit‌شده‌ی همان `../icon.png` اصلی است و تنها source of truth هویت بصری محسوب می‌شود. دستور زیر با Tauri CLI، بدون تغییر نسبت یا طراحی logo، assetهای وب و platform-specific را بازتولید می‌کند:

```sh
bun run icons
```

این generator favicon و Apple Touch Icon، اندازه‌های PWA (`192x192` و `512x512` و maskable)، PNGهای Tauri، `ico` و `icns`، Android adaptive icons با densityهای مختلف و iOS AppIconها را در `public/` و `src-tauri/icons/` تولید می‌کند. workflow CI تفاوت خروجی generator با فایل‌های commit‌شده را بررسی می‌کند تا asset ناقص وارد build نشود.

### رفع اشکال CI/CD

- اگر `bun install --frozen-lockfile` شکست خورد، تغییرات `package.json` را با `bun install` همگام و `bun.lock` را commit کنید.
- اگر check مربوط به icon شکست خورد، `bun run icons` را اجرا و همه خروجی‌های تغییرکرده در `public/` و `src-tauri/icons/` را commit کنید.
- برای خطای Tauri روی Linux، dependencyهای WebKitGTK و AppIndicator باید نصب باشند؛ workflow آن‌ها را نصب می‌کند.
- اگر release ساخته نشد، ابتدا jobهای quality و build را بررسی کنید. tag موجود روی HEAD باعث skip امن اجرای تکراری می‌شود.
- buildهای فعلی unsigned هستند؛ خطای signing تا زمان افزودن certificateهای معتبر طبیعی است و نباید با قرار دادن credential در کد دور زده شود.

## رفع اشکال

- **خطای CORS یا session:** origin و port frontend را دقیقاً در `FRONTEND_ORIGINS` و `SANCTUM_STATEFUL_DOMAINS` وارد کنید و backend را restart کنید.
- **خطای اتصال API:** مقدار `VITE_API_URL` را بررسی کنید؛ باید به `/api/v1` ختم شود و backend در دسترس باشد.
- **خطای migration:** از `php artisan migrate` استفاده کنید. `migrate:fresh` داده‌های محلی را حذف می‌کند و برای database دارای داده استفاده نشود.
- **نمایش نشدن تغییرات frontend:** dev server را restart کنید یا `bun run build` را اجرا کنید.
- **خطای Tauri:** نصب Rust، پورت ثابت `1420` و درستی `VITE_API_URL` محیط build را بررسی کنید.

## مشارکت و Git workflow

تغییرات را کوچک و موضوعی نگه دارید. branch ادغام توسعه `dev/itarrshia` است؛ برای هر workstream از branch توصیفی مانند `fix/backend-api`، `feat/jalali-datepicker` یا `docs/readme-improvements` استفاده کنید. commitها باید Conventional Commit باشند، برای مثال `fix: correct API validation handling`. قبل از Pull Request تست مرتبط را اجرا کنید، فایل‌های محیطی و dependencyهای تولیدشده را commit نکنید، و PR را ابتدا به `dev/itarrshia` و پس از verification به `main` هدف بگیرید.

## مجوز

این پروژه در حال توسعه است. مجوز رسمی در repository تعریف نشده است؛ پیش از توزیع عمومی، مجوز مناسب اضافه کنید.
