type ItemPhotoProps = {
  itemId: string;
  photoKey?: string | null;
  alt: string;
  className?: string;
};

export default function ItemPhoto({
  itemId,
  photoKey,
  alt,
  className = "h-40 w-full rounded-lg border border-neutral-200 object-cover",
}: ItemPhotoProps) {
  if (!photoKey) {
    return null;
  }

  return (
    <img
      src={`/items/${itemId}/photo`}
      alt={alt}
      className={className}
      loading="lazy"
    />
  );
}
