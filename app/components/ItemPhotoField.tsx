import { useEffect, useRef, useState } from "react";

import { compressItemPhoto } from "~/utils/compress-image.client";

type ItemPhotoFieldProps = {
  itemId?: string;
  photoKey?: string | null;
  error?: string;
};

export default function ItemPhotoField({
  itemId,
  photoKey,
  error,
}: ItemPhotoFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [removePhoto, setRemovePhoto] = useState(false);

  const existingPhotoUrl =
    itemId && photoKey && !removePhoto ? `/items/${itemId}/photo` : null;

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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

  return (
    <div>
      <label htmlFor="photo" className="block text-sm font-medium text-gray-700">
        Photo (optional)
      </label>
      <p className="mt-1 text-sm text-gray-500">
        Add one photo to help folks recognize the item. Images are resized on
        your device before upload.
      </p>

      {(showExistingPhoto || previewUrl) && (
        <div className="mt-3">
          <img
            src={previewUrl ?? existingPhotoUrl ?? undefined}
            alt="Item preview"
            className="h-48 w-full max-w-sm rounded-lg border border-gray-200 object-cover"
          />
        </div>
      )}

      <div className="mt-3 space-y-3">
        <input
          ref={fileInputRef}
          id="photo"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100"
        />

        {compressing ? (
          <p className="text-sm text-gray-500">Compressing photo...</p>
        ) : null}

        {showExistingPhoto ? (
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
