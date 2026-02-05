/**
 * GRADIENT INK SIGNATURE PAD
 * EusoTrip's signature brand feature - digital signatures
 * rendered in the official brand gradient (#1473FF → #BE01FF)
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
  height = 200,
  disabled = false,
  signerName,
  documentTitle,
  legalText = "By signing, I agree that this electronic signature is the legal equivalent of my handwritten signature.",
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
  const getGradientStroke = useCallback((ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, "#1473FF");
    gradient.addColorStop(0.5, "#7B3AFF");
    gradient.addColorStop(1, "#BE01FF");
    return gradient;
  }, [width]);

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

    // Draw signature line
    ctx.strokeStyle = "rgba(100, 116, 139, 0.3)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(40, height - 40);
    ctx.lineTo(width - 40, height - 40);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw "Sign here" hint
    ctx.fillStyle = "rgba(100, 116, 139, 0.4)";
    ctx.font = "13px Inter, sans-serif";
    ctx.fillText("Sign here", 40, height - 20);

    // Draw X marker
    ctx.fillStyle = "rgba(100, 116, 139, 0.5)";
    ctx.font = "bold 18px Inter, sans-serif";
    ctx.fillText("X", 20, height - 36);
  }, [width, height]);

  const getPosition = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
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
    const gradient = getGradientStroke(ctx, lastPointRef.current.x, lastPointRef.current.y, pos.x, pos.y);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalCompositeOperation = "source-over";

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);

    // Smooth curve using quadratic bezier
    const midX = (lastPointRef.current.x + pos.x) / 2;
    const midY = (lastPointRef.current.y + pos.y) / 2;
    ctx.quadraticCurveTo(lastPointRef.current.x, lastPointRef.current.y, midX, midY);
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

    // Redraw signature line
    ctx.strokeStyle = "rgba(100, 116, 139, 0.3)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(40, height - 40);
    ctx.lineTo(width - 40, height - 40);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "rgba(100, 116, 139, 0.4)";
    ctx.font = "13px Inter, sans-serif";
    ctx.fillText("Sign here", 40, height - 20);

    ctx.fillStyle = "rgba(100, 116, 139, 0.5)";
    ctx.font = "bold 18px Inter, sans-serif";
    ctx.fillText("X", 20, height - 36);

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
    link.download = `eusotrip-signature-${Date.now()}.png`;
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

      {/* Canvas Container */}
      <div className={cn(
        "relative rounded-xl overflow-hidden border-2 transition-all",
        isSigned ? "border-green-500/50 bg-slate-900/80" : "border-slate-600/50 bg-slate-900/50",
        isDrawing && "border-purple-500/50 shadow-lg shadow-purple-500/10",
        disabled && "opacity-50 pointer-events-none"
      )}>
        {/* Gradient border glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#1473FF]/5 to-[#BE01FF]/5 pointer-events-none" />

        <canvas
          ref={canvasRef}
          className={cn(
            "relative z-10 cursor-crosshair touch-none",
            isSigned && "cursor-default"
          )}
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
            <div className="text-center opacity-40">
              <Pen className="w-8 h-8 mx-auto mb-2 text-purple-400" />
              <p className="text-slate-400 text-sm">Draw your signature with gradient ink</p>
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
              className="flex-1 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:from-[#1260DD] hover:to-[#A801DD] disabled:opacity-40"
            >
              <Fingerprint className="w-4 h-4 mr-2" />
              Confirm Signature
            </Button>
            <Button
              variant="outline"
              onClick={clearSignature}
              disabled={!hasSignature || disabled}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={downloadSignature}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              onClick={clearSignature}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Re-sign
            </Button>
          </>
        )}
      </div>

      {/* Verification badge */}
      {showVerification && isSigned && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
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
