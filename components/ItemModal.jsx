






"use client";

import { useEffect, useState } from "react";

export default function ItemModal({ item, onClose }) {
  const [activeImage, setActiveImage] = useState(item.mainImage);
  const [qcPreviewIndex, setQcPreviewIndex] = useState(-1);
  const gallery = [item.mainImage, ...(item.images || [])].filter(Boolean);
  const qcImages = item.qcImages || [];

  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === "Escape") {
        if (qcPreviewIndex >= 0) {
          setQcPreviewIndex(-1);
          return;
        }
        onClose();
      }
      if (qcPreviewIndex >= 0 && e.key === "ArrowRight" && qcImages.length > 1) {
        setQcPreviewIndex((prev) => (prev + 1) % qcImages.length);
      }
      if (qcPreviewIndex >= 0 && e.key === "ArrowLeft" && qcImages.length > 1) {
        setQcPreviewIndex((prev) => (prev - 1 + qcImages.length) % qcImages.length);
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose, qcPreviewIndex, qcImages.length]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 md:p-8"
      onClick={onClose}
    >
      <div
        className="mx-auto max-w-5xl rounded-2xl border border-zinc-700 bg-zinc-900 p-4 md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <img
              src={activeImage}
              alt={item.title}
              className="h-72 w-full rounded-xl object-cover md:h-96"
              loading="lazy"
            />
            <div className="mt-3 grid grid-cols-4 gap-2">
              {gallery.map((img) => (
                <button
                  key={img}
                  type="button"
                  className={`overflow-hidden rounded-lg border ${
                    activeImage === img ? "border-cyan-400" : "border-zinc-700"
                  }`}
                  onClick={() => setActiveImage(img)}
                >
                  <img src={img} alt="preview" className="h-16 w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col">
            <span className="mb-2 inline-flex w-fit rounded-full border border-violet-400/40 bg-violet-500/10 px-2 py-1 text-xs font-medium text-violet-200 shadow-[0_0_12px_rgba(139,92,246,0.2)]">
              {item.category || "Other"}
            </span>
            <h2 className="text-2xl font-semibold text-white">{item.title}</h2>
            <p className="mt-2 text-3xl font-bold text-emerald-400">${item.price.toFixed(2)}</p>
            {item.description ? (
              <p className="mt-4 text-zinc-300">{item.description}</p>
            ) : null}

            <div className="mt-6">
              <h3 className="text-sm uppercase tracking-wide text-zinc-400">QC Images</h3>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(item.qcImages || []).length > 0 ? (
                  item.qcImages.map((img, index) => (
                    <button
                      key={img}
                      type="button"
                      onClick={() => setQcPreviewIndex(index)}
                      className="overflow-hidden rounded-lg border border-zinc-700 transition hover:border-cyan-400 hover:shadow-[0_0_16px_rgba(34,211,238,0.28)]"
                    >
                      <img
                        src={img}
                        alt="QC"
                        className="h-20 w-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))
                ) : (
                  <p className="col-span-3 text-sm text-zinc-500">No QC images provided.</p>
                )}
              </div>
            </div>

            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="mt-auto inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 via-violet-500 to-emerald-500 px-4 font-semibold text-white transition hover:scale-[1.02]"
            >
              Buy via Kakobuy
            </a>
          </div>
        </div>
      </div>

      {qcPreviewIndex >= 0 ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4"
          onClick={() => setQcPreviewIndex(-1)}
        >
          <div className="relative flex w-full max-w-6xl items-center justify-center">
            {qcImages.length > 1 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQcPreviewIndex((prev) => (prev - 1 + qcImages.length) % qcImages.length);
                }}
                className="absolute left-0 z-10 rounded-full border border-zinc-600 bg-zinc-900/80 px-4 py-2 text-zinc-100"
              >
                Prev
              </button>
            ) : null}

            <img
              src={qcImages[qcPreviewIndex]}
              alt="QC preview"
              className="qc-lightbox-image max-h-[88vh] w-auto max-w-full rounded-xl border border-zinc-700 object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {qcImages.length > 1 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQcPreviewIndex((prev) => (prev + 1) % qcImages.length);
                }}
                className="absolute right-0 z-10 rounded-full border border-zinc-600 bg-zinc-900/80 px-4 py-2 text-zinc-100"
              >
                Next
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
