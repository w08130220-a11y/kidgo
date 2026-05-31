"use client";

/**
 * 新增景點表單 (client)
 * 圖片直接上傳到 Supabase Storage bucket `poi-photos`
 * (bucket 需先在 Supabase Dashboard 建好, 設為 public read)
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, X, Upload, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cx } from "@/lib/cx";

const CATEGORIES = [
  { value: "park", label: "🌳 公園 / 戶外" },
  { value: "museum", label: "🏛️ 博物館 / 展館" },
  { value: "zoo", label: "🦁 動物 / 牧場" },
  { value: "amusement", label: "🎡 遊樂園" },
  { value: "indoor", label: "🎨 室內遊戲場" },
  { value: "restaurant", label: "🍽️ 親子餐廳" },
] as const;

const TAW_CITIES = [
  "基隆市", "臺北市", "新北市", "桃園市", "新竹市", "新竹縣",
  "苗栗縣", "臺中市", "彰化縣", "南投縣", "雲林縣", "嘉義市",
  "嘉義縣", "臺南市", "高雄市", "屏東縣", "宜蘭縣", "花蓮縣",
  "臺東縣", "澎湖縣", "金門縣", "連江縣",
];

const ALL_TAGS = [
  "戶外", "室內", "免費", "雨天首選", "雨天備案",
  "推車友善", "有遊戲區", "捷運直達", "需開車",
  "動物互動", "可野餐", "玩水", "需訂位", "無障礙",
];

const STORAGE_BUCKET = "poi-photos";
const MAX_PHOTOS = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

type Photo = {
  url: string;
  uploading: boolean;
  error?: string;
};

export function NewPoiForm({ userId }: { userId: string }) {
  const router = useRouter();
  const sb = createClient();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("park");
  const [city, setCity] = useState("臺北市");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [ageMin, setAgeMin] = useState(0);
  const [ageMax, setAgeMax] = useState(12);
  const [durationMin, setDurationMin] = useState(120);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(0);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [phone, setPhone] = useState("");
  const [requiresReservation, setRequiresReservation] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const slotsLeft = MAX_PHOTOS - photos.length;
    const toUpload = Array.from(files).slice(0, slotsLeft);

    for (const file of toUpload) {
      if (!/^image\/(jpe?g|png|webp)$/.test(file.type)) {
        setPhotos((p) => [...p, { url: "", uploading: false, error: "格式不支援" }]);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setPhotos((p) => [...p, { url: "", uploading: false, error: "檔案 > 5MB" }]);
        continue;
      }

      const placeholderIdx = photos.length;
      setPhotos((p) => [...p, { url: "", uploading: true }]);

      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

      try {
        const { error: upErr } = await sb.storage
          .from(STORAGE_BUCKET)
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (upErr) throw upErr;
        const { data: urlData } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);
        setPhotos((p) =>
          p.map((ph, i) =>
            i === placeholderIdx ? { url: urlData.publicUrl, uploading: false } : ph
          )
        );
      } catch (e) {
        setPhotos((p) =>
          p.map((ph, i) =>
            i === placeholderIdx
              ? {
                  url: "",
                  uploading: false,
                  error: e instanceof Error ? e.message : "上傳失敗",
                }
              : ph
          )
        );
      }
    }
  };

  const removePhoto = (idx: number) =>
    setPhotos((p) => p.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setSubmitting(true);
    try {
      const photoUrls = photos.filter((p) => p.url).map((p) => p.url);
      const res = await fetch("/api/pois", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          city,
          district,
          address: address || undefined,
          ageMin,
          ageMax,
          durationMin,
          priceMin,
          priceMax,
          description,
          tags,
          photos: photoUrls,
          phone: phone || undefined,
          requiresReservation,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      router.push("/me/uploads?just_submitted=1");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "送出失敗");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      {/* 名稱 */}
      <Field label="景點名稱 *" hint="2-100 字">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          placeholder="例如：大安森林公園親子遊戲場"
          className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-400"
        />
      </Field>

      {/* 類別 */}
      <Field label="類別 *">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={cx(
                "rounded-xl border px-3 py-2.5 text-sm transition",
                category === c.value
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-stone-200 bg-white hover:border-stone-300"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </Field>

      {/* 縣市 + 區 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="縣市 *">
          <select
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-400"
          >
            {TAW_CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="區 / 鄉鎮 *">
          <input
            required
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            maxLength={50}
            placeholder="例如：大安區"
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-400"
          />
        </Field>
      </div>

      {/* 地址 */}
      <Field label="完整地址 (可空)">
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="例如：臺北市大安區新生南路二段 1 號"
          className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-400"
        />
      </Field>

      {/* 年齡範圍 */}
      <Field label="適合年齡">
        <div className="flex items-center gap-3">
          <NumberInput value={ageMin} onChange={setAgeMin} min={0} max={18} />
          <span className="text-stone-400">至</span>
          <NumberInput value={ageMax} onChange={setAgeMax} min={ageMin} max={99} />
          <span className="text-sm text-stone-500">歲</span>
        </div>
      </Field>

      {/* 停留時間 */}
      <Field label="建議停留時間">
        <div className="flex items-center gap-3">
          <NumberInput
            value={durationMin}
            onChange={setDurationMin}
            min={15}
            max={720}
            step={15}
          />
          <span className="text-sm text-stone-500">分鐘 (約 {Math.round(durationMin / 60 * 10) / 10} 小時)</span>
        </div>
      </Field>

      {/* 價格 */}
      <Field label="人均費用 (免費填 0)">
        <div className="flex items-center gap-3">
          <span className="text-sm text-stone-500">NT$</span>
          <NumberInput value={priceMin} onChange={setPriceMin} min={0} max={5000} step={10} />
          <span className="text-stone-400">至</span>
          <NumberInput value={priceMax} onChange={setPriceMax} min={priceMin} max={5000} step={10} />
        </div>
      </Field>

      {/* 標籤 */}
      <Field label="標籤 (可複選)" hint="幫其他爸媽快速找到">
        <div className="flex flex-wrap gap-2">
          {ALL_TAGS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTag(t)}
              className={cx(
                "rounded-full border px-3 py-1.5 text-sm transition",
                tags.includes(t)
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
              )}
            >
              {tags.includes(t) ? "✓ " : "+ "}
              {t}
            </button>
          ))}
        </div>
      </Field>

      {/* 描述 */}
      <Field label="描述 *" hint="10-500 字, 講重點">
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          minLength={10}
          maxLength={500}
          placeholder="例如：館內展示玻璃工藝, 有 DIY 體驗區可預約. 室內有冷氣, 雨天首選. 3 歲以上小孩會有興趣."
          className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-400"
        />
        <div className="mt-1 text-right text-xs text-stone-400">
          {description.length} / 500
        </div>
      </Field>

      {/* 電話 + 訂位 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="電話 (可空)">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="02-1234-5678"
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-400"
          />
        </Field>
        <Field label="是否需要訂位">
          <label className="flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2.5">
            <input
              type="checkbox"
              checked={requiresReservation}
              onChange={(e) => setRequiresReservation(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm">是, 建議先打電話確認</span>
          </label>
        </Field>
      </div>

      {/* 照片 */}
      <Field
        label={`照片 (最多 ${MAX_PHOTOS} 張)`}
        hint="幫其他爸媽看到實景, JPG/PNG/WEBP, 每張 < 5MB"
      >
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p, i) => (
            <div
              key={i}
              className="relative aspect-square overflow-hidden rounded-lg border border-stone-200 bg-stone-50"
            >
              {p.uploading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="animate-spin text-stone-400" size={24} />
                </div>
              ) : p.error ? (
                <div className="flex h-full flex-col items-center justify-center gap-1 px-2 text-center">
                  <AlertCircle size={20} className="text-rose-500" />
                  <span className="text-xs text-rose-600">{p.error}</span>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.url} alt={`照片 ${i + 1}`} className="h-full w-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                aria-label="刪除"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-stone-300 bg-white text-stone-500 hover:bg-stone-50">
              <Camera size={22} />
              <span className="text-xs">點擊上傳</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </label>
          )}
        </div>
      </Field>

      {/* 提交 */}
      {err && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {err}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-stone-200 pt-6">
        <p className="text-xs text-stone-500">
          送出後等候審核 (通常 1-2 天). 每天最多上傳 5 個.
        </p>
        <button
          type="submit"
          disabled={submitting}
          className={cx(
            "flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600",
            submitting && "opacity-60"
          )}
        >
          {submitting ? (
            <>
              <Loader2 className="animate-spin" size={16} /> 送出中
            </>
          ) : (
            <>
              <Upload size={16} /> 送出審核
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ────────────────────────────────────────────────────────────────────
// Small bits
// ────────────────────────────────────────────────────────────────────
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-stone-800">{label}</label>
      {hint && <p className="mt-0.5 text-xs text-stone-500">{hint}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <div className="inline-flex items-center rounded-lg border border-stone-300 bg-white">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        className="px-2 py-1.5 text-stone-500 hover:bg-stone-100"
        aria-label="減少"
      >
        −
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
        }}
        min={min}
        max={max}
        step={step}
        className="w-14 border-0 bg-transparent text-center text-sm outline-none"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + step))}
        className="px-2 py-1.5 text-stone-500 hover:bg-stone-100"
        aria-label="增加"
      >
        +
      </button>
    </div>
  );
}

