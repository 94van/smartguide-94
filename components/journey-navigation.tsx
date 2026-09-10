'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pause,
  Play,
  MapPin,
  RotateCcw,
  Check,
  ArrowRight,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Choice } from '@/components/choice';
import { createJourney, journeyAt } from '@/shared/journey.mjs';
import { getNode } from '@/shared/hospital.mjs';
import type { HospitalState } from '@/lib/use-hospital';
import type { createJourneyScene } from '@/lib/scene/journey';
export default function JourneyNavigation({
  state,
  target,
  theme,
  onClose,
  onArrive,
}: {
  state: HospitalState;
  target: string;
  theme: string;
  onClose: () => void;
  onArrive: () => Promise<boolean>;
}) {
  const journey = useMemo(
    () => createJourney(state.location, target, state),
    [state, target],
  );
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState('1');
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const engine = useRef<ReturnType<typeof createJourneyScene> | null>(null);
  const signature = journey?.signature;
  const [routeChanged, setRouteChanged] = useState(false);
  const old = useRef(signature);
  useEffect(() => {
    if (old.current !== signature) {
      setRouteChanged(true);
      old.current = signature;
    }
    setPlaying(false);
    setElapsed(0);
  }, [signature]);
  useEffect(() => {
    let canceled = false;
    setReady(false);
    setFailed(false);
    if (!journey) return;
    import('@/lib/scene/journey')
      .then(({ createJourneyScene }) => {
        if (canceled) return;
        try {
          engine.current = createJourneyScene(host.current!, journey, theme);
          setReady(true);
        } catch {
          setFailed(true);
        }
      })
      .catch(() => {
        if (!canceled) setFailed(true);
      });
    return () => {
      canceled = true;
      engine.current?.dispose();
      engine.current = null;
    };
  }, [signature, theme]);
  useEffect(() => {
    if (!playing || !journey) return;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      if (!document.hidden)
        setElapsed((t) =>
          Math.min(
            journey.totalSeconds,
            t + Math.min((now - last) / 1000, 0.25) * Number(speed),
          ),
        );
      last = now;
    }, 80);
    return () => clearInterval(id);
  }, [playing, speed, journey?.totalSeconds]);
  const current = journey ? journeyAt(journey, elapsed) : null;
  useEffect(() => {
    if (current) {
      engine.current?.setProgress(current.index, current.fraction);
      if (current.done) setPlaying(false);
    }
  }, [elapsed, ready]);
  const done = current?.done;
  const progress = journey
    ? Math.round((elapsed / Math.max(1, journey.totalSeconds)) * 100)
    : 0;
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="journey-dialog">
        <DialogTitle>全程三维导航</DialogTitle>
        <DialogDescription>
          从 {getNode(state.location, state)?.name} 到{' '}
          {getNode(target, state)?.name}
          。镜头默认固定，位置标记沿路线移动；支持跨楼层、跨楼栋。
        </DialogDescription>
        <div className="journey-world" ref={host} />
        {failed && (
          <p role="alert" className="journey-warning">
            当前设备无法显示三维场景，仍可查看下方路线指引。
          </p>
        )}
        {routeChanged && (
          <p role="status" className="journey-warning">
            通行条件已变化，已重算全程路线。请重新开始。
          </p>
        )}
        <div className="journey-instruction" role="status">
          <MapPin size={25} />
          <div>
            <strong>
              {!journey
                ? '当前路线不可通行'
                : done
                  ? '已完成全程导航演示'
                  : current?.leg?.title || '您已在目的地'}
            </strong>
            <span>
              {journey
                ? `全程约 ${journey.meters} 米 · ${journey.levels.length} 个楼层区域 · ${progress}%`
                : '请检查电梯或路段封闭设置。'}
            </span>
          </div>
        </div>
        <Progress value={progress} aria-label="全程导航演示进度" />
        <div className="journey-segments">
          {journey?.legs
            .filter((l) => l.kind !== 'walk')
            .map((l, i) => (
              <span key={i}>
                {l.title}
                <ArrowRight size={13} />
              </span>
            ))}
        </div>
        <div className="journey-buttons">
          <button
            className="secondary"
            disabled={!journey || (!ready && !failed)}
            onClick={() => {
              setElapsed(0);
              setPlaying(false);
              engine.current?.reset();
            }}
          >
            <RotateCcw size={16} />
            从起点重看
          </button>
          <Choice
            label="导航演示速度"
            value={speed}
            onChange={setSpeed}
            options={[
              { value: '.5', label: '慢速 0.5×' },
              { value: '1', label: '标准 1×' },
              { value: '2', label: '快速 2×' },
            ]}
          />
          <button
            className="primary"
            disabled={!journey || done || (!ready && !failed)}
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? <Pause size={18} /> : <Play size={18} />}{' '}
            {playing ? '暂停导航' : '开始全程导航'}
          </button>
          {done && (
            <button
              className="primary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  if (await onArrive()) onClose();
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Check size={18} />
              确认模拟到达
            </button>
          )}
        </div>
        <p className="journey-note">
          仅演示路线，未使用真实定位。到达后由您确认；不自动完成就诊项目。可随时暂停或关闭。
        </p>
      </DialogContent>
    </Dialog>
  );
}
