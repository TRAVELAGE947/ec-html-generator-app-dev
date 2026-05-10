"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  Copy,
  Download,
  Eye,
  FileText,
  Image,
  Info,
  Maximize2,
  Monitor,
  Rocket,
  Settings2,
  Smartphone,
  X,
} from "lucide-react";

type ProductForm = {
  productName: string;
  brand: string;
  colors: string;
  sizes: string;
  material: string;
  country: string;
  description: string;
  leadCopy: string;
  pointLead: string;
  point1Title: string;
  point1Text: string;
  point2Title: string;
  point2Text: string;
  point3Title: string;
  point3Text: string;
  extraDescription: string;
  colorDescription: string;
  closingCopy: string;
  notice: string;
  rakutenImageUrls: string[];
  yahooImageUrls: string[];
  rakutenLineBannerUrl: string;
  rakutenStockNoticeUrl: string;
  rakutenPolicyUrl: string;
  yahooLineBannerUrl: string;
  yahooStockNoticeUrl: string;
  yahooPolicyUrl: string;
  insertLineBanner: boolean;
  insertStockNotice: boolean;
  insertPolicyImage: boolean;
  pageBlockOrder: PageBlockKey[];
};

type GeneratedHtml = {
  rakutenMobile: string;
  rakutenPc: string;
  yahoo: string;
  yahooMobile: string;
};

type ProductTextFieldKey = keyof Omit<
  ProductForm,
  | "rakutenImageUrls"
  | "yahooImageUrls"
  | "insertLineBanner"
  | "insertStockNotice"
  | "insertPolicyImage"
  | "pageBlockOrder"
>;

type TextField = {
  key: ProductTextFieldKey;
  label: string;
  placeholder?: string;
  multiline?: boolean;
};

type HtmlOutput = {
  key: keyof GeneratedHtml;
  title: string;
  description: string;
  previewTitle: string;
  previewMaxWidth: number;
};

type BannerKey = "policyUrl" | "stockNoticeUrl" | "lineBannerUrl";
type BannerUrls = Record<BannerKey, string>;
type BannerToggleKey = "insertLineBanner" | "insertStockNotice" | "insertPolicyImage";
type PageBlockKey =
  | "mainImage"
  | "catchCopy"
  | "productDescription"
  | "point"
  | "extraDescription"
  | "color"
  | "itemDetail"
  | "notice"
  | "storeCommonImages";
type SavedDraft = {
  id: string;
  name: string;
  updatedAt: string;
  form: ProductForm;
};

const copyFieldKeys = [
  "leadCopy",
  "pointLead",
  "point1Title",
  "point1Text",
  "point2Title",
  "point2Text",
  "point3Title",
  "point3Text",
  "extraDescription",
  "colorDescription",
  "closingCopy",
] as const satisfies ReadonlyArray<keyof ProductForm>;

const defaultPageBlockOrder: PageBlockKey[] = [
  "mainImage",
  "catchCopy",
  "productDescription",
  "point",
  "extraDescription",
  "color",
  "itemDetail",
  "notice",
  "storeCommonImages",
];

const pageBlockLabels: Record<PageBlockKey, string> = {
  mainImage: "メイン画像",
  catchCopy: "キャッチコピー",
  productDescription: "商品説明",
  point: "POINT",
  extraDescription: "補足説明",
  color: "COLOR",
  itemDetail: "商品詳細",
  notice: "注意事項",
  storeCommonImages: "店舗共通画像",
};

const initialForm: ProductForm = {
  productName: "",
  brand: "",
  colors: "",
  sizes: "",
  material: "",
  country: "",
  description: "",
  leadCopy: "",
  pointLead: "",
  point1Title: "",
  point1Text: "",
  point2Title: "",
  point2Text: "",
  point3Title: "",
  point3Text: "",
  extraDescription: "",
  colorDescription: "",
  closingCopy: "",
  notice:
    "※海外製品のため、日本製品に比べて縫製の甘さ、糸の始末、多少のほつれ、タグの位置違いなどが見られる場合がございます。\n\n※生産時期により、色味・サイズ感・仕様が若干異なる場合がございます。\n\n※ご覧いただくモニター環境や撮影時の光の加減により、実際の商品と色味が異なって見える場合がございます。\n\n※サイズは平置き採寸のため、1〜3cm程度の誤差が生じる場合がございます。\n\n※ご使用前に商品タグや洗濯表示をご確認ください。",
  rakutenImageUrls: Array.from({ length: 20 }, () => ""),
  yahooImageUrls: Array.from({ length: 20 }, () => ""),
  rakutenLineBannerUrl: "",
  rakutenStockNoticeUrl: "",
  rakutenPolicyUrl: "",
  yahooLineBannerUrl: "",
  yahooStockNoticeUrl: "",
  yahooPolicyUrl: "",
  insertLineBanner: true,
  insertStockNotice: true,
  insertPolicyImage: true,
  pageBlockOrder: defaultPageBlockOrder,
};

const formStorageKey = "ec-html-generator-form-v1";
const draftStorageKey = "ec-html-generator-drafts-v1";
const maxDraftCount = 20;
const emptyGeneratedHtml: GeneratedHtml = {
  rakutenMobile: "",
  rakutenPc: "",
  yahoo: "",
  yahooMobile: "",
};

function normalizeStoredImageUrls(value: unknown): string[] {
  const source = Array.isArray(value) ? value : [];
  return Array.from({ length: 20 }, (_, index) =>
    typeof source[index] === "string" ? source[index] : "",
  );
}

function normalizePageBlockOrder(value: unknown): PageBlockKey[] {
  const allowed = new Set<PageBlockKey>(defaultPageBlockOrder);
  const source = Array.isArray(value) ? value : [];
  const storedOrder = source.filter((item): item is PageBlockKey =>
    typeof item === "string" && allowed.has(item as PageBlockKey),
  );
  const missingBlocks = defaultPageBlockOrder.filter((key) => !storedOrder.includes(key));

  return [...storedOrder, ...missingBlocks];
}

function normalizeStoredForm(value: unknown): ProductForm {
  const source = typeof value === "object" && value !== null
    ? (value as Partial<Record<keyof ProductForm, unknown>>)
    : {};

  return {
    ...initialForm,
    productName: typeof source.productName === "string" ? source.productName : initialForm.productName,
    brand: typeof source.brand === "string" ? source.brand : initialForm.brand,
    colors: typeof source.colors === "string" ? source.colors : initialForm.colors,
    sizes: typeof source.sizes === "string" ? source.sizes : initialForm.sizes,
    material: typeof source.material === "string" ? source.material : initialForm.material,
    country: typeof source.country === "string" ? source.country : initialForm.country,
    description: typeof source.description === "string" ? source.description : initialForm.description,
    leadCopy: typeof source.leadCopy === "string" ? source.leadCopy : initialForm.leadCopy,
    pointLead: typeof source.pointLead === "string" ? source.pointLead : initialForm.pointLead,
    point1Title: typeof source.point1Title === "string" ? source.point1Title : initialForm.point1Title,
    point1Text: typeof source.point1Text === "string" ? source.point1Text : initialForm.point1Text,
    point2Title: typeof source.point2Title === "string" ? source.point2Title : initialForm.point2Title,
    point2Text: typeof source.point2Text === "string" ? source.point2Text : initialForm.point2Text,
    point3Title: typeof source.point3Title === "string" ? source.point3Title : initialForm.point3Title,
    point3Text: typeof source.point3Text === "string" ? source.point3Text : initialForm.point3Text,
    extraDescription: typeof source.extraDescription === "string" ? source.extraDescription : initialForm.extraDescription,
    colorDescription: typeof source.colorDescription === "string" ? source.colorDescription : initialForm.colorDescription,
    closingCopy: typeof source.closingCopy === "string" ? source.closingCopy : initialForm.closingCopy,
    notice: typeof source.notice === "string" ? source.notice : initialForm.notice,
    rakutenImageUrls: normalizeStoredImageUrls(source.rakutenImageUrls),
    yahooImageUrls: normalizeStoredImageUrls(source.yahooImageUrls),
    rakutenLineBannerUrl: typeof source.rakutenLineBannerUrl === "string" ? source.rakutenLineBannerUrl : initialForm.rakutenLineBannerUrl,
    rakutenStockNoticeUrl: typeof source.rakutenStockNoticeUrl === "string" ? source.rakutenStockNoticeUrl : initialForm.rakutenStockNoticeUrl,
    rakutenPolicyUrl: typeof source.rakutenPolicyUrl === "string" ? source.rakutenPolicyUrl : initialForm.rakutenPolicyUrl,
    yahooLineBannerUrl: typeof source.yahooLineBannerUrl === "string" ? source.yahooLineBannerUrl : initialForm.yahooLineBannerUrl,
    yahooStockNoticeUrl: typeof source.yahooStockNoticeUrl === "string" ? source.yahooStockNoticeUrl : initialForm.yahooStockNoticeUrl,
    yahooPolicyUrl: typeof source.yahooPolicyUrl === "string" ? source.yahooPolicyUrl : initialForm.yahooPolicyUrl,
    insertLineBanner: typeof source.insertLineBanner === "boolean" ? source.insertLineBanner : initialForm.insertLineBanner,
    insertStockNotice: typeof source.insertStockNotice === "boolean" ? source.insertStockNotice : initialForm.insertStockNotice,
    insertPolicyImage: typeof source.insertPolicyImage === "boolean" ? source.insertPolicyImage : initialForm.insertPolicyImage,
    pageBlockOrder: normalizePageBlockOrder(source.pageBlockOrder),
  };
}

function formatDraftDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeSavedDrafts(value: unknown): SavedDraft[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item): SavedDraft | null => {
      if (typeof item !== "object" || item === null) {
        return null;
      }

      const source = item as Partial<Record<keyof SavedDraft, unknown>>;
      const form = normalizeStoredForm(source.form);
      const productName = form.productName.trim();

      return {
        id: typeof source.id === "string" ? source.id : `${Date.now()}-${Math.random()}`,
        name:
          typeof source.name === "string" && source.name.trim()
            ? source.name.trim()
            : productName || "無題の下書き",
        updatedAt:
          typeof source.updatedAt === "string" && source.updatedAt
            ? source.updatedAt
            : new Date().toISOString(),
        form,
      };
    })
    .filter((item): item is SavedDraft => item !== null)
    .slice(0, maxDraftCount);
}

const fields: TextField[] = [
  { key: "productName", label: "商品名", placeholder: "例：レディース トートバッグ" },
  { key: "brand", label: "ブランド", placeholder: "例：Brand Name" },
  { key: "colors", label: "カラー", placeholder: "例：ブラック / ベージュ" },
  { key: "sizes", label: "サイズ", placeholder: "例：幅30cm 高さ24cm マチ12cm" },
  { key: "material", label: "素材", placeholder: "例：合成皮革" },
  { key: "country", label: "生産国", placeholder: "例：中国" },
  { key: "description", label: "商品説明", multiline: true },
  { key: "leadCopy", label: "リードコピー", multiline: true },
  { key: "pointLead", label: "POINTサブコピー", multiline: true },
  { key: "point1Title", label: "POINT 1 タイトル", placeholder: "例：Soft Touch" },
  { key: "point1Text", label: "POINT 1 本文", multiline: true },
  { key: "point2Title", label: "POINT 2 タイトル", placeholder: "例：Daily Wear" },
  { key: "point2Text", label: "POINT 2 本文", multiline: true },
  { key: "point3Title", label: "POINT 3 タイトル", placeholder: "例：Natural Colors" },
  { key: "point3Text", label: "POINT 3 本文", multiline: true },
  { key: "extraDescription", label: "補足説明", multiline: true },
  { key: "colorDescription", label: "COLOR説明", multiline: true },
  { key: "closingCopy", label: "締めコピー", multiline: true },
  { key: "notice", label: "注意事項", multiline: true },
  { key: "rakutenLineBannerUrl", label: "楽天 LINEバナーURL", placeholder: "例：https://image.rakuten.co.jp/shop-name/cabinet/line.jpg" },
  { key: "rakutenStockNoticeUrl", label: "楽天 在庫注意画像URL", placeholder: "例：https://image.rakuten.co.jp/shop-name/cabinet/stock.jpg" },
  { key: "rakutenPolicyUrl", label: "楽天 ポリシー画像URL", placeholder: "例：https://image.rakuten.co.jp/shop-name/cabinet/policy.jpg" },
  { key: "yahooLineBannerUrl", label: "Yahoo LINEバナーURL", placeholder: "例：https://shopping.c.yimg.jp/lib/shop-name/line.jpg" },
  { key: "yahooStockNoticeUrl", label: "Yahoo 在庫注意画像URL", placeholder: "例：https://shopping.c.yimg.jp/lib/shop-name/stock.jpg" },
  { key: "yahooPolicyUrl", label: "Yahoo ポリシー画像URL", placeholder: "例：https://shopping.c.yimg.jp/lib/shop-name/policy.jpg" },
];

const outputs: HtmlOutput[] = [
  {
    key: "rakutenPc",
    title: "楽天PC用HTML",
    description: "雑誌風レイアウト、table/font/img中心",
    previewTitle: "楽天PC用プレビュー",
    previewMaxWidth: 725,
  },
  {
    key: "rakutenMobile",
    title: "楽天スマホ用HTML",
    description: "styleタグ・classなし、table/img/br/center中心",
    previewTitle: "楽天スマホ用プレビュー",
    previewMaxWidth: 375,
  },
  {
    key: "yahoo",
    title: "Yahoo PC用HTML",
    description: "既存のYahoo用シンプルHTML",
    previewTitle: "Yahoo PC用プレビュー",
    previewMaxWidth: 725,
  },
  {
    key: "yahooMobile",
    title: "Yahooスマホ用HTML",
    description: "center/font/styleなしのYahooスマホ専用HTML",
    previewTitle: "Yahooスマホ用プレビュー",
    previewMaxWidth: 375,
  },
];

const specLabels: Array<[label: string, key: keyof ProductForm]> = [
  ["商品名", "productName"],
  ["ブランド", "brand"],
  ["カラー", "colors"],
  ["サイズ", "sizes"],
  ["素材", "material"],
  ["生産国", "country"],
];

const pcSpecLabels: Array<[label: string, key: keyof ProductForm]> = [
  ["商品名", "productName"],
  ["カラー", "colors"],
  ["サイズ", "sizes"],
  ["素材", "material"],
  ["生産国", "country"],
  ["ブランド", "brand"],
];

const bannerOutputOrder: BannerKey[] = ["lineBannerUrl", "stockNoticeUrl", "policyUrl"];
const yahooImageBaseUrl = "https://shopping.c.yimg.jp/lib/";
const rakutenImageBaseUrl = "https://image.rakuten.co.jp/";

function normalizeYahooStoreId(storeId: string): string {
  return storeId === "h-garden-fuk" ? "h-garden" : storeId;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function linesToHtml(value: string): string {
  return escapeHtml(value)
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .join("<br>");
}

function filled(values: string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean);
}

function convertRakutenToYahooUrl(url: string): string {
  const trimmed = url.trim();

  if (!trimmed || !trimmed.startsWith(rakutenImageBaseUrl)) {
    return "";
  }

  const path = trimmed.slice(rakutenImageBaseUrl.length);
  const [storeId, cabinetDir, ...rest] = path.split("/");
  const filename = rest.pop()?.trim();

  return storeId && cabinetDir === "cabinet" && filename
    ? `${yahooImageBaseUrl}${normalizeYahooStoreId(storeId)}/${filename}`
    : "";
}
function convertRakutenUrlsToYahoo(urls: string[]): string[] {
  return urls.map(convertRakutenToYahooUrl);
}

function normalizeRakutenStoreId(storeId: string): string {
  return storeId === "h-garden-fuk" ? "h-garden" : storeId;
}

function convertYahooToRakutenUrl(url: string): string {
  const trimmed = url.trim();

  if (!trimmed || !trimmed.startsWith(yahooImageBaseUrl)) {
    return "";
  }

  const path = trimmed.slice(yahooImageBaseUrl.length);
  const [storeId, ...rest] = path.split("/");
  const filename = rest.pop()?.trim();

  return storeId && filename
    ? `${rakutenImageBaseUrl}${normalizeRakutenStoreId(storeId)}/cabinet/${filename}`
    : "";
}

function convertYahooUrlsToRakuten(urls: string[]): string[] {
  return urls.map(convertYahooToRakutenUrl);
}

function cannotConvertRakutenUrl(url: string): boolean {
  const trimmed = url.trim();
  return Boolean(trimmed) && !convertRakutenToYahooUrl(trimmed);
}

function hasMultipleValues(value: string): boolean {
  return /[、,／\/・\n]| \//.test(value.trim());
}

function buildAutoCopy(form: ProductForm): Pick<ProductForm, (typeof copyFieldKeys)[number]> {
  const material = form.material.toLowerCase();
  const hasCotton = /cotton|コットン/.test(material);
  const hasStretch = /span|spandex|polyurethane|ポリウレタン/.test(material);
  const hasMultipleColors = hasMultipleValues(form.colors);
  const hasMultipleSizes = hasMultipleValues(form.sizes);

  const leadCopy = hasCotton
    ? "ナチュラルな雰囲気にそっと馴染む、やわらかな風合いが魅力の一枚。"
    : "ナチュラルな雰囲気にそっと馴染む、韓国子供服らしい上品な印象の一枚。";

  const pointLead = hasMultipleColors
    ? "毎日のコーデに合わせやすい、カラー展開も楽しめるシンプルなデザイン。"
    : "毎日のコーデに合わせやすい、シンプルで使いやすいデザイン。";

  const point1Title = hasCotton ? "Soft Touch" : "Natural Mood";
  const point1Text = hasCotton ? "やわらかな風合い" : "ナチュラルに馴染む雰囲気";
  const point2Title = hasStretch ? "Easy Fit" : "Daily Wear";
  const point2Text = hasStretch ? "動きに寄り添う伸縮性" : "デイリーに使いやすい";
  const point3Title = hasMultipleColors
    ? "Natural Colors"
    : hasMultipleSizes
      ? "Selectable Size"
      : "Simple Styling";
  const point3Text = hasMultipleColors
    ? "コーデに馴染むカラー展開"
    : hasMultipleSizes
      ? "成長や体型に合わせて選びやすい"
      : "合わせるアイテムを選びにくい";

  const extraDescription = hasMultipleSizes
    ? "シンプルなトップスやワンピースとのレイヤードにも合わせやすく、成長や体型に合わせて選びやすいサイズ展開です。"
    : "シンプルなトップスやワンピースとのレイヤードにも合わせやすく、おうち時間からお出かけまで幅広く活躍します。";

  const colorDescription = hasMultipleColors
    ? "落ち着いたカラー展開で、ナチュラルなコーディネートにも合わせやすい印象です。"
    : form.colors.trim()
      ? "やさしい色味で、普段のコーディネートにも自然に馴染む印象です。"
      : "";

  const closingCopy = form.productName.trim()
    ? `${form.productName.trim()}で、毎日の装いにさりげない可愛らしさを添えて。`
    : "毎日の装いに、さりげない可愛らしさを添えてくれる一枚です。";

  return {
    leadCopy,
    pointLead,
    point1Title,
    point1Text,
    point2Title,
    point2Text,
    point3Title,
    point3Text,
    extraDescription,
    colorDescription,
    closingCopy,
  };
}

function imageHtml(url: string): string {
  return `<img src="${escapeHtml(url)}" width="100%" border="0"><br><br>`;
}

function pcImageHtml(url: string, alt?: string): string {
  const altText = alt ? ` alt="${escapeHtml(alt)}"` : "";
  return `<img src="${escapeHtml(url)}" width="100%" border="0"${altText}><br><br>`;
}

function yahooMobileImageHtml(url: string, alt: string): string {
  return `<img src="${escapeHtml(url)}" width="100%" border="0" alt="${escapeHtml(alt)}"><br><br>`;
}

function bannerGroupHtml(banners: BannerUrls, imageBuilder = imageHtml): string {
  return bannerOutputOrder
    .map((key) => banners[key].trim())
    .filter(Boolean)
    .map((url) => imageBuilder(url))
    .join("\n");
}

function orderedPageBlocks(
  blockOrder: PageBlockKey[],
  blocks: Record<PageBlockKey, string>,
): string {
  return normalizePageBlockOrder(blockOrder)
    .map((key) => blocks[key])
    .filter(Boolean)
    .join("\n");
}

function pointText(form: ProductForm): string {
  const pointRows = [
    [form.point1Title, form.point1Text],
    [form.point2Title, form.point2Text],
    [form.point3Title, form.point3Text],
  ].filter(([title, text]) => title.trim() || text.trim());

  return [
    form.pointLead.trim(),
    ...pointRows.map(([title, text], index) =>
      [
        `Point ${String(index + 1).padStart(2, "0")}`,
        title.trim(),
        text.trim(),
      ]
        .filter(Boolean)
        .join("\n"),
    ),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function simplePointBlock(form: ProductForm, width: string): string {
  return textBlock("POINT", pointText(form), width);
}

function simpleColorBlock(form: ProductForm, width: string): string {
  return textBlock(
    "COLOR",
    [form.colors.trim(), form.colorDescription.trim()].filter(Boolean).join("\n\n"),
    width,
  );
}

function specTable(form: ProductForm, width: string): string {
  const rows = specLabels
    .filter(([, key]) => String(form[key]).trim())
    .map(([label, key], index) => {
      const bg = index % 2 === 0 ? "#f7f4ef" : "#ffffff";
      return [
        `<tr bgcolor="${bg}">`,
        `<td width="35%" align="center"><b>${escapeHtml(label)}</b></td>`,
        `<td>${linesToHtml(String(form[key]).trim())}</td>`,
        "</tr>",
      ].join("\n");
    });

  if (rows.length === 0) {
    return "";
  }

  return [
    `<table width="${width}" border="0" cellspacing="1" cellpadding="8" bgcolor="#dddddd">`,
    rows.join("\n"),
    "</table>",
    "<br><br>",
  ].join("\n");
}

function textBlock(title: string, body: string, width: string): string {
  const trimmed = body.trim();

  if (!trimmed) {
    return "";
  }

  return [
    `<table width="${width}" border="0" cellspacing="1" cellpadding="8" bgcolor="#dddddd">`,
    '<tr bgcolor="#f7f4ef">',
    `<td align="center"><b>${escapeHtml(title)}</b></td>`,
    "</tr>",
    '<tr bgcolor="#ffffff">',
    `<td>${linesToHtml(trimmed)}</td>`,
    "</tr>",
    "</table>",
    "<br><br>",
  ].join("\n");
}

function yahooMobileTextBlock(title: string, body: string): string {
  const trimmed = body.trim();

  if (!trimmed) {
    return "";
  }

  return [
    '<table width="96%" border="0" cellspacing="0" cellpadding="12" bgcolor="#ffffff">',
    "<tr>",
    `<td align="center" bgcolor="#f7f4ef"><b>${escapeHtml(title)}</b></td>`,
    "</tr>",
    "<tr>",
    `<td align="left">${linesToHtml(trimmed)}</td>`,
    "</tr>",
    "</table>",
    "<br><br>",
  ].join("\n");
}

function pcSectionHeading(title: string, subTitle?: string): string {
  return [
    '<table width="96%" border="0" cellspacing="0" cellpadding="12" bgcolor="#ffffff">',
    "<tr>",
    '<td align="center">',
    `<font size="5" color="#333333" face="Times New Roman, serif"><b>${escapeHtml(title)}</b></font>`,
    subTitle?.trim()
      ? `<br><font size="2" color="#777777">${linesToHtml(subTitle.trim())}</font>`
      : "",
    "</td>",
    "</tr>",
    "</table>",
    "<br>",
  ]
    .filter(Boolean)
    .join("\n");
}

function pcTextBlock(body: string, bgcolor = "#ffffff", align: "left" | "center" = "left"): string {
  const trimmed = body.trim();

  if (!trimmed) {
    return "";
  }

  return [
    `<table width="96%" border="0" cellspacing="0" cellpadding="16" bgcolor="${bgcolor}">`,
    "<tr>",
    `<td align="${align}">`,
    `<font size="3" color="#555555">${linesToHtml(trimmed)}</font>`,
    "</td>",
    "</tr>",
    "</table>",
    "<br><br>",
  ].join("\n");
}

function pcPointTable(form: ProductForm): string {
  const points = [
    [form.point1Title, form.point1Text],
    [form.point2Title, form.point2Text],
    [form.point3Title, form.point3Text],
  ].filter(([title, text]) => title.trim() || text.trim());

  if (points.length === 0) {
    return "";
  }

  const cells = points
    .map(([title, text]) => [
      '<td width="33%" valign="top" align="center" bgcolor="#ffffff">',
      title.trim()
        ? `<font size="3" color="#333333" face="Times New Roman, serif"><b>${linesToHtml(title.trim())}</b></font><br><br>`
        : "",
      text.trim() ? `<font size="2" color="#555555">${linesToHtml(text.trim())}</font>` : "",
      "</td>",
    ].join("\n"))
    .join("\n");

  return [
    '<table width="96%" border="0" cellspacing="1" cellpadding="14" bgcolor="#e8e1d8">',
    "<tr>",
    cells,
    "</tr>",
    "</table>",
    "<br><br>",
  ].join("\n");
}

function pcSpecTable(form: ProductForm): string {
  const rows = pcSpecLabels
    .filter(([, key]) => String(form[key]).trim())
    .map(([label, key]) => [
      '<tr bgcolor="#f7f4ef">',
      `<td width="30%" align="center"><font size="3" color="#555555"><b>${escapeHtml(label)}</b></font></td>`,
      `<td width="70%"><font size="3" color="#555555">${linesToHtml(String(form[key]).trim())}</font></td>`,
      "</tr>",
    ].join("\n"));

  if (rows.length === 0) {
    return "";
  }

  return [
    '<table width="96%" border="0" cellspacing="1" cellpadding="12" bgcolor="#dddddd">',
    rows.join("\n"),
    "</table>",
    "<br><br>",
  ].join("\n");
}

function yahooMobilePointTable(form: ProductForm): string {
  const points = [
    [form.point1Title, form.point1Text],
    [form.point2Title, form.point2Text],
    [form.point3Title, form.point3Text],
  ].filter(([title, text]) => title.trim() || text.trim());

  if (points.length === 0 && !form.pointLead.trim()) {
    return "";
  }

  const rows = points
    .map(([title, text], index) => [
      '<tr bgcolor="#ffffff">',
      '<td align="center">',
      `<b>Point ${String(index + 1).padStart(2, "0")}</b>`,
      title.trim() ? `<br><b>${linesToHtml(title.trim())}</b>` : "",
      text.trim() ? `<br>${linesToHtml(text.trim())}` : "",
      "</td>",
      "</tr>",
    ].join("\n"));

  return [
    '<table width="96%" border="0" cellspacing="1" cellpadding="14" bgcolor="#e8e1d8">',
    form.pointLead.trim()
      ? [
          '<tr bgcolor="#f7f4ef">',
          `<td align="center"><b>POINT</b><br>${linesToHtml(form.pointLead.trim())}</td>`,
          "</tr>",
        ].join("\n")
      : "",
    rows.join("\n"),
    "</table>",
    "<br><br>",
  ]
    .filter(Boolean)
    .join("\n");
}

function yahooMobileColorBlock(form: ProductForm): string {
  const colorText = form.colors.trim();
  const colorDescription = form.colorDescription.trim();

  if (!colorText && !colorDescription) {
    return "";
  }

  return [
    '<table width="96%" border="0" cellspacing="0" cellpadding="12" bgcolor="#ffffff">',
    "<tr>",
    '<td align="center" bgcolor="#f7f4ef"><b>COLOR</b></td>',
    "</tr>",
    colorText
      ? [
          "<tr>",
          `<td align="center"><b>${linesToHtml(colorText)}</b></td>`,
          "</tr>",
        ].join("\n")
      : "",
    colorDescription
      ? [
          "<tr>",
          `<td align="left">${linesToHtml(colorDescription)}</td>`,
          "</tr>",
        ].join("\n")
      : "",
    "</table>",
    "<br><br>",
  ]
    .filter(Boolean)
    .join("\n");
}

function yahooMobileSpecTable(form: ProductForm): string {
  const rows = specLabels
    .filter(([, key]) => String(form[key]).trim())
    .map(([label, key], index) => [
      "<tr>",
      `<td${index === 0 ? ' width="35%"' : ""} align="center"><b>${escapeHtml(label)}</b></td>`,
      `<td${index === 0 ? ' width="65%"' : ""}>${linesToHtml(String(form[key]).trim())}</td>`,
      "</tr>",
    ].join("\n"));

  if (rows.length === 0) {
    return "";
  }

  return [
    '<table width="96%" border="0" cellspacing="0" cellpadding="8" bgcolor="#f7f4ef">',
    rows.join("\n"),
    "</table>",
    "<br><br>",
  ].join("\n");
}

function yahooMobileBannerHtml(banners: BannerUrls): string {
  return bannerOutputOrder
    .map((key) => banners[key].trim())
    .filter(Boolean)
    .map((url, index) => yahooMobileImageHtml(url, `案内画像 ${index + 1}`))
    .join("\n");
}

function generateSimpleHtml(form: ProductForm, imageUrls: string[], banners: BannerUrls): string {
  const filledImageUrls = filled(imageUrls);
  const blocks: Record<PageBlockKey, string> = {
    mainImage: filledImageUrls.map((url) => imageHtml(url)).join("\n"),
    catchCopy: textBlock("キャッチコピー", form.leadCopy, "96%"),
    productDescription: textBlock("商品説明", form.description, "96%"),
    point: simplePointBlock(form, "96%"),
    extraDescription: textBlock("補足説明", form.extraDescription, "96%"),
    color: simpleColorBlock(form, "96%"),
    itemDetail: specTable(form, "96%"),
    notice: textBlock("注意事項", form.notice, "96%"),
    storeCommonImages: bannerGroupHtml(banners),
  };

  return [
    "<center>",
    orderedPageBlocks(form.pageBlockOrder, blocks),
    "</center>",
  ]
    .filter(Boolean)
    .join("\n");
}

function imageAt(imageUrls: string[], index: number, alt?: string): string {
  const url = imageUrls[index]?.trim();
  return url ? pcImageHtml(url, alt) : "";
}

function imagesFrom(imageUrls: string[], startIndex: number, endIndex: number): string {
  return imageUrls
    .slice(startIndex, endIndex + 1)
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url) => pcImageHtml(url))
    .join("\n");
}

function generateRakutenPcHtml(form: ProductForm, banners: BannerUrls): string {
  const imageUrls = form.rakutenImageUrls;
  const titleMeta = [form.brand.trim(), form.country.trim()].filter(Boolean).join(" / ");
  const colorText = form.colors.trim();
  const titleBlock = form.productName.trim() || titleMeta
    ? [
        '<table width="96%" border="0" cellspacing="0" cellpadding="18" bgcolor="#ffffff">',
        "<tr>",
        '<td align="center">',
        form.productName.trim()
          ? `<font size="5" color="#333333" face="Times New Roman, serif"><b>${escapeHtml(form.productName.trim())}</b></font><br>`
          : "",
        titleMeta ? `<font size="3" color="#777777">${escapeHtml(titleMeta)}</font>` : "",
        "</td>",
        "</tr>",
        "</table>",
        "<br>",
      ].join("\n")
    : "";
  const noticeBlock = form.notice.trim()
    ? [
        '<table width="96%" border="0" cellspacing="0" cellpadding="14" bgcolor="#fafafa">',
        "<tr>",
        '<td align="left">',
        `<font size="2" color="#777777">${linesToHtml(form.notice.trim())}</font>`,
        "</td>",
        "</tr>",
        "</table>",
        "<br><br>",
      ].join("\n")
    : "";
  const blocks: Record<PageBlockKey, string> = {
    mainImage: [
      imageAt(
        imageUrls,
        0,
        form.productName.trim() ? `${form.productName.trim()} メイン画像` : "メイン画像",
      ),
      titleBlock,
    ].filter(Boolean).join("\n"),
    catchCopy: [pcTextBlock(form.leadCopy, "#f7f4ef", "center"), imageAt(imageUrls, 1)]
      .filter(Boolean)
      .join("\n"),
    productDescription: [pcTextBlock(form.description, "#ffffff", "left"), imagesFrom(imageUrls, 2, 3)]
      .filter(Boolean)
      .join("\n"),
    point: [
      pcSectionHeading("POINT", form.pointLead),
      pcPointTable(form),
      imagesFrom(imageUrls, 4, 5),
    ].filter(Boolean).join("\n"),
    extraDescription: [pcTextBlock(form.extraDescription, "#fafafa", "left"), imageAt(imageUrls, 6)]
      .filter(Boolean)
      .join("\n"),
    color: [
      colorText ? pcSectionHeading("COLOR", colorText) : "",
      pcTextBlock(form.colorDescription, "#ffffff", "left"),
      imagesFrom(imageUrls, 7, 19),
    ].filter(Boolean).join("\n"),
    itemDetail: [pcSectionHeading("ITEM DETAIL"), pcSpecTable(form), pcTextBlock(form.closingCopy, "#f7f4ef", "center")]
      .filter(Boolean)
      .join("\n"),
    notice: noticeBlock,
    storeCommonImages: bannerGroupHtml(banners, pcImageHtml),
  };

  return [
    "<center>",
    '<table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff">',
    "<tr>",
    "<td align=\"center\">",
    orderedPageBlocks(form.pageBlockOrder, blocks),
    "</td>",
    "</tr>",
    "</table>",
    "</center>",
  ]
    .filter(Boolean)
    .join("\n");
}

function generateYahooMobileHtml(form: ProductForm, banners: BannerUrls): string {
  const productName = form.productName.trim();
  const imageHtml = filled(form.yahooImageUrls)
    .map((url, index) => {
      const alt = productName
        ? `${productName} 画像${index + 1}`
        : `商品画像${index + 1}`;
      return yahooMobileImageHtml(url, alt);
    })
    .join("\n");
  const specHtml = yahooMobileSpecTable(form);
  const itemDetailBlock = specHtml
    ? [
        '<table width="96%" border="0" cellspacing="0" cellpadding="12" bgcolor="#ffffff">',
        "<tr>",
        '<td align="center" bgcolor="#f7f4ef"><b>ITEM DETAIL</b></td>',
        "</tr>",
        "</table>",
        "<br>",
        specHtml,
      ].join("\n")
    : "";
  const blocks: Record<PageBlockKey, string> = {
    mainImage: imageHtml,
    catchCopy: yahooMobileTextBlock("キャッチコピー", form.leadCopy),
    productDescription: yahooMobileTextBlock("商品説明", form.description),
    point: yahooMobilePointTable(form),
    extraDescription: yahooMobileTextBlock("補足説明", form.extraDescription),
    color: yahooMobileColorBlock(form),
    itemDetail: itemDetailBlock,
    notice: yahooMobileTextBlock("注意事項", form.notice),
    storeCommonImages: yahooMobileBannerHtml(banners),
  };

  return [
    '<table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff">',
    "<tr>",
    '<td align="center">',
    orderedPageBlocks(form.pageBlockOrder, blocks),
    "</td>",
    "</tr>",
    "</table>",
  ]
    .filter(Boolean)
    .join("\n");
}

function enabledBannerUrls(form: ProductForm, mall: "rakuten" | "yahoo"): BannerUrls {
  return {
    lineBannerUrl: form.insertLineBanner
      ? mall === "rakuten"
        ? form.rakutenLineBannerUrl
        : form.yahooLineBannerUrl
      : "",
    stockNoticeUrl: form.insertStockNotice
      ? mall === "rakuten"
        ? form.rakutenStockNoticeUrl
        : form.yahooStockNoticeUrl
      : "",
    policyUrl: form.insertPolicyImage
      ? mall === "rakuten"
        ? form.rakutenPolicyUrl
        : form.yahooPolicyUrl
      : "",
  };
}

function generateHtml(form: ProductForm): GeneratedHtml {
  const rakutenBanners = enabledBannerUrls(form, "rakuten");
  const yahooBanners = enabledBannerUrls(form, "yahoo");

  return {
    rakutenMobile: generateSimpleHtml(form, form.rakutenImageUrls, rakutenBanners),
    rakutenPc: generateRakutenPcHtml(form, rakutenBanners),
    yahoo: generateSimpleHtml(form, form.yahooImageUrls, yahooBanners),
    yahooMobile: generateYahooMobileHtml(form, yahooBanners),
  };
}

function EcHtmlGeneratorLegacy() {
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [generated, setGenerated] = useState<GeneratedHtml>(emptyGeneratedHtml);
  const [hasGeneratedHtml, setHasGeneratedHtml] = useState(false);
  const [copiedKey, setCopiedKey] = useState<keyof GeneratedHtml | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [hasRestoredForm, setHasRestoredForm] = useState(false);

  const filledRakutenImageCount = useMemo(
    () => filled(form.rakutenImageUrls).length,
    [form.rakutenImageUrls],
  );
  const filledYahooImageCount = useMemo(
    () => filled(form.yahooImageUrls).length,
    [form.yahooImageUrls],
  );

  useEffect(() => {
    try {
      const storedForm = window.localStorage.getItem(formStorageKey);
      if (storedForm) {
        setForm(normalizeStoredForm(JSON.parse(storedForm)));
      }
    } catch (error) {
      console.warn("Failed to restore EC HTML generator form:", error);
    } finally {
      setHasRestoredForm(true);
    }
  }, []);

  useEffect(() => {
    if (!hasRestoredForm) {
      return;
    }

    try {
      window.localStorage.setItem(formStorageKey, JSON.stringify(form));
    } catch (error) {
      console.warn("Failed to save EC HTML generator form:", error);
    }
  }, [form, hasRestoredForm]);

  const updateField = (
    key: ProductTextFieldKey,
    value: string,
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateRakutenImageUrl = (index: number, value: string) => {
    setForm((current) => {
      const nextImageUrls = [...current.rakutenImageUrls];
      nextImageUrls[index] = value;
      return { ...current, rakutenImageUrls: nextImageUrls };
    });
  };

  const updateYahooImageUrl = (index: number, value: string) => {
    setForm((current) => {
      const nextImageUrls = [...current.yahooImageUrls];
      nextImageUrls[index] = value;
      return { ...current, yahooImageUrls: nextImageUrls };
    });
  };

  const handleGenerate = () => {
    setGenerated(generateHtml(form));
    setHasGeneratedHtml(true);
    setCopiedKey(null);
  };

  const handleClearForm = () => {
    if (!window.confirm("入力内容をクリアしますか？")) {
      return;
    }

    window.localStorage.removeItem(formStorageKey);
    setForm(initialForm);
    setGenerated(emptyGeneratedHtml);
    setHasGeneratedHtml(false);
    setCopiedKey(null);
    setAiError("");
  };

  const handleAutoCopy = () => {
    const hasExistingCopy = copyFieldKeys.some((key) => form[key].trim());

    if (
      hasExistingCopy &&
      !window.confirm("入力済みの雑誌風コピー欄があります。上書きしてもよろしいですか？")
    ) {
      return;
    }

    setForm((current) => ({ ...current, ...buildAutoCopy(current) }));
    setAiError("");
  };

  const handleAiCopy = async () => {
    const hasExistingCopy = copyFieldKeys.some((key) => form[key].trim());

    if (
      hasExistingCopy &&
      !window.confirm("入力済みの雑誌風コピー欄があります。AI生成結果で上書きしてもよろしいですか？")
    ) {
      return;
    }

    setIsAiGenerating(true);
    setAiError("");

    try {
      const response = await fetch("/api/generate-copy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productName: form.productName,
          brand: form.brand,
          colors: form.colors,
          sizes: form.sizes,
          material: form.material,
          country: form.country,
          description: form.description,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as Partial<
        Pick<ProductForm, (typeof copyFieldKeys)[number]>
      > & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "AIコピー生成に失敗しました。");
      }

      setForm((current) => {
        const nextCopy = copyFieldKeys.reduce((acc, key) => {
          acc[key] = typeof data[key] === "string" ? data[key] : "";
          return acc;
        }, {} as Pick<ProductForm, (typeof copyFieldKeys)[number]>);

        return { ...current, ...nextCopy };
      });
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "AIコピー生成に失敗しました。");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleGenerateYahooUrls = () => {
    const hasExistingYahooUrls =
      form.yahooImageUrls.some((url) => url.trim()) ||
      form.yahooLineBannerUrl.trim() ||
      form.yahooStockNoticeUrl.trim() ||
      form.yahooPolicyUrl.trim();

    if (
      hasExistingYahooUrls &&
      !window.confirm("入力済みのYahoo画像URLがあります。楽天URLから生成したURLで上書きしてもよろしいですか？")
    ) {
      return;
    }

    setForm((current) => ({
      ...current,
      yahooImageUrls: convertRakutenUrlsToYahoo(current.rakutenImageUrls),
      yahooLineBannerUrl: convertRakutenToYahooUrl(current.rakutenLineBannerUrl),
      yahooStockNoticeUrl: convertRakutenToYahooUrl(current.rakutenStockNoticeUrl),
      yahooPolicyUrl: convertRakutenToYahooUrl(current.rakutenPolicyUrl),
    }));
  };

  const handleCopy = async (key: keyof GeneratedHtml) => {
    const text = generated[key];

    if (!text) {
      return;
    }

    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((current) => (current === key ? null : current));
    }, 1800);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-blue-700">EC HTML Generator</p>
          <h1 className="text-2xl font-bold tracking-normal sm:text-3xl">
            楽天市場・Yahooショッピング用 商品ページHTML自動生成
          </h1>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(360px,480px)_1fr]">
          <form
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            onSubmit={(event) => {
              event.preventDefault();
              handleGenerate();
            }}
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">商品情報入力</h2>
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={handleAutoCopy}
                  className="rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-800 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  コピー自動生成
                </button>
                <button
                  type="button"
                  onClick={() => void handleAiCopy()}
                  disabled={isAiGenerating}
                  className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAiGenerating ? "生成中..." : "AIコピー生成"}
                </button>
                <button
                  type="button"
                  onClick={handleClearForm}
                  className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  入力内容をクリア
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  HTML生成
                </button>
              </div>
            </div>

            {aiError ? (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {aiError}
              </div>
            ) : null}

            <div className="grid gap-4">
              {fields.map((field) => (
                <label key={field.key} className="grid gap-1.5">
                  <span className="text-sm font-semibold text-slate-700">{field.label}</span>
                  {field.multiline ? (
                    <textarea
                      value={form[field.key]}
                      onChange={(event) => updateField(field.key, event.target.value)}
                      className="min-h-28 resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  ) : (
                    <input
                      value={form[field.key]}
                      onChange={(event) => updateField(field.key, event.target.value)}
                      placeholder={field.placeholder}
                      className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  )}
                  {[
                    "rakutenLineBannerUrl",
                    "rakutenStockNoticeUrl",
                    "rakutenPolicyUrl",
                  ].includes(field.key) && cannotConvertRakutenUrl(form[field.key]) ? (
                    <span className="text-xs font-semibold text-red-600">
                      変換できないURLです
                    </span>
                  ) : null}
                </label>
              ))}

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-700">画像URL</h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Yahoo画像URL・共通バナーURLは、楽天URLから自動生成できます。
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateYahooUrls}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Yahoo用URLを自動生成
                  </button>
                </div>

                <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-bold text-slate-700">楽天画像URL</h4>
                    <span className="text-xs font-semibold text-slate-500">
                      {filledRakutenImageCount}/20
                    </span>
                  </div>
                  {form.rakutenImageUrls.map((url, index) => (
                    <label key={index} className="grid gap-1">
                      <span className="text-xs font-semibold text-slate-500">
                        楽天画像URL {index + 1}
                      </span>
                      <input
                        value={url}
                        onChange={(event) => updateRakutenImageUrl(index, event.target.value)}
                        placeholder="https://image.rakuten.co.jp/shop-name/cabinet/item/item-1.jpg"
                        className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                      {cannotConvertRakutenUrl(url) ? (
                        <span className="text-xs font-semibold text-red-600">
                          変換できないURLです
                        </span>
                      ) : null}
                    </label>
                  ))}
                </div>

                <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-bold text-slate-700">Yahoo画像URL</h4>
                    <span className="text-xs font-semibold text-slate-500">
                      {filledYahooImageCount}/20
                    </span>
                  </div>
                  {form.yahooImageUrls.map((url, index) => (
                    <label key={index} className="grid gap-1">
                      <span className="text-xs font-semibold text-slate-500">
                        Yahoo画像URL {index + 1}
                      </span>
                      <input
                        value={url}
                        onChange={(event) => updateYahooImageUrl(index, event.target.value)}
                        placeholder="https://shopping.c.yimg.jp/lib/shop-name/item-1.jpg"
                        className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </form>

          <section className="grid gap-4">
            {outputs.map((output) => (
              <article
                key={output.key}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold">{output.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">{output.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {copiedKey === output.key ? (
                      <span className="text-sm font-bold text-emerald-700">
                        コピーしました
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void handleCopy(output.key)}
                      className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      コピー
                    </button>
                  </div>
                </div>
                <textarea
                  readOnly
                  value={generated[output.key]}
                  className="h-72 w-full resize-y rounded-md border border-slate-300 bg-slate-950 px-3 py-3 font-mono text-xs leading-relaxed text-slate-50 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <div className="mt-5">
                  <h3 className="text-base font-bold text-slate-800">
                    {output.previewTitle}
                  </h3>
                  <div
                    className="mt-3 overflow-x-auto rounded-md border border-slate-300 bg-white p-3"
                    style={{ maxWidth: output.previewMaxWidth }}
                  >
                    {hasGeneratedHtml && generated[output.key] ? (
                      <div
                        className="mx-auto w-full bg-white"
                        dangerouslySetInnerHTML={{ __html: generated[output.key] }}
                      />
                    ) : (
                      <p className="py-8 text-center text-sm font-semibold text-slate-500">
                        HTMLを生成するとプレビューが表示されます
                      </p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </section>
        </section>
      </div>
    </main>
  );
}

export function EcHtmlGenerator() {
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [generated, setGenerated] = useState<GeneratedHtml>(emptyGeneratedHtml);
  const [hasGeneratedHtml, setHasGeneratedHtml] = useState(false);
  const [copiedKey, setCopiedKey] = useState<keyof GeneratedHtml | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [hasRestoredForm, setHasRestoredForm] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>([]);
  const [draftMessage, setDraftMessage] = useState("");
  const [isDraftListOpen, setIsDraftListOpen] = useState(false);
  const [activeMall, setActiveMall] = useState<"rakuten" | "yahoo">("rakuten");
  const [activePreview, setActivePreview] = useState<keyof GeneratedHtml>("rakutenPc");
  const [isHtmlOpen, setIsHtmlOpen] = useState(false);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const filledRakutenImageCount = useMemo(
    () => filled(form.rakutenImageUrls).length,
    [form.rakutenImageUrls],
  );
  const filledYahooImageCount = useMemo(
    () => filled(form.yahooImageUrls).length,
    [form.yahooImageUrls],
  );
  const currentPreviewOutput = outputs.find((output) => output.key === activePreview) ?? outputs[0];
  const outputWarnings = useMemo<Record<keyof GeneratedHtml, string>>(
    () => ({
      rakutenPc: filledRakutenImageCount ? "" : "楽天用画像URLが未入力です",
      rakutenMobile: filledRakutenImageCount ? "" : "楽天用画像URLが未入力です",
      yahoo: filledYahooImageCount ? "" : "Yahoo用画像URLが未入力です",
      yahooMobile: filledYahooImageCount ? "" : "Yahoo用画像URLが未入力です",
    }),
    [filledRakutenImageCount, filledYahooImageCount],
  );

  useEffect(() => {
    try {
      const storedForm = window.localStorage.getItem(formStorageKey);
      if (storedForm) {
        setForm(normalizeStoredForm(JSON.parse(storedForm)));
      }

      const storedDrafts = window.localStorage.getItem(draftStorageKey);
      if (storedDrafts) {
        setSavedDrafts(normalizeSavedDrafts(JSON.parse(storedDrafts)));
      }
    } catch (error) {
      console.warn("Failed to restore EC HTML generator form:", error);
    } finally {
      setHasRestoredForm(true);
    }
  }, []);

  useEffect(() => {
    if (!hasRestoredForm) {
      return;
    }

    try {
      window.localStorage.setItem(formStorageKey, JSON.stringify(form));
      setLastSavedAt(new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }));
    } catch (error) {
      console.warn("Failed to save EC HTML generator form:", error);
    }
  }, [form, hasRestoredForm]);

  useEffect(() => {
    if (!hasRestoredForm) {
      return;
    }

    try {
      window.localStorage.setItem(draftStorageKey, JSON.stringify(savedDrafts));
    } catch (error) {
      console.warn("Failed to save EC HTML generator drafts:", error);
    }
  }, [savedDrafts, hasRestoredForm]);

  const updateField = (
    key: ProductTextFieldKey,
    value: string,
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateToggle = (key: BannerToggleKey, value: boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateRakutenImageUrl = (index: number, value: string) => {
    setForm((current) => {
      const nextImageUrls = [...current.rakutenImageUrls];
      nextImageUrls[index] = value;
      return { ...current, rakutenImageUrls: nextImageUrls };
    });
  };

  const updateYahooImageUrl = (index: number, value: string) => {
    setForm((current) => {
      const nextImageUrls = [...current.yahooImageUrls];
      nextImageUrls[index] = value;
      return { ...current, yahooImageUrls: nextImageUrls };
    });
  };
  const moveImageUrl = (
    key: "rakutenImageUrls" | "yahooImageUrls",
    index: number,
    direction: "up" | "down",
  ) => {
    setForm((current) => {
      const nextImageUrls = [...current[key]];
      const targetIndex = direction === "up" ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= nextImageUrls.length) {
        return current;
      }

      [nextImageUrls[index], nextImageUrls[targetIndex]] = [
        nextImageUrls[targetIndex],
        nextImageUrls[index],
      ];

      return { ...current, [key]: nextImageUrls };
    });
  };

  const clearImageUrl = (
    key: "rakutenImageUrls" | "yahooImageUrls",
    index: number,
  ) => {
    setForm((current) => {
      const nextImageUrls = [...current[key]];
      nextImageUrls[index] = "";
      return { ...current, [key]: nextImageUrls };
    });
  };
  const movePageBlock = (index: number, direction: "up" | "down") => {
    setForm((current) => {
      const nextBlockOrder = normalizePageBlockOrder(current.pageBlockOrder);
      const targetIndex = direction === "up" ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= nextBlockOrder.length) {
        return current;
      }

      [nextBlockOrder[index], nextBlockOrder[targetIndex]] = [
        nextBlockOrder[targetIndex],
        nextBlockOrder[index],
      ];

      return { ...current, pageBlockOrder: nextBlockOrder };
    });
  };
  const selectMall = (mall: "rakuten" | "yahoo") => {
    setActiveMall(mall);
    setActivePreview(mall === "rakuten" ? "rakutenPc" : "yahoo");
  };

  const handleGenerate = () => {
    setGenerated(generateHtml(form));
    setHasGeneratedHtml(true);
    setCopiedKey(null);
    setCopiedAll(false);
  };

  const handleClearForm = () => {
    if (!window.confirm("入力内容をクリアしますか？")) {
      return;
    }

    window.localStorage.removeItem(formStorageKey);
    setForm(initialForm);
    setGenerated(emptyGeneratedHtml);
    setHasGeneratedHtml(false);
    setCopiedKey(null);
    setCopiedAll(false);
  };

  const resetGeneratedState = () => {
    setGenerated(emptyGeneratedHtml);
    setHasGeneratedHtml(false);
    setCopiedKey(null);
    setCopiedAll(false);
  };

  const handleSaveDraft = () => {
    const name = form.productName.trim() || "無題の下書き";
    const nextDraft: SavedDraft = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      updatedAt: new Date().toISOString(),
      form,
    };

    setSavedDrafts((current) => [nextDraft, ...current].slice(0, maxDraftCount));
    setDraftMessage(`「${name}」を下書き保存しました。`);
  };

  const handleLoadDraft = (draft: SavedDraft) => {
    setForm(normalizeStoredForm(draft.form));
    resetGeneratedState();
    setDraftMessage(`「${draft.name}」を呼び出しました。`);
  };

  const handleDeleteDraft = (id: string) => {
    setSavedDrafts((current) => current.filter((draft) => draft.id !== id));
    setDraftMessage("下書きを削除しました。");
  };

  const handleClearImageSettings = () => {
    if (!window.confirm("画像設定をクリアしますか？")) {
      return;
    }

    setForm((current) => ({
      ...current,
      rakutenImageUrls: Array.from({ length: 20 }, () => ""),
      yahooImageUrls: Array.from({ length: 20 }, () => ""),
      rakutenLineBannerUrl: "",
      rakutenStockNoticeUrl: "",
      rakutenPolicyUrl: "",
      yahooLineBannerUrl: "",
      yahooStockNoticeUrl: "",
      yahooPolicyUrl: "",
    }));
    resetGeneratedState();
    setDraftMessage("画像設定をクリアしました。");
  };

  const handleClearDetailCopySettings = () => {
    if (!window.confirm("詳細コピー設定をクリアしますか？")) {
      return;
    }

    setForm((current) => ({
      ...current,
      leadCopy: "",
      pointLead: "",
      point1Title: "",
      point1Text: "",
      point2Title: "",
      point2Text: "",
      point3Title: "",
      point3Text: "",
      extraDescription: "",
      colorDescription: "",
      closingCopy: "",
      notice: "",
    }));
    resetGeneratedState();
    setDraftMessage("詳細コピー設定をクリアしました。");
  };

  const handleAutoCopy = () => {
    const hasExistingCopy = copyFieldKeys.some((key) => form[key].trim());

    if (
      hasExistingCopy &&
      !window.confirm("入力済みの雑誌風コピー欄があります。上書きしてもよろしいですか？")
    ) {
      return;
    }

    setForm((current) => ({ ...current, ...buildAutoCopy(current) }));
  };

  const handleGenerateYahooUrls = () => {
    const hasExistingYahooUrls =
      form.yahooImageUrls.some((url) => url.trim()) ||
      form.yahooLineBannerUrl.trim() ||
      form.yahooStockNoticeUrl.trim() ||
      form.yahooPolicyUrl.trim();

    if (
      hasExistingYahooUrls &&
      !window.confirm("入力済みのYahoo画像URLがあります。楽天URLから生成したURLで上書きしてもよろしいですか？")
    ) {
      return;
    }

    setForm((current) => ({
      ...current,
      yahooImageUrls: convertRakutenUrlsToYahoo(current.rakutenImageUrls),
      yahooLineBannerUrl: convertRakutenToYahooUrl(current.rakutenLineBannerUrl),
      yahooStockNoticeUrl: convertRakutenToYahooUrl(current.rakutenStockNoticeUrl),
      yahooPolicyUrl: convertRakutenToYahooUrl(current.rakutenPolicyUrl),
    }));
  };


  const handleGenerateRakutenUrls = () => {
    const hasExistingRakutenUrls =
      form.rakutenImageUrls.some((url) => url.trim()) ||
      form.rakutenLineBannerUrl.trim() ||
      form.rakutenStockNoticeUrl.trim() ||
      form.rakutenPolicyUrl.trim();

    if (
      hasExistingRakutenUrls &&
      !window.confirm("入力済みの楽天画像URLがあります。Yahoo URLから生成したURLで上書きしてもよろしいですか？")
    ) {
      return;
    }

    setForm((current) => ({
      ...current,
      rakutenImageUrls: convertYahooUrlsToRakuten(current.yahooImageUrls),
      rakutenLineBannerUrl: convertYahooToRakutenUrl(current.yahooLineBannerUrl),
      rakutenStockNoticeUrl: convertYahooToRakutenUrl(current.yahooStockNoticeUrl),
      rakutenPolicyUrl: convertYahooToRakutenUrl(current.yahooPolicyUrl),
    }));
  };
  const handleCopy = async (key: keyof GeneratedHtml) => {
    const text = generated[key];

    if (!text) {
      return;
    }

    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((current) => (current === key ? null : current));
    }, 1800);
  };

  const downloadText = (title: string, text: string) => {
    if (!text) {
      return;
    }

    const blob = new Blob([text], { type: "text/html;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = title;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleDownload = (key: keyof GeneratedHtml) => {
    const filenames: Record<keyof GeneratedHtml, string> = {
      rakutenPc: "rakuten-pc.html",
      rakutenMobile: "rakuten-smartphone.html",
      yahoo: "yahoo-pc.html",
      yahooMobile: "yahoo-smartphone.html",
    };

    downloadText(filenames[key], generated[key]);
  };

  const handleCopyAll = async () => {
    if (!hasGeneratedHtml) {
      return;
    }

    const text = outputs
      .map((output) => [`【${output.title}】`, generated[output.key]].join("\n"))
      .join("\n\n");

    await navigator.clipboard.writeText(text);
    setCopiedAll(true);
    window.setTimeout(() => setCopiedAll(false), 1800);
  };

  const handleDownloadAll = () => {
    outputs.forEach((output) => handleDownload(output.key));
  };

  const productFields: Array<[ProductTextFieldKey, string, string]> = [
    ["productName", "商品名", "例）Velu Cotton Beret"],
    ["brand", "ブランド", "例）mini market"],
    ["colors", "カラー", "例）Light Beige / Charcoal"],
    ["sizes", "サイズ", "例）free"],
    ["material", "素材", "例）Cotton 100%"],
    ["country", "生産国", "例）Made in Korea"],
  ];
  const advancedCopyFields = fields.filter((field) =>
    [
      "leadCopy",
      "pointLead",
      "point1Title",
      "point1Text",
      "point2Title",
      "point2Text",
      "point3Title",
      "point3Text",
      "extraDescription",
      "colorDescription",
      "closingCopy",
      "notice",
    ].includes(field.key),
  );
  const bannerFields = fields.filter((field) =>
    [
      "rakutenLineBannerUrl",
      "rakutenStockNoticeUrl",
      "rakutenPolicyUrl",
      "yahooLineBannerUrl",
      "yahooStockNoticeUrl",
      "yahooPolicyUrl",
    ].includes(field.key),
  );
  const bannerToggles: Array<[BannerToggleKey, string]> = [
    ["insertLineBanner", "LINEバナーを挿入"],
    ["insertStockNotice", "在庫注意画像を挿入"],
    ["insertPolicyImage", "ポリシー画像を挿入"],
  ];
  const pageBlockItems = normalizePageBlockOrder(form.pageBlockOrder);

  const renderPreview = (expanded = false) => {
    const previewHtml = generated[activePreview];
    const isMobilePreview = activePreview === "rakutenMobile" || activePreview === "yahooMobile";
    const previewWidth = isMobilePreview ? 375 : currentPreviewOutput.previewMaxWidth;
    const previewHeight = expanded ? "min(78vh, 920px)" : isMobilePreview ? 680 : 760;

    return (
      <div
        className="mx-auto bg-white"
        style={{ width: previewWidth, maxWidth: "100%" }}
      >
        <div className="overflow-hidden rounded-lg border border-[#EADFCF] bg-white p-3">
          {hasGeneratedHtml && previewHtml ? (
            <iframe
              title={currentPreviewOutput.previewTitle}
              srcDoc={previewHtml}
              className="block w-full border-0 bg-white"
              style={{ height: previewHeight }}
            />
          ) : (
            <div className="flex min-h-56 w-full items-center justify-center rounded-md border border-dashed border-[#EADFCF] bg-[#FAF7F0] px-4 text-center text-sm font-bold text-stone-500">
              HTMLを生成すると、ここに実HTMLプレビューが表示されます。
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#FAF7F0] px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-6">
        <header className="rounded-lg border border-[#EADFCF] bg-white px-5 py-6 shadow-sm sm:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#BFDBFE] bg-[#EEF6FF] px-3 py-1 text-sm font-bold text-sky-800">
                <FileText className="h-4 w-4" aria-hidden="true" />
                EC HTML Generator
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-normal text-stone-950 sm:text-4xl">
                EC HTML Generator
              </h1>
              <p className="mt-2 text-base font-medium text-stone-600">
                楽天市場・Yahoo!ショッピング対応 商品ページHTML作成ツール
              </p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-[#ECFDF5] px-4 py-3 text-sm text-emerald-900 shadow-sm">
              <p className="font-bold">
                このブラウザに現在の下書きを自動保存中
                {lastSavedAt ? `　最終保存：${lastSavedAt}` : ""}
              </p>
              <p className="mt-1 text-xs font-medium leading-5 text-emerald-800">
                現在編集中の商品データを1件だけ保存します。同じPC・同じブラウザで開くと自動復元されます。
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-emerald-100 bg-[#ECFDF5] p-3 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                下書き保存
              </button>
              <button
                type="button"
                onClick={() => setIsDraftListOpen((current) => !current)}
                className="inline-flex items-center justify-center rounded-lg border border-emerald-100 bg-white px-4 py-2 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                保存済み下書き一覧
              </button>
              <button
                type="button"
                onClick={handleClearImageSettings}
                className="inline-flex items-center justify-center rounded-lg border border-emerald-100 bg-white px-4 py-2 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                画像設定をクリア
              </button>
              <button
                type="button"
                onClick={handleClearDetailCopySettings}
                className="inline-flex items-center justify-center rounded-lg border border-emerald-100 bg-white px-4 py-2 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                詳細コピー設定をクリア
              </button>
              <button
                type="button"
                onClick={handleClearForm}
                className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                入力内容をクリア
              </button>
            </div>

            {draftMessage ? (
              <p className="mt-3 rounded-lg border border-emerald-100 bg-white px-3 py-2 text-sm font-bold text-emerald-800">
                {draftMessage}
              </p>
            ) : null}

            {isDraftListOpen ? (
              <div className="mt-3 grid gap-3 rounded-lg border border-emerald-100 bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-stone-800">保存済み下書き一覧</h3>
                  <span className="text-xs font-bold text-stone-500">
                    {savedDrafts.length}/{maxDraftCount}
                  </span>
                </div>
                {savedDrafts.length ? (
                  savedDrafts.map((draft) => (
                    <div
                      key={draft.id}
                      className="grid gap-3 rounded-lg border border-emerald-100 bg-[#ECFDF5] p-3 sm:grid-cols-[1fr_auto] sm:items-center"
                    >
                      <div>
                        <p className="font-bold text-stone-900">{draft.name}</p>
                        <p className="mt-1 text-xs font-medium text-stone-500">
                          保存日時：{formatDraftDate(draft.updatedAt) || "不明"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <button
                          type="button"
                          onClick={() => handleLoadDraft(draft)}
                          className="inline-flex items-center justify-center rounded-lg border border-emerald-100 bg-white px-3 py-2 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                        >
                          呼び出し
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDraft(draft.id)}
                          className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed border-emerald-200 bg-[#ECFDF5] px-4 py-6 text-center text-sm font-bold text-stone-400">
                    保存済みの下書きはありません。
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[minmax(420px,520px)_1fr]">
          <form
            id="ec-html-generator-form"
            className="grid content-start gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              handleGenerate();
            }}
          >
            <section className="rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-sky-700" aria-hidden="true" />
                <h2 className="text-lg font-bold text-sky-950">出力設定</h2>
              </div>

              <div className="grid gap-5">
                <div>
                  <p className="mb-2 text-sm font-bold text-stone-700">出力モール</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ["rakuten", "R", "楽天市場"],
                      ["yahoo", "Y!", "Yahoo!ショッピング"],
                    ].map(([mall, badge, label]) => (
                      <button
                        key={mall}
                        type="button"
                        onClick={() => selectMall(mall as "rakuten" | "yahoo")}
                        className={[
                          "flex items-center gap-2 rounded-lg border px-3 py-3 text-left text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                          activeMall === mall
                            ? "border-sky-400 bg-white text-sky-900 shadow-sm"
                            : "border-sky-100 bg-white/80 text-stone-700 hover:bg-white",
                        ].join(" ")}
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-red-600 shadow-sm">
                          {badge}
                        </span>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-bold text-stone-700">生成対象</p>
                  <div className="flex flex-wrap gap-2">
                    {outputs.map((output) => (
                      <span
                        key={output.key}
                        className="inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-white px-3 py-1.5 text-sm font-bold text-sky-900"
                      >
                        <CheckCircle className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                        {output.title.replace("用HTML", "")}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-stone-600">
                    1回の入力で、楽天PC・楽天スマホ・Yahoo! PC・Yahoo! スマホ用HTMLをまとめて生成できます。
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-[#E9D5FF] bg-[#F5F3FF] p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-violet-700" aria-hidden="true" />
                <h2 className="text-lg font-bold text-violet-950">表示順設定</h2>
              </div>
              <p className="rounded-lg border border-violet-100 bg-white px-3 py-2 text-sm font-medium leading-6 text-stone-600">
                商品ページ内の表示ブロック順を変更できます。変更後に一括生成すると、4種類のHTMLに反映されます。
              </p>

              <div className="mt-4 grid gap-2">
                {pageBlockItems.map((blockKey, index) => (
                  <div
                    key={blockKey}
                    className="grid gap-3 rounded-lg border border-violet-100 bg-white p-3 shadow-sm sm:grid-cols-[auto_1fr_auto] sm:items-center"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F3FF] text-sm font-bold text-violet-800">
                      {index + 1}
                    </span>
                    <span className="text-sm font-bold text-stone-800">
                      {pageBlockLabels[blockKey]}
                    </span>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <button
                        type="button"
                        onClick={() => movePageBlock(index, "up")}
                        disabled={index === 0}
                        className="rounded-md border border-violet-100 bg-white px-2 py-1 text-xs font-bold text-stone-600 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        上へ
                      </button>
                      <button
                        type="button"
                        onClick={() => movePageBlock(index, "down")}
                        disabled={index === pageBlockItems.length - 1}
                        className="rounded-md border border-violet-100 bg-white px-2 py-1 text-xs font-bold text-stone-600 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        下へ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] p-5 shadow-sm">
              <h2 className="text-lg font-bold text-emerald-950">商品情報</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {productFields.map(([key, label, placeholder]) => (
                  <label key={key} className="grid gap-1.5">
                    <span className="text-sm font-bold text-stone-700">{label}</span>
                    <input
                      value={String(form[key])}
                      onChange={(event) => updateField(key, event.target.value)}
                      placeholder={placeholder}
                      className="h-11 rounded-lg border border-emerald-100 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </label>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-[#FED7AA] bg-[#FFF7ED] p-5 shadow-sm">
              <h2 className="text-lg font-bold text-orange-950">商品説明</h2>
              <label className="mt-4 grid gap-1.5">
                <span className="text-sm font-bold text-stone-700">商品説明文</span>
                <textarea
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  placeholder="商品の特徴、着用感、コーディネート提案などを入力してください。"
                  className="min-h-44 resize-y rounded-lg border border-orange-100 bg-white px-3 py-3 text-sm leading-7 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                />
              </label>
            </section>

            <section className="rounded-lg border border-[#FBCFE8] bg-[#FDF2F8] p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Image className="h-5 w-5 text-rose-700" aria-hidden="true" />
                <h2 className="text-lg font-bold text-rose-950">画像設定</h2>
              </div>
              <div className="grid gap-4">
                <div className="grid gap-3 rounded-lg border border-rose-100 bg-white p-3 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-bold text-stone-700">楽天用画像URL</h4>
                    <span className="text-xs font-bold text-stone-500">{filledRakutenImageCount}/20</span>
                  </div>
                  {form.rakutenImageUrls.map((url, index) => (
                    <label key={`rakuten-${index}`} className="grid gap-1">
                      <span className="text-xs font-semibold text-stone-500">
                        {index === 0 ? "1枚目 メイン画像URL" : `${index + 1}枚目 画像URL`}
                      </span>
                      <input
                        value={url}
                        onChange={(event) => updateRakutenImageUrl(index, event.target.value)}
                        placeholder="https://image.rakuten.co.jp/shop-name/cabinet/item/item-1.jpg"
                        className="h-10 rounded-lg border border-rose-100 bg-white px-3 font-mono text-xs outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => moveImageUrl("rakutenImageUrls", index, "up")}
                          disabled={index === 0}
                          className="rounded-md border border-rose-100 bg-white px-2 py-1 text-xs font-bold text-stone-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          上へ
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImageUrl("rakutenImageUrls", index, "down")}
                          disabled={index === form.rakutenImageUrls.length - 1}
                          className="rounded-md border border-rose-100 bg-white px-2 py-1 text-xs font-bold text-stone-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          下へ
                        </button>
                        <button
                          type="button"
                          onClick={() => clearImageUrl("rakutenImageUrls", index)}
                          className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold text-red-700"
                        >
                          削除
                        </button>
                      </div>
                      {cannotConvertRakutenUrl(url) ? (
                        <span className="text-xs font-semibold text-red-600">
                          変換できないURLです
                        </span>
                      ) : null}
                    </label>
                  ))}
                  <span className="text-xs font-medium text-stone-500">楽天PC・楽天スマホ用HTMLで使用します。</span>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateYahooUrls}
                  className="inline-flex w-fit items-center gap-2 rounded-lg border border-rose-100 bg-white px-4 py-2 text-sm font-bold text-rose-800 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:ring-offset-2"
                >
                  <Download className="h-4 w-4 rotate-[-90deg]" aria-hidden="true" />
                  楽天URLからYahoo用URLを生成
                </button>

                <button
                  type="button"
                  onClick={handleGenerateRakutenUrls}
                  className="inline-flex w-fit items-center gap-2 rounded-lg border border-rose-100 bg-white px-4 py-2 text-sm font-bold text-rose-800 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:ring-offset-2"
                >
                  <Download className="h-4 w-4 rotate-90" aria-hidden="true" />
                  Yahoo URLから楽天用URLを生成
                </button>

                <div className="grid gap-3 rounded-lg border border-rose-100 bg-white p-3 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-bold text-stone-700">Yahoo用画像URL</h4>
                    <span className="text-xs font-bold text-stone-500">{filledYahooImageCount}/20</span>
                  </div>
                  {form.yahooImageUrls.map((url, index) => (
                    <label key={`yahoo-${index}`} className="grid gap-1">
                      <span className="text-xs font-semibold text-stone-500">
                        {index === 0 ? "1枚目 メイン画像URL" : `${index + 1}枚目 画像URL`}
                      </span>
                      <input
                        value={url}
                        onChange={(event) => updateYahooImageUrl(index, event.target.value)}
                        placeholder="https://shopping.c.yimg.jp/lib/shop-name/item-1.jpg"
                        className="h-10 rounded-lg border border-rose-100 bg-white px-3 font-mono text-xs outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => moveImageUrl("yahooImageUrls", index, "up")}
                          disabled={index === 0}
                          className="rounded-md border border-rose-100 bg-white px-2 py-1 text-xs font-bold text-stone-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          上へ
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImageUrl("yahooImageUrls", index, "down")}
                          disabled={index === form.yahooImageUrls.length - 1}
                          className="rounded-md border border-rose-100 bg-white px-2 py-1 text-xs font-bold text-stone-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          下へ
                        </button>
                        <button
                          type="button"
                          onClick={() => clearImageUrl("yahooImageUrls", index)}
                          className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold text-red-700"
                        >
                          削除
                        </button>
                      </div>
                    </label>
                  ))}
                  <span className="text-xs font-medium text-stone-500">Yahoo! PC・Yahoo! スマホ用HTMLで使用します。</span>
                </div>

                <p className="rounded-lg border border-rose-100 bg-white px-3 py-2 text-sm font-medium text-stone-600">
                  選択したモールに応じた画像URLを使用します。
                </p>
              </div>
            </section>

            <section className="rounded-lg border border-[#DDD6FE] bg-[#F5F3FF] p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-violet-700" aria-hidden="true" />
                <h2 className="text-lg font-bold text-violet-950">店舗共通画像設定</h2>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2 sm:grid-cols-3">
                  {bannerToggles.map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center justify-between gap-3 rounded-lg border border-violet-100 bg-white px-3 py-3 text-sm font-bold text-stone-700 shadow-sm"
                    >
                      <span>{label}</span>
                      <input
                        type="checkbox"
                        checked={form[key]}
                        onChange={(event) => updateToggle(key, event.target.checked)}
                        className="h-5 w-5 accent-emerald-700"
                      />
                    </label>
                  ))}
                </div>

                <div className="grid gap-4">
                  {bannerFields.map((field) => (
                    <label key={field.key} className="grid gap-1.5">
                      <span className="text-sm font-bold text-stone-700">{field.label}</span>
                      <input
                        value={form[field.key]}
                        onChange={(event) => updateField(field.key, event.target.value)}
                        placeholder={field.placeholder}
                        className="h-11 rounded-lg border border-violet-100 bg-white px-3 text-sm outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                      />
                      {[
                        "rakutenLineBannerUrl",
                        "rakutenStockNoticeUrl",
                        "rakutenPolicyUrl",
                      ].includes(field.key) && cannotConvertRakutenUrl(form[field.key]) ? (
                        <span className="text-xs font-bold text-red-600">変換できないURLです</span>
                      ) : null}
                    </label>
                  ))}
                </div>

                <p className="rounded-lg border border-violet-100 bg-white px-3 py-2 text-sm font-medium text-stone-600">
                  空欄のURL、またはOFFの共通画像は出力HTMLに挿入されません。
                </p>
              </div>
            </section>

            <section className="rounded-lg border border-[#DDD6FE] bg-white p-5 shadow-sm">
              <button
                type="button"
                onClick={() => setIsAdvancedOpen((current) => !current)}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <span className="flex items-center gap-2 text-lg font-bold">
                  <Settings2 className="h-5 w-5 text-violet-700" aria-hidden="true" />
                  <span className="text-violet-950">詳細コピー設定</span>
                </span>
                <span className="text-sm font-bold text-emerald-700">
                  {isAdvancedOpen ? "閉じる" : "開く"}
                </span>
              </button>
              {isAdvancedOpen ? (
                <div className="mt-4 grid gap-4">
                  <button
                    type="button"
                    onClick={handleAutoCopy}
                    className="inline-flex w-fit items-center gap-2 rounded-lg border border-violet-100 bg-[#F5F3FF] px-4 py-2 text-sm font-bold text-violet-800 transition hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2"
                  >
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    雑誌風コピーを自動入力
                  </button>
                  <div className="grid gap-4">
                    {advancedCopyFields.map((field) => (
                      <label key={field.key} className="grid gap-1.5">
                        <span className="text-sm font-bold text-stone-700">{field.label}</span>
                        {field.multiline ? (
                          <textarea
                            value={form[field.key]}
                            onChange={(event) => updateField(field.key, event.target.value)}
                            className="min-h-24 resize-y rounded-lg border border-violet-100 bg-white px-3 py-3 text-sm leading-6 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                          />
                        ) : (
                          <input
                            value={form[field.key]}
                            onChange={(event) => updateField(field.key, event.target.value)}
                            placeholder={field.placeholder}
                            className="h-11 rounded-lg border border-violet-100 bg-white px-3 text-sm outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                          />
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>

            <div className="flex items-start gap-2 rounded-lg border border-[#EADFCF] bg-white px-4 py-3 text-sm font-bold text-stone-700 shadow-sm">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-stone-500" aria-hidden="true" />
              Yahooスマホ：center / font未使用　楽天スマホ：style未使用
            </div>
          </form>

          <section className="grid content-start gap-5">
            <article className="rounded-lg border border-[#EADFCF] bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-amber-700" aria-hidden="true" />
                    <h2 className="text-lg font-bold text-amber-950">実HTMLプレビュー</h2>
                  </div>
                  <p className="mt-1 text-sm font-medium text-stone-500">
                    コピー・ダウンロードされるHTMLの表示イメージです。
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex rounded-lg border border-[#EADFCF] bg-[#FAF7F0] p-1">
                    {outputs.map((output) => {
                      const isMobile = output.key === "rakutenMobile" || output.key === "yahooMobile";
                      const Icon = isMobile ? Smartphone : Monitor;
                      return (
                        <button
                          key={output.key}
                          type="button"
                          onClick={() => {
                            setActivePreview(output.key);
                            setActiveMall(output.key === "rakutenPc" || output.key === "rakutenMobile" ? "rakuten" : "yahoo");
                          }}
                          className={[
                            "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                            activePreview === output.key
                              ? "bg-white text-amber-800 shadow-sm"
                              : "text-stone-600 hover:bg-white",
                          ].join(" ")}
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                          {output.title.replace("用HTML", "")}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPreviewExpanded(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#EADFCF] bg-white px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-[#FAF7F0] focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2"
                  >
                    <Maximize2 className="h-4 w-4" aria-hidden="true" />
                    拡大表示
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-[#EADFCF] bg-[#FAF7F0] p-3 sm:p-5">
                {renderPreview()}
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setIsHtmlOpen((current) => !current)}
                  className="text-sm font-bold text-emerald-700 underline-offset-4 hover:underline"
                >
                  {isHtmlOpen ? "HTMLを閉じる" : "HTMLを表示"}
                </button>
                {isHtmlOpen ? (
                  <textarea
                    readOnly
                    value={generated[activePreview]}
                    placeholder="一括生成後に、選択中プレビューのHTMLを確認できます。"
                    className="mt-3 h-56 w-full resize-y rounded-lg border border-stone-300 bg-stone-950 px-3 py-3 font-mono text-xs leading-relaxed text-stone-50 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                ) : null}
              </div>
            </article>

            <article className="rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-bold">出力結果（4種類まとめて生成されます）</h2>
                {hasGeneratedHtml ? (
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                    <CheckCircle className="h-4 w-4" aria-hidden="true" />
                    生成済み
                  </span>
                ) : null}
              </div>

              <div className="grid gap-3">
                {outputs.map((output, index) => (
                  <div
                    key={output.key}
                    className="grid gap-3 rounded-lg border border-emerald-100 bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-stone-600 shadow-sm">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="font-bold text-stone-900">{output.title}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span
                            className={[
                              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
                              hasGeneratedHtml
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-stone-200 text-stone-600",
                            ].join(" ")}
                          >
                            <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                            {hasGeneratedHtml ? "生成完了" : "未生成"}
                          </span>
                          {outputWarnings[output.key] ? (
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                              {outputWarnings[output.key]}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <button
                        type="button"
                        onClick={() => void handleCopy(output.key)}
                        disabled={!hasGeneratedHtml}
                        className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Copy className="h-4 w-4" aria-hidden="true" />
                        {copiedKey === output.key ? "コピー済み" : "コピー"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownload(output.key)}
                        disabled={!hasGeneratedHtml}
                        className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Download className="h-4 w-4" aria-hidden="true" />
                        ダウンロード
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-lg border border-emerald-100 bg-[#ECFDF5] p-5 shadow-sm">
              <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
                <button
                  type="submit"
                  form="ec-html-generator-form"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-3 text-base font-bold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  <Rocket className="h-5 w-5" aria-hidden="true" />
                  楽天・Yahoo用HTMLを一括生成
                </button>
                <button
                  type="button"
                  onClick={() => void handleCopyAll()}
                  disabled={!hasGeneratedHtml}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-100 bg-white px-4 py-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  {copiedAll ? "コピー済み" : "コピー（すべて）"}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadAll}
                  disabled={!hasGeneratedHtml}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-100 bg-white px-4 py-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  ダウンロード（すべて）
                </button>
              </div>
            </article>
          </section>
        </section>
      </div>

      {isPreviewExpanded ? (
        <div className="fixed inset-0 z-50 bg-black/55 p-4 sm:p-6">
          <div className="mx-auto flex h-full max-w-6xl flex-col rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-[#EADFCF] bg-[#FAF7F0] px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-amber-950">実HTMLプレビュー</h2>
                <p className="text-sm font-medium text-stone-500">
                  {currentPreviewOutput.previewTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewExpanded(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#EADFCF] bg-white text-stone-700 transition hover:bg-[#FAF7F0] focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2"
                aria-label="閉じる"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto bg-[#FAF7F0] p-4 sm:p-6">
              {renderPreview(true)}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}



























