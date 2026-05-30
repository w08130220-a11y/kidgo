import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Nav } from "@/components/Nav";

export const metadata = {
  title: "服務條款 ・ kidgo",
};

export default function TermsPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900"
        >
          <ArrowLeft size={14} /> 回首頁
        </Link>

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">服務條款</h1>
        <p className="mt-2 text-sm text-stone-500">最後更新：2026 年 5 月 30 日</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-stone-700">
          <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
            <strong>⚠ v1 內測階段聲明：</strong>本條款為起草版，正式上線前將委請律師檢視。
            使用本服務即表示同意本條款內容。
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900">1. 服務性質</h2>
            <p>
              kidgo（以下稱「本服務」）提供 AI 親子行程**建議**工具。
              我們**不**是旅行社、**不**代訂景點門票、**不**處理金流。
              本服務產出的行程僅為參考，您應自行向各場館確認營業時間、票價、適齡規範等資訊後再行前往。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900">2. 帳號與註冊</h2>
            <ul className="ml-5 list-disc space-y-1">
              <li>未註冊可瀏覽景點、產生行程（每日限 3 次）。</li>
              <li>登入後可儲存行程、收藏景點、累積積分、貢獻內容。</li>
              <li>登入需透過 LINE 或 Google 第三方認證，您應確保該帳號為本人所有。</li>
              <li>本服務不開放 13 歲以下兒童註冊使用。</li>
              <li>禁止以爬蟲、機器人、自動化腳本大量呼叫本服務。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900">3. 內容免責</h2>
            <p>本服務提供的資訊（景點介紹、價格、適齡建議、AI 推薦理由等）可能存在以下情況：</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>景點實際狀況可能與資料庫不符（如休館、設施維修、票價調整）</li>
              <li>適齡標註為一般參考，您應依您孩子個別狀況判斷</li>
              <li>AI 推薦理由為演算法產出，不構成任何承諾或保證</li>
              <li>UGC 內容（其他爸媽上傳的景點/評論）由貢獻者負責，本服務不擔保其正確性</li>
            </ul>
            <p>
              <strong>您前往任何景點所生之費用、交通、人身安全、財物損失，本服務恕不負責</strong>。
              帶孩童出遊請自行注意安全並依各場館規定行事。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900">4. UGC（用戶生成內容）規範</h2>
            <p>您上傳景點、評論、行程分享時，必須遵守：</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>內容為您真實經驗，非虛構或抄襲</li>
              <li>不含商業廣告、聯盟連結（除非標註並經本服務同意）</li>
              <li>不含侮辱、歧視、騷擾、色情內容</li>
              <li>不含可識別他人兒童身份的個資（如全名、學校、家庭住址）</li>
              <li>您擁有上傳照片之合法權利（自己拍的、有授權的）</li>
            </ul>
            <p>
              上傳內容即授權本服務在平台內展示、推薦、編輯（如修飾錯字）之非專屬權利。
              您仍保有著作權，可隨時刪除。違反規範之內容本服務有權移除並停權。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900">5. 積分系統</h2>
            <ul className="ml-5 list-disc space-y-1">
              <li>積分為平台內虛擬獎勵，無實體價值，不得提現、轉讓、贈與他人。</li>
              <li>未來訂閱版上線後，積分可依當時公告比例折抵訂閱費用。</li>
              <li>禁止以多帳號、機器人等方式刷積分，違者帳號將被停權且積分歸零。</li>
              <li>本服務保留調整積分規則之權利（重大變更會提前 30 天通知）。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900">6. AI 規劃次數限制</h2>
            <p>
              為維持服務品質與成本，每個 IP / 帳號每日有 AI 規劃次數上限（v1 為 3 次/日）。
              超出後請隔日再試。未來訂閱版將提供更高額度。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900">7. 服務變更與終止</h2>
            <ul className="ml-5 list-disc space-y-1">
              <li>本服務為內測階段，功能、UI、價格、規則隨時可能調整。</li>
              <li>重大變更會於本頁公告並通知已登入用戶。</li>
              <li>本服務保留隨時暫停或終止全部或部分服務之權利。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900">8. 智慧財產權</h2>
            <p>
              本服務的所有原創內容（程式碼、UI、編輯精選文案、AI 推薦理由）之著作權歸本服務所有。
              使用本服務不代表您取得任何上述內容之授權。
              用戶上傳的 UGC 內容著作權歸用戶所有，本服務僅取得平台內展示之非專屬授權。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900">9. 法律適用</h2>
            <p>
              本條款依中華民國法律解釋。如有爭議，雙方同意以台灣台北地方法院為第一審管轄法院。
            </p>
          </section>
        </div>

        <div className="mt-12 flex gap-3 border-t border-stone-200 pt-6 text-sm">
          <Link href="/privacy" className="text-orange-600 hover:underline">
            → 隱私權政策
          </Link>
          <span className="text-stone-300">|</span>
          <Link href="/" className="text-stone-500 hover:text-stone-900">
            回首頁
          </Link>
        </div>
      </main>
    </>
  );
}
