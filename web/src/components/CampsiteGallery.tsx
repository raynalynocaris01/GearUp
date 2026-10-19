'use client';

import { useState } from 'react';
import Image from 'next/image';
import { appImageSrc } from '@/components/AppImage';

interface Photo {
  id: number;
  image_url: string;
}

interface CampsiteGalleryProps {
  photos: Photo[];
  fallbackImage: string;
  campsiteName: string;
  isFeatured: boolean;
}

export function CampsiteGallery({
  photos,
  fallbackImage,
  campsiteName,
  isFeatured,
}: CampsiteGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const openLightbox = (index: number) => {
    setActiveIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const nextPhoto = () =>
    setActiveIndex((prev) => (prev + 1) % photos.length);
  const prevPhoto = () =>
    setActiveIndex((prev) => (prev - 1 + photos.length) % photos.length);

  if (photos.length === 0) {
    return (
      <div className="relative h-[420px] rounded-2xl overflow-hidden mb-8">
        <Image
          src={appImageSrc(fallbackImage)}
          alt={campsiteName}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 1200px"
          className="object-cover"
          unoptimized
        />
        {isFeatured && (
          <div className="absolute top-4 left-4 bg-gearup-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
            {'\u2605'} Featured
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="relative mb-8">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[420px] rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => openLightbox(0)}
            className="relative col-span-2 row-span-2 block w-full h-full text-left focus:outline-none focus:ring-4 focus:ring-gearup-600/50 transition"
          >
            <Image
              src={appImageSrc(photos[0].image_url)}
              alt={campsiteName}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 600px"
              className="object-cover hover:opacity-90 transition"
              unoptimized
            />
          </button>

          {photos.slice(1, 5).map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => openLightbox(i + 1)}
              className="relative block w-full h-full text-left focus:outline-none focus:ring-4 focus:ring-gearup-600/50 transition"
            >
              <Image
                src={appImageSrc(p.image_url)}
                alt={campsiteName + ' photo ' + (i + 2)}
                fill
                sizes="25vw"
                className="object-cover hover:opacity-90 transition"
                unoptimized
              />
              {i === 3 && photos.length > 5 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm font-semibold hover:bg-black/40 transition">
                  {'+' + (photos.length - 5) + ' more'}
                </div>
              )}
            </button>
          ))}
        </div>

        {isFeatured && (
          <div className="absolute top-4 left-4 bg-gearup-600 text-white text-xs font-bold px-3 py-1.5 rounded-full pointer-events-none">
            {'\u2605'} Featured
          </div>
        )}
      </div>

      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
          <div className="flex justify-end p-4">
            <button
              type="button"
              onClick={closeLightbox}
              className="text-white text-3xl font-light hover:text-gray-300 px-3"
              aria-label="Close gallery"
            >
              {'\u2715'}
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center relative px-12">
            <Image
              src={appImageSrc(photos[activeIndex].image_url)}
              alt={campsiteName + ' photo ' + (activeIndex + 1)}
              fill
              sizes="100vw"
              className="object-contain"
              unoptimized
            />
            {photos.length > 1 && (
              <button
                type="button"
                onClick={prevPhoto}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-5xl font-light hover:text-gray-300 bg-black/50 rounded-full w-12 h-12 flex items-center justify-center"
                aria-label="Previous photo"
              >
                {'\u2039'}
              </button>
            )}
            {photos.length > 1 && (
              <button
                type="button"
                onClick={nextPhoto}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-5xl font-light hover:text-gray-300 bg-black/50 rounded-full w-12 h-12 flex items-center justify-center"
                aria-label="Next photo"
              >
                {'\u203A'}
              </button>
            )}
          </div>

          <div className="text-center text-white text-sm py-6">
            {activeIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}