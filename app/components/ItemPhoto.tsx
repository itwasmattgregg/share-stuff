import { useState } from "react";

import { hasItemPhoto } from "~/utils/item-photo-url";

type ItemPhotoProps = {
  itemId: string;
  photoKey?: string | null;
  photoUrl?: string | null;
  alt: string;
  className?: string;
};

export default function ItemPhoto({
  itemId,
  photoKey,
  photoUrl,
  alt,
  className = "h-40 w-full rounded-lg border border-neutral-200 object-cover",
}: ItemPhotoProps) {
  const [remoteFailed, setRemoteFailed] = useState(false);

  if (!hasItemPhoto({ photoKey, photoUrl })) {
    return null;
  }

  // Uploaded photos always win over external lookup URLs.
  if (photoKey) {
    return (
      <img
        src={`/items/${itemId}/photo`}
        alt={alt}
        className={className}
        loading="lazy"
      />
    );
  }

  if (!photoUrl || remoteFailed) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-neutral-100 text-sm text-neutral-500`}
        role="img"
        aria-label={alt}
      >
        No photo available
      </div>
    );
  }

  return (
    <img
      src={photoUrl}
      alt={alt}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setRemoteFailed(true)}
    />
  );
}
