'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  HeartPulse,
  MoveUpRight,
  RotateCcw,
  Layers,
  MousePointer2,
  ScanLine,
  Navigation,
  LoaderCircle,
} from 'lucide-react';
import type { BuildingId, createCampus } from '@/lib/scene/campus';
const places = [
  {
    id: 'out' as BuildingId,
    name: '门诊综合楼',
    en: 'OUTPATIENT CENTER',
    open: '1F — 3F',
    desc: '从签到到取药，让每一站清晰相连。',
    services: ['门诊服务', '专科诊室', '西药房'],
    n: '01',
  },
  {
    id: 'tech' as BuildingId,
    name: '医技中心',
    en: 'DIAGNOSTIC CENTER',
    open: '1F',
    desc: 'CT、磁共振与超声检查，找到你的下一站。',
    services: ['CT 检查', '医学影像', '报告领取'],
    n: '02',
  },
  {
    id: 'ward' as BuildingId,
    name: '住院楼',
    en: 'INPATIENT BUILDING',
    open: '1F 开放',
    desc: '入院办理与住院服务，从容开启新的旅程。',
    services: ['入院办理', '家属休息', '生活服务'],
    n: '03',
  },
];
export default function SpatialEntry({
  onEnter,
}: {
  onEnter: (building: BuildingId) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const labels = useRef<(HTMLButtonElement | null)[]>([]);
  const engine = useRef<ReturnType<typeof createCampus> | null>(null);
  const [selected, setSelected] = useState<BuildingId>('out');
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [entering, setEntering] = useState(false);
  const onEnterRef = useRef(onEnter);
  onEnterRef.current = onEnter;
  const place = places.find((p) => p.id === selected)!;
  useEffect(() => {
    let stopped = false;
    const mount = host.current!;
    import('@/lib/scene/campus')
      .then(({ createCampus }) => {
        if (stopped) return;
        try {
          engine.current = createCampus(mount, {
            onSelect: setSelected,
            onReady: () => setReady(true),
            onError: () => setFailed(true),
            labels: labels.current.filter(Boolean) as HTMLElement[],
          });
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
  function choose(id: BuildingId) {
    setSelected(id);
    engine.current?.select(id);
  }
  function enter() {
    if (entering) return;
    if (failed || !engine.current) {
      onEnterRef.current(selected);
      return;
    }
    setEntering(true);
    engine.current.enter(selected, () => onEnterRef.current(selected));
  }
  return (
    <section
      className={`spatial-entry ${ready ? 'scene-ready' : ''} ${entering ? 'scene-entering' : ''}`}
      aria-label="三维院区入口"
    >
      <div className="spatial-ambient" />
      <div
        className="scene-host"
        ref={host}
        aria-label="三维院区模型，拖动旋转，滚轮缩放"
      />
      <div className="spatial-labels">
        {places.map((p, i) => (
          <button
            key={p.id}
            ref={(el) => {
              labels.current[i] = el;
            }}
            className="building-beacon"
            onClick={() => choose(p.id)}
            disabled={entering}
            aria-label={`选择${p.name}`}
          >
            <span className="beacon-number">{p.n}</span>
            <span>
              {p.name}
              <small>{p.en}</small>
            </span>
            <ArrowUpRight size={13} />
            <i />
          </button>
        ))}
      </div>
      <div className="spatial-vignette" />
      <header className="spatial-header">
        <a href="/" className="spatial-brand">
          <span>
            <HeartPulse size={24} />
          </span>
          <div>
            玖肆智慧医院<small>JIUSI SMART HOSPITAL</small>
          </div>
        </a>
        <span className="spatial-header-center">
          <i /> 智慧院区 · 空间导览
        </span>
        <button
          onClick={() => onEnterRef.current('out')}
          className="skip-entry"
          disabled={entering}
        >
          直接查看导诊单 <ArrowUpRight size={15} />
        </button>
      </header>
      <div className="spatial-copy">
        <div className="spatial-eyebrow">
          <span /> A SPACE THAT CARES
        </div>
        <h1>
          行至
          <br />
          <em>安心之境。</em>
        </h1>
        <p>
          让陌生的空间，成为清晰的下一站。
          <br />
          从这里，开启你的安心就诊之旅。
        </p>
        <div className="spatial-start">
          <button
            onClick={enter}
            disabled={entering || (!ready && !failed)}
            className="enter-campus"
          >
            <span>
              {entering ? '正在进入空间' : failed ? '打开院内导诊' : '进入院区'}
            </span>
            {!ready && !failed ? (
              <LoaderCircle className="spin" size={20} />
            ) : (
              <ArrowUpRight size={22} />
            )}
          </button>
          <span className="entry-caption">EXPLORE YOUR NEXT STEP</span>
        </div>
        <div className="spatial-metrics">
          <div>
            <strong>03</strong>
            <span>院区建筑</span>
          </div>
          <i />
          <div>
            <strong>30</strong>
            <span>科室与设施</span>
          </div>
          <i />
          <div>
            <strong>01</strong>
            <span>安心就诊旅程</span>
          </div>
        </div>
      </div>
      <div className="spatial-top-coordinate">
        <span>JIUSI / MAIN CAMPUS</span>
        <b>08:00 &nbsp;—&nbsp; 17:30</b>
        <small>虚构院区 · 空间示意</small>
      </div>
      <div className="scene-actions">
        <button
          title="恢复初始视角"
          aria-label="恢复初始视角"
          onClick={() => {
            engine.current?.reset();
            setExpanded(false);
          }}
          disabled={!ready || entering}
        >
          <RotateCcw size={18} />
        </button>
        <button
          className={expanded ? 'is-active' : ''}
          title="展开门诊楼楼层"
          aria-label="展开门诊楼楼层"
          aria-pressed={expanded}
          disabled={!ready || entering}
          onClick={() => {
            choose('out');
            engine.current?.expand(!expanded);
            setExpanded(!expanded);
          }}
        >
          <Layers size={18} />
        </button>
        <span>{expanded ? '楼层展开' : '空间视角'}</span>
      </div>
      <aside className="spatial-building-card">
        <div className="building-card-top">
          <span>
            <i /> {expanded && selected === 'out' ? '楼层剖面' : '已选择建筑'}
          </span>
          <b>{place.n} / 03</b>
        </div>
        <div className="building-card-title">
          <div>
            <span>{place.en}</span>
            <h2>{place.name}</h2>
          </div>
          <MoveUpRight size={27} />
        </div>
        <p>{place.desc}</p>
        <div className="building-services">
          {place.services.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
        <button onClick={enter} disabled={entering || (!ready && !failed)}>
          <span>
            <Navigation size={15} />
            进入 {place.open}
          </span>
          <ArrowRight size={18} />
        </button>
      </aside>
      <footer className="spatial-footer">
        <div className="campus-selector">
          {places.map((p) => (
            <button
              key={p.id}
              className={selected === p.id ? 'selected' : ''}
              onClick={() => choose(p.id)}
              disabled={entering}
            >
              <span>{p.n}</span>
              <b>{p.name}</b>
              <i />
            </button>
          ))}
        </div>
        <div className="spatial-instructions">
          <MousePointer2 size={14} />
          <span>拖动旋转 · 滚轮缩放 · 点击探索</span>
          <ScanLine size={18} />
        </div>
      </footer>
      {failed && (
        <div className="spatial-fallback" role="status">
          当前设备无法显示三维空间，可直接进入院内导诊。
        </div>
      )}
      <div className="scene-transition" aria-hidden="true" />
    </section>
  );
}
