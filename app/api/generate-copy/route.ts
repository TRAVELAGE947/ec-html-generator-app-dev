import OpenAI from "openai";
import { NextResponse } from "next/server";

type CopyRequest = {
  productName?: string;
  brand?: string;
  colors?: string;
  sizes?: string;
  material?: string;
  country?: string;
  description?: string;
};

type GeneratedCopy = {
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
};

const copyKeys = [
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
] as const satisfies ReadonlyArray<keyof GeneratedCopy>;

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCopy(value: unknown): GeneratedCopy {
  const source = typeof value === "object" && value !== null ? value : {};

  return copyKeys.reduce((acc, key) => {
    acc[key] = toText((source as Record<string, unknown>)[key]);
    return acc;
  }, {} as GeneratedCopy);
}

function buildPrompt(input: Required<CopyRequest>): string {
  return [
    "楽天市場・Yahooショッピング向けの商品ページ用コピーを生成してください。",
    "韓国子供服らしいナチュラルで上品な雑誌風コピーにしてください。",
    "商品情報にない機能・効果・対象年齢・安全性・品質保証・製造品質・縫製品質は勝手に作らないでください。",
    "「必ず」「絶対」「安全」「肌に優しい」「赤ちゃんに安心」「高品質」「上質」「丁寧に仕立てた」など断定的または強すぎる表現は避けてください。",
    "素材・カラー・サイズ・ブランド名は入力値を尊重してください。",
    "point1Title, point2Title, point3Title は英語のみで、2〜3語程度の短いタイトルにしてください。",
    "文章は日本語中心にしてください。",
    "返答は必ずJSONのみで、Markdownや説明文は含めないでください。",
    "JSONキーは次の11個だけにしてください: leadCopy, pointLead, point1Title, point1Text, point2Title, point2Text, point3Title, point3Text, extraDescription, colorDescription, closingCopy。",
    "",
    "商品情報:",
    `商品名: ${input.productName || "未入力"}`,
    `ブランド: ${input.brand || "未入力"}`,
    `カラー: ${input.colors || "未入力"}`,
    `サイズ: ${input.sizes || "未入力"}`,
    `素材: ${input.material || "未入力"}`,
    `生産国: ${input.country || "未入力"}`,
    `商品説明: ${input.description || "未入力"}`,
  ].join("\n");
}

function getErrorDetails(error: unknown): { status?: unknown; code?: unknown; message: string } {
  if (error instanceof Error) {
    const extra = error as Error & { status?: unknown; code?: unknown };
    return {
      status: extra.status,
      code: extra.code,
      message: error.message,
    };
  }

  if (typeof error === "object" && error !== null) {
    const source = error as { status?: unknown; code?: unknown; message?: unknown };
    return {
      status: source.status,
      code: source.code,
      message: typeof source.message === "string" ? source.message : "Unknown error",
    };
  }

  return {
    message: String(error),
  };
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY が .env.local に設定されていません。" },
      { status: 500 },
    );
  }

  let body: CopyRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエストJSONを読み取れませんでした。" }, { status: 400 });
  }

  const input: Required<CopyRequest> = {
    productName: toText(body.productName),
    brand: toText(body.brand),
    colors: toText(body.colors),
    sizes: toText(body.sizes),
    material: toText(body.material),
    country: toText(body.country),
    description: toText(body.description),
  };

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "あなたはEC商品ページのコピーライターです。指定された商品情報だけを根拠に、控えめで上品な日本語コピーをJSONのみで返します。入力にない品質・安全性・効果は断定しません。",
        },
        {
          role: "user",
          content: buildPrompt(input),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message.content;

    if (!content) {
      return NextResponse.json({ error: "コピー生成結果が空でした。" }, { status: 502 });
    }

    return NextResponse.json(normalizeCopy(JSON.parse(content)));
  } catch (error) {
    const details = getErrorDetails(error);
    console.error("generate-copy error:", error);
    console.error("generate-copy error details:", {
      status: details.status,
      code: details.code,
      message: details.message,
    });

    return NextResponse.json(
      {
        error: `AIコピー生成に失敗しました: ${details.message}`,
        status: details.status,
        code: details.code,
      },
      { status: 500 },
    );
  }
}
