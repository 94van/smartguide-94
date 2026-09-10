'use client';
import { useRef, useState } from 'react';
import { Plus, Minus, LocateFixed, Compass } from 'lucide-react';
import {
  buildings,
  nodes,
  edges,
  pois,
  getNode,
  planRoute,
  edgePolyline,
} from '@/shared/hospital.mjs';
import type { HospitalState } from '@/lib/use-hospital';
type Props = {
  state: HospitalState;
  level: string;
  target: string | null;
  onLevel: (s: string) => void;
  onSelect: (s: string) => void;
};
export default function HospitalMap({
  state,
  level,
  target,
  onLevel,
  onSelect,
}: Props) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(
    null,
  );
  const moved = useRef(false);
  const route = target ? planRoute(state.location, target, state) : null;
  const position = getNode(state.location, state);
  const campus = level === 'campus';
  function point(id: string) {
    const n = getNode(id, state);
    if (!n) return { x: 0, y: 0 };
    if (!campus) return n;
    const b = buildings.find((b) => b.id === n.building)!;
    return { x: b.x + b.w / 2, y: b.y + b.h + 12 };
  }
  const visibleEdges = campus
    ? edges.filter((e) => e.kind === 'outdoor')
    : edges.filter(
        (e) => getNode(e.a)?.level === level && getNode(e.b)?.level === level,
      );
  return (
    <div className="map-surface interactive-map">
      <div className="map-title">
        <span className="live-dot" />
        {campus
          ? '院区总览'
          : `${buildings.find((b) => b.id === level.split('-')[0])?.short} · ${level.split('-')[1]}F`}
        <small>{campus ? 'CAMPUS OVERVIEW' : 'INDOOR NAVIGATION'}</small>
      </div>
      <div className="compass">
        <Compass size={29} />
        <span>N</span>
      </div>
      <svg
        className="map-svg"
        viewBox="0 0 800 610"
        role="img"
        aria-label="医院导航地图，可点击建筑或科室"
        onPointerDown={(e) => {
          if ((e.target as Element).closest('[data-poi]')) return;
          drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
          moved.current = false;
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (drag.current) {
            const factor = 800 / e.currentTarget.getBoundingClientRect().width;
            const dx = (e.clientX - drag.current.x) * factor,
              dy = (e.clientY - drag.current.y) * factor;
            moved.current = Math.abs(dx) + Math.abs(dy) > 4;
            setPan({ x: drag.current.px + dx, y: drag.current.py + dy });
          }
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
      >
        <defs>
          <pattern
            id="floorGrid"
            width="25"
            height="25"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 25 0 L 0 0 0 25"
              fill="none"
              stroke="#2b4059"
              strokeWidth=".5"
            />
          </pattern>
          <filter id="routeGlow">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
        <g
          transform={`translate(${pan.x + 400 * (1 - zoom)} ${pan.y + 305 * (1 - zoom)}) scale(${zoom})`}
        >
          {campus ? (
            <>
              <path
                d="M 45 555 H 733 M 45 555 V 345 H 700 M 398 95 V 560"
                stroke="#233950"
                strokeWidth="37"
                fill="none"
              />
              <path
                d="M 45 555 H 733 M 398 95 V 560"
                stroke="#436079"
                strokeDasharray="8 10"
                fill="none"
              />
              <text
                x="95"
                y="590"
                fill="#6d8aa6"
                fontSize="13"
                letterSpacing="4"
              >
                院区南路 · 主入口
              </text>
              {buildings.map((b, i) => (
                <g
                  key={b.id}
                  data-poi="true"
                  role="button"
                  tabIndex={0}
                  aria-label={`进入${b.name}`}
                  onClick={() => onLevel(`${b.id}-1`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ')
                      onLevel(`${b.id}-1`);
                  }}
                  className="svg-room"
                >
                  <path
                    d={`M${b.x},${b.y + b.h} l18,22 h${b.w} v-${b.h} l-18,-22`}
                    fill="#142439"
                    stroke="#365b80"
                  />
                  <rect
                    x={b.x}
                    y={b.y}
                    width={b.w}
                    height={b.h}
                    rx="5"
                    fill={i === 0 ? '#294d71' : '#263e57'}
                    stroke={i === 0 ? '#6097c5' : '#496785'}
                    strokeWidth="2"
                  />
                  <rect
                    x={b.x + 12}
                    y={b.y + 12}
                    width={b.w - 24}
                    height={b.h - 24}
                    rx="3"
                    fill="url(#floorGrid)"
                    stroke="#557793"
                  />
                  {[0, 1, 2, 3].map((j) => (
                    <path
                      key={j}
                      d={`M${b.x + 25 + (j * (b.w - 45)) / 4},${b.y + 25} v${b.h - 50}`}
                      stroke="#466581"
                      strokeWidth="11"
                    />
                  ))}
                  <rect
                    x={b.x + 22}
                    y={b.y + b.h / 2 - 27}
                    width={b.w - 44}
                    height="64"
                    rx="7"
                    fill="#14273ee8"
                  />
                  <text
                    x={b.x + b.w / 2}
                    y={b.y + b.h / 2}
                    textAnchor="middle"
                    fill="#e4efff"
                    fontSize="19"
                    fontWeight="600"
                  >
                    {b.name}
                  </text>
                  <text
                    x={b.x + b.w / 2}
                    y={b.y + b.h / 2 + 24}
                    textAnchor="middle"
                    fill="#8ca9c8"
                    fontSize="12"
                  >
                    {b.floors} 个开放楼层 · 点击进入
                  </text>
                </g>
              ))}
            </>
          ) : (
            <>
              <rect
                x="75"
                y="110"
                width="650"
                height="410"
                rx="14"
                fill="#1d344e"
                stroke="#496782"
                strokeWidth="2"
              />
              <rect
                x="85"
                y="120"
                width="630"
                height="390"
                fill="url(#floorGrid)"
              />
              <path
                d="M 160 300 H 645 M 180 300 V 440 H 620 V 300 M 400 300 V 440"
                stroke="#314b65"
                strokeWidth="42"
                fill="none"
              />
              {pois
                .filter((p) => p.level === level)
                .map((p) => {
                  const active = p.id === target;
                  const name = getNode(p.id, state).name;
                  return (
                    <g
                      key={p.id}
                      data-poi="true"
                      className="svg-room"
                      role="button"
                      tabIndex={0}
                      aria-label={`导航到${name}`}
                      onClick={() => onSelect(p.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') onSelect(p.id);
                      }}
                    >
                      <rect
                        x={p.x - 82}
                        y={p.y < 300 ? 130 : 335}
                        width="164"
                        height={p.y < 300 ? 115 : 65}
                        rx="5"
                        fill={active ? '#245584' : '#29435e'}
                        stroke={active ? '#60b5ff' : '#4c6782'}
                        strokeWidth={active ? 2 : 1}
                      />
                      <text
                        x={p.x}
                        y={p.y < 300 ? 186 : 362}
                        textAnchor="middle"
                        fill={active ? '#e1f2ff' : '#aec3d9'}
                        fontSize="14"
                      >
                        {name.length > 12 ? name.replace(' · ', ' ') : name}
                      </text>
                      <text
                        x={p.x}
                        y={p.y < 300 ? 212 : 383}
                        textAnchor="middle"
                        fill="#7495b4"
                        fontSize="11"
                      >
                        {active ? '目的地' : '点击查看路线'}
                      </text>
                    </g>
                  );
                })}
              <text
                x="400"
                y="282"
                fill="#7894af"
                fontSize="11"
                textAnchor="middle"
                letterSpacing="6"
              >
                中央通行走廊
              </text>
            </>
          )}
          {visibleEdges.map((e) => {
            const a = point(e.a),
              b = point(e.b);
            if (!state.blocked.includes(e.id)) return null;
            return (
              <g key={e.id}>
                <path
                  d={`M${a.x} ${a.y} L${b.x} ${b.y}`}
                  stroke="#ed776b"
                  strokeWidth="5"
                  strokeDasharray="6 5"
                />
                <text
                  x={(a.x + b.x) / 2}
                  y={(a.y + b.y) / 2 - 10}
                  fill="#ff9b91"
                  fontSize="12"
                >
                  临时封闭
                </text>
              </g>
            );
          })}
          {route?.segments.map((e, i) => {
            if (
              campus
                ? e.kind !== 'outdoor'
                : getNode(e.a)?.level !== level || getNode(e.b)?.level !== level
            )
              return null;
            const a = point(e.a),
              b = point(e.b);
            const routeD = campus
              ? `M${a.x} ${a.y} L${b.x} ${b.y}`
              : edgePolyline(e)
                  .map((p, j) => `${j ? 'L' : 'M'}${p.x} ${p.y}`)
                  .join(' ');
            return (
              <g key={i}>
                <path
                  d={routeD}
                  stroke="#279aff"
                  strokeWidth="12"
                  opacity=".35"
                  filter="url(#routeGlow)"
                />
                <path
                  d={routeD}
                  stroke="#3fa5ff"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <path
                  className="route-flow"
                  d={routeD}
                  stroke="#bfebff"
                  strokeWidth="2"
                  strokeDasharray="4 13"
                />
              </g>
            );
          })}
          {!campus &&
            nodes
              .filter(
                (n) =>
                  n.level === level &&
                  ['elevator', 'stairs', 'entry'].includes(n.type),
              )
              .map((n) => (
                <g
                  key={n.id}
                  data-poi="true"
                  tabIndex={0}
                  role="button"
                  aria-label={`选择${n.name}`}
                  onClick={() => onSelect(n.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSelect(n.id);
                  }}
                  className="svg-room"
                >
                  <rect
                    x={n.x - 25}
                    y={n.y - 19}
                    width="50"
                    height="37"
                    rx="7"
                    fill={
                      n.type === 'elevator' && state.elevatorClosed
                        ? '#763d48'
                        : '#355574'
                    }
                    stroke="#587f9f"
                  />
                  <text
                    x={n.x}
                    y={n.y + 5}
                    textAnchor="middle"
                    fill="#dceaff"
                    fontSize="16"
                  >
                    {n.type === 'elevator'
                      ? '↕'
                      : n.type === 'stairs'
                        ? '≋'
                        : '↗'}
                  </text>
                  <text
                    x={n.x}
                    y={n.y + 39}
                    textAnchor="middle"
                    fill="#92abc4"
                    fontSize="12"
                  >
                    {n.type === 'elevator' && state.elevatorClosed
                      ? '电梯停运'
                      : n.name}
                  </text>
                </g>
              ))}
          {(campus || position?.level === level) && position && (
            <g>
              <circle
                cx={point(position.id).x}
                cy={point(position.id).y}
                r="17"
                fill="#44b4ff"
                opacity=".2"
              />
              <circle
                cx={point(position.id).x}
                cy={point(position.id).y}
                r="8"
                fill="#59b6ff"
                stroke="white"
                strokeWidth="3"
              />
            </g>
          )}
          {target && (campus || getNode(target)?.level === level) && (
            <g>
              <circle
                cx={point(target).x}
                cy={point(target).y}
                r="12"
                fill="#ffad5d"
                stroke="#ffdab4"
                strokeWidth="3"
              />
              <text
                x={point(target).x}
                y={point(target).y + 4}
                textAnchor="middle"
                fontSize="11"
                fill="#422b19"
              >
                终
              </text>
            </g>
          )}
        </g>
      </svg>
      <div className="map-controls">
        <button
          aria-label="放大地图"
          onClick={() => setZoom((z) => Math.min(2, z + 0.2))}
        >
          <Plus size={18} />
        </button>
        <button
          aria-label="缩小地图"
          onClick={() => setZoom((z) => Math.max(0.7, z - 0.2))}
        >
          <Minus size={18} />
        </button>
        <button
          aria-label="回到当前位置并重置地图"
          onClick={() => {
            setPan({ x: 0, y: 0 });
            setZoom(1);
            onLevel(position?.level || 'campus');
          }}
        >
          <LocateFixed size={18} />
        </button>
      </div>
      <div className="map-position">
        <span className="live-dot" />
        模拟位置：{position?.name}
      </div>
      <div className="map-scale">
        ━━━━<span>约 20 米</span>
      </div>
    </div>
  );
}
