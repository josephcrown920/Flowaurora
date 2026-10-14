import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  ArrowLeft, CirclePlay, Download, Film, Layers3, Pause, Plus, Scissors,
  SkipBack, Split, Trash2, Type, ArrowUp, ArrowDown, RotateCcw, Save,
} from 'lucide-react';
import { getGetProjectQueryKey, useGetProject } from '@workspace/api-client-react';
import './editor.css';

type Clip = { id: string; src: string; nodeId: string; label: string; inPoint: number; outPoint: number };
type Title = { text: string; start: number; end: number };
type EditDocument = { version: 1; clips: Clip[]; title: Title };
type Asset = { id: string; src: string; label: string };
const SAFE_MEDIA_PATH = /^\/api\/modelark\/media\/([A-Za-z0-9_-]{1,128})$/;
const EMPTY_TITLE: Title = { text: '', start: 0, end: 3 };

function safeMediaPath(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const parsed = new URL(value, window.location.origin);
    if (parsed.origin !== window.location.origin || parsed.search || parsed.hash) return null;
    const match = parsed.pathname.match(SAFE_MEDIA_PATH);
    return match ? `/api/modelark/media/${match[1]}` : null;
  } catch { return null; }
}

function formatTime(value: number) {
  const safe = Math.max(0, Number.isFinite(value) ? value : 0);
  const mins = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  const frames = Math.floor((safe % 1) * 25);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(frames).padStart(2, '0')}`;
}

function loadVideoSource(video: HTMLVideoElement, src: string): Promise<void> {
  if (video.getAttribute('src') === src && video.readyState >= HTMLMediaElement.HAVE_METADATA) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      window.clearTimeout(timer);
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('error', onError);
    };
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve();
    };
    const onLoaded = () => finish();
    const onError = () => finish(new Error('A source video could not be loaded for export.'));
    const timer = window.setTimeout(() => finish(new Error('Video source timed out while exporting.')), 15000);
    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('error', onError);
    if (video.getAttribute('src') !== src) {
      video.src = src;
      video.load();
    }
  });
}

function seekVideo(video: HTMLVideoElement, target: number): Promise<void> {
  const safeTarget = Math.max(0, target);
  if (Math.abs(video.currentTime - safeTarget) <= 0.04) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      window.clearTimeout(timer);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
    };
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve();
    };
    const onSeeked = () => finish();
    const onError = () => finish(new Error('The browser could not seek to the requested export time.'));
    const timer = window.setTimeout(() => finish(new Error(`Timed out seeking to ${formatTime(safeTarget)} during export.`)), 6000);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);
    try {
      video.currentTime = safeTarget;
      if (Math.abs(video.currentTime - safeTarget) <= 0.04 && !video.seeking) finish();
    } catch {
      finish(new Error('The browser rejected the requested export seek.'));
    }
  });
}

function recordingDimensions(sourceWidth: number, sourceHeight: number) {
  const width = Math.max(1, sourceWidth);
  const height = Math.max(1, sourceHeight);
  const scale = Math.min(1, 1920 / Math.max(width, height), Math.sqrt(2_073_600 / (width * height)));
  return { width: Math.max(2, Math.round(width * scale)), height: Math.max(2, Math.round(height * scale)) };
}

function newClip(src: string, nodeId: string, label: string, duration = 5): Clip {
  return { id: `${nodeId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, src, nodeId, label, inPoint: 0, outPoint: Math.max(0.25, duration) };
}

function validDocument(input: unknown): EditDocument | null {
  if (!input || typeof input !== 'object') return null;
  const candidate = input as Partial<EditDocument>;
  if (candidate.version !== 1 || !Array.isArray(candidate.clips) || !candidate.title || typeof candidate.title !== 'object') return null;
  const clips = candidate.clips.slice(0, 80).flatMap((raw) => {
    if (!raw || typeof raw !== 'object') return [];
    const clip = raw as Clip;
    const src = safeMediaPath(clip.src);
    const inPoint = Number(clip.inPoint);
    const outPoint = Number(clip.outPoint);
    if (!src || !Number.isFinite(inPoint) || !Number.isFinite(outPoint) || inPoint < 0 || outPoint <= inPoint) return [];
    return [{
      id: typeof clip.id === 'string' && /^[\w-]{1,100}$/.test(clip.id) ? clip.id : `recovered-${clipsFallbackId++}`,
      src, nodeId: typeof clip.nodeId === 'string' ? clip.nodeId.slice(0, 100) : 'asset',
      label: typeof clip.label === 'string' ? clip.label.slice(0, 100) : 'Video clip',
      inPoint, outPoint,
    }];
  });
  const title = candidate.title as Title;
  const start = Number(title.start), end = Number(title.end);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start) return null;
  return { version: 1 as const, clips, title: { text: typeof title.text === 'string' ? title.text.slice(0, 240) : '', start, end } };
}
let clipsFallbackId = 0;

function projectNodes(canvasState: unknown): any[] {
  if (typeof canvasState !== 'string') return [];
  try {
    const parsed = JSON.parse(canvasState);
    return Array.isArray(parsed?.nodes) ? parsed.nodes : [];
  } catch { return []; }
}

function EditorPage() {
  const query = new URLSearchParams(window.location.search);
  const rawProjectId = query.get('projectId');
  const projectId = rawProjectId && /^\d{1,12}$/.test(rawProjectId) && Number(rawProjectId) > 0 ? Number(rawProjectId) : null;
  const source = safeMediaPath(query.get('source'));
  const nodeId = query.get('nodeId')?.slice(0, 100) || 'source';
  const storageKey = `flows-editor:v1:${projectId ?? 'solo'}:${source ? source.split('/').at(-1) : 'invalid'}`;
  const initial = useMemo<{ doc: EditDocument; recovered: boolean }>(() => {
    if (!source) return { doc: { version: 1, clips: [], title: EMPTY_TITLE } as EditDocument, recovered: false };
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return { doc: { version: 1, clips: [newClip(source, nodeId, 'Generated video')], title: EMPTY_TITLE }, recovered: false };
      const doc = validDocument(JSON.parse(raw));
      if (doc) return { doc, recovered: false };
      return { doc: { version: 1, clips: [newClip(source, nodeId, 'Generated video')], title: EMPTY_TITLE }, recovered: true };
    } catch {
      return { doc: { version: 1, clips: [newClip(source, nodeId, 'Generated video')], title: EMPTY_TITLE }, recovered: true };
    }
  }, [source, storageKey, nodeId]);
  const { data: project, isLoading, isError, refetch } = useGetProject(projectId ?? 0, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId ?? 0) },
  });
  const [doc, setDoc] = useState<EditDocument>(initial.doc);
  const [activeId, setActiveId] = useState(initial.doc.clips[0]?.id ?? '');
  const [timelineTime, setTimelineTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState(initial.recovered ? 'A damaged edit was recovered. Your original source is ready.' : '');
  const [exporting, setExporting] = useState(false);
  const [saved, setSaved] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const [, setLocation] = useLocation();
  const duration = doc.clips.reduce((sum, clip) => sum + Math.max(0, clip.outPoint - clip.inPoint), 0);
  const activeIndex = Math.max(0, doc.clips.findIndex((clip) => clip.id === activeId));
  const activeClip = doc.clips[activeIndex];
  const clipStarts = useMemo(() => {
    let cursor = 0;
    return doc.clips.map((clip) => {
      const start = cursor;
      cursor += Math.max(0, clip.outPoint - clip.inPoint);
      return start;
    });
  }, [doc.clips]);
  const playheadClipIndex = Math.max(0, doc.clips.findIndex((clip, index) => timelineTime < clipStarts[index] + clip.outPoint - clip.inPoint || index === doc.clips.length - 1));
  const playheadClip = doc.clips[playheadClipIndex];
  const playheadLocal = playheadClip ? Math.max(0, timelineTime - clipStarts[playheadClipIndex]) : 0;
  const activeTitle = doc.title.text && timelineTime >= doc.title.start && timelineTime <= doc.title.end;

  const assets = useMemo(() => {
    const found: Asset[] = [];
    for (const node of projectNodes(project?.canvasState)) {
      if (node?.type !== 'LTXProNode' || node?.data?.generationStatus !== 'completed') continue;
      const safe = safeMediaPath(node?.data?.videoUrl);
      if (!safe) continue;
      found.push({ id: String(node.id ?? `asset-${found.length}`), src: safe, label: typeof node.data?.prompt === 'string' && node.data.prompt.trim() ? node.data.prompt.trim().slice(0, 54) : `Generated video ${found.length + 1}` });
    }
    if (source && !found.some((asset) => asset.src === source)) found.unshift({ id: nodeId, src: source, label: 'Current generated video' });
    return found;
  }, [project?.canvasState, source, nodeId]);

  useEffect(() => {
    if (!source) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(doc));
      setSaved(true);
    } catch { setMessage('Local storage is unavailable. Changes will stay in this tab only.'); }
  }, [doc, source, storageKey]);

  useEffect(() => {
    if (!activeClip || !videoRef.current) return;
    const video = videoRef.current;
    if (video.getAttribute('src') !== activeClip.src) {
      video.src = activeClip.src;
      video.load();
    }
  }, [activeClip?.src, activeClip?.id]);

  const updateTitle = (patch: Partial<Title>) => setDoc((current) => ({ ...current, title: { ...current.title, ...patch } }));
  const updateClip = (patch: Partial<Clip>) => {
    if (!activeClip) return;
    setDoc((current) => ({ ...current, clips: current.clips.map((clip) => clip.id === activeClip.id ? { ...clip, ...patch } : clip) }));
  };
  const seek = (nextTime: number) => {
    const clamped = Math.max(0, Math.min(duration, nextTime));
    setTimelineTime(clamped);
    const index = doc.clips.findIndex((clip, i) => clamped < clipStarts[i] + clip.outPoint - clip.inPoint || i === doc.clips.length - 1);
    if (index < 0) return;
    setActiveId(doc.clips[index].id);
    const video = videoRef.current;
    if (video && Number.isFinite(video.duration)) {
      const inTimelineClip = Math.max(0, clamped - clipStarts[index]);
      const seekTo = Math.min(doc.clips[index].outPoint, doc.clips[index].inPoint + inTimelineClip);
      if (Math.abs(video.currentTime - seekTo) > 0.35) video.currentTime = seekTo;
    }
  };
  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video || !doc.clips.length) return;
    if (playing) { video.pause(); setPlaying(false); return; }
    if (timelineTime >= duration) seek(0);
    try { await video.play(); setPlaying(true); } catch { setMessage('This video could not be played in the current browser.'); }
  };
  const handleTimeUpdate = () => {
    if (exporting) return;
    const video = videoRef.current;
    if (!video || !activeClip) return;
    if (video.currentTime >= activeClip.outPoint - 0.04) {
      const nextIndex = activeIndex + 1;
      if (nextIndex < doc.clips.length) {
        setTimelineTime(clipStarts[nextIndex]);
        setActiveId(doc.clips[nextIndex].id);
        if (doc.clips[nextIndex].src === activeClip.src) video.currentTime = doc.clips[nextIndex].inPoint;
      } else {
        video.pause(); setPlaying(false); setTimelineTime(duration);
      }
      return;
    }
    setTimelineTime(clipStarts[activeIndex] + Math.max(0, video.currentTime - activeClip.inPoint));
  };
  const onLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video || !activeClip) return;
    if (activeClip.outPoint > video.duration && video.duration > activeClip.inPoint) {
      updateClip({ outPoint: video.duration });
    }
    if (video.currentTime < activeClip.inPoint || video.currentTime > activeClip.outPoint) video.currentTime = activeClip.inPoint;
    if (playing && !exporting) void video.play().catch(() => setPlaying(false));
  };
  const addAsset = (asset: Asset) => {
    const added = newClip(asset.src, asset.id, asset.label);
    setDoc((current) => ({ ...current, clips: [...current.clips, added] }));
    setActiveId(added.id);
    setMessage('');
  };
  const splitClip = () => {
    if (!activeClip) return;
    const splitAt = activeClip.inPoint + Math.max(0, timelineTime - clipStarts[activeIndex]);
    if (splitAt - activeClip.inPoint < 0.12 || activeClip.outPoint - splitAt < 0.12) {
      setMessage('Move the playhead inside the selected segment before splitting.'); return;
    }
    const left = { ...activeClip, outPoint: splitAt };
    const right = { ...activeClip, id: `${activeClip.id}-split-${Date.now()}`, inPoint: splitAt, label: `${activeClip.label} · split` };
    setDoc((current) => ({ ...current, clips: current.clips.flatMap((clip) => clip.id === activeClip.id ? [left, right] : [clip]) }));
    setActiveId(right.id);
    setMessage('');
  };
  const moveClip = (direction: -1 | 1) => {
    if (activeIndex + direction < 0 || activeIndex + direction >= doc.clips.length) return;
    setDoc((current) => {
      const clips = [...current.clips];
      [clips[activeIndex], clips[activeIndex + direction]] = [clips[activeIndex + direction], clips[activeIndex]];
      return { ...current, clips };
    });
  };
  const deleteClip = () => {
    if (!activeClip) return;
    const next = doc.clips.filter((clip) => clip.id !== activeClip.id);
    setDoc((current) => ({ ...current, clips: next }));
    setActiveId(next[Math.max(0, activeIndex - 1)]?.id ?? '');
    setTimelineTime(0);
  };

  const exportWebm = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !doc.clips.length) { setMessage('Add a video segment before exporting.'); return; }
    if (typeof canvas.captureStream !== 'function' || typeof MediaRecorder === 'undefined' || typeof window.AudioContext === 'undefined') {
      setMessage('Export is unavailable: this browser cannot record WebM with continuous source-audio capture across clips. Try a current desktop browser.');
      return;
    }
    const supportedMime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((mime) => MediaRecorder.isTypeSupported(mime));
    if (!supportedMime) { setMessage('Export is unavailable: this browser cannot encode WebM video.'); return; }
    setMessage('');
    setExporting(true);
    let canvasStream: MediaStream | null = null;
    let recorder: MediaRecorder | null = null;
    let animationFrame = 0;
    const chunks: BlobPart[] = [];
    try {
      const firstClip = doc.clips[0];
      await loadVideoSource(video, firstClip.src);
      await seekVideo(video, firstClip.inPoint);
      if (!video.videoWidth || !video.videoHeight) throw new Error('The first source has no usable video dimensions.');

      // Fix the recording track dimensions before captureStream is created; all later
      // source frames are contained within this first-source aspect ratio.
      const dimensions = recordingDimensions(video.videoWidth, video.videoHeight);
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;

      let audioContext = audioContextRef.current;
      if (!audioContext) {
        audioContext = new AudioContext();
        const audioSource = audioContext.createMediaElementSource(video);
        const audioDestination = audioContext.createMediaStreamDestination();
        audioSource.connect(audioDestination);
        audioSource.connect(audioContext.destination);
        audioContextRef.current = audioContext;
        audioSourceRef.current = audioSource;
        audioDestinationRef.current = audioDestination;
      }
      if (!audioSourceRef.current || !audioDestinationRef.current) {
        throw new Error('This browser cannot preserve source audio continuously when the video changes clips.');
      }
      await audioContext.resume();

      canvasStream = canvas.captureStream(30);
      const audioTracks = audioDestinationRef.current.stream.getAudioTracks();
      if (audioTracks.length === 0) throw new Error('The browser did not provide a continuous audio track for export.');
      const combined = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);
      let activeRecorder: MediaRecorder;
      try { activeRecorder = new MediaRecorder(combined, { mimeType: supportedMime }); }
      catch { throw new Error('Recording could not be started in this browser.'); }
      recorder = activeRecorder;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('The export canvas is unavailable.');
      exportingRef.current = true;
      exportPositionRef.current = 0;
      const drawFrame = () => {
        if (!exportingRef.current) return;
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
          ctx.fillStyle = '#080a0a';
          ctx.fillRect(0, 0, dimensions.width, dimensions.height);
          const scale = Math.min(dimensions.width / video.videoWidth, dimensions.height / video.videoHeight);
          const drawWidth = video.videoWidth * scale;
          const drawHeight = video.videoHeight * scale;
          const x = (dimensions.width - drawWidth) / 2;
          const y = (dimensions.height - drawHeight) / 2;
          ctx.drawImage(video, x, y, drawWidth, drawHeight);
          const at = exportPositionRef.current;
          if (doc.title.text && at >= doc.title.start && at <= doc.title.end) {
            const fontScale = dimensions.width / 1280;
            ctx.font = `700 ${Math.max(16, Math.round(44 * fontScale))}px sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
            ctx.lineWidth = Math.max(2, 6 * fontScale); ctx.strokeStyle = 'rgba(0,0,0,.82)'; ctx.fillStyle = '#ffffff';
            const line = doc.title.text.slice(0, 240);
            ctx.strokeText(line, dimensions.width / 2, dimensions.height * .88, dimensions.width * .84);
            ctx.fillText(line, dimensions.width / 2, dimensions.height * .88, dimensions.width * .84);
          }
        }
        animationFrame = requestAnimationFrame(drawFrame);
      };
      activeRecorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      activeRecorder.start(250);
      animationFrame = requestAnimationFrame(drawFrame);

      for (let index = 0; index < doc.clips.length; index++) {
        const clip = doc.clips[index];
        await loadVideoSource(video, clip.src);
        await seekVideo(video, clip.inPoint);
        await video.play();
        const clipDuration = clip.outPoint - clip.inPoint;
        await new Promise<void>((resolve, reject) => {
          const check = () => {
            exportPositionRef.current = clipStarts[index] + Math.min(clipDuration, Math.max(0, video.currentTime - clip.inPoint));
            if (video.currentTime >= clip.outPoint || video.ended) { video.pause(); resolve(); }
            else if (video.error) reject(new Error('A source video failed during export.'));
            else window.setTimeout(check, 35);
          };
          check();
        });
      }
      exportPositionRef.current = duration;
      await new Promise<void>((resolve) => { activeRecorder.onstop = () => resolve(); activeRecorder.stop(); });
      const blob = new Blob(chunks, { type: 'video/webm' });
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl; anchor.download = `flows-edit-${Date.now()}.webm`; anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
    } catch (error) {
      setMessage(error instanceof Error ? `Export failed: ${error.message}` : 'Export failed while rendering the sequence.');
      if (recorder && recorder.state !== 'inactive') recorder.stop();
    } finally {
      exportingRef.current = false;
      if (animationFrame) cancelAnimationFrame(animationFrame);
      setExporting(false);
      video.pause();
      setPlaying(false);
      canvasStream?.getTracks().forEach((track) => track.stop());
    }
  };
  const exportPositionRef = useRef(0);
  const exportingRef = useRef(false);

  const returnToCanvas = useCallback(() => {
    setLocation(projectId ? `/canvas?projectId=${projectId}` : '/canvas');
  }, [projectId, setLocation]);

  if (projectId && isLoading) return <div className="editor-loading" data-testid="status-project-loading">Loading project media…</div>;
  return (
    <div className="editor-shell" data-testid="video-editor">
      <header className="editor-topbar">
        <div className="editor-brand" data-testid="text-flows-brand"><span className="editor-mark">F</span><span>Flows</span></div>
        <span className="editor-divider" />
        <span className="editor-project-label">{project?.title || 'Video editor'}{projectId ? ' · Project' : ''}</span>
        <div className="editor-top-actions">
          <button className="editor-button subtle" onClick={returnToCanvas} data-testid="button-return-canvas" aria-label="Return to canvas"><ArrowLeft size={15} /> Canvas</button>
          <button className="editor-button primary" onClick={exportWebm} disabled={exporting || !source || !doc.clips.length} data-testid="button-export-webm"><Download size={14} />{exporting ? 'Recording…' : 'Export WebM'}</button>
        </div>
      </header>
      <main className="editor-main">
        <div className="editor-heading">
          <div><h1>Finish the motion.</h1><p>Shape the generated footage, then send the cut back into your world.</p></div>
          <span className="editor-status" data-testid="status-save">{saved ? 'LOCAL EDIT · SAVED' : 'SAVING…'}</span>
        </div>
        {isError && <div className="editor-message" role="status" data-testid="status-project-error">Could not load this project’s assets. <button className="editor-button" onClick={() => refetch()} data-testid="button-retry-project">Retry</button></div>}
        {!source && <div className="editor-message" role="alert" data-testid="status-invalid-source">This source is not a valid Flows media asset. Open the editor from a completed video node.</div>}
        {message && <div className={`editor-message ${initial.recovered ? 'info' : ''}`} role="status" data-testid="status-editor-message">{message}</div>}
        <section className="editor-layout" aria-label="Video preview and project assets">
          <div className="editor-preview-panel">
            <div className="editor-preview-stage" data-testid="video-preview-stage">
              {activeClip && source ? <video ref={videoRef} src={activeClip.src} playsInline preload="metadata" onTimeUpdate={handleTimeUpdate} onLoadedMetadata={onLoadedMetadata} onEnded={() => setPlaying(false)} aria-label="Edited video preview" data-testid="video-preview" /> :
                <div className="editor-video-placeholder"><Film size={30} /><span>{source ? 'Add a video asset to begin your cut.' : 'A safe video source is needed to preview.'}</span></div>}
              {activeTitle && <div className="editor-overlay-preview" data-testid="preview-title">{doc.title.text}</div>}
              <canvas ref={canvasRef} width="1280" height="720" hidden />
            </div>
            <div className="editor-preview-controls">
              <button className="editor-icon-button" onClick={() => seek(0)} aria-label="Return playhead to beginning" data-testid="button-seek-start"><SkipBack size={16} /></button>
              <button className="editor-icon-button" onClick={togglePlayback} aria-label={playing ? 'Pause preview' : 'Play preview'} data-testid="button-play-pause">{playing ? <Pause size={16} /> : <CirclePlay size={17} />}</button>
              <span className="editor-time" data-testid="text-playhead-time">{formatTime(timelineTime)}</span>
              <input type="range" min="0" max={Math.max(duration, 0.01)} step="0.01" value={Math.min(timelineTime, duration)} onChange={(event) => seek(Number(event.target.value))} aria-label="Scrub timeline" className="editor-scrub" data-testid="input-scrub" />
              <span className="editor-time" data-testid="text-total-duration">{formatTime(duration)}</span>
            </div>
          </div>
          <aside className="editor-assets-panel" aria-label="Project video assets">
            <div className="editor-section-head"><h2>Project media</h2><Layers3 size={14} color="#c8f169" /></div>
            <div className="editor-assets-list">
              {assets.length ? assets.map((asset) => (
                <button className="editor-asset" key={asset.id} onClick={() => addAsset(asset)} data-testid={`button-add-asset-${asset.id}`} aria-label={`Add ${asset.label} to timeline`}>
                  <span className="editor-thumb"><video src={asset.src} muted preload="metadata" aria-hidden="true" /></span>
                  <span className="editor-asset-info"><strong>{asset.label}</strong><small>VIDEO · ADD TO CUT</small></span><Plus size={14} />
                </button>
              )) : <div className="editor-empty-assets" data-testid="text-empty-assets">No completed project videos yet. Generate a video in the canvas and it will appear here.</div>}
            </div>
          </aside>
        </section>
        <section className="editor-timeline-panel" aria-label="Editable timeline">
          <div className="editor-timeline-toolbar">
            <button className="editor-button" onClick={splitClip} disabled={!activeClip} data-testid="button-split-clip"><Split size={13} /> Split at playhead</button>
            <button className="editor-button" onClick={() => moveClip(-1)} disabled={!activeClip || activeIndex === 0} aria-label="Move clip earlier" data-testid="button-move-clip-up"><ArrowUp size={13} /> Earlier</button>
            <button className="editor-button" onClick={() => moveClip(1)} disabled={!activeClip || activeIndex >= doc.clips.length - 1} aria-label="Move clip later" data-testid="button-move-clip-down"><ArrowDown size={13} /> Later</button>
            <button className="editor-button" onClick={deleteClip} disabled={!activeClip} data-testid="button-delete-clip"><Trash2 size={13} /> Remove</button>
            <span className="editor-timeline-label">{doc.clips.length} {doc.clips.length === 1 ? 'segment' : 'segments'} · {formatTime(duration)}</span>
          </div>
          <div className="editor-ruler" data-testid="timeline-ruler"><span>00:00</span><span>{formatTime(duration * .25)}</span><span>{formatTime(duration * .5)}</span><span>{formatTime(duration * .75)}</span><span>{formatTime(duration)}</span></div>
          <div className="editor-lanes">
            <div className="editor-lane" aria-label="Video clips">
              <span className="editor-lane-title">Video</span>
              {doc.clips.map((clip, index) => (
                <button key={clip.id} className={`editor-clip ${clip.id === activeId ? 'active' : ''}`} style={{ flexGrow: Math.max(.2, clip.outPoint - clip.inPoint) }} onClick={() => { setActiveId(clip.id); seek(clipStarts[index]); }} aria-label={`Select clip ${index + 1}, ${clip.label}`} data-testid={`timeline-clip-${clip.id}`}>
                  <video src={clip.src} muted preload="metadata" aria-hidden="true" />
                  <span>{clip.label} · {formatTime(clip.outPoint - clip.inPoint)}</span>
                </button>
              ))}
              {!doc.clips.length && <div className="editor-empty-assets">Add a media item to create your first segment.</div>}
              {duration > 0 && <div className="editor-playhead" style={{ left: `calc(62px + ${Math.min(100, timelineTime / duration * 100)}% - ${timelineTime / duration * 62}px)` }} data-testid="timeline-playhead" />}
            </div>
            <div className="editor-lane" aria-label="Timed text overlay">
              <span className="editor-lane-title">Title</span>
              {doc.title.text && duration > 0 && <div className="editor-title-clip" style={{ flexGrow: Math.max(.1, doc.title.end - doc.title.start) }} data-testid="timeline-title">{doc.title.text}</div>}
              {!doc.title.text && <span className="editor-save-note">TEXT LAYER · EMPTY</span>}
            </div>
          </div>
          <div className="editor-editors">
            <div className="editor-edit-card">
              <h3><Scissors size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />Selected segment</h3>
              {activeClip ? <div className="editor-fields">
                <div className="editor-field"><label htmlFor="clip-in">In point · seconds</label><input id="clip-in" type="number" min="0" max={activeClip.outPoint - .1} step=".1" value={activeClip.inPoint.toFixed(2)} onChange={(event) => updateClip({ inPoint: Math.min(activeClip.outPoint - .1, Math.max(0, Number(event.target.value) || 0)) })} data-testid="input-clip-in" /></div>
                <div className="editor-field"><label htmlFor="clip-out">Out point · seconds</label><input id="clip-out" type="number" min={activeClip.inPoint + .1} step=".1" value={activeClip.outPoint.toFixed(2)} onChange={(event) => updateClip({ outPoint: Math.max(activeClip.inPoint + .1, Number(event.target.value) || activeClip.inPoint + .1) })} data-testid="input-clip-out" /></div>
                <div className="editor-edit-actions">
                  <button className="editor-button" onClick={() => seek(clipStarts[activeIndex])} data-testid="button-seek-clip-start"><SkipBack size={12} /> Segment start</button>
                  <button className="editor-button" onClick={() => updateClip({ inPoint: Math.min(activeClip.outPoint - .1, videoRef.current?.currentTime ?? activeClip.inPoint) })} data-testid="button-set-in-playhead">Set in at playhead</button>
                </div>
              </div> : <span className="editor-save-note">Select a video segment to trim.</span>}
            </div>
            <div className="editor-edit-card">
              <h3><Type size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />Timed text</h3>
              <div className="editor-fields">
                <div className="editor-field full"><label htmlFor="overlay-copy">Overlay copy</label><input id="overlay-copy" type="text" maxLength={240} value={doc.title.text} onChange={(event) => updateTitle({ text: event.target.value })} placeholder="Add a title to the picture" data-testid="input-overlay-text" /></div>
                <div className="editor-field"><label htmlFor="title-start">Starts · sec</label><input id="title-start" type="number" min="0" step=".1" value={doc.title.start} onChange={(event) => updateTitle({ start: Math.max(0, Number(event.target.value) || 0) })} data-testid="input-title-start" /></div>
                <div className="editor-field"><label htmlFor="title-end">Ends · sec</label><input id="title-end" type="number" min="0" step=".1" value={doc.title.end} onChange={(event) => updateTitle({ end: Math.max(doc.title.start, Number(event.target.value) || 0) })} data-testid="input-title-end" /></div>
                <div className="editor-edit-actions">
                  <button className="editor-button" onClick={() => updateTitle({ start: timelineTime, end: Math.max(timelineTime + .5, doc.title.end) })} data-testid="button-title-at-playhead"><Plus size={12} /> Start at playhead</button>
                  <button className="editor-button subtle" onClick={() => updateTitle(EMPTY_TITLE)} data-testid="button-clear-title"><RotateCcw size={12} /> Clear</button>
                </div>
              </div>
            </div>
          </div>
        </section>
        <div className="editor-heading" style={{ marginTop: 12 }}>
          <span className="editor-save-note"><Save size={11} style={{ verticalAlign: 'middle', marginRight: 5 }} />Timeline and title saved on this device only · version 1</span>
          <Link href={projectId ? `/canvas?projectId=${projectId}` : '/canvas'} className="editor-button subtle" data-testid="link-back-canvas">Return to canvas <ArrowLeft size={13} /></Link>
        </div>
      </main>
    </div>
  );
}

export default EditorPage;
