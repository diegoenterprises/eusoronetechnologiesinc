/**
 * SIGNATURE CANVAS COMPONENT
 * DocuSign-style signature capture with gradient ink
 * Gradient flows from cyan-400 to emerald-400 across the signature
 */

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { X, Check, RotateCcw, Download, FileSignature } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignatureCanvasProps {
  onSave: (signatureData: SignatureData) => void;
  onCancel?: () => void;
  signerName: string;
  signerRole?: string;
  documentName?: string;
  documentType?: string;
  className?: string;
  width?: number;
  height?: number;
  showLegalText?: boolean;
}

export interface SignatureData {
  imageDataUrl: string;
  signedAt: string;
  signerName: string;
  signerRole?: string;
  ipAddress?: string;
  userAgent?: string;
}

export function SignatureCanvas({
  onSave,
  onCancel,
  signerName,
  signerRole,
  documentName,
  documentType,
  className,
  width = 600,
  height = 200,
  showLegalText = true,
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  // Gradient colors matching app theme
  const gradientStart = "#22d3ee"; // cyan-400
  const gradientEnd = "#34d399"; // emerald-400

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    // Set up canvas
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 3;

    // Clear with transparent background
    context.clearRect(0, 0, width, height);

    // Draw signature line
    context.strokeStyle = "rgba(148, 163, 184, 0.3)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(40, height - 40);
    context.lineTo(width - 40, height - 40);
    context.stroke();

    // Draw X marker
    context.fillStyle = "rgba(148, 163, 184, 0.5)";
    context.font = "24px sans-serif";
    context.fillText("✕", 20, height - 35);

    // Reset line width for drawing
    context.lineWidth = 3;
    setCtx(context);
  }, [width, height]);

  const getGradientColor = useCallback((x: number): string => {
    // Calculate gradient position based on x coordinate
    const ratio = Math.min(Math.max(x / width, 0), 1);
    
    // Parse colors
    const startR = parseInt(gradientStart.slice(1, 3), 16);
    const startG = parseInt(gradientStart.slice(3, 5), 16);
    const startB = parseInt(gradientStart.slice(5, 7), 16);
    
    const endR = parseInt(gradientEnd.slice(1, 3), 16);
    const endG = parseInt(gradientEnd.slice(3, 5), 16);
    const endB = parseInt(gradientEnd.slice(5, 7), 16);
    
    // Interpolate
    const r = Math.round(startR + (endR - startR) * ratio);
    const g = Math.round(startG + (endG - startG) * ratio);
    const b = Math.round(startB + (endB - startB) * ratio);
    
    return `rgb(${r}, ${g}, ${b})`;
  }, [width]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    setIsDrawing(true);
    setLastPoint(coords);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !ctx || !lastPoint) return;
    e.preventDefault();

    const coords = getCoordinates(e);

    // Create gradient stroke
    ctx.strokeStyle = getGradientColor(coords.x);
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    setLastPoint(coords);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPoint(null);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Redraw signature line
    ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, height - 40);
    ctx.lineTo(width - 40, height - 40);
    ctx.stroke();

    // Redraw X marker
    ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
    ctx.font = "24px sans-serif";
    ctx.fillText("✕", 20, height - 35);

    ctx.lineWidth = 3;
    setHasSignature(false);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    const signatureData: SignatureData = {
      imageDataUrl: canvas.toDataURL("image/png"),
      signedAt: new Date().toISOString(),
      signerName,
      signerRole,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    };

    onSave(signatureData);
  };

  return (
    <Card className={cn("bg-slate-800/50 border-slate-700/50 rounded-xl", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2">
          <FileSignature className="w-5 h-5 text-cyan-400" />
          Sign Document
        </CardTitle>
        {documentName && (
          <p className="text-sm text-slate-400">
            {documentType && <span className="text-cyan-400">[{documentType}]</span>} {documentName}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Signing as:</span>
            <span className="text-white font-medium">{signerName}</span>
            {signerRole && (
              <span className="text-xs text-cyan-400 bg-cyan-500/20 px-2 py-1 rounded">{signerRole}</span>
            )}
          </div>
        </div>

        <div className="relative">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="w-full bg-white rounded-lg cursor-crosshair touch-none"
            style={{ maxWidth: "100%", height: "auto", aspectRatio: `${width}/${height}` }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          {!hasSignature && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-slate-400 text-sm">Draw your signature above</p>
            </div>
          )}
        </div>

        {showLegalText && (
          <p className="text-xs text-slate-500 leading-relaxed">
            By signing above, I agree that this electronic signature is the legal equivalent of my handwritten 
            signature and that I have reviewed and agree to the terms of this document. This signature will be 
            legally binding and enforceable.
          </p>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-4 pt-4 border-t border-slate-700/50">
        <Button
          variant="outline"
          onClick={clearSignature}
          className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 rounded-lg"
          disabled={!hasSignature}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Clear
        </Button>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 rounded-lg"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}
          <Button
            onClick={saveSignature}
            disabled={!hasSignature}
            className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg"
          >
            <Check className="w-4 h-4 mr-2" />
            Sign & Accept
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

// Compact inline signature for forms
export function SignatureField({
  value,
  onChange,
  signerName,
  label = "Signature",
  required = false,
  className,
}: {
  value?: string;
  onChange: (signatureData: SignatureData | null) => void;
  signerName: string;
  label?: string;
  required?: boolean;
  className?: string;
}) {
  const [showCanvas, setShowCanvas] = useState(false);

  const handleSave = (data: SignatureData) => {
    onChange(data);
    setShowCanvas(false);
  };

  const handleClear = () => {
    onChange(null);
  };

  if (showCanvas) {
    return (
      <SignatureCanvas
        signerName={signerName}
        onSave={handleSave}
        onCancel={() => setShowCanvas(false)}
        width={500}
        height={150}
        showLegalText={false}
        className={className}
      />
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm text-slate-400">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {value ? (
        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={value} alt="Signature" className="h-12 object-contain" />
              <div>
                <p className="text-sm text-white">{signerName}</p>
                <p className="text-xs text-slate-500">Signed</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowCanvas(true)}
          className="w-full h-16 bg-slate-900/50 border-slate-700/50 border-dashed hover:bg-slate-800/50 rounded-lg"
        >
          <FileSignature className="w-5 h-5 mr-2 text-cyan-400" />
          <span className="text-slate-400">Click to sign</span>
        </Button>
      )}
    </div>
  );
}

export default SignatureCanvas;
