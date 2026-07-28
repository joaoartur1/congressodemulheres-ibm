"use client";

import { QRCodeSVG } from "qrcode.react";

export function QRCodeDisplay({
  value,
  size = 200,
  ariaLabel,
}: {
  value: string;
  size?: number;
  ariaLabel?: string;
}) {
  return (
    <div className="inline-block rounded-xl bg-white p-2">
      <QRCodeSVG
        value={value}
        size={size}
        fgColor="#453b6e"
        bgColor="#ffffff"
        level="M"
        aria-label={ariaLabel}
      />
    </div>
  );
}
