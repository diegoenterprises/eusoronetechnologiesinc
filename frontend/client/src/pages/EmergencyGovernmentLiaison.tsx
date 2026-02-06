/**
 * EMERGENCY GOVERNMENT LIAISON — Federal/state partnership tools
 * Contacts for FEMA, DOE, DOT, PHMSA, CISA + partnership programs.
 * 
 * NO MOCK DATA - All data from tRPC queries
 */

import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import {
  ArrowLeft, Globe, Building, Phone, Shield, ExternalLink,
  CheckCircle, Siren, Users, MapPin
} from 'lucide-react';

export default function EmergencyGovernmentLiaison() {
  const contactsQuery = (trpc as any).emergencyResponse.getGovernmentContacts.useQuery();
  const data = contactsQuery.data;

  if (contactsQuery.isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4">{[...Array(6)].map((_: any, i: number) => <Skeleton key={i} className="h-24" />)}</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/emergency/command-center">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
            <Globe className="h-6 w-6 text-purple-400" />
            Government Liaison Portal
          </h1>
          <p className="text-slate-400 text-sm">Federal & state emergency coordination contacts and partnership programs</p>
        </div>
      </div>

      {/* Federal Contacts */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader>
          <CardTitle className="text-slate-200 flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-400" />
            Federal Agency Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data?.federal?.map((contact: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-slate-800/70 border border-slate-700/30 hover:border-blue-500/30 transition-all">
                <div className="p-2 rounded-full bg-blue-500/20 mt-0.5">
                  <Building className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">{contact.agency}</Badge>
                  </div>
                  <p className="text-sm text-slate-300 mt-1">{contact.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{contact.role}</p>
                  <div className="flex items-center gap-1 mt-2 text-sm text-blue-400">
                    <Phone className="w-3 h-3" />
                    {contact.phone}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl border-l-4 border-l-red-500">
        <CardHeader>
          <CardTitle className="text-slate-200 flex items-center gap-2">
            <Siren className="w-5 h-5 text-red-400" />
            Emergency Response Contacts (24/7)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data?.emergency?.map((contact: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-red-900/10 border border-red-500/20">
                <div className="p-2 rounded-full bg-red-500/20">
                  <Siren className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">{contact.name}</p>
                  <p className="text-xs text-slate-500">{contact.role}</p>
                  <div className="flex items-center gap-1 mt-2 text-sm text-red-400">
                    <Phone className="w-3 h-3" />
                    {contact.phone}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Partnership Programs */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader>
          <CardTitle className="text-slate-200 flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-400" />
            Partnership Programs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data?.partnershipPrograms?.map((program: any, i: number) => (
            <div key={i} className="p-4 rounded-lg bg-slate-800/70 border border-slate-700/30">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">{program.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{program.description}</p>
                  <div className="mt-2 p-2 rounded bg-green-900/20 border border-green-500/20">
                    <p className="text-xs text-green-400"><span className="font-medium">EusoTrip Role:</span> {program.eusoTripRole}</p>
                  </div>
                </div>
                {program.url && (
                  <a href={program.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="border-slate-600">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Visit
                    </Button>
                  </a>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* EusoTrip Capabilities */}
      <Card className="bg-gradient-to-r from-slate-800/80 to-blue-900/20 border-slate-700/50 rounded-xl">
        <CardHeader>
          <CardTitle className="text-slate-200 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            EusoTrip Platform Capabilities for Government Partners
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {data?.eusoTripCapabilities?.map((cap: string, i: number) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded bg-slate-800/50">
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                <p className="text-sm text-slate-300">{cap}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
