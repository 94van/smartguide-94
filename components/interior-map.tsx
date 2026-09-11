'use client';
import { useEffect, useRef, useState } from 'react';
import {
  RotateCcw,
  Plus,
  Minus,
  Footprints,
  Box,
  ArrowUpRight,
} from 'lucide-react';
import type { HospitalState } from '@/lib/use-hospital';
import type { createInterior } from '@/lib/scene/interior';
import { floors, getNode, planRoute } from '@/shared/hospital.mjs';
import HospitalMap from './hospital-map';
import SpatialEntry from './spatial-entry';
import JourneyNavigation from './journey-navigation';
type Props = {
  onArrive: () => Promise<boolean>;
  theme?: 'medical' | 'contrast' | 'spatial';
  state: HospitalState;
  level: string;
  target: string | null;
  onLevel: (id: string) => void;
  onSelect: (id: string) => void;
};
export default function InteriorMap(props: Props) {
  if (props.level === 'campus')
    return (
      <div className="inline-campus">
        <SpatialEntry onEnter={(b) => props.onLevel(b + '-1')} />
      </div>
    );
  return <FloorSpace {...props} />;
}
function FloorSpace({
  state,
  level,
  target,
  onLevel,
  onSelect,
  theme = 'medical',
  onArrive,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const engine = useRef<ReturnType<typeof createInterior> | null>(null);
  const latest = useRef({ state, level, target, theme });
  latest.current = { state, level, target, theme };
  const callback = useRef(onSelect);
  callback.current = (id) =>
    id.startsWith('floor:') ? onLevel(id.slice(6)) : onSelect(id);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [tour, setTour] = useState(false);
  useEffect(() => {
    let stopped = false;
    import('@/lib/scene/interior')
      .then(({ createInterior }) => {
        if (stopped) return;
        try {
          engine.current = createInterior(
            host.current!,
            (id) => callback.current(id),
            () => setFailed(true),
          );
          engine.current.update(latest.current);
          setReady(true);
        } catch {
          setFailed(true);
        }
      })
      .catch(() => {
        if (!stopped) setFailed(true);
      });
    return () => {
      stopped = true;
      engine.current?.dispose();
      engine.current = null;
    };
  }, []);
  useEffect(() => {
    engine.current?.update({ state, level, target, theme });
  }, [state, level, target, theme]);
  // Polling returns equal-version snapshots; only rebuild when content changes.
  const route = target ? planRoute(state.location, target, state) : null;
  if (failed)
    return (
      <div>
        <div className="connection-warning">
          当前设备无法显示三维楼层，已切换备用平面导航。
        </div>
        <HospitalMap
          state={state}
          level={level}
          target={target}
          onLevel={onLevel}
          onSelect={onSelect}
        />
      </div>
    );
  return (
    <>
      <div className="interior-space">
        <div className="interior-canvas" ref={host} />
        <div className="interior-caption">
          <span>
            <Box size={15} /> LIVE SPATIAL NAVIGATION
          </span>
          <h3>
            {floors.find((f) => f.id === level)?.name}{' '}
            <small>整栋建筑 · 当前层高亮</small>
          </h3>
          <p>
            {ready
              ? '选择楼层高亮 · 其他层透明 · 拖动旋转'
              : '正在构建楼层空间…'}
          </p>
        </div>
        <div className="interior-level-mark">
          {level.split('-')[1]}
          <span>FLOOR</span>
        </div>
        <div className="interior-tools">
          <button
            onClick={() => {
              engine.current?.reset();
              setTour(false);
            }}
            aria-label="重置三维楼层视角" title="立体视角"
          >
            <RotateCcw size={18} />
          </button>
          <button onClick={() => engine.current?.view('overhead')} aria-label="切换俯视路线视角">俯视</button>
          <button
            onClick={() => engine.current?.zoom(0.85)}
            aria-label="拉近三维地图"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={() => engine.current?.zoom(1.18)}
            aria-label="拉远三维地图"
          >
            <Minus size={18} />
          </button>
        </div>
        <div className="interior-status">
          <span>
            <i />
            {getNode(state.location, state)?.name}
          </span>
          <button disabled={!route || !ready} onClick={() => setTour(true)}>
            <Footprints size={16} />
            全程导航 · 跨楼层 / 楼栋
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
      {tour && target && (
        <JourneyNavigation
          state={state}
          target={target}
          theme={theme}
          onClose={() => setTour(false)}
          onArrive={onArrive}
        />
      )}
    </>
  );
}
