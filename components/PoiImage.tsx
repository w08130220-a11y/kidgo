"use client";

import { useState } from "react";

/**
 * 圖片優先, 失敗 / 沒圖時 fall back 到漸層+emoji.
 * 漸層始終 render 為背景, 圖片 onError 時隱藏自己 → 背景自然顯示.
 */
export function PoiImage({
  photo,
  gradientClass,
  emoji,
  alt,
  aspect = "aspect-[4/3]",
  children,
}: {
  photo?: string;
  gradientClass: string;
  emoji: string;
  alt: string;
  aspect?: string;
  children?: React.ReactNode;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = photo && !imgFailed;

  return (
    <div
      className={`relative ${aspect} overflow-hidden flex items-center justify-center bg-gradient-to-br ${gradientClass}`}
    >
      {/* Emoji background (always rendered, hidden when image loads on top) */}
      <span className="text-6xl text-white drop-shadow-md select-none pointer-events-none">
        {emoji}
      </span>

      {/* Real photo overlay if available */}
      {showImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
          onError={() => setImgFailed(true)}
        />
      )}

      {/* Pass through badges etc */}
      {children}
    </div>
  );
}
