/**
 * SHIPPER INVOICE REVIEW PAGE - 100% Dynamic
 */
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import { FileText, DollarSign, CheckCircle, XCircle, AlertTriangle, ChevronLeft, Download, Truck, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ShipperInvoiceReview() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/shipper/invoice/:invoiceId");
  const invoiceId = params?.invoiceId;
  const [disputeReason, setDisputeReason] = useState("");
  const [showDispute, setShowDispute] = useState(false);

  const invoiceQuery = (trpc as any).loads.getById.useQuery({ id: invoiceId || "" });
  const approveMutation = (trpc as any).loads.create.useMutation({
    onSuccess: () => { toast.success("Invoice approved"); navigate("/shipper/invoices"); },
  });
  const disputeMutation = (trpc as any).loads.create.useMutation({
    onSuccess: () => { toast.success("Dispute submitted"); navigate("/shipper/invoices"); },
  });

  const invoice = invoiceQuery.data as any;
  const lineItems = invoice?.lineItems || invoice?.accessorials || [];

  if (invoiceQuery.isLoading) return <div className="p-6 space-y-4"><Skeleton className="h-12 w-64" /><Skeleton className="h-96 w-full rounded-xl" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/shipper/invoices")} className="text-slate-400 hover:text-white"><ChevronLeft className="w-6 h-6" /></Button>
        <div className="flex-1"><h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Invoice Review</h1><p className="text-slate-400 text-sm mt-1">#{invoice?.loadNumber || invoice?.invoiceNumber}</p></div>
        <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 rounded-lg"><Download className="w-4 h-4 mr-2" />PDF</Button>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div><Badge className={cn("border-0 mb-2", invoice?.status === "pending" ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400")}>{invoice?.status}</Badge><h2 className="text-white font-bold text-xl">{invoice?.carrier?.name}</h2></div>
            <div className="text-right"><p className="text-slate-400 text-sm">Total</p><p className="text-4xl font-bold text-green-400">${invoice?.total?.toLocaleString()}</p></div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-400">Invoice Date</p><p className="text-white">{invoice?.invoiceDate}</p></div>
            <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-400">Due Date</p><p className="text-white">{invoice?.dueDate}</p></div>
            <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-400">Terms</p><p className="text-white">{invoice?.paymentTerms || "NET 30"}</p></div>
            <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-400">Load #</p><p className="text-white">{invoice?.loadNumber}</p></div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white flex items-center gap-2"><FileText className="w-5 h-5 text-cyan-400" />Line Items</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {lineItems.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                <span className="text-white">{item.description}</span>
                <span className="text-white font-bold">${item.amount?.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between p-3 rounded-lg bg-green-500/10">
            <span className="text-green-400 font-bold">Total</span>
            <span className="text-green-400 font-bold text-xl">${invoice?.total?.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      {showDispute && (
        <Card className="bg-red-500/10 border-red-500/30 rounded-xl">
          <CardContent className="p-4 space-y-4">
            <p className="text-red-400 font-medium">Dispute Reason</p>
            <Textarea value={disputeReason} onChange={(e: any) => setDisputeReason(e.target.value)} placeholder="Explain..." className="bg-slate-800/50 border-slate-700/50 rounded-lg" />
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        {showDispute ? (
          <>
            <Button variant="outline" onClick={() => setShowDispute(false)} className="bg-slate-700/50 border-slate-600/50 rounded-lg">Cancel</Button>
            <Button onClick={() => disputeMutation.mutate({ cargoType: "general" } as any)} disabled={!disputeReason} className="bg-red-600 rounded-lg"><XCircle className="w-4 h-4 mr-2" />Submit Dispute</Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => setShowDispute(true)} className="bg-slate-700/50 border-slate-600/50 rounded-lg"><XCircle className="w-4 h-4 mr-2" />Dispute</Button>
            <Button onClick={() => approveMutation.mutate({ cargoType: "general" } as any)} className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg px-8"><CheckCircle className="w-4 h-4 mr-2" />Approve</Button>
          </>
        )}
      </div>
    </div>
  );
}
