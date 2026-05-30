import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Nav } from "@/components/Nav";

export const metadata = {
  title: "隱私權政策 ・ ChildTrip",
};

export default function PrivacyPage() {
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

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">隱私權政策</h1>
        <p className="mt-2 text-sm text-stone-500">最後更新：2026 年 5 月 30 日</p>

        <div className="prose prose-stone mt-8 max-w-none space-y-6 text-sm leading-relaxed text-stone-700">
          <section>
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
              <strong>⚠ v1 內測階段聲明：</strong>本服務目前為內測，本文件為**起草版本**，非經律師審核之正式條款。
              正式上線前將委請熟悉電商與兒少資訊保護之律師事務所檢視。
              在內測期間使用本服務即表示理解此狀態。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900">1. 我們是誰</h2>
            <p>
              ChildTrip（以下稱「本服務」）是一個提供台灣親子行程規劃建議的網路工具。
              本服務由獨立開發者營運，致力於為雙薪家庭提供高品質的親子出遊推薦。
            </p>
            <p>
              依據中華民國《個人資料保護法》（以下稱「個資法」）及相關法規，
              我們重視您及您家庭成員的個人資料隱私，並依本政策進行蒐集、處理與利用。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900">2. 我們蒐集哪些資料</h2>
            <h3 className="mt-3 font-semibold text-stone-800">2.1 您主動提供的資料</h3>
            <ul className="ml-5 list-disc space-y-1">
              <li>
                <strong>規劃需求</strong>：大人/小孩人數、孩子年齡、出遊日期、出發地、預算範圍、偏好氛圍、特殊需求。
              </li>
              <li>
                <strong>登入資料（如選擇登入）</strong>：透過 LINE 或 Google 第三方登入時提供的暱稱、頭像、Email。
              </li>
              <li>
                <strong>UGC 內容</strong>：您上傳的景點建議、評論、行程分享內容、照片。
              </li>
            </ul>

            <h3 className="mt-4 font-semibold text-stone-800">2.2 自動蒐集的資料</h3>
            <ul className="ml-5 list-disc space-y-1">
              <li>
                <strong>裝置與瀏覽資訊</strong>：IP 位址、瀏覽器類型、作業系統、訪問時間、來源頁面。
              </li>
              <li>
                <strong>使用記錄</strong>：您查詢的關鍵字、生成的行程、按讚的內容、瀏覽路徑。
              </li>
              <li>
                <strong>Cookie 與 Local Storage</strong>：用於保持登入狀態、記住您的偏好設定。
              </li>
            </ul>

            <h3 className="mt-4 font-semibold text-stone-800">2.3 關於兒少資訊的特別說明</h3>
            <p className="rounded-md bg-stone-100 p-3 text-xs">
              本服務蒐集的「孩子年齡」係作為 AI 推薦適齡景點的<strong>非識別性類別資料</strong>，
              不蒐集兒童本人的姓名、生日、學校、就讀資訊、聯絡方式或任何可直接識別兒童的資料。
              我們強烈建議您勿於分享行程、評論或上傳內容時附上可識別兒童身份的資訊（如全名、學校制服、家門口照片等）。
              本服務不對 13 歲以下兒童開設帳號。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900">3. 為什麼蒐集這些資料（蒐集目的）</h2>
            <ul className="ml-5 list-disc space-y-1">
              <li>提供 AI 親子行程推薦服務</li>
              <li>儲存您的行程供日後查閱、分享給朋友</li>
              <li>讓您與其他爸媽社群互動（按讚、評論、上傳景點）</li>
              <li>累積積分供未來訂閱版折抵</li>
              <li>分析使用模式以改進產品（彙總、去識別化後）</li>
              <li>偵測異常行為以維持服務穩定與防止濫用</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900">4. 第三方資料分享</h2>
            <p>
              為提供本服務，我們將部分資料傳輸給以下第三方處理者。我們僅傳輸必要的最小資料，
              且要求所有第三方遵守同等的資料保護義務。
            </p>
            <ul className="ml-5 list-disc space-y-2">
              <li>
                <strong>Anthropic（Claude AI）</strong>：您的規劃需求（年齡、預算、偏好等）會傳送給 Anthropic 的 API 進行 AI 推薦運算。
                Anthropic 依其
                <a className="text-orange-600 hover:underline" href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noreferrer">
                  隱私政策
                </a>
                處理。我們不傳輸您的個人身份識別資料給 Anthropic。
              </li>
              <li>
                <strong>Vercel</strong>：本服務託管於 Vercel（美國）。您的瀏覽請求與 IP 位址會通過其 CDN 與運算節點。
              </li>
              <li>
                <strong>Supabase</strong>：用於儲存帳號、行程、評論等資料。
              </li>
              <li>
                <strong>LINE Login / Google OAuth</strong>：若您選擇透過第三方登入，將適用其各自之隱私政策。
              </li>
              <li>
                <strong>PostHog / Sentry</strong>（如有啟用）：產品分析與錯誤監控，採彙總與去識別化處理。
              </li>
            </ul>
            <p className="text-xs text-stone-500">
              我們不會將您的個資出售、出租或為行銷目的轉讓給任何第三方。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900">5. 資料保存期限</h2>
            <ul className="ml-5 list-disc space-y-1">
              <li>
                <strong>未登入用戶</strong>：規劃記錄不儲存於我們的資料庫，僅暫存於您的瀏覽器。
              </li>
              <li>
                <strong>已登入用戶</strong>：行程、評論、積分等資料保留至帳號刪除後 30 天。
              </li>
              <li>
                <strong>系統 log / IP 記錄</strong>：保留 90 天供安全稽核。
              </li>
              <li>
                <strong>法定保存資料</strong>：如未來涉及金流交易，依稅務法令保存 5 年。
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900">6. 您的權利</h2>
            <p>依個資法第 3 條，您對個人資料享有以下權利：</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>查詢或請求閱覽</li>
              <li>請求製給複製本</li>
              <li>請求補充或更正</li>
              <li>請求停止蒐集、處理或利用</li>
              <li>請求刪除（並可同時刪除帳號）</li>
            </ul>
            <p>
              欲行使上述權利，請寄信至下方聯絡信箱。我們將在 7 個工作日內回覆。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900">7. Cookie 政策</h2>
            <p>本服務使用以下類型 Cookie：</p>
            <ul className="ml-5 list-disc space-y-1">
              <li><strong>必要性 Cookie</strong>：維持登入狀態、防止 CSRF 攻擊。無法停用。</li>
              <li><strong>偏好性 Cookie</strong>：記憶您選的出發地、語言等。</li>
              <li><strong>分析性 Cookie</strong>：彙總統計使用模式（如 PostHog）。可於瀏覽器設定停用。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900">8. 安全性</h2>
            <p>我們採取以下措施保護您的資料：</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>全站 HTTPS 加密傳輸</li>
              <li>密碼採單向雜湊（不可逆）</li>
              <li>資料庫存取權限分層、Row Level Security（RLS）隔離各用戶資料</li>
              <li>API 設有速率限制防止暴力存取</li>
            </ul>
            <p className="text-xs text-stone-500">
              然而網際網路傳輸無 100% 安全保證，若發生資料外洩事件，我們將於 72 小時內通知主管機關及受影響用戶。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900">9. 政策變更</h2>
            <p>
              本政策若有重大變更（如蒐集目的擴張、增加第三方處理者），
              將在本頁顯示公告並透過 Email 通知已登入用戶，給予 30 天緩衝期。
              小幅文字調整則直接更新「最後更新日」並於本頁公告。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900">10. 聯絡我們</h2>
            <p>
              對隱私政策有任何疑問、要求行使個資權利、或回報資安事件，請寄信至：
            </p>
            <p className="rounded-md bg-stone-100 p-3 font-mono text-xs">
              privacy@childtrip.tw &nbsp;（v1 內測階段請改寄至創辦人個人信箱，登入後設定頁查詢）
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900">11. 適用法律</h2>
            <p>
              本政策依中華民國《個人資料保護法》、《消費者保護法》、《電子簽章法》及相關法令訂定。
              如有爭議，以台灣台北地方法院為第一審管轄法院。
            </p>
          </section>
        </div>

        <div className="mt-12 flex gap-3 border-t border-stone-200 pt-6 text-sm">
          <Link href="/terms" className="text-orange-600 hover:underline">
            → 服務條款
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
