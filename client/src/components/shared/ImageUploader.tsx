import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
}

export function ImageUploader({ files, onChange, maxFiles = 20 }: Props) {
  const [previews, setPreviews] = useState<string[]>([]);

  const onDrop = useCallback(
    (accepted: File[]) => {
      const remaining = maxFiles - files.length;
      const toAdd = accepted.slice(0, remaining);
      const newPreviews = toAdd.map((f) => URL.createObjectURL(f));
      setPreviews((prev) => [...prev, ...newPreviews]);
      onChange([...files, ...toAdd]);
    },
    [files, maxFiles, onChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxFiles: maxFiles - files.length,
    disabled: files.length >= maxFiles,
  });

  function remove(index: number) {
    URL.revokeObjectURL(previews[index]);
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400',
          files.length >= maxFiles && 'opacity-50 cursor-not-allowed',
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
        <p className="text-sm font-medium text-gray-700">
          {isDragActive ? 'Upuść zdjęcia tutaj' : 'Przeciągnij zdjęcia lub kliknij aby wybrać'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          JPG, PNG, WebP • max 10MB • {files.length}/{maxFiles} zdjęć
        </p>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {previews.map((src, i) => (
            <div key={src} className="relative group aspect-square">
              <img
                src={src}
                alt={`Zdjęcie ${i + 1}`}
                className="w-full h-full object-cover rounded-lg border border-gray-200"
              />
              {i === 0 && (
                <span className="absolute top-1 left-1 rounded text-xs bg-primary-600 text-white px-1.5 py-0.5">
                  Główne
                </span>
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 rounded-full bg-red-600 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {previews.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <ImageIcon className="h-4 w-4" />
          <span>Brak zdjęć — dodaj co najmniej jedno</span>
        </div>
      )}
    </div>
  );
}
