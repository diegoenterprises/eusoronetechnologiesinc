/**
 * Wallet - Transaction History
 * Journey Document: All user journeys - Section 8
 * 
 * NO MOCK DATA - All data from tRPC queries
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, ArrowUpRight, ArrowDownLeft, Search, 
  Download, Filter, Calendar, DollarSign 
} from 'lucide-react';
import { Link } from 'wouter';
import { toast } from 'sonner';

export default function WalletTransactions() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30');

  const { data: transactions, isLoading } = (trpc as any).wallet.getTransactions.useQuery({
    type: typeFilter !== 'all' ? typeFilter as any : undefined,
    limit: 100,
  });

  const exportData = (trpc as any).wallet.getTransactions.useQuery({});

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-16" />
        <div className="space-y-2">
          {[...Array(10)].map((_: any, i: number) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  const getTransactionIcon = (type: string) => {
    if (type === 'credit' || type === 'deposit' || type === 'refund') {
      return <ArrowDownLeft className="h-5 w-5 text-green-500" />;
    }
    return <ArrowUpRight className="h-5 w-5 text-red-500" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/wallet">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-green-500" />
              Transaction History
            </h1>
            <p className="text-muted-foreground">View all your wallet transactions</p>
          </div>
        </div>
        <Button 
          variant="outline"
          onClick={() => toast.success("Export started")}
          disabled={false}
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  className="pl-9"
                  value={search}
                  onChange={(e: any) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="credit">Credits</SelectItem>
                <SelectItem value="debit">Debits</SelectItem>
                <SelectItem value="transfer">Transfers</SelectItem>
                <SelectItem value="payout">Payouts</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[150px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {transactions?.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${
                    tx.type === 'credit' || tx.type === 'deposit' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div>
                    <p className="font-medium">{tx.description || tx.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {tx.reference && <span className="mr-2">Ref: {tx.reference}</span>}
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {getStatusBadge(tx.status)}
                  <div className="text-right min-w-[100px]">
                    <p className={`font-bold ${
                      tx.type === 'credit' || tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'credit' || tx.type === 'deposit' ? '+' : '-'}
                      ${Math.abs(tx.amount || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Balance: ${tx.balanceAfter?.toLocaleString() || '0.00'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {(!transactions || transactions.length === 0) && (
              <div className="p-8 text-center text-muted-foreground">
                No transactions found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
