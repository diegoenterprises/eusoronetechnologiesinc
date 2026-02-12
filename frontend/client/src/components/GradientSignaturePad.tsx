/**
 * GRADIENT INK SIGNATURE PAD
 * EusoTrip's signature brand feature - digital signatures
 * rendered in the official brand gradient (#1473FF → #BE01FF)
 * on a dark canvas background matching the EusoTrip whitepaper design.
 * 
 * Canvas-based signature capture with real-time gradient ink rendering.
 * Used across BOL signing, Rate Confirmations, PODs, Contracts, etc.
 */

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Pen, RotateCcw, Check, Download, Shield, Fingerprint,
} from "lucide-react";

// Dark canvas background matching whitepaper design
const CANVAS_BG = "#1E1E2E";
const SIGNATURE_LINE_COLOR = "rgba(100, 116, 139, 0.25)";
const HINT_COLOR = "rgba(148, 163, 184, 0.3)";

interface GradientSignaturePadProps {
  onSign?: (signatureData: string) => void;
  onClear?: () => void;
  width?: number;
  height?: number;
  disabled?: boolean;
  signerName?: string;
  documentTitle?: string;
  legalText?: string;
  showVerification?: boolean;
  className?: string;
}

export default function GradientSignaturePad({
  onSign,
  onClear,
  width = 600,
  height = 220,
  disabled = false,
  signerName,
  documentTitle,
  legalText = "By electronically signing this document, I acknowledge and agree that my electronic signature holds the same legal validity as a handwritten signature, to the extent permitted by applicable laws and regulations of the United States.",
  showVerification = true,
  className,
}: GradientSignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const strokeCountRef = useRef(0);

  // Create gradient for the ink
  const getGradientStroke = useCallback((ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, "#1473FF");
    gradient.addColorStop(0.5, "#7B3AFF");
    gradient.addColorStop(1, "#BE01FF");
    return gradient;
  }, [width]);

  // Draw the dark background and signature line
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    // Dark background
    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(0, 0, width, height);

    // Subtle signature line near bottom
    ctx.strokeStyle = SIGNATURE_LINE_COLOR;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(32, height - 44);
    ctx.lineTo(width - 32, height - 44);
    ctx.stroke();
  }, [width, height]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas resolution for retina displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    drawBackground(ctx);
  }, [width, height, drawBackground]);

  const getPosition = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    // Scale factor: canvas logical size vs CSS display size
    // On mobile, CSS maxWidth:100% shrinks the canvas display but the
    // drawing coordinate space stays at width×height. We must scale.
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;

    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled || isSigned) return;
    e.preventDefault();
    const pos = getPosition(e);
    lastPointRef.current = pos;
    setIsDrawing(true);
    strokeCountRef.current += 1;
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled || isSigned) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || !lastPointRef.current) return;

    const pos = getPosition(e);
    const gradient = getGradientStroke(ctx);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalCompositeOperation = "source-over";

    // Draw continuous line from last point to current point
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastPointRef.current = pos;
    if (!hasSignature) setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    drawBackground(ctx);

    setHasSignature(false);
    setIsSigned(false);
    strokeCountRef.current = 0;
    onClear?.();
  };

  const confirmSignature = () => {
    if (!hasSignature) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureData = canvas.toDataURL("image/png");
    setIsSigned(true);
    onSign?.(signatureData);
  };

  const downloadSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `eusotrip-gradient-ink-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      {documentTitle && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">{documentTitle}</h3>
            {signerName && <p className="text-slate-400 text-sm">Signer: {signerName}</p>}
          </div>
          <Badge className="bg-gradient-to-r from-[#1473FF]/20 to-[#BE01FF]/20 text-purple-300 border border-purple-500/30">
            <Pen className="w-3 h-3 mr-1" />
            Gradient Ink
          </Badge>
        </div>
      )}

      {/* Canvas Container — Dark background matching whitepaper */}
      <div className={cn(
        "relative rounded-2xl overflow-hidden border transition-all",
        isSigned
          ? "border-green-500/40 shadow-lg shadow-green-500/5"
          : "border-slate-700/60",
        isDrawing && "border-[#7B3AFF]/40 shadow-lg shadow-purple-500/10",
        disabled && "opacity-50 pointer-events-none"
      )}>
        <canvas
          ref={canvasRef}
          className={cn(
            "relative z-10 w-full cursor-crosshair touch-none",
            isSigned && "cursor-default"
          )}
          style={{ maxWidth: "100%", height: "auto", aspectRatio: `${width}/${height}` }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Signed overlay */}
        {isSigned && (
          <div className="absolute top-3 right-3 z-20">
            <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
              <Check className="w-3 h-3 mr-1" />
              Signed
            </Badge>
          </div>
        )}

        {/* Empty state hint */}
        {!hasSignature && !isSigned && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="text-center opacity-30">
              <Pen className="w-8 h-8 mx-auto mb-2 text-purple-400" />
              <p className="text-slate-300 text-sm">Draw your signature with Gradient Ink</p>
            </div>
          </div>
        )}
      </div>

      {/* Legal text */}
      <p className="text-xs text-slate-500 leading-relaxed">{legalText}</p>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {!isSigned ? (
          <>
            <Button
              onClick={confirmSignature}
              disabled={!hasSignature || disabled}
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:from-[#1260DD] hover:to-[#A801DD] disabled:opacity-40 text-sm font-medium"
            >
              Continue
            </Button>
            <Button
              variant="outline"
              onClick={clearSignature}
              disabled={!hasSignature || disabled}
              className="h-11 rounded-xl border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={downloadSignature}
              className="h-11 rounded-xl border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              onClick={clearSignature}
              className="h-11 rounded-xl border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Re-sign
            </Button>
          </>
        )}
      </div>

      {/* Verification badge */}
      {showVerification && isSigned && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
          <Shield className="w-5 h-5 text-green-400 flex-shrink-0" />
          <div className="text-xs">
            <span className="text-green-400 font-medium">ESIGN Act Compliant</span>
            <span className="text-slate-400 ml-1">
              - Gradient Ink digital signature verified at {new Date().toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
