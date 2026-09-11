'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  Navigation,
  Map,
  ClipboardList,
  Check,
  ChevronRight,
  Search,
  Accessibility,
  Clock,
  MapPin,
  ArrowUpRight,
  Volume2,
  QrCode,
  FileText,
  ShieldCheck,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Choice } from '@/components/choice';
import AppHeader from '@/components/app-header';
import InteriorMap from '@/components/interior-map';
import SpatialEntry from '@/components/spatial-entry';
import { VisitFeedback, ErrorFeedback } from '@/components/visit-feedback';
import { Box } from 'lucide-react';
import { useHospital } from '@/lib/use-hospital';
import {
  stages,
  pois,
  nodes,
  floors,
  buildings,
  getNode,
  amenities,
  doctors,
  destinationPresets,
  planRoute,
} from '@/shared/hospital.mjs';
export default function Home() {
  const { state, online, busy, notice, noticeKind, act, setNotice } =
    useHospital();
  const [level, setLevel] = useState('campus');
  const [spatial, setSpatial] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<'task' | 'route' | 'guide'>('task');
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  function toggleMobilePanel(next: 'task' | 'route' | 'guide') {
    setMobilePanelOpen(next !== mobilePanel || !mobilePanelOpen);
    setMobilePanel(next);
  }
  const [theme, setTheme] = useState<'medical' | 'contrast' | 'spatial'>(
    'medical',
  );
  useEffect(() => {
    const saved = localStorage.getItem('smartguide-theme');
    if (saved === 'medical' || saved === 'contrast' || saved === 'spatial')
      setTheme(saved);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.hospitalTheme = theme;
    return () => {
      delete document.documentElement.dataset.hospitalTheme;
    };
  }, [theme]);
  function chooseTheme(value: string) {
    if (value === 'medical' || value === 'contrast' || value === 'spatial') {
      setTheme(value);
      localStorage.setItem('smartguide-theme', value);
    }
  }
  const [target, setTarget] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [destinationsOpen, setDestinationsOpen] = useState(false);
  const [presetGroup, setPresetGroup] = useState('care');
  const [locate, setLocate] = useState(false);
  const [location, setLocation] = useState('out-1-entry');
  const [report, setReport] = useState(false);
  const [large, setLarge] = useState(false);
  const current = stages[state.stage];
  const route = useMemo(
    () => (target ? planRoute(state.location, target, state) : null),
    [state, target],
  );
  const results = query.trim()
    ? [...pois, ...amenities].filter((p) =>
        `${getNode(p.id, state).name} ${p.aliases}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      )
    : [];
  const atTask = !!current.target && state.location === current.target;
  function navigate(id: string) {
    setTarget(id);
    setMobilePanel('route');
    setMobilePanelOpen(true);
    setQuery('');
    setDestinationsOpen(false);
    setLevel(getNode(state.location)?.level || 'campus');
    setNotice('路线已规划，请查看地图和分段指引');
  }
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('loc');
    if (id && nodes.some((n) => n.id === id)) {
      setLocation(id);
      setLocate(true);
      setSpatial(false);
    }
  }, []);
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: { registerTool: (t: unknown, o: unknown) => unknown };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const controller = new AbortController();
    try {
      Promise.resolve(
        context.registerTool(
          {
            name: 'plan_hospital_navigation',
            title: '规划院内导航',
            description:
              '选择科室并在当前地图展示从模拟位置出发的路线，不移动患者。',
            inputSchema: {
              type: 'object',
              properties: { destination: { type: 'string' } },
              required: ['destination'],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false },
            execute: async (input: unknown) => {
              const id = (input as { destination?: string })?.destination;
              if (!id || !getNode(id)) throw Error('无效目的地');
              setTarget(id);
              setMobilePanel('route');
    setMobilePanelOpen(true);
              setSpatial(false);
              setLevel(getNode(state.location).level);
              return {
                destination: id,
                route: planRoute(state.location, id, state),
              };
            },
          },
          { signal: controller.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => controller.abort();
  }, [state]);
  const done = state.stage === 9;
  const timeline =
    state.scenario === 'simple'
      ? [0, 1, 2, 7, 8, 9]
      : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  if (spatial)
    return (
      <SpatialEntry
        onEnter={(building) => {
          setLevel(building + '-1');
          setSpatial(false);
          window.scrollTo(0, 0);
        }}
      />
    );
  return (
    <main
      data-mobile-panel={mobilePanel}
      data-panel-open={mobilePanelOpen}
      data-tools-open={mobileToolsOpen}
      className={
        'shell building-workspace theme-' +
        theme +
        ' ' +
        (large ? 'large-text' : '')
      }
    >
      <AppHeader online={online} />
      <VisitFeedback
        state={state}
        online={online}
        onNext={(id) => {
          if (id) navigate(id);
        }}
      />
      <ErrorFeedback
        message={noticeKind === 'error' ? notice : ''}
        onClose={() => setNotice('')}
      />

      <div className="workspace">
        <section className="page-heading">
          <div>
            <div className="eyebrow">PATIENT JOURNEY</div>
            <h1>{done ? '今日就诊，顺利完成。' : '每一步，都安心。'}</h1>
            <p>你的今日就诊安排与院内导航</p>
          </div>
          <div className="heading-actions">
            <Choice
              label="界面主题"
              value={theme}
              onChange={chooseTheme}
              options={[
                { value: 'medical', label: '医院蓝绿 · 适老' },
                { value: 'contrast', label: '高对比 · 大字' },
                { value: 'spatial', label: '空间展示 · 深色' },
              ]}
            />
            <button className="secondary" onClick={() => setSpatial(true)}>
              <Box size={16} /> 三维院区
            </button>
            <label>
              <Switch
                checked={large}
                onCheckedChange={setLarge}
                aria-label="关怀大字模式"
              />{' '}
              关怀模式
            </label>
            <span className="date-label">
              <ShieldCheck size={17} /> 全程模拟 · 安心体验
            </span>
          </div>
        </section>
        {!online && (
          <div className="connection-warning" role="status">
            正在连接本地演示服务；连接成功后可操作。启动命令：pnpm dev
          </div>
        )}
        <div className="patient-grid">
          <aside className="card guide-card" aria-label="今日导诊单">
            <div className="mobile-ticket-heading">
              <span><ClipboardList size={17} /> 万穗 · A023</span>
              <strong>{done ? '就诊已完成' : '今日导诊单'}</strong>
            </div>
            <div className="card-heading">
              <h2>
                <ClipboardList size={20} /> 今日导诊单
              </h2>
              <span className="pill">{done ? '已完成' : '进行中'}</span>
            </div>
            <div className="patient-info">
              <div className="avatar">万</div>
              <div>
                <strong>
                  万穗 <small>模拟患者</small>
                </strong>
                <p>心血管内科 · 钟国医生</p>
              </div>
            </div>
            <div className="visit-meta">
              <span>
                就诊号<strong>A023</strong>
              </span>
              <span>
                预约时间<strong>09:30</strong>
              </span>
              <span>
                诊室<strong>218 室</strong>
              </span>
            </div>
            <div className="next-card">
              <span>
                {done
                  ? '全流程已完成'
                  : `当前任务 · ${String(timeline.indexOf(state.stage) + 1).padStart(2, '0')}`}
              </span>
              <h3>{current.title}</h3>
              <p className="task-hint">{current.hint}</p>
              {state.stage === 2 && (
                <div className="queue-count">
                  {state.queue > 0 ? (
                    <>
                      <b>{state.queue}</b> 人在你前面{' '}
                      <small>预计等待 {state.queue * 3} 分钟</small>
                    </>
                  ) : (
                    <strong>已叫到 A023，请进入诊室</strong>
                  )}
                </div>
              )}
              {state.stage === 2 && state.queue > 0 && (
                <button className="secondary skip-wait-button" disabled={!online || busy || !atTask}
                  onClick={() => act({ type: 'skip-wait' })}>
                  <Clock size={17} /> {busy ? '正在处理…' : '跳过等待（演示）'}
                </button>
              )}
              {current.target && !done && (
                <button
                  className="primary"
                  onClick={() => navigate(current.target!)}
                >
                  <Navigation size={17} />
                  {atTask ? '查看所在位置' : '去这里 · 开始导航'}
                </button>
              )}
              {!done && (
                <button
                  className={current.target ? 'secondary full' : 'primary full'}
                  disabled={
                    !online ||
                    busy ||
                    (!!current.target && !atTask) ||
                    (state.stage === 2 && state.queue > 0)
                  }
                  onClick={() => act({ type: 'advance' })}
                >
                  {current.action}
                  <ChevronRight size={16} />
                </button>
              )}
              {current.target && !atTask && !done && (
                <p className="tiny-note">导航后点击「模拟到达」，即可继续</p>
              )}
              {done && (
                <a className="primary" href="/admin">
                  重新开始演示 <ArrowUpRight size={16} />
                </a>
              )}
            </div>
            <div className="journey-progress">
              <div>
                <span>就诊进度</span>
                <b>
                  {Math.round(
                    (timeline.indexOf(state.stage) / (timeline.length - 1)) *
                      100,
                  )}
                  %
                </b>
              </div>
              <Progress
                value={
                  (timeline.indexOf(state.stage) / (timeline.length - 1)) * 100
                }
                aria-label="就诊进度"
              />
            </div>
            <details className="journey-details">
              <summary>查看全部就诊步骤</summary>
              <div className="timeline">
                {timeline.map((idx, i) => (
                  <div
                    className={
                      'timeline-row ' +
                      (idx === state.stage
                        ? 'current'
                        : idx < state.stage
                          ? 'completed'
                          : '')
                    }
                    key={idx}
                  >
                    <span className="step-dot">
                      {idx < state.stage ? <Check size={14} /> : i + 1}
                    </span>
                    <div>
                      <strong>{stages[idx].title}</strong>
                      <p>
                        {idx < state.stage
                          ? '已完成'
                          : idx === state.stage
                            ? '当前进行中'
                            : '待完成'}
                      </p>
                    </div>
                    {stages[idx].target && (
                      <button
                        className="icon-link"
                        aria-label={`导航到${stages[idx].title}`}
                        onClick={() => navigate(stages[idx].target!)}
                      >
                        <ChevronRight size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </details>
            {state.stage >= 6 && state.scenario === 'ct' && (
              <button className="report-link" onClick={() => setReport(true)}>
                <FileText size={17} /> 查看模拟检查报告{' '}
                <ChevronRight size={16} />
              </button>
            )}
          </aside>
          <div className="map-column">
            <section className="card map-card">
              <div className="card-heading">
                <h2>
                  <Map size={20} /> 院内导航
                </h2>
                <span className="muted">主院区 · 3 栋楼</span>
              </div>
              <div className="map-toolbar">
                <div className="search-wrap">
                  <Search size={18} />
                  <input
                    aria-label="搜索科室或设施"
                    placeholder="搜索科室、检查、药房…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {query && (
                    <button aria-label="清空搜索" onClick={() => setQuery('')}>
                      ×
                    </button>
                  )}
                  {query.trim() && (
                    <div className="search-results">
                      {results.length ? (
                        results.map((p) => (
                          <button key={p.id} onClick={() => navigate(p.id)}>
                            <MapPin size={16} />
                            <span>
                              {getNode(p.id, state).name}
                              <small>
                                {floors.find((f) => f.id === p.level)?.name}
                              </small>
                            </span>
                            <ChevronRight size={15} />
                          </button>
                        ))
                      ) : (
                        <p>没有找到相关科室，试试「CT」或「取药」。</p>
                      )}
                    </div>
                  )}
                </div>
                <button className="secondary" onClick={() => setLocate(true)}>
                  <QrCode size={17} />
                  <span>模拟定位</span>
                </button>
              </div>
              <div className="level-bar">
                <Choice
                  label="选择建筑"
                  value={level === 'campus' ? 'campus' : level.split('-')[0]}
                  onChange={(v) => setLevel(v === 'campus' ? v : v + '-1')}
                  options={[
                    { value: 'campus', label: '院区总览' },
                    ...buildings.map((b) => ({ value: b.id, label: b.name })),
                  ]}
                />
                <div className="floor-buttons">
                  {level !== 'campus' &&
                    floors
                      .filter((f) => f.building === level.split('-')[0])
                      .map((f) => (
                        <button
                          key={f.id}
                          className={level === f.id ? 'selected' : ''}
                          onClick={() => setLevel(f.id)}
                        >
                          {f.floor}F{route?.levels.includes(f.id) && <i />}
                        </button>
                      ))}
                </div>
                <label className="access-label">
                  <Accessibility size={16} /> 无障碍
                  <Switch
                    checked={state.accessible}
                    disabled={!online || busy}
                    onCheckedChange={(v) =>
                      act({ type: 'accessible', value: v })
                    }
                    aria-label="无障碍路线"
                  />
                </label>
              </div>
              <InteriorMap
                onArrive={async () => {
                  if (!target) return false;
                  const ok = await act({ type: 'arrive', id: target });
                  if (ok) {
                    setLevel(getNode(target).level);
                    setMobilePanel('task');
                    setMobilePanelOpen(true);
                  }
                  return ok;
                }}
                theme={theme}
                state={state}
                level={level}
                target={target}
                onLevel={setLevel}
                onSelect={(id) => {
                  navigate(id);
                  setLevel(getNode(id).level);
                }}
              />
              {target ? (
                <div className="route-panel">
                  <div className="route-heading">
                    <div>
                      <span className="eyebrow">YOUR ROUTE</span>
                      <h3>{getNode(target, state)?.name}</h3>
                      {getNode(target, state)?.hours && (
                        <p className="muted">
                          开放时间 {getNode(target, state).hours}
                        </p>
                      )}
                    </div>
                    {route && (
                      <div className="route-stats">
                        <b>
                          {route.minutes}
                          <small> 分钟</small>
                        </b>
                        <span>约 {route.meters} 米</span>
                      </div>
                    )}
                  </div>
                  {getNode(target)?.detail && <p className="destination-detail">{getNode(target).detail}</p>}
                  {route ? (
                    <>
                      <div className="route-levels">
                        {route.levels.length > 1 && (
                          <button onClick={() => setLevel('campus')}>
                            院区总览
                          </button>
                        )}
                        {route.levels.map((l) => (
                          <button
                            key={l}
                            className={l === level ? 'selected' : ''}
                            onClick={() => setLevel(l)}
                          >
                            {floors.find((f) => f.id === l)?.name}
                            <ChevronRight size={12} />
                          </button>
                        ))}
                      </div>
                      <ol className="route-steps">
                        {route.steps.map((s, i) => (
                          <li key={i}>
                            <span>{i + 1}</span>
                            {s}
                          </li>
                        ))}
                      </ol>
                      <div className="route-actions">
                        <button
                          className="secondary"
                          onClick={() => {
                            if (!('speechSynthesis' in window)) {
                              setNotice('当前浏览器不支持语音播报');
                              return;
                            }
                            speechSynthesis.cancel();
                            const s = new SpeechSynthesisUtterance(
                              route.steps.join('。'),
                            );
                            s.lang = 'zh-CN';
                            speechSynthesis.speak(s);
                          }}
                        >
                          <Volume2 size={16} /> 语音播报
                        </button>
                        <button
                          className="primary"
                          disabled={
                            !online || busy || state.location === target
                          }
                          onClick={async () => {
                            if (await act({ type: 'arrive', id: target })) {
                              setLevel(getNode(target).level);
                              setMobilePanel('task');
                    setMobilePanelOpen(true);
                            }
                          }}
                        >
                          <Check size={16} />
                          {state.location === target ? '已到达' : '模拟到达'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="no-route">
                      当前没有可通行路线。
                      {state.accessible && state.elevatorClosed
                        ? '无障碍模式下电梯已停运，请联系服务台或在后台恢复电梯。'
                        : '请在后台检查封闭路段。'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="map-footer">
                  <Navigation size={23} />
                  <div>
                    <strong>从这里，找到下一站</strong>
                    <p>选择导诊任务，或点击地图中的建筑和科室</p>
                  </div>
                  <span className="map-legend">
                    <i />
                    当前位置 <i />
                    目的地
                  </span>
                </div>
              )}
            </section>
            <div className="info-strip">
              <Clock size={18} />
              <span>
                门诊服务时间 <b>08:00 — 17:30</b>
              </span>
              <span>
                服务台 <b>门诊楼 1F</b>
              </span>
            </div>
            <section className="demo-console">
              <div>
                <span className="console-icon">▶</span>
                <div>
                  <h3>演示控制台</h3>
                  <p>体验叫号与就诊状态变化</p>
                </div>
              </div>
              <button
                className="secondary"
                disabled={
                  !online || busy || state.stage !== 2 || state.queue === 0
                }
                onClick={() => act({ type: 'call' })}
              >
                模拟下一位叫号
              </button>
              <a href="/admin">
                更多控制 <ArrowUpRight size={15} />
              </a>
            </section>
          </div>
        </div>
        <footer>
          玖肆智慧医院 · SmartGuide{' '}
          <span>所有医院、患者与诊疗数据均为虚构演示数据</span>
        </footer>
      </div>
      <button className="mobile-tools-toggle" aria-expanded={mobileToolsOpen} onClick={() => setMobileToolsOpen(!mobileToolsOpen)}>
        <span><Map size={18} /> {level === 'campus' ? '院区总览' : floors.find((f) => f.id === level)?.name}</span>
        <span><SlidersHorizontal size={16} /> {mobileToolsOpen ? '收起设置' : '地图设置'}<ChevronDown size={16} /></span>
      </button>
      <button className="mobile-status-toggle" aria-expanded={mobilePanelOpen} onClick={() => setMobilePanelOpen(!mobilePanelOpen)}>
        <span className="status-toggle-icon">{mobilePanel === 'route' ? <Navigation size={20} /> : <ClipboardList size={20} />}</span>
        <span className="status-toggle-copy"><small>{mobilePanel === 'guide' ? '万穗 · A023' : mobilePanel === 'route' ? '路线导航' : '当前任务'}</small><strong>{mobilePanel === 'route' ? (target ? getNode(target, state)?.name : '选择目的地') : mobilePanel === 'guide' ? '今日导诊单' : current.title}</strong></span>
        <span className="status-toggle-action">{mobilePanelOpen ? '收起' : '展开'}<ChevronDown size={18} /></span>
      </button>
      <button className="destination-launch" onClick={() => setDestinationsOpen(true)}><MapPin size={18} /> 去哪儿</button>
      <Dialog open={destinationsOpen} onOpenChange={setDestinationsOpen}>
        <DialogContent className="destination-dialog">
          <DialogTitle>选择目的地</DialogTitle>
          <DialogDescription>点击常用地点，地面导航线会沿可通行路线显示。</DialogDescription>
          <div className="preset-categories" role="group" aria-label="目的地分类">
            {[...destinationPresets, { id: 'doctor', name: '医生' }].map((g) => <button key={g.id} aria-pressed={presetGroup === g.id} onClick={() => setPresetGroup(g.id)}>{g.name}</button>)}
          </div>
          {presetGroup === 'doctor' ? doctors.map((doctor) => <section key={doctor.id} className="doctor-profile">
            <h3>{doctor.name}<small> · {doctor.department}</small></h3>
            <p>{doctor.room}</p><p>演示排班：{doctor.schedule}</p><p className="muted">{doctor.note}</p>
            <button className="primary" onClick={() => navigate(doctor.target)}><Navigation size={17} /> 导航到诊室</button>
          </section>) : <div className="preset-destinations">
            {destinationPresets.find((g) => g.id === presetGroup)?.items.map((id) => {
              const place = getNode(id, state);
              return <button key={id} onClick={() => navigate(id)}><MapPin size={20} /><span><strong>{place.name}</strong><small>{floors.find((f) => f.id === place.level)?.name}</small></span><ChevronRight size={16} /></button>;
            })}
          </div>}
          {presetGroup === 'parking' && <p className="preset-note">户外停车场按人行入口导航。没有实时车位或收费数据；地下车库尚未建模。</p>}
        </DialogContent>
      </Dialog>
      <nav className="mobile-module-dock" aria-label="导诊面板切换">
        <button type="button" aria-pressed={mobilePanel === 'task'} onClick={() => toggleMobilePanel('task')} aria-expanded={mobilePanel === 'task' && mobilePanelOpen}>
          <span className="module-key"><Check size={22} /></span><span>当前任务</span>
        </button>
        <button type="button" aria-pressed={mobilePanel === 'route'} onClick={() => toggleMobilePanel('route')} aria-expanded={mobilePanel === 'route' && mobilePanelOpen}>
          <span className="module-key"><Navigation size={22} /></span><span>路线导航</span>
        </button>
        <button type="button" aria-pressed={mobilePanel === 'guide'} onClick={() => toggleMobilePanel('guide')} aria-expanded={mobilePanel === 'guide' && mobilePanelOpen}>
          <span className="module-key"><ClipboardList size={22} /></span><span>导诊单</span>
        </button>
      </nav>
      {notice && noticeKind !== 'error' && (
        <div className={'notice notice-' + noticeKind} role="status">
          {notice}
        </div>
      )}
      <Dialog open={locate} onOpenChange={setLocate}>
        <DialogContent>
          <DialogTitle>设置模拟位置</DialogTitle>
          <DialogDescription>
            选择院内点位，模拟扫码定位。确认后路线自动重新计算。
          </DialogDescription>
          <Choice
            value={location}
            onChange={setLocation}
            label="定位点"
            options={nodes
              .filter((n) => n.type !== 'corridor')
              .map((n) => ({
                value: n.id,
                label: `${floors.find((f) => f.id === n.level)?.name} · ${getNode(n.id, state).name}`,
              }))}
          />
          <button
            className="primary"
            disabled={!online || busy}
            onClick={async () => {
              if (await act({ type: 'locate', id: location })) {
                setLevel(getNode(location).level);
                setLocate(false);
              }
            }}
          >
            确认模拟定位
          </button>
        </DialogContent>
      </Dialog>
      <Dialog open={report} onOpenChange={setReport}>
        <DialogContent>
          <DialogTitle>胸部 CT · 模拟报告</DialogTitle>
          <DialogDescription>
            仅用于展示报告流转，不作为医疗判断依据。
          </DialogDescription>
          <div className="report-sheet">
            <p>患者：万穗　就诊号：A023</p>
            <p>检查项目：胸部 CT 平扫</p>
            <p>检查地点：医技楼 1F</p>
            <p>报告状态：已生成</p>
            <hr />
            <p>这是虚构的演示报告，不包含诊断结论。</p>
            <p>下一步：返回 218 诊室复诊。</p>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
