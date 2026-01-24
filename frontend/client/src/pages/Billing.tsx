/**
 * BILLING & PAYMENTS PAGE
 * EusoWallet integration for payments and settlements
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wallet, DollarSign, CreditCard, ArrowUpRight, ArrowDownLeft,
  Clock, CheckCircle, XCircle, Search, Filter, Download,
  TrendingUp, Building2, Truck, AlertTriangle, ChevronRight, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Transaction {
  id: string;
  type: "payment" | "receipt" | "refund" | "fee" | "withdrawal";
  description: string;
  loadNumber?: string;
  counterparty: string;
  amount: number;
  fee?: number;
  status: "completed" | "pending" | "failed";
  date: string;
  method: "wallet" | "ach" | "wire" | "card";
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  loadNumber: string;
  customer: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  dueDate: string;
  issuedDate: string;
}

const WALLET_BALANCE = 47250.00;
const PENDING_PAYMENTS = 12500.00;
const AVAILABLE_BALANCE = 34750.00;

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: "t1", type: "receipt", description: "Load Payment", loadNumber: "LOAD-45898", counterparty: "Shell Oil Company", amount: 4200, status: "completed", date: "Jan 22, 2026", method: "wallet" },
  { id: "t2", type: "payment", description: "Carrier Payment", loadNumber: "LOAD-45898", counterparty: "ABC Transport", amount: -3600, status: "completed", date: "Jan 22, 2026", method: "wallet" },
  { id: "t3", type: "fee", description: "Platform Fee (3%)", loadNumber: "LOAD-45898", counterparty: "EusoTrip", amount: -126, status: "completed", date: "Jan 22, 2026", method: "wallet" },
  { id: "t4", type: "receipt", description: "Load Payment", loadNumber: "LOAD-45895", counterparty: "Exxon Mobil", amount: 3200, status: "pending", date: "Jan 23, 2026", method: "ach" },
  { id: "t5", type: "withdrawal", description: "Bank Transfer", counterparty: "Wells Fargo ****4521", amount: -10000, status: "completed", date: "Jan 20, 2026", method: "ach" },
  { id: "t6", type: "receipt", description: "Quick Pay Fee", loadNumber: "LOAD-45890", counterparty: "Chevron", amount: 2800, status: "completed", date: "Jan 19, 2026", method: "wallet" },
];

const MOCK_INVOICES: Invoice[] = [
  { id: "i1", invoiceNumber: "INV-2026-0145", loadNumber: "LOAD-45901", customer: "Shell Oil Company", amount: 2800, status: "pending", dueDate: "Feb 7, 2026", issuedDate: "Jan 23, 2026" },
  { id: "i2", invoiceNumber: "INV-2026-0144", loadNumber: "LOAD-45898", customer: "Exxon Mobil", amount: 3200, status: "paid", dueDate: "Feb 5, 2026", issuedDate: "Jan 21, 2026" },
  { id: "i3", invoiceNumber: "INV-2026-0140", loadNumber: "LOAD-45890", customer: "Valero Energy", amount: 4500, status: "overdue", dueDate: "Jan 15, 2026", issuedDate: "Jan 1, 2026" },
];

const STATS = {
  totalRevenue: 156780,
  pendingReceivables: 18500,
  paidThisMonth: 124500,
  avgDaysToPayment: 4.2,
};

export default function Billing() {
  const [transactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [invoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.counterparty.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.loadNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleWithdraw = () => {
    toast.success("Withdrawal initiated", {
      description: "Funds will be transferred within 1-2 business days.",
    });
  };

  const handleAddFunds = () => {
    toast.info("Add Funds", {
      description: "ACH transfer initiated. Funds available in 2-3 business days.",
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Billing & Payments</h1>
          <p className="text-slate-400">Manage your EusoWallet and transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-600" onClick={handleAddFunds}>
            <Plus className="w-4 h-4 mr-2" />
            Add Funds
          </Button>
          <Button className="bg-green-600 hover:bg-green-700" onClick={handleWithdraw}>
            <ArrowUpRight className="w-4 h-4 mr-2" />
            Withdraw
          </Button>
        </div>
      </div>

      {/* Wallet Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Wallet className="w-10 h-10 text-blue-400" />
              <Badge className="bg-green-500/20 text-green-400">Active</Badge>
            </div>
            <p className="text-slate-400 text-sm">EusoWallet Balance</p>
            <p className="text-4xl font-bold text-white mt-1">
              ${WALLET_BALANCE.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Available</span>
                <span className="text-green-400">${AVAILABLE_BALANCE.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-slate-400">Pending</span>
                <span className="text-yellow-400">${PENDING_PAYMENTS.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <ArrowDownLeft className="w-10 h-10 text-green-400" />
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-slate-400 text-sm">Revenue (This Month)</p>
            <p className="text-3xl font-bold text-white mt-1">
              ${STATS.totalRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-green-400 mt-2">+12.5% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-10 h-10 text-yellow-400" />
              <span className="text-2xl font-bold text-white">{STATS.avgDaysToPayment}</span>
            </div>
            <p className="text-slate-400 text-sm">Avg Days to Payment</p>
            <p className="text-3xl font-bold text-white mt-1">
              ${STATS.pendingReceivables.toLocaleString()}
            </p>
            <p className="text-xs text-slate-400 mt-2">in pending receivables</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Pay Banner */}
      <Card className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-medium">Quick Pay Available</p>
                <p className="text-sm text-slate-400">Get paid within 24 hours for a 2% fee</p>
              </div>
            </div>
            <Button className="bg-purple-600 hover:bg-purple-700">
              Enable Quick Pay
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Transactions */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Recent Transactions</CardTitle>
                  <Button variant="ghost" size="sm" className="text-slate-400">
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((txn) => (
                    <div key={txn.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          txn.amount > 0 ? "bg-green-500/20" : "bg-red-500/20"
                        )}>
                          {txn.amount > 0 ? (
                            <ArrowDownLeft className="w-5 h-5 text-green-400" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5 text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{txn.description}</p>
                          <p className="text-xs text-slate-400">{txn.counterparty}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "font-medium",
                          txn.amount > 0 ? "text-green-400" : "text-red-400"
                        )}>
                          {txn.amount > 0 ? "+" : ""}${Math.abs(txn.amount).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500">{txn.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Outstanding Invoices */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Outstanding Invoices</CardTitle>
                  <Button variant="ghost" size="sm" className="text-slate-400">
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoices.filter(i => i.status !== "paid").map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white text-sm font-medium">{inv.invoiceNumber}</p>
                          <Badge className={cn(
                            "text-xs",
                            inv.status === "pending" && "bg-yellow-500/20 text-yellow-400",
                            inv.status === "overdue" && "bg-red-500/20 text-red-400"
                          )}>
                            {inv.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400">{inv.customer}</p>
                        <p className="text-xs text-slate-500">Due: {inv.dueDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">${inv.amount.toLocaleString()}</p>
                        <Button size="sm" variant="outline" className="mt-1 border-slate-600 text-xs">
                          Send Reminder
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Transaction History</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search..."
                      className="pl-9 w-64 bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                  <Button variant="outline" className="border-slate-600">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-slate-400 border-b border-slate-700">
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Description</th>
                      <th className="pb-3">Load #</th>
                      <th className="pb-3">Counterparty</th>
                      <th className="pb-3">Method</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((txn) => (
                      <tr key={txn.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                        <td className="py-3 text-sm text-slate-300">{txn.date}</td>
                        <td className="py-3 text-sm text-white">{txn.description}</td>
                        <td className="py-3">
                          {txn.loadNumber ? (
                            <Badge variant="outline" className="text-xs text-slate-400">
                              {txn.loadNumber}
                            </Badge>
                          ) : "-"}
                        </td>
                        <td className="py-3 text-sm text-slate-300">{txn.counterparty}</td>
                        <td className="py-3">
                          <Badge variant="outline" className="text-xs text-slate-400 uppercase">
                            {txn.method}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <Badge className={cn(
                            "text-xs",
                            txn.status === "completed" && "bg-green-500/20 text-green-400",
                            txn.status === "pending" && "bg-yellow-500/20 text-yellow-400",
                            txn.status === "failed" && "bg-red-500/20 text-red-400"
                          )}>
                            {txn.status}
                          </Badge>
                        </td>
                        <td className={cn(
                          "py-3 text-sm text-right font-medium",
                          txn.amount > 0 ? "text-green-400" : "text-red-400"
                        )}>
                          {txn.amount > 0 ? "+" : ""}${Math.abs(txn.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Invoices</CardTitle>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Invoice
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        inv.status === "paid" && "bg-green-500/20",
                        inv.status === "pending" && "bg-yellow-500/20",
                        inv.status === "overdue" && "bg-red-500/20"
                      )}>
                        {inv.status === "paid" && <CheckCircle className="w-5 h-5 text-green-400" />}
                        {inv.status === "pending" && <Clock className="w-5 h-5 text-yellow-400" />}
                        {inv.status === "overdue" && <AlertTriangle className="w-5 h-5 text-red-400" />}
                      </div>
                      <div>
                        <p className="text-white font-medium">{inv.invoiceNumber}</p>
                        <p className="text-sm text-slate-400">{inv.customer}</p>
                        <p className="text-xs text-slate-500">Load: {inv.loadNumber} • Issued: {inv.issuedDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xl font-bold text-white">${inv.amount.toLocaleString()}</p>
                        <p className="text-xs text-slate-400">Due: {inv.dueDate}</p>
                      </div>
                      <Badge className={cn(
                        inv.status === "paid" && "bg-green-500/20 text-green-400",
                        inv.status === "pending" && "bg-yellow-500/20 text-yellow-400",
                        inv.status === "overdue" && "bg-red-500/20 text-red-400"
                      )}>
                        {inv.status}
                      </Badge>
                      <Button size="sm" variant="outline" className="border-slate-600">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white">Payout Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bank Account */}
              <div className="p-4 rounded-lg bg-slate-700/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Building2 className="w-10 h-10 text-blue-400" />
                    <div>
                      <p className="text-white font-medium">Wells Fargo Business Checking</p>
                      <p className="text-sm text-slate-400">****4521 • Verified</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500/20 text-green-400">Primary</Badge>
                    <Button size="sm" variant="outline" className="border-slate-600">Edit</Button>
                  </div>
                </div>
              </div>

              {/* Payout Schedule */}
              <div>
                <p className="text-white font-medium mb-3">Automatic Payout Schedule</p>
                <div className="grid grid-cols-3 gap-3">
                  {["Daily", "Weekly", "Monthly"].map((schedule) => (
                    <Button
                      key={schedule}
                      variant={schedule === "Weekly" ? "default" : "outline"}
                      className={schedule === "Weekly" ? "bg-blue-600" : "border-slate-600"}
                    >
                      {schedule}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Automatic payouts occur every Monday. Minimum payout: $100
                </p>
              </div>

              {/* Add Bank Account */}
              <Button variant="outline" className="w-full border-dashed border-slate-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Bank Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
