import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { X, Download, Copy, CheckCircle } from "lucide-react";

interface Props {
  address: string;
  companyName?: string;
  onClose: () => void;
}

const WalletQRModal: React.FC<Props> = ({ address, companyName, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, address, {
      width: 240,
      margin: 2,
      color: { dark: "#1e1b4b", light: "#ffffff" },
      errorCorrectionLevel: "M",
    });
  }, [address]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `trezo-wallet-${address.slice(0, 8)}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Receive Funds</h2>
            {companyName && <p className="text-xs text-gray-400 mt-0.5">{companyName}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center px-6 py-6 gap-4">
          <div className="p-3 bg-white rounded-2xl shadow-inner border border-gray-100">
            <canvas ref={canvasRef} className="rounded-xl" />
          </div>

          {/* Pera Wallet hint */}
          <p className="text-xs text-gray-400 text-center">
            Scan with Pera Wallet or any Algorand-compatible wallet to send funds to this treasury.
          </p>

          {/* Address display */}
          <div className="w-full bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200">
            <p className="text-xs text-gray-400 mb-1">Wallet Address</p>
            <p className="font-mono text-xs text-gray-800 break-all leading-relaxed">{address}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 w-full">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 border border-gray-300 text-gray-700 text-xs font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy Address
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-indigo-600 text-white text-xs font-medium rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Save QR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletQRModal;
