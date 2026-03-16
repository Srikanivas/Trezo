import React, { useRef, useState } from "react";
import { Upload, X, FileText } from "lucide-react";

interface Props {
  file: File | null;
  onChange: (file: File | null) => void;
}

const ALLOWED = ["image/jpeg", "image/png", "application/pdf"];
const MAX_BYTES = 10 * 1024 * 1024;

const ReceiptUpload: React.FC<Props> = ({ file, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  function validate(f: File): string {
    if (!ALLOWED.includes(f.type)) return "Only JPEG, PNG, and PDF files are accepted";
    if (f.size > MAX_BYTES) return "File size must not exceed 10 MB";
    return "";
  }

  function handleFile(f: File) {
    const err = validate(f);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    onChange(f);
  }

  return (
    <div className="space-y-2">
      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${dragging ? "border-indigo-400 bg-indigo-50" : "border-gray-300 hover:border-indigo-300"}`}
        >
          <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Drag & drop or click to upload receipt</p>
          <p className="text-xs text-gray-400 mt-1">JPEG, PNG, PDF — max 10 MB</p>
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      ) : (
        <div className="flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center gap-2">
            {file.type === "application/pdf" ? (
              <FileText className="h-5 w-5 text-red-500" />
            ) : (
              <img src={URL.createObjectURL(file)} alt="preview" className="h-8 w-8 object-cover rounded" />
            )}
            <span className="text-sm text-gray-700 truncate max-w-[200px]">{file.name}</span>
          </div>
          <button onClick={() => onChange(null)} className="text-gray-400 hover:text-red-500">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default ReceiptUpload;
