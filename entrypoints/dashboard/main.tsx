import { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Plotly from 'plotly.js-basic-dist-min';
import { ArrowUpRight, Bookmark, Clock3, ExternalLink, Library, LoaderCircle, Search, Trash2, Youtube } from 'lucide-react';
import { browser } from 'wxt/browser';
import { Button } from '../../src/components/ui/button';
import { Logo } from '../../src/components/logo';
import { formatNoteDate, formatTimestamp, getNotes, sendExtensionMessage } from '../../src/lib/messaging';
import type { MomentNote } from '../../src/lib/types';
import '../../src/styles/global.css';

type PlotNode = HTMLDivElement & {
  on: (event: 'plotly_click', callback: (event: Plotly.PlotMouseEvent) => void) => void;
  removeListener: (event: 'plotly_click', callback: (event: Plotly.PlotMouseEvent) => void) => void;
};

/** Wrap a long title onto several lines (Plotly axis labels support <br>). */
function wrapTitle(title: string, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of title.split(/\s+/)) {
    const chunks = word.length > width ? word.match(new RegExp(`.{1,${width}}`, 'g')) ?? [word] : [word];
    for (const chunk of chunks) {
      if (line && `${line} ${chunk}`.length > width) { lines.push(line); line = chunk; }
      else line = line ? `${line} ${chunk}` : chunk;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function Timeline({ notes, onSelect }: { notes: MomentNote[]; onSelect: (id: string) => void }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = container.current;
    if (!node) return;
    const videos = [...new Set(notes.map((note) => note.videoId))];
    const rowByVideo = new Map(videos.map((id, index) => [id, index]));
    const wrapWidth = node.clientWidth < 640 ? 20 : 32;
    const wrapped = videos.map((id) => wrapTitle(notes.find((note) => note.videoId === id)?.videoTitle ?? id, wrapWidth));
    const maxLines = Math.max(1, ...wrapped.map((lines) => lines.length));
    const longest = Math.max(...wrapped.flat().map((line) => line.length));
    const trace: Plotly.Data = {
      type: 'scatter',
      mode: 'markers',
      x: notes.map((note) => note.seconds),
      y: notes.map((note) => rowByVideo.get(note.videoId) ?? 0),
      text: notes.map((note) => note.text),
      customdata: notes.map((note) => note.id),
      marker: { size: 14, color: '#ff6b35', line: { color: '#fff', width: 2 } },
      hovertemplate: '<b>%{text}</b><br>%{x:.0f}s<extra></extra>',
    };
    const layout: Partial<Plotly.Layout> = {
      autosize: true,
      height: Math.max(210, videos.length * Math.max(68, maxLines * 15 + 26) + 90),
      margin: { l: Math.min(300, longest * 6.4 + 34), r: 24, t: 16, b: 42 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: 'rgba(58,34,22,.65)', family: 'Geist Variable, ui-sans-serif, system-ui', size: 11 },
      xaxis: { title: { text: 'Video time (seconds)' }, gridcolor: 'rgba(58,34,22,.08)', zerolinecolor: 'rgba(58,34,22,.08)' },
      yaxis: {
        tickmode: 'array',
        tickvals: videos.map((_, index) => index),
        ticktext: wrapped.map((lines) => lines.map(escapeHtml).join('<br>')),
        gridcolor: 'rgba(58,34,22,.06)',
        zeroline: false,
        autorange: 'reversed',
      },
      hoverlabel: { bgcolor: '#2a140a', bordercolor: '#ff6b35', font: { color: '#f7f3ee' } },
    };
    const plotNode = node as PlotNode;
    void Plotly.react(node, [trace], layout, { displayModeBar: false, responsive: true });
    const onClick = (event: Plotly.PlotMouseEvent) => {
      const id = event.points[0]?.customdata;
      if (typeof id === 'string') onSelect(id);
    };
    plotNode.on('plotly_click', onClick);
    return () => { plotNode.removeListener('plotly_click', onClick); Plotly.purge(node); };
  }, [notes, onSelect]);

  if (!notes.length) return <div className="grid h-48 place-items-center text-sm text-cocoa-900/40">Save a few moments to see them on your timeline.</div>;
  return <div ref={container} className="min-h-52 w-full" />;
}

function Dashboard() {
  const [notes, setNotes] = useState<MomentNote[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    setNotes(await getNotes());
    setLoading(false);
  }

  useEffect(() => { void refresh(); }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return notes;
    return notes.filter((note) => `${note.text} ${note.videoTitle}`.toLowerCase().includes(normalized));
  }, [notes, query]);

  async function openAt(note: MomentNote) {
    await browser.tabs.create({ url: `${note.videoUrl}&t=${Math.floor(note.seconds)}s` });
  }

  async function remove(note: MomentNote) {
    await sendExtensionMessage({ type: 'notes:delete', id: note.id });
    setNotes((current) => current.filter((item) => item.id !== note.id));
  }

  const selectPoint = (id: string) => {
    const note = notes.find((item) => item.id === id);
    if (note) void openAt(note);
  };

  return (
    <main className="atmosphere grain relative min-h-screen overflow-hidden text-cocoa-900">
      <div aria-hidden className="pointer-events-none absolute -right-40 -bottom-40 size-[640px] animate-drift rounded-full bg-ember-400/20 blur-3xl" />
      <div className="relative z-10 mx-auto max-w-6xl px-5 py-10 md:px-8">
        <header className="relative mb-6 animate-rise overflow-hidden rounded-[2rem] border border-cocoa-900/15 p-7 md:p-10" style={{ background: 'radial-gradient(55% 85% at 0% 0%, #ff8a57 0%, rgb(255 138 87 / 0.55) 45%, transparent 75%), radial-gradient(60% 90% at 100% 115%, #ff6b35 0%, rgb(255 107 53 / 0.5) 45%, transparent 75%), #f9efe6' }}>
          <div aria-hidden className="grain absolute inset-0" />
          <div aria-hidden className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-mist/25 to-transparent" />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="mb-6 flex items-center gap-3"><Logo size={34} /><span className="eyebrow !text-cocoa-900/80">CueBit</span></div>
              <h1 className="font-display text-4xl leading-[1.05] font-light tracking-tight text-cocoa-950 md:text-6xl">Every moment, <em className="font-normal text-ember-700 italic">on cue.</em></h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-cocoa-900/70">Every note you left on a video, ready to jump back to.</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-cocoa-900/20 bg-white/70 px-3.5 py-2 text-xs text-cocoa-900/80 backdrop-blur"><Library size={14} /> Private on this device</div>
          </div>
        </header>

        <section className="mb-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Saved moments" value={notes.length} icon={<Bookmark size={14} />} delay={60} />
          <Stat label="Videos with notes" value={new Set(notes.map((note) => note.videoId)).size} icon={<Youtube size={14} />} delay={120} />
          <Stat label="Latest note" value={notes[0] ? formatNoteDate(notes[0].createdAt) : '—'} icon={<Clock3 size={14} />} delay={180} />
        </section>

        <section className="glass mb-6 animate-rise overflow-hidden rounded-[2rem] p-5 md:p-7" style={{ animationDelay: '220ms' }}>
          <div className="mb-3 flex items-end justify-between gap-4">
            <div><p className="eyebrow">Explore</p><h2 className="mt-1.5 font-display text-2xl font-normal text-cocoa-950">Moments across your videos</h2></div>
            <span className="hidden text-xs text-cocoa-900/45 sm:block">Select a point to jump to its note</span>
          </div>
          {loading ? <div className="grid h-48 place-items-center"><LoaderCircle className="animate-spin text-ember-700" size={20} /></div> : <Timeline notes={notes} onSelect={selectPoint} />}
        </section>

        <section className="glass animate-rise rounded-[2rem] p-5 md:p-7" style={{ animationDelay: '280ms' }}>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div><p className="eyebrow">Notebook</p><h2 className="mt-1.5 font-display text-2xl font-normal text-cocoa-950">All saved notes <span className="ml-1 font-mono text-sm text-cocoa-900/50">{filtered.length}</span></h2></div>
            <label className="flex w-full items-center gap-2.5 rounded-full border border-cocoa-900/15 bg-white/70 px-4 py-2.5 transition-colors focus-within:border-ember-700/70 focus-within:ring-4 focus-within:ring-ember-400/15 sm:w-72">
              <Search size={15} className="text-ember-700" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes or videos" className="w-full bg-transparent text-xs text-cocoa-950 outline-none placeholder:text-cocoa-900/30" />
            </label>
          </div>
          {loading ? <div className="grid h-24 place-items-center"><LoaderCircle className="animate-spin text-ember-700" size={20} /></div> : filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-cocoa-900/15 px-6 py-14 text-center">
              <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-ember-500/15 text-ember-700"><Bookmark size={20} /></div>
              <p className="font-display text-xl text-cocoa-950">{query ? 'No matching notes' : 'Your notebook is empty'}</p>
              <p className="mt-1 text-xs text-cocoa-900/50">{query ? 'Try another search.' : 'Save a note from a YouTube video to start your collection.'}</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((note) => <NoteRow key={note.id} note={note} onOpen={() => void openAt(note)} onDelete={() => void remove(note)} />)}
            </ul>
          )}
        </section>
        <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-cocoa-900/40">
          <span>Stored locally in IndexedDB. No account required.</span>
          <a className="inline-flex items-center gap-1 transition-colors hover:text-ember-700" href="https://www.youtube.com/" target="_blank" rel="noreferrer">Open YouTube <ArrowUpRight size={12} /></a>
        </footer>
      </div>
    </main>
  );
}

function Stat({ label, value, icon, delay = 0 }: { label: string; value: number | string; icon: React.ReactNode; delay?: number }) {
  return (
    <div className="glass animate-rise rounded-3xl p-5" style={{ animationDelay: `${delay}ms` }}>
      <div className="mb-4 flex items-center gap-2 text-ember-700">{icon}<span className="eyebrow">{label}</span></div>
      <p className="font-display text-4xl leading-none font-light tracking-tight text-cocoa-950 tabular-nums">{value}</p>
    </div>
  );
}

function NoteRow({ note, onOpen, onDelete }: { note: MomentNote; onOpen: () => void; onDelete: () => void }) {
  return (
    <li className="group flex flex-col gap-3 rounded-2xl border border-transparent p-3.5 transition-colors hover:border-cocoa-900/12 hover:bg-cocoa-900/[0.045] sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3.5">
        <div className="mt-0.5 grid h-10 w-[58px] shrink-0 place-items-center rounded-xl bg-cream-200 font-mono text-xs font-medium text-ember-700 ring-1 ring-cocoa-900/15 tabular-nums">{formatTimestamp(note.seconds)}</div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm leading-6 text-cocoa-950">{note.text}</p>
          <p className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] text-cocoa-900/50"><Youtube size={11} className="shrink-0 text-ember-700" /><span className="max-w-[460px] truncate">{note.videoTitle}</span><span aria-hidden>·</span><span className="shrink-0">Saved {formatNoteDate(note.createdAt)}</span></p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 pl-[72px] sm:pl-0">
        <Button variant="secondary" size="sm" onClick={onOpen}><ExternalLink size={13} /> Watch moment</Button>
        <Button variant="danger" size="sm" onClick={onDelete} aria-label="Delete note"><Trash2 size={14} /></Button>
      </div>
    </li>
  );
}

createRoot(document.getElementById('root')!).render(<Dashboard />);
