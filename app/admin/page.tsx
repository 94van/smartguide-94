'use client';
import { useState } from 'react';
import {
  Activity,
  Building2,
  MapPin,
  Route,
  SlidersHorizontal,
  ClipboardList,
  Search,
  Pencil,
  RotateCcw,
  ArrowRight,
  Check,
  Clock,
  QrCode,
} from 'lucide-react';
import AppHeader from '@/components/app-header';
import { Choice } from '@/components/choice';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { useHospital, apiBase } from '@/lib/use-hospital';
import { stages, pois, edges, floors, getNode } from '@/shared/hospital.mjs';
export default function Admin() {
  const { state, online, busy, notice, act } = useHospital();
  const [filter, setFilter] = useState('');
  const [edit, setEdit] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [hours, setHours] = useState('');
  const [reset, setReset] = useState(false);
  const [scenario, setScenario] = useState('ct');
  const [qr, setQr] = useState<string | null>(null);
  const current = stages[state.stage];
  const at = current.target === state.location;
  const visible = pois.filter((p) =>
    `${getNode(p.id, state).name} ${p.aliases}`
      .toLowerCase()
      .includes(filter.toLowerCase()),
  );
  return (
    <main className="shell">
      <AppHeader admin online={online} />
      <div className="workspace">
        <section className="page-heading">
          <div>
            <div className="eyebrow">OPERATIONS WORKSPACE</div>
            <h1>让就诊，有序发生。</h1>
            <p>院区运营与全流程演示控制</p>
          </div>
          <a className="secondary" href="/" target="_blank" rel="noreferrer">
            打开患者端 <ArrowRight size={16} />
          </a>
        </section>
        {!online && (
          <div className="connection-warning">
            本地服务尚未连接，请使用 pnpm dev 启动。
          </div>
        )}
        <div className="admin-metrics">
          {[
            [Building2, '院区建筑', '3 栋'],
            [MapPin, '科室与设施', `${pois.length} 处`],
            [Route, '通行路段', `${edges.length - state.blocked.length} 条`],
            [Activity, '当前患者', 'A023'],
          ].map(([Icon, label, value]) => {
            const I = Icon as typeof Activity;
            return (
              <div className="metric" key={String(label)}>
                <I />
                <div>
                  <span>{String(label)}</span>
                  <b>{String(value)}</b>
                </div>
              </div>
            );
          })}
        </div>
        <Tabs defaultValue="demo">
          <TabsList className="admin-tabs">
            <TabsTrigger value="demo">演示控制</TabsTrigger>
            <TabsTrigger value="departments">科室管理</TabsTrigger>
            <TabsTrigger value="routes">通行管理</TabsTrigger>
            <TabsTrigger value="logs">操作记录</TabsTrigger>
          </TabsList>
          <TabsContent value="demo">
            <div className="admin-grid">
              <section className="card admin-card">
                <h2>
                  <ClipboardList size={20} /> 当前就诊流程
                </h2>
                <div className="admin-current">
                  <span className="stat-small">
                    万穗 · A023 ·{' '}
                    {state.scenario === 'ct' ? '检查复诊流程' : '普通门诊流程'}
                  </span>
                  <h3>{current.title}</h3>
                  <p>{current.hint}</p>
                  <p>当前位置：{getNode(state.location, state).name}</p>
                </div>
                {state.stage === 2 && (
                  <div className="admin-alert">
                    前方 {state.queue} 人 ·{' '}
                    {state.queue === 0
                      ? '已叫到 A023'
                      : '点击叫号按钮推进候诊队列'}
                  </div>
                )}
                <div className="admin-buttons">
                  <button
                    className="secondary"
                    disabled={
                      !online ||
                      busy ||
                      !current.target ||
                      at ||
                      state.stage === 9
                    }
                    onClick={() => act({ type: 'arrive', id: current.target })}
                  >
                    <MapPin size={16} /> 模拟到达任务地点
                  </button>
                  <button
                    className="secondary"
                    disabled={
                      !online || busy || state.stage !== 2 || state.queue === 0
                    }
                    onClick={() => act({ type: 'call' })}
                  >
                    <Activity size={16} /> 模拟下一位叫号
                  </button>
                  <button
                    className="primary"
                    disabled={
                      !online ||
                      busy ||
                      state.stage === 9 ||
                      (!!current.target && !at) ||
                      (state.stage === 2 && state.queue > 0)
                    }
                    onClick={() => act({ type: 'advance' })}
                  >
                    <Check size={16} /> {current.action}
                  </button>
                  <a
                    className="secondary"
                    href="/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    查看患者端 <ArrowRight size={16} />
                  </a>
                </div>
                <p className="admin-note">
                  患者端每 1.5 秒同步一次。请先到达任务地点，再推进流程。
                </p>
                <div className="reset-row">
                  <Choice
                    label="选择演示流程"
                    value={scenario}
                    onChange={setScenario}
                    options={[
                      { value: 'ct', label: '检查 → 复诊 → 取药' },
                      { value: 'simple', label: '普通门诊 → 取药' },
                    ]}
                  />
                  <button
                    className="secondary"
                    disabled={!online || busy}
                    onClick={() => setReset(true)}
                  >
                    <RotateCcw size={15} /> 重置演示
                  </button>
                </div>
              </section>
              <section className="card admin-card">
                <h2>
                  <SlidersHorizontal size={20} /> 院区通行设置
                </h2>
                <div className="control-row">
                  <div>
                    <h3>无障碍路线</h3>
                    <p>仅使用平层通道及电梯，避开楼梯。</p>
                  </div>
                  <Switch
                    checked={state.accessible}
                    disabled={!online || busy}
                    onCheckedChange={(v) =>
                      act({ type: 'accessible', value: v })
                    }
                    aria-label="无障碍路线"
                  />
                </div>
                <div className="control-row">
                  <div>
                    <h3>A 区电梯暂停服务</h3>
                    <p>停运后自动重算路线；可改走 B 区楼梯。</p>
                  </div>
                  <Switch
                    checked={state.elevatorClosed}
                    disabled={!online || busy}
                    onCheckedChange={(v) => act({ type: 'elevator', value: v })}
                    aria-label="A 区电梯暂停服务"
                  />
                </div>
                {state.elevatorClosed && state.accessible && (
                  <div className="admin-alert">
                    电梯停运且无障碍模式已开启，跨楼层路线将不可用。
                  </div>
                )}
                <h2 style={{ marginTop: 28 }}>
                  <Clock size={20} /> 最近动态
                </h2>
                <div className="log-list">
                  {state.logs.length ? (
                    state.logs
                      .slice(0, 5)
                      .map(
                        (l: { id: number; time: string; message: string }) => (
                          <div className="log-row" key={l.id}>
                            <time>
                              {new Date(l.time).toLocaleTimeString('zh-CN', {
                                hour12: false,
                              })}
                            </time>
                            <span>{l.message}</span>
                          </div>
                        ),
                      )
                  ) : (
                    <p className="empty-message">
                      尚无操作，开始一段就诊演示吧。
                    </p>
                  )}
                </div>
              </section>
            </div>
          </TabsContent>
          <TabsContent value="departments">
            <section className="card table-card">
              <div className="table-toolbar">
                <div>
                  <h2>科室与设施</h2>
                  <p className="muted">
                    修改名称与开放时间后，患者端同步更新。
                  </p>
                </div>
                <div className="search-wrap">
                  <Search size={17} />
                  <input
                    aria-label="搜索后台科室"
                    placeholder="搜索名称或别名"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>科室 / 设施</TableHead>
                    <TableHead>所在位置</TableHead>
                    <TableHead>开放时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        {getNode(p.id, state).name}
                        <small>{p.aliases}</small>
                      </TableCell>
                      <TableCell>
                        {floors.find((f) => f.id === p.level)?.name}
                      </TableCell>
                      <TableCell>{getNode(p.id, state).hours}</TableCell>
                      <TableCell>
                        <button
                          className="secondary"
                          disabled={!online || busy}
                          onClick={() => {
                            setEdit(p.id);
                            setName(getNode(p.id, state).name);
                            setHours(getNode(p.id, state).hours);
                          }}
                        >
                          <Pencil size={13} /> 编辑
                        </button>{' '}
                        <button
                          className="secondary"
                          onClick={() => setQr(p.id)}
                          aria-label={`${p.name}定位码`}
                        >
                          <QrCode size={14} />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!visible.length && (
                <p className="empty-message">没有找到匹配科室。</p>
              )}
            </section>
          </TabsContent>
          <TabsContent value="routes">
            <section className="card table-card">
              <div className="table-toolbar">
                <div>
                  <h2>通行路段</h2>
                  <p className="muted">
                    关闭路段后，导航将寻找其他可用路径。地图数据位于
                    shared/hospital.mjs。
                  </p>
                </div>
                <span className="pill">{state.blocked.length} 条已封闭</span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>路段</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>距离</TableHead>
                    <TableHead>允许通行</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {edges
                    .filter(
                      (e) =>
                        e.kind !== 'walk' ||
                        (getNode(e.a).type !== 'poi' &&
                          getNode(e.b).type !== 'poi'),
                    )
                    .map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="route-table-name">
                          {
                            floors.find((f) => f.id === getNode(e.a).level)
                              ?.name
                          }{' '}
                          · {getNode(e.a, state).name} →{' '}
                          {getNode(e.b, state).name}
                          {getNode(e.a).level !== getNode(e.b).level &&
                            `（${floors.find((f) => f.id === getNode(e.b).level)?.name}）`}
                        </TableCell>
                        <TableCell>
                          {
                            {
                              walk: '走廊',
                              stairs: '楼梯',
                              elevator: '电梯',
                              outdoor: '院区步道',
                            }[e.kind as 'walk']
                          }
                        </TableCell>
                        <TableCell>{e.distance} 米</TableCell>
                        <TableCell>
                          <Switch
                            aria-label={`路段 ${e.id} 允许通行`}
                            checked={!state.blocked.includes(e.id)}
                            disabled={!online || busy}
                            onCheckedChange={(v) =>
                              act({ type: 'block', id: e.id, value: !v })
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </section>
          </TabsContent>
          <TabsContent value="logs">
            <section className="card admin-card">
              <h2>
                <Clock size={20} /> 操作记录
              </h2>
              <p>保留最近 100 条演示操作。</p>
              {state.logs.length ? (
                state.logs.map(
                  (l: { id: number; time: string; message: string }) => (
                    <div className="log-row" key={l.id}>
                      <time>
                        {new Date(l.time).toLocaleTimeString('zh-CN', {
                          hour12: false,
                        })}
                      </time>
                      <span>{l.message}</span>
                    </div>
                  ),
                )
              ) : (
                <div className="empty-message">尚无操作记录</div>
              )}
            </section>
          </TabsContent>
        </Tabs>
        <footer>
          SmartGuide · 运营工作台{' '}
          <span>本地模拟环境 · 无真实支付或患者资料</span>
        </footer>
      </div>
      {notice && (
        <div className="notice" role="status">
          {notice}
        </div>
      )}
      <Dialog
        open={!!edit}
        onOpenChange={(v) => {
          if (!v) setEdit(null);
        }}
      >
        <DialogContent>
          <DialogTitle>编辑科室信息</DialogTitle>
          <DialogDescription>
            更新会保存到本地，并同步至患者端搜索和地图。
          </DialogDescription>
          <form
            className="edit-form"
            onSubmit={async (e) => {
              e.preventDefault();
              if (await act({ type: 'poi', id: edit, name, hours }))
                setEdit(null);
            }}
          >
            <label>
              科室名称
              <input
                required
                maxLength={40}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              开放时间
              <input
                required
                maxLength={40}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </label>
            <button className="primary" disabled={busy}>
              保存修改
            </button>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={reset} onOpenChange={setReset}>
        <AlertDialogContent>
          <AlertDialogTitle>重新开始演示？</AlertDialogTitle>
          <AlertDialogDescription>
            将清除当前就诊进度、科室编辑与通行设置，恢复所选流程的初始状态。
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => act({ type: 'reset', scenario })}>
              确认重置
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog
        open={!!qr}
        onOpenChange={(v) => {
          if (!v) setQr(null);
        }}
      >
        <DialogContent>
          <DialogTitle>
            定位二维码 · {qr && getNode(qr, state).name}
          </DialogTitle>
          <DialogDescription>
            小程序扫描后设置模拟位置；也可在患者端输入同一点位。
          </DialogDescription>
          {qr && (
            <div className="qr-preview">
              <img
                src={`${apiBase()}/api/qr?id=${encodeURIComponent(qr)}`}
                width="220"
                height="220"
                alt={`${getNode(qr, state).name}定位二维码`}
              />
              <code>hospital-demo://location/{qr}</code>
              <a
                className="secondary"
                href={`/?loc=${qr}`}
                target="_blank"
                rel="noreferrer"
              >
                在患者端模拟扫码
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
