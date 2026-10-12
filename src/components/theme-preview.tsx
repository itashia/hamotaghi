import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  MoonIcon,
  PlusIcon,
  SparklesIcon,
  SunIcon,
  TriangleAlertIcon,
  WalletIcon,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const transactions = [
  {
    date: "۱۲ مهر",
    title: "اجاره خانه ونک",
    person: "سارا",
    amount: "۸٬۰۰۰٬۰۰۰",
    signed: "−",
    tone: "settled" as const,
    status: "تسویه شد",
  },
  {
    date: "۱۱ مهر",
    title: "خرید سوپرمارکت",
    person: "علی",
    amount: "۶۴۵٬۰۰۰",
    signed: "+",
    tone: "credit" as const,
    status: "بستانکار",
  },
  {
    date: "۱۰ مهر",
    title: "قبض برق",
    person: "مریم",
    amount: "۲۱۰٬۰۰۰",
    signed: "−",
    tone: "debt" as const,
    status: "بدهکار",
  },
  {
    date: "۹ مهر",
    title: "شام گروهی",
    person: "رضا",
    amount: "۹۸۰٬۰۰۰",
    signed: "−",
    tone: "pending" as const,
    status: "در انتظار",
  },
];

const buttonVariants = [
  ["default", "اصلی"],
  ["secondary", "ثانویه"],
  ["outline", "خطی"],
  ["ghost", "شفاف"],
  ["destructive", "خطر"],
  ["link", "پیوند"],
] as const;

const buttonSizes = [
  ["xs", "خیلی کوچک"],
  ["sm", "کوچک"],
  ["default", "معمولی"],
  ["lg", "بزرگ"],
] as const;

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      variant="outline"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
      {isDark ? "حالت روشن" : "حالت تیره"}
    </Button>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl">{title}</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function ExpenseForm() {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const amountInvalid = submitted && amount.trim() === "";

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
        if (amount.trim() === "") {
          return;
        }
        toast.success("هزینه ثبت شد", {
          description: note.trim() || "مبلغ در حساب گروه خانه ونک نشست.",
        });
      }}
    >
      <FieldGroup>
        <Field data-invalid={amountInvalid || undefined}>
          <FieldLabel htmlFor="amount">مبلغ</FieldLabel>
          <Input
            id="amount"
            inputMode="numeric"
            placeholder="مثلاً ۱۲۵٬۰۰۰"
            value={amount}
            aria-invalid={amountInvalid}
            className="h-10 font-heading text-base"
            onChange={(event) => setAmount(event.target.value)}
          />
          <FieldDescription>مبلغ را به تومان بنویسید.</FieldDescription>
          {amountInvalid ? (
            <FieldError>مبلغ را وارد کنید.</FieldError>
          ) : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="note">توضیح</FieldLabel>
          <Textarea
            id="note"
            placeholder="مثلاً خرید میوه برای خانه"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>

        <Field data-invalid>
          <FieldLabel htmlFor="card">شماره کارت</FieldLabel>
          <Input
            id="card"
            defaultValue="۶۰۳۷"
            aria-invalid
            className="h-10"
          />
          <FieldError>شماره کارت کامل نیست.</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="disabled-field">حساب قفل‌شده</FieldLabel>
          <Input
            id="disabled-field"
            disabled
            defaultValue="حساب مشترک خانه"
            className="h-10"
          />
        </Field>
      </FieldGroup>

      <div className="flex flex-wrap gap-2">
        <Button type="submit">ثبت هزینه</Button>
        <Button type="button" variant="outline" disabled>
          <Spinner />
          در حال ثبت
        </Button>
      </div>
    </form>
  );
}

export function ThemePreview() {
  const [page, setPage] = useState(1);
  const [share, setShare] = useState([40]);
  const [remind, setRemind] = useState(true);
  const [alerts, setAlerts] = useState(true);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <WalletIcon className="size-4" />
            </span>
            <div className="leading-tight">
              <p className="font-heading text-base font-bold">هم‌اتاقی</p>
              <p className="text-xs text-muted-foreground">پیش‌نمایش پوسته</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button>
              <PlusIcon />
              هزینه جدید
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-8 sm:px-6">
        <div className="space-y-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#home">خانه</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#group">گروه ونک</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>پوسته</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="max-w-2xl space-y-3">
            <h1 className="text-3xl sm:text-4xl">حساب‌وکتاب، آرام و روشن</h1>
            <p className="text-base text-muted-foreground">
              متن بدنه با یکان‌بخ نوشته شده تا خواندن توضیح‌ها و فرم‌ها نرم بماند.
              عنوان‌ها، برچسب‌های مهم و رقم‌ها با پیدا آمده‌اند تا تیزتر و قابل‌تشخیص‌تر باشند.
            </p>
          </div>
        </div>

        <Section
          title="تایپوگرافی"
          description="یکان‌بخ برای بدنه و پیدا برای عنوان و عدد. هر دو از فایل‌های محلی بارگذاری می‌شوند."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>پیدا</CardTitle>
                <CardDescription>عنوان، برچسب مهم، عدد</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 font-heading">
                <p className="text-lg font-light">خانه را با هم سبک‌تر کنیم</p>
                <p className="text-lg font-medium">خانه را با هم سبک‌تر کنیم</p>
                <p className="text-lg font-semibold">خانه را با هم سبک‌تر کنیم</p>
                <p className="text-lg font-bold">خانه را با هم سبک‌تر کنیم</p>
                <p className="pt-2 text-3xl font-bold leading-none">۱۲٬۴۸۰٬۰۰۰</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>یکان‌بخ</CardTitle>
                <CardDescription>بدنه، توضیح، فیلد و رابط</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-light">
                  این ماه اجاره، خرید خانه و قبض‌ها را بین چهار نفر تقسیم کرده‌ایم.
                </p>
                <p className="font-normal">
                  این ماه اجاره، خرید خانه و قبض‌ها را بین چهار نفر تقسیم کرده‌ایم.
                </p>
                <p className="font-medium">
                  این ماه اجاره، خرید خانه و قبض‌ها را بین چهار نفر تقسیم کرده‌ایم.
                </p>
                <p className="font-bold">
                  این ماه اجاره، خرید خانه و قبض‌ها را بین چهار نفر تقسیم کرده‌ایم.
                </p>
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section
          title="خلاصه مالی"
          description="سبز برای مانده مثبت، قرمز برای بدهی، و نارنجی برای امتیاز و نوبت."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardDescription>مانده مثبت</CardDescription>
                <CardTitle className="font-heading text-3xl font-bold text-success">
                  ۱۲٬۴۸۰٬۰۰۰
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">تومان بستانکار در گروه ونک</p>
              </CardContent>
              <CardFooter className="text-sm text-success">
                <CircleCheckIcon className="size-4" />
                سه تسویه در این هفته
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>بدهی مانده</CardDescription>
                <CardTitle className="font-heading text-3xl font-bold text-destructive">
                  ۳٬۲۵۰٬۰۰۰
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">تومان که هنوز پرداخت نشده</p>
              </CardContent>
              <CardFooter className="text-sm text-destructive">
                <TriangleAlertIcon className="size-4" />
                سررسید اجاره، ۱۵ مهر
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>امتیاز و نوبت</CardDescription>
                <CardTitle className="font-heading text-3xl font-bold">۱٬۲۴۰</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-2">
                <Badge className="bg-accent text-accent-foreground">
                  <SparklesIcon />
                  نوبت خرید
                </Badge>
                <span className="text-sm text-muted-foreground">نوبت بعدی با سارا</span>
              </CardContent>
              <CardFooter className="text-sm">
                <SparklesIcon className="size-4 text-accent" />
                ۴۰ امتیاز تا پاداش ماه
              </CardFooter>
            </Card>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-success text-success-foreground">بستانکار</Badge>
            <Badge variant="destructive">بدهکار</Badge>
            <Badge className="bg-accent text-accent-foreground">پاداش</Badge>
            <Badge variant="secondary">پیش‌نویس</Badge>
            <Badge variant="outline">بایگانی</Badge>
          </div>
        </Section>

        <Section
          title="دکمه‌ها"
          description="گوشه‌ها کوتاه مانده‌اند تا دکمه‌ها نرم باشند، بدون انحنای زیاد."
        >
          <Card>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap gap-2">
                {buttonVariants.map(([variant, label]) => (
                  <Button key={variant} variant={variant}>
                    {label}
                  </Button>
                ))}
                <Button disabled>غیرفعال</Button>
              </div>
              <Separator />
              <div className="flex flex-wrap items-center gap-2">
                {buttonSizes.map(([size, label]) => (
                  <Button key={size} size={size}>
                    {label}
                  </Button>
                ))}
                <Button size="icon" aria-label="افزودن">
                  <PlusIcon />
                </Button>
              </div>
            </CardContent>
          </Card>
        </Section>

        <Section
          title="تراکنش‌ها"
          description="نمونه‌ای از جدول مالی گروه، با وضعیت تسویه، بستانکار، بدهکار و در انتظار."
        >
          <Card>
            <CardHeader>
              <CardTitle>گروه خانه ونک</CardTitle>
              <CardDescription>چهار تراکنش اخیر این ماه</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">همه</TabsTrigger>
                  <TabsTrigger value="open">باز</TabsTrigger>
                  <TabsTrigger value="settled">تسویه‌شده</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="pt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>تاریخ</TableHead>
                        <TableHead>شرح</TableHead>
                        <TableHead>طرف</TableHead>
                        <TableHead>مبلغ</TableHead>
                        <TableHead>وضعیت</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((row) => (
                        <TableRow key={row.title}>
                          <TableCell>{row.date}</TableCell>
                          <TableCell className="font-medium">{row.title}</TableCell>
                          <TableCell>{row.person}</TableCell>
                          <TableCell
                            className={
                              row.tone === "credit"
                                ? "font-heading font-semibold text-success"
                                : row.tone === "debt"
                                  ? "font-heading font-semibold text-destructive"
                                  : "font-heading font-semibold"
                            }
                          >
                            {row.signed}
                            {row.amount}
                          </TableCell>
                          <TableCell>
                            {row.tone === "credit" ? (
                              <Badge className="bg-success text-success-foreground">
                                {row.status}
                              </Badge>
                            ) : row.tone === "debt" ? (
                              <Badge variant="destructive">{row.status}</Badge>
                            ) : row.tone === "pending" ? (
                              <Badge className="bg-accent text-accent-foreground">
                                {row.status}
                              </Badge>
                            ) : (
                              <Badge variant="outline">{row.status}</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
                <TabsContent value="open" className="pt-4 text-sm text-muted-foreground">
                  دو مورد هنوز باز است: قبض برق و شام گروهی.
                </TabsContent>
                <TabsContent value="settled" className="pt-4 text-sm text-muted-foreground">
                  اجاره ۱۲ مهر تسویه شده است.
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </Section>

        <Section
          title="فرم"
          description="برچسب، ورودی، متن بلند، حالت خطا و حالت غیرفعال."
        >
          <Card>
            <CardHeader>
              <CardTitle>ثبت هزینه</CardTitle>
              <CardDescription>
                اگر مبلغ خالی بماند، خطا نشان داده می‌شود. شماره کارت نمونه‌ای از خطای ثابت است.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExpenseForm />
            </CardContent>
          </Card>
        </Section>

        <Section
          title="انتخاب‌ها"
          description="فهرست، چک‌باکس، دکمه رادیویی و کلید، با برچسب فارسی."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>دسته‌بندی</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field>
                  <FieldLabel>نوع هزینه</FieldLabel>
                  <Select defaultValue="rent">
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder="انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rent">اجاره</SelectItem>
                      <SelectItem value="food">خوراک</SelectItem>
                      <SelectItem value="bill">قبض</SelectItem>
                      <SelectItem value="transport">حمل‌ونقل</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field orientation="horizontal">
                  <Checkbox
                    id="remind"
                    checked={remind}
                    onCheckedChange={(checked) => setRemind(checked === true)}
                  />
                  <FieldLabel htmlFor="remind">یادآوری قبل از سررسید</FieldLabel>
                </Field>
                <Field orientation="horizontal" data-invalid>
                  <Checkbox id="invalid-check" aria-invalid />
                  <div>
                    <FieldLabel htmlFor="invalid-check">تأیید تقسیم</FieldLabel>
                    <FieldError>قبل از ثبت باید تأیید شود.</FieldError>
                  </div>
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>روش تسویه</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup defaultValue="card" className="gap-3">
                  {[
                    ["cash", "نقدی"],
                    ["card", "کارت"],
                    ["shared", "حساب مشترک"],
                  ].map(([value, label]) => (
                    <div key={value} className="flex items-center gap-2">
                      <RadioGroupItem value={value} id={`pay-${value}`} />
                      <Label htmlFor={`pay-${value}`}>{label}</Label>
                    </div>
                  ))}
                </RadioGroup>
                <Separator />
                <Field orientation="horizontal">
                  <Switch
                    id="alerts"
                    checked={alerts}
                    onCheckedChange={setAlerts}
                  />
                  <FieldLabel htmlFor="alerts">اعلان تراکنش‌ها</FieldLabel>
                </Field>
                <Field orientation="horizontal">
                  <Switch id="locked" disabled />
                  <FieldLabel htmlFor="locked">تسویه خودکار غیرفعال</FieldLabel>
                </Field>
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section
          title="لایه‌ها و پیام‌ها"
          description="گفتگو، هشدار، منو، راهنما و اعلان."
        >
          <div className="flex flex-wrap gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">تسویه حساب</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>تسویه با سارا</DialogTitle>
                  <DialogDescription>
                    مبلغ ۲٬۱۰۰٬۰۰۰ تومان به حساب سارا منتقل می‌شود. بعد از تأیید، وضعیت بدهی بسته می‌شود.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    onClick={() =>
                      toast.success("تسویه ثبت شد", {
                        description: "بدهی سارا بسته شد.",
                      })
                    }
                  >
                    تأیید تسویه
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">جزئیات امتیاز</Button>
              </PopoverTrigger>
              <PopoverContent align="start">
                <PopoverHeader>
                  <PopoverTitle>نوبت خرید خانه</PopoverTitle>
                  <PopoverDescription>
                    با ثبت خرید بعدی ۴۰ امتیاز می‌گیرید و نوبت به نفر بعد می‌رسد.
                  </PopoverDescription>
                </PopoverHeader>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">عملیات حساب</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>گروه ونک</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>ویرایش هزینه</DropdownMenuItem>
                <DropdownMenuItem>اشتراک تسویه</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">حذف تراکنش</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary">راهنمای مانده</Button>
              </TooltipTrigger>
              <TooltipContent>مانده مثبت یعنی دیگران به شما بدهکارند.</TooltipContent>
            </Tooltip>

            <Button
              variant="secondary"
              onClick={() =>
                toast("یادآوری اجاره", {
                  description: "سه روز تا سررسید اجاره خانه ونک مانده است.",
                })
              }
            >
              نمایش اعلان
            </Button>
          </div>

          <div className="grid gap-3">
            <Alert>
              <InfoIcon />
              <AlertTitle>تسویه این هفته کامل است</AlertTitle>
              <AlertDescription>
                سه نفر سهم خود را پرداخت کرده‌اند. فقط قبض برق مریم باز مانده است.
              </AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>بدهی سررسید گذشته</AlertTitle>
              <AlertDescription>
                ۲۱۰٬۰۰۰ تومان از قبض برق هنوز پرداخت نشده است.
              </AlertDescription>
            </Alert>
          </div>
        </Section>

        <Section
          title="وضعیت و بارگذاری"
          description="نوار پیشرفت، لغزنده سهم، اسکلت و چرخش بارگذاری."
        >
          <Card>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>سهم پرداخت‌شده اجاره</span>
                  <span className="font-heading font-semibold">۶۸٪</span>
                </div>
                <Progress value={68} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>سهم شما از شام</span>
                  <span className="font-heading font-semibold">{share[0]}٪</span>
                </div>
                <Slider
                  value={share}
                  max={100}
                  step={5}
                  onValueChange={setShare}
                />
              </div>
              <div className="flex items-center gap-3">
                <Spinner className="size-5" />
                <span className="text-sm text-muted-foreground">در حال همگام‌سازی تراکنش‌ها</span>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-2/3" />
              </div>
            </CardContent>
          </Card>
        </Section>

        <Section
          title="اعضا و صفحه‌بندی"
          description="چهره‌ها، جداکننده و حرکت بین صفحه‌های تراکنش."
        >
          <Card>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-3">
                {[
                  ["س", "سارا"],
                  ["ع", "علی"],
                  ["م", "مریم"],
                  ["ر", "رضا"],
                ].map(([initial, name]) => (
                  <div key={name} className="flex items-center gap-2">
                    <Avatar>
                      <AvatarFallback className="bg-secondary font-heading text-sm font-semibold">
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{name}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#prev"
                      text="قبلی"
                      onClick={(event) => {
                        event.preventDefault();
                        setPage((current) => Math.max(1, current - 1));
                      }}
                    />
                  </PaginationItem>
                  {[1, 2, 3].map((number) => (
                    <PaginationItem key={number}>
                      <PaginationLink
                        href={`#page-${number}`}
                        isActive={page === number}
                        onClick={(event) => {
                          event.preventDefault();
                          setPage(number);
                        }}
                      >
                        {["۱", "۲", "۳"][number - 1]}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#next"
                      text="بعدی"
                      onClick={(event) => {
                        event.preventDefault();
                        setPage((current) => Math.min(3, current + 1));
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              <p className="text-center text-sm text-muted-foreground">
                صفحه {["۱", "۲", "۳"][page - 1]} از ۳
              </p>
            </CardContent>
          </Card>
        </Section>
      </main>
    </div>
  );
}
