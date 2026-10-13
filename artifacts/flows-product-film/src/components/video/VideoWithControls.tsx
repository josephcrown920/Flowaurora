import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ChevronDown, ChevronUp, Pause, Play, Repeat, Volume2, VolumeX } from 'lucide-react';
import VideoTemplate, { SCENE_DURATIONS } from './VideoTemplate';
import { useSceneControls } from './useSceneControls';
import { SCENE_DETAILS } from './sceneMeta';

const PROGRESS_TICK_MS = 60;

function formatPlaybackTime(durationMs: number) {
  const seconds = Math.max(0, Math.floor(durationMs / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function announceSceneSelection(index: number, sceneKeys: string[]) {
  const key = sceneKeys[index];
  const details = SCENE_DETAILS[key];
  if (!details?.filePath) return;
  window.parent.postMessage({
    type: 'REPLIT_VIDEO_SCENE_SELECTED',
    payload: {
      sceneIndex: index,
      sceneCount: sceneKeys.length,
      sceneTitle: details.title || key,
      filePath: details.filePath,
      lineNumber: 1,
    },
  }, '*');
}

function PlaybackStatus({
  sceneKeys,
  activeIndex,
  activeDuration,
  activeStartTime,
  totalDuration,
  tick,
  paused,
  onJumpTo,
}: {
  sceneKeys: string[];
  activeIndex: number;
  activeDuration: number;
  activeStartTime: number;
  totalDuration: number;
  tick: number;
  paused: boolean;
  onJumpTo: (index: number) => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const elapsedBaseRef = useRef(0);

  useEffect(() => {
    setElapsed(0);
    elapsedBaseRef.current = 0;
  }, [tick]);
  useEffect(() => {
    if (paused) return;
    const startedAt = performance.now();
    const timer = window.setInterval(() => setElapsed(elapsedBaseRef.current + performance.now() - startedAt), PROGRESS_TICK_MS);
    return () => {
      window.clearInterval(timer);
      elapsedBaseRef.current += performance.now() - startedAt;
    };
  }, [tick, paused]);

  const progress = activeDuration > 0 ? Math.min(1, elapsed / activeDuration) : 0;
  const totalElapsed = Math.min(totalDuration, activeStartTime + Math.min(elapsed, activeDuration));
  return (
    <>
      <div className="flex flex-1 items-center gap-[.55vmin]">
        {sceneKeys.map((key, index) => (
          <button
            key={key}
            onClick={() => onJumpTo(index)}
            aria-label={`Jump to scene ${index + 1}`}
            aria-current={index === activeIndex ? 'true' : undefined}
            className="relative h-[.65vmin] min-h-[5px] flex-1 cursor-pointer overflow-hidden rounded-full bg-white/20"
          >
            <span className="absolute inset-y-0 left-0 rounded-full bg-[#d5c9ff]" style={{ width: `${index === activeIndex ? progress * 100 : index < activeIndex ? 100 : 0}%` }} />
          </button>
        ))}
      </div>
      <div className="film-mono shrink-0 text-[1vmin] tabular-nums text-white/65">{activeIndex + 1}/{sceneKeys.length}</div>
      <div className="film-mono min-w-[8ch] shrink-0 text-right text-[1vmin] tabular-nums text-white/80" role="timer" aria-label={`Playback time ${formatPlaybackTime(totalElapsed)} of ${formatPlaybackTime(totalDuration)}`}>
        {formatPlaybackTime(totalElapsed)} / {formatPlaybackTime(totalDuration)}
      </div>
    </>
  );
}

function ControlBar({
  visible,
  collapsed,
  locked,
  paused,
  muted,
  sceneKeys,
  activeIndex,
  activeDuration,
  activeStartTime,
  totalDuration,
  tick,
  onTogglePause,
  onToggleLock,
  onToggleMute,
  onJumpTo,
  onToggleCollapsed,
}: {
  visible: boolean;
  collapsed: boolean;
  locked: boolean;
  paused: boolean;
  muted: boolean;
  sceneKeys: string[];
  activeIndex: number;
  activeDuration: number;
  activeStartTime: number;
  totalDuration: number;
  tick: number;
  onTogglePause: () => void;
  onToggleLock: () => void;
  onToggleMute: () => void;
  onJumpTo: (index: number) => void;
  onToggleCollapsed: () => void;
}) {
  const buttonClass = 'flex h-[4.6vmin] w-[4.6vmin] min-h-[30px] min-w-[30px] shrink-0 items-center justify-center rounded-[.8vmin] text-white/70 transition-colors hover:bg-white/10 hover:text-white';
  return (
    <div className={`flex items-center gap-[1vmin] border-t border-white/[.09] bg-[#15141bd9] px-[1.6vmin] py-[.8vmin] backdrop-blur-md transition-all duration-200 ${visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'}`} aria-hidden={!visible}>
      <button className={buttonClass} onClick={onTogglePause} title={paused ? 'Play' : 'Pause'} aria-label={paused ? 'Play' : 'Pause'}>
        {paused ? <Play className="h-[2.2vmin] w-[2.2vmin]" /> : <Pause className="h-[2.2vmin] w-[2.2vmin]" />}
      </button>
      <button className={`${buttonClass} ${locked ? 'bg-white/15 text-white' : ''}`} onClick={onToggleLock} title={locked ? 'Loop current scene: on' : 'Loop current scene: off'} aria-label={locked ? 'Loop current scene: on' : 'Loop current scene: off'} aria-pressed={locked}>
        <Repeat className="h-[2vmin] w-[2vmin]" />
      </button>
      <button className={buttonClass} onClick={onToggleMute} title={muted ? 'Unmute' : 'Mute'} aria-label={muted ? 'Unmute audio' : 'Mute audio'} aria-pressed={muted}>
        {muted ? <VolumeX className="h-[2vmin] w-[2vmin]" /> : <Volume2 className="h-[2vmin] w-[2vmin]" />}
      </button>
      <div className="h-[3vmin] w-px shrink-0 bg-white/15" />
      <PlaybackStatus
        sceneKeys={sceneKeys}
        activeIndex={activeIndex}
        activeDuration={activeDuration}
        activeStartTime={activeStartTime}
        totalDuration={totalDuration}
        tick={tick}
        paused={paused}
        onJumpTo={onJumpTo}
      />
      <button className={buttonClass} onClick={onToggleCollapsed} title={collapsed ? 'Show controls' : 'Hide controls'} aria-label={collapsed ? 'Show controls' : 'Hide controls'} aria-expanded={!collapsed}>
        {collapsed ? <ChevronUp className="h-[2.3vmin] w-[2.3vmin]" /> : <ChevronDown className="h-[2.3vmin] w-[2.3vmin]" />}
      </button>
    </div>
  );
}

export default function VideoWithControls() {
  const isIframed = typeof window !== 'undefined' && window.self !== window.top;
  const [muted, setMuted] = useState(false);
  const sensorRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [tapPinned, setTapPinned] = useState(false);
  const {
    sceneKeys, activeIndex, locked, paused, mountKey, tick,
    durations, activeDuration, activeStartTime, totalDuration,
    onSceneChange, jumpTo, toggleLock, togglePause,
  } = useSceneControls(SCENE_DURATIONS);

  const handleJumpTo = useCallback((index: number) => {
    jumpTo(index);
    announceSceneSelection(index, sceneKeys);
  }, [jumpTo, sceneKeys]);

  useEffect(() => {
    if (!paused || !stageRef.current) return;
    const stage = stageRef.current;
    const frozen = document.getAnimations().filter((animation) => {
      const target = animation.effect?.target;
      return target instanceof Element && stage.contains(target) && animation.playState === 'running';
    });
    frozen.forEach((animation) => animation.pause());
    return () => frozen.forEach((animation) => animation.play());
  }, [paused]);

  const handlePointerEnter = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') setHovering(true);
  }, []);
  const handlePointerLeave = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') setHovering(false);
  }, []);
  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' && collapsed) setTapPinned(true);
  }, [collapsed]);
  const handleToggleCollapsed = useCallback(() => {
    setCollapsed((current) => {
      if (!current) {
        setHovering(false);
        setTapPinned(false);
      }
      return !current;
    });
  }, []);
  useEffect(() => {
    if (!(collapsed && tapPinned)) return;
    const clearPin = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' && sensorRef.current && !sensorRef.current.contains(event.target as Node)) setTapPinned(false);
    };
    document.addEventListener('pointerdown', clearPin);
    return () => document.removeEventListener('pointerdown', clearPin);
  }, [collapsed, tapPinned]);

  if (!isIframed) return <VideoTemplate />;
  const barVisible = !collapsed || hovering || tapPinned;
  return (
    <div ref={stageRef} className="relative h-screen w-full overflow-hidden">
      <VideoTemplate key={mountKey} durations={durations} loop paused={paused} muted={muted} onSceneChange={onSceneChange} />
      <div
        ref={sensorRef}
        className="absolute bottom-0 left-0 right-0 z-50 flex flex-col justify-end"
        style={{ height: '25%' }}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
      >
        <div className="w-full flex-1" aria-hidden="true" />
        <ControlBar
          visible={barVisible}
          collapsed={collapsed}
          locked={locked}
          paused={paused}
          muted={muted}
          sceneKeys={sceneKeys}
          activeIndex={activeIndex}
          activeDuration={activeDuration}
          activeStartTime={activeStartTime}
          totalDuration={totalDuration}
          tick={tick}
          onTogglePause={togglePause}
          onToggleLock={toggleLock}
          onToggleMute={() => setMuted((current) => !current)}
          onJumpTo={handleJumpTo}
          onToggleCollapsed={handleToggleCollapsed}
        />
      </div>
    </div>
  );
}
