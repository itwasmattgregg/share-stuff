import { useEffect, useRef, useState } from "react";

import { compressItemPhoto } from "~/utils/compress-image.client";
import { hasItemPhoto } from "~/utils/item-photo-url";

type ItemPhotoFieldProps = {
  itemId?: string;
  photoKey?: string | null;
  photoUrl?: string | null;
  /** Controlled external URL from lookup (create form). */
  lookupPhotoUrl?: string | null;
  onLookupPhotoUrlChange?: (url: string | null) => void;
  allowUpload?: boolean;
  error?: string;
};

export default function ItemPhotoField({
  itemId,
  photoKey,
  photoUrl,
  lookupPhotoUrl,
  onLookupPhotoUrlChange,
  allowUpload = true,
  error,
}: ItemPhotoFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [remoteFailed, setRemoteFailed] = useState(false);

  const externalUrl = lookupPhotoUrl ?? photoUrl ?? null;
  const existingUploadedUrl =
    itemId && photoKey && !removePhoto ? `/items/${itemId}/photo` : null;
  const existingExternalUrl =
    !photoKey && externalUrl && !removePhoto ? externalUrl : null;
  const existingPhotoUrl = existingUploadedUrl ?? existingExternalUrl;

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    setRemoteFailed(false);
  }, [externalUrl]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setLocalError(null);
    setRemovePhoto(false);

    if (!file) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      return;
    }

    setCompressing(true);

    try {
      const compressed = await compressItemPhoto(file);
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(compressed);

      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
      }

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl(URL.createObjectURL(compressed));
    } catch (compressionError) {
      event.target.value = "";
      setLocalError(
        compressionError instanceof Error
          ? compressionError.message
          : "Could not compress that photo."
      );
    } finally {
      setCompressing(false);
    }
  }

  function handleRemoveExistingPhoto() {
    setRemovePhoto(true);
    setLocalError(null);

    // Only drop the lookup/external URL when that is what is currently shown.
    if (!photoKey) {
      onLookupPhotoUrlChange?.(null);
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const displayError = error ?? localError;
  const showExistingPhoto = existingPhotoUrl && !previewUrl;
  const showRemoteFallback =
    showExistingPhoto && existingExternalUrl && remoteFailed;
  const hasExisting = hasItemPhoto({ photoKey, photoUrl: externalUrl });

  // Keep external URL when removing an uploaded photo so it can fall back.
  const submittedPhotoUrl =
    removePhoto && !photoKey ? "" : externalUrl ?? "";

  return (
    <div>
      <label htmlFor="photo" className="block text-sm font-medium text-gray-700">
        Photo (optional)
      </label>
      <p className="mt-1 text-sm text-gray-500">
        {externalUrl && !photoKey
          ? allowUpload
            ? "Using the cover from lookup. Upload your own photo to replace it."
            : "Using the cover from lookup."
          : allowUpload
          ? "Add one photo to help folks recognize the item. Images are resized on your device before upload."
          : "No photo yet."}
      </p>

      {(showExistingPhoto || previewUrl) && (
        <div className="mt-3">
          {showRemoteFallback ? (
            <div className="flex h-48 w-full max-w-sm items-center justify-center rounded-lg border border-gray-200 bg-neutral-100 text-sm text-neutral-500">
              Cover unavailable
            </div>
          ) : (
            <img
              src={previewUrl ?? existingPhotoUrl ?? undefined}
              alt="Item preview"
              className="h-48 w-full max-w-sm rounded-lg border border-gray-200 object-cover"
              referrerPolicy="no-referrer"
              onError={() => {
                if (!previewUrl && existingExternalUrl) {
                  setRemoteFailed(true);
                }
              }}
            />
          )}
        </div>
      )}

      {/* Persist lookup URL unless the user clears an external-only photo */}
      <input type="hidden" name="photoUrl" value={submittedPhotoUrl} />

      <div className="mt-3 space-y-3">
        {allowUpload ? (
          <input
            ref={fileInputRef}
            id="photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100"
          />
        ) : null}

        {compressing ? (
          <p className="text-sm text-gray-500">Compressing photo...</p>
        ) : null}

        {(showExistingPhoto || (hasExisting && !previewUrl)) && !removePhoto ? (
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="removePhoto"
              value="true"
              checked={removePhoto}
              onChange={(event) => {
                if (event.target.checked) {
                  handleRemoveExistingPhoto();
                } else {
                  setRemovePhoto(false);
                }
              }}
              className="rounded border-gray-300 text-danger-600 shadow-sm focus:border-danger-300 focus:ring focus:ring-danger-200 focus:ring-opacity-50"
            />
            Remove current photo
          </label>
        ) : null}
      </div>

      {displayError ? (
        <div className="pt-2 text-sm text-danger-700">{displayError}</div>
      ) : null}
    </div>
  );
}
