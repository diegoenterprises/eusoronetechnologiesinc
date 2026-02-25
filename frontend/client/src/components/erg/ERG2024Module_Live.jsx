import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, AlertTriangle, Phone, ChevronRight, X, MapPin, Flame, Wind, Shield, Zap } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function apiGet(path, signal) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

function normalizeGuide(g) {
  if (!g) return null;
  const guideNumber = g.guide_number ?? g.guideNumber ?? g.num ?? g.number;
  const isolate = g.isolation?.initial?.meters ?? g.initial_isolation_meters ?? g.isolate ?? null;
  const fireIsolate = g.isolation?.fire?.meters ?? g.fire_isolation_meters ?? g.fireIsolate ?? null;
  const hazards = g.hazards?.fire_explosion ?? g.fire_explosion_hazards ?? g.hazards ?? [];
  const health = g.hazards?.health ?? g.health_hazards ?? g.health ?? [];
  const fire = g.emergency_response?.fire ?? g.fire ?? {};
  const spill = g.emergency_response?.spill ?? g.emergency_response?.spill_leak ?? g.spill ?? {};
  const firstAid = g.emergency_response?.first_aid ?? g.first_aid ?? g.firstAid ?? null;

  return {
    num: Number(guideNumber),
    title: g.title ?? '',
    color: g.color ?? '#6B7280',
    isolate: typeof isolate === 'number' ? isolate : Number(isolate || 0) || 0,
    fireIsolate: typeof fireIsolate === 'number' ? fireIsolate : Number(fireIsolate || 0) || 0,
    hazards: Array.isArray(hazards) ? hazards : (hazards ? [String(hazards)] : []),
    health: Array.isArray(health) ? health : (health ? [String(health)] : []),
    fire: {
      small: Array.isArray(fire.small) ? fire.small.join(' ') : (fire.small ?? ''),
      large: Array.isArray(fire.large) ? fire.large.join(' ') : (fire.large ?? ''),
      tank: Array.isArray(fire.tank) ? fire.tank.join(' ') : (fire.tank ?? ''),
    },
    spill: Array.isArray(spill.general) ? spill.general.join(' ') : (spill.general ?? spill.small ?? spill.large ?? ''),
    firstAid: firstAid ? String(firstAid) : '',
  };
}

function normalizeMaterial(r) {
  if (!r) return null;
  const un = String(r.un_number ?? r.unNumber ?? r.id ?? '').replace(/^UN/i, '');
  return {
    id: un,
    name: r.name ?? '',
    guide: Number(r.guide ?? r.guide_number ?? r.guideNumber ?? 111),
    cls: r.hazard_class ?? r.hazardClass ?? r.cls ?? '',
    tih: Boolean(r.is_tih ?? r.isTih ?? r.tih),
  };
}

export default function ERG2024Module() {
  const [tab, setTab] = useState('search');
  const [query, setQuery] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [emergency, setEmergency] = useState(false);

  const [stats, setStats] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [hazardClasses, setHazardClasses] = useState([]);
  const [guideList, setGuideList] = useState([]);
  const [results, setResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingModal, setLoadingModal] = useState(false);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);

  useEffect(() => {
    const ac = new AbortController();
    abortRef.current = ac;

    (async () => {
      try {
        const [s, g, c, hc] = await Promise.all([
          apiGet('/api/v1/erg/stats', ac.signal),
          apiGet('/api/v1/erg/guides', ac.signal),
          apiGet('/api/v1/erg/contacts', ac.signal),
          apiGet('/api/v1/erg/hazard-classes', ac.signal),
        ]);
        setStats(s?.database ?? null);
        setGuideList(Array.isArray(g?.guides) ? g.guides : []);
        setContacts(Array.isArray(c?.contacts) ? c.contacts : []);
        setHazardClasses(Array.isArray(hc?.hazard_classes) ? hc.hazard_classes : []);
      } catch (e) {
        if (e?.name === 'AbortError') return;
        setError(e?.message || 'Failed to load ERG data');
      }
    })();

    return () => ac.abort();
  }, []);

  useEffect(() => {
    if (tab !== 'search') return;
    if (!query || query.length < 2) {
      setResults([]);
      setLoadingSearch(false);
      return;
    }

    const ac = new AbortController();
    setLoadingSearch(true);
    setError(null);

    const t = setTimeout(async () => {
      try {
        const data = await apiGet(`/api/v1/erg/materials/search?q=${encodeURIComponent(query)}&limit=15`, ac.signal);
        const normalized = Array.isArray(data) ? data.map(normalizeMaterial).filter(Boolean) : [];
        setResults(normalized);
      } catch (e) {
        if (e?.name === 'AbortError') return;
        setError(e?.message || 'Search failed');
      } finally {
        setLoadingSearch(false);
      }
    }, 250);

    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [query, tab]);

  const primaryContact = useMemo(() => {
    if (!contacts?.length) return null;
    const preferred = contacts.find(c => c.is_primary && String(c.country || '').toUpperCase() === 'USA');
    if (preferred) return preferred;
    const anyPrimary = contacts.find(c => c.is_primary);
    if (anyPrimary) return anyPrimary;
    return contacts[0];
  }, [contacts]);

  const guideColorByNumber = useMemo(() => {
    const m = new Map();
    for (const g of guideList || []) {
      if (g?.guide_number != null) m.set(Number(g.guide_number), g.color || null);
    }
    return m;
  }, [guideList]);

  const selectMaterial = async (m) => {
    setLoadingModal(true);
    setError(null);
    try {
      const data = await apiGet(`/api/v1/erg/materials/${encodeURIComponent(m.id)}`);
      const material = normalizeMaterial(data?.material);
      const guide = normalizeGuide(data?.guide);
      const protective = data?.protective_distances || null;

      setSelectedMaterial({
        ...material,
        protective_distances: protective,
      });
      setSelectedGuide(guide);
      setShowModal(true);
    } catch (e) {
      setError(e?.message || 'Failed to load material');
    } finally {
      setLoadingModal(false);
    }
  };

  const selectGuide = async (g) => {
    setLoadingModal(true);
    setError(null);
    try {
      const full = await apiGet(`/api/v1/erg/guides/${encodeURIComponent(g.guide_number ?? g.num ?? g.guide ?? g)}`);
      setSelectedMaterial(null);
      setSelectedGuide(normalizeGuide(full));
      setShowModal(true);
    } catch (e) {
      setError(e?.message || 'Failed to load guide');
    } finally {
      setLoadingModal(false);
    }
  };

  return (
    <div className={`min-h-screen ${emergency ? 'bg-red-900' : 'bg-gradient-to-b from-slate-50 to-slate-100'}`}>
      {/* Emergency Toggle */}
      <button onClick={() => setEmergency(!emergency)} className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-full font-bold text-sm shadow-lg ${emergency ? 'bg-white text-red-600 animate-pulse' : 'bg-red-500 text-white hover:bg-red-600'}`}>
        {emergency ? '🚨 EXIT EMERGENCY' : '🚨 EMERGENCY'}
      </button>

      {/* Header */}
      <header className={`${emergency ? 'bg-red-800' : 'bg-white'} shadow-sm sticky top-0 z-40`}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-bold ${emergency ? 'text-white' : 'text-slate-800'}`}>ERG 2024</h1>
              <p className={`text-sm ${emergency ? 'text-red-200' : 'text-slate-500'}`}>
                Emergency Response Guidebook
                {stats?.total_materials ? ` • ${stats.total_materials} Materials` : ''}
                {stats?.total_guides ? ` • ${stats.total_guides} Guides` : ''}
              </p>
            </div>
            <div className="flex gap-2">
              {['search', 'guides', 'classes', 'contacts'].map(t => (
                <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 rounded-lg text-sm font-medium ${tab === t ? (emergency ? 'bg-red-600 text-white' : 'bg-blue-500 text-white') : (emergency ? 'text-red-200 hover:bg-red-700' : 'text-slate-600 hover:bg-slate-100')}`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className={`${emergency ? 'bg-red-800 text-red-100' : 'bg-white text-slate-800'} rounded-2xl shadow-lg p-4 mb-6`}>
            {error}
          </div>
        )}

        {/* Search Tab */}
        {tab === 'search' && (
          <div className="space-y-6">
            <div className={`${emergency ? 'bg-red-800' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
              <div className="relative">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${emergency ? 'text-red-300' : 'text-slate-400'}`} />
                <input type="text" placeholder="Search UN Number or Material Name..." value={query} onChange={(e) => setQuery(e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 rounded-xl text-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${emergency ? 'bg-red-700 text-white placeholder-red-300 border-red-600' : 'bg-slate-50 text-slate-800 placeholder-slate-400 border-slate-200'}`} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`text-sm ${emergency ? 'text-red-300' : 'text-slate-500'}`}>Quick:</span>
                {['1017', '1203', '1075', '3480', '1005'].map(id => (
                  <button key={id} onClick={() => setQuery(id)} className={`px-3 py-1 rounded-full text-sm ${emergency ? 'bg-red-700 text-red-200 hover:bg-red-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>UN{id}</button>
                ))}
              </div>
            </div>

            {results.length > 0 && (
              <div className={`${emergency ? 'bg-red-800' : 'bg-white'} rounded-2xl shadow-lg overflow-hidden`}>
                <div className={`px-6 py-3 border-b ${emergency ? 'border-red-700 bg-red-900' : 'border-slate-100 bg-slate-50'}`}>
                  <h3 className={`font-semibold ${emergency ? 'text-white' : 'text-slate-700'}`}>Results ({results.length})</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {results.map(m => (
                    <button key={m.id} onClick={() => selectMaterial(m)} className={`w-full px-6 py-4 flex items-center justify-between ${emergency ? 'hover:bg-red-700' : 'hover:bg-slate-50'}`}>
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: guideColorByNumber.get(Number(m.guide)) || '#6B7280' }}
                        >
                          {m.guide}
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${emergency ? 'text-white' : 'text-slate-800'}`}>UN{m.id}</span>
                            {m.tih && <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded">TIH</span>}
                          </div>
                          <p className={`text-sm ${emergency ? 'text-red-200' : 'text-slate-600'}`}>{m.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm ${emergency ? 'text-red-300' : 'text-slate-500'}`}>Class {m.cls}</span>
                        <ChevronRight className={`w-5 h-5 ${emergency ? 'text-red-400' : 'text-slate-400'}`} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loadingSearch && (
              <div className={`${emergency ? 'bg-red-800 text-red-200' : 'bg-white text-slate-600'} rounded-2xl shadow-lg p-6`}>
                Searching...
              </div>
            )}
          </div>
        )}

        {/* Guides Tab */}
        {tab === 'guides' && (
          <div className={`${emergency ? 'bg-red-800' : 'bg-white'} rounded-2xl shadow-lg overflow-hidden`}>
            <div className={`px-6 py-4 border-b ${emergency ? 'border-red-700' : 'border-slate-100'}`}>
              <h3 className={`font-bold text-lg ${emergency ? 'text-white' : 'text-slate-800'}`}>Emergency Response Guides</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4">
              {guideList.map(g => (
                <button key={g.guide_number} onClick={() => selectGuide(g.guide_number)} className={`p-4 rounded-xl text-left ${emergency ? 'bg-red-700 hover:bg-red-600' : 'bg-slate-50 hover:bg-slate-100'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#6B7280' }}>{g.guide_number}</div>
                    <p className={`font-semibold text-sm ${emergency ? 'text-white' : 'text-slate-800'}`}>{g.title}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Classes Tab */}
        {tab === 'classes' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(hazardClasses || []).map(hc => (
              <div key={hc.class} className={`${emergency ? 'bg-red-800' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl"
                    style={{ backgroundColor: hc.color || '#6B7280' }}
                  >
                    {hc.icon || String(hc.class)}
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${emergency ? 'text-white' : 'text-slate-800'}`}>Class {hc.class}</p>
                    <p className={emergency ? 'text-red-200' : 'text-slate-600'}>{hc.name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contacts Tab */}
        {tab === 'contacts' && (
          <div className={`${emergency ? 'bg-red-800' : 'bg-white'} rounded-2xl shadow-lg overflow-hidden`}>
            <div className={`px-6 py-4 border-b ${emergency ? 'border-red-700 bg-red-900' : 'border-slate-100 bg-slate-50'}`}>
              <h3 className={`font-bold text-lg ${emergency ? 'text-white' : 'text-slate-800'}`}>24-Hour Emergency Contacts</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {contacts.map((c, i) => (
                <a key={i} href={`tel:${c.phone.replace(/[^0-9+]/g, '')}`} className={`flex items-center justify-between px-6 py-4 ${emergency ? 'hover:bg-red-700' : 'hover:bg-slate-50'}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${emergency ? 'text-white' : 'text-slate-800'}`}>{c.name}</span>
                      {c.is_primary && <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded">PRIMARY</span>}
                    </div>
                    <p className={`text-sm ${emergency ? 'text-red-300' : 'text-slate-500'}`}>{c.country}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-mono ${emergency ? 'text-white' : 'text-blue-600'}`}>{c.phone}</span>
                    <Phone className={`w-5 h-5 ${emergency ? 'text-white' : 'text-blue-500'}`} />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Guide Detail Modal */}
      {showModal && selectedGuide && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto" onClick={() => setShowModal(false)}>
          <div className="flex min-h-full items-end sm:items-center justify-center p-4">
          <div className={`w-full max-w-2xl ${emergency ? 'bg-red-900' : 'bg-white'} rounded-t-3xl sm:rounded-3xl shadow-2xl`} onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 z-10 p-4 border-b border-slate-200" style={{ backgroundColor: selectedGuide.color }}>
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <p className="text-sm opacity-75">GUIDE {selectedGuide.num}</p>
                  <h2 className="text-xl font-bold">{selectedGuide.title}</h2>
                  {selectedMaterial && <p className="text-sm opacity-75 mt-1">UN{selectedMaterial.id} - {selectedMaterial.name}</p>}
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-full bg-white/20 hover:bg-white/30"><X className="w-5 h-5 text-white" /></button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* TIH Warning */}
              {selectedMaterial?.tih && selectedMaterial?.protective_distances && (
                <div className="p-4 bg-green-100 border-2 border-green-500 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Wind className="w-5 h-5 text-green-600" />
                    <span className="font-bold text-green-800">TOXIC INHALATION HAZARD (TIH)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-green-800">Small Spill</p>
                      <p className="text-green-700">Day: {selectedMaterial.protective_distances.small_spill?.day?.protect_km} km</p>
                      <p className="text-green-700">Night: {selectedMaterial.protective_distances.small_spill?.night?.protect_km} km</p>
                    </div>
                    <div>
                      <p className="font-semibold text-green-800">Large Spill</p>
                      <p className="text-green-700">Day: {selectedMaterial.protective_distances.large_spill?.day?.protect_km} km</p>
                      <p className="text-green-700">Night: {selectedMaterial.protective_distances.large_spill?.night?.protect_km} km</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Isolation Distances */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-700 uppercase">Initial Isolate</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-900">{selectedGuide.isolate}m</p>
                  <p className="text-xs text-amber-600">{Math.round(selectedGuide.isolate * 3.28)} ft in all directions</p>
                </div>
                <div className="p-4 bg-red-50 rounded-2xl border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-semibold text-red-700 uppercase">Fire Isolate</span>
                  </div>
                  <p className="text-2xl font-bold text-red-900">{selectedGuide.fireIsolate}m</p>
                  <p className="text-xs text-red-600">{Math.round(selectedGuide.fireIsolate * 3.28)} ft</p>
                </div>
              </div>

              {/* Hazards */}
              <div className="space-y-4">
                <h3 className={`text-sm font-semibold uppercase tracking-wider flex items-center gap-2 ${emergency ? 'text-red-300' : 'text-slate-500'}`}>
                  <AlertTriangle className="w-4 h-4" /> Potential Hazards
                </h3>
                <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200">
                  <p className="text-xs font-bold text-orange-700 uppercase mb-2">🔥 Fire/Explosion</p>
                  <ul className="space-y-1">
                    {selectedGuide.hazards?.map((h, i) => <li key={i} className="text-sm text-orange-900 flex gap-2"><span className="text-orange-400">•</span>{h}</li>)}
                  </ul>
                </div>
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200">
                  <p className="text-xs font-bold text-purple-700 uppercase mb-2">⚠️ Health</p>
                  <ul className="space-y-1">
                    {selectedGuide.health?.map((h, i) => <li key={i} className="text-sm text-purple-900 flex gap-2"><span className="text-purple-400">•</span>{h}</li>)}
                  </ul>
                </div>
              </div>

              {/* Emergency Response */}
              <div className="space-y-4">
                <h3 className={`text-sm font-semibold uppercase tracking-wider flex items-center gap-2 ${emergency ? 'text-red-300' : 'text-slate-500'}`}>
                  <Zap className="w-4 h-4" /> Emergency Response
                </h3>
                <div className="p-4 bg-red-50 rounded-2xl border border-red-200">
                  <p className="text-xs font-bold text-red-700 uppercase mb-3">🔥 Fire</p>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-semibold text-red-800">Small:</span> <span className="text-red-700">{selectedGuide.fire?.small}</span></div>
                    <div><span className="font-semibold text-red-800">Large:</span> <span className="text-red-700">{selectedGuide.fire?.large}</span></div>
                    <div><span className="font-semibold text-red-800">Tank:</span> <span className="text-red-700">{selectedGuide.fire?.tank}</span></div>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                  <p className="text-xs font-bold text-blue-700 uppercase mb-2">💧 Spill/Leak</p>
                  <p className="text-sm text-blue-900">{selectedGuide.spill}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-2xl border border-green-200">
                  <p className="text-xs font-bold text-green-700 uppercase mb-2">🏥 First Aid</p>
                  <p className="text-sm text-green-900">{selectedGuide.firstAid}</p>
                </div>
              </div>

              <a
                href={primaryContact?.phone ? `tel:${String(primaryContact.phone).replace(/[^0-9+]/g, '')}` : undefined}
                className="block w-full py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl text-center font-bold text-lg shadow-lg hover:shadow-xl"
              >
                <Phone className="w-5 h-5 inline mr-2" /> Call {primaryContact?.name || 'Emergency Contact'}: {primaryContact?.phone || ''}
              </a>
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
