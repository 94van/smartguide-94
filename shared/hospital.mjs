export const buildings = [
  {
    id: 'out',
    name: '门诊综合楼',
    short: '门诊楼',
    floors: 3,
    x: 95,
    y: 110,
    w: 270,
    h: 220,
  },
  {
    id: 'tech',
    name: '医技楼',
    short: '医技楼',
    floors: 1,
    x: 440,
    y: 105,
    w: 220,
    h: 160,
  },
  {
    id: 'ward',
    name: '住院楼',
    short: '住院楼',
    floors: 1,
    x: 450,
    y: 360,
    w: 210,
    h: 150,
  },
];
const specs = [
  [
    'out',
    1,
    [
      ['service', '门诊服务台', '签到 咨询'],
      ['pharmacy', '西药房', '取药 拿药'],
      ['payment', '收费处', '缴费'],
      ['emergency', '急诊中心', '急救'],
      ['toilet1', '无障碍卫生间', '厕所'],
      ['blood', '采血中心', '抽血 检验'],
    ],
  ],
  [
    'out',
    2,
    [
      ['cardio', '心血管内科 · 218', '心脏 内科 218'],
      ['surgery', '普通外科 · 216', '外科'],
      ['bone', '骨科 · 212', '骨头'],
      ['neuro', '神经内科 · 208', '头痛'],
      ['toilet2', '卫生间', '厕所'],
      ['waiting', '二层候诊区', '候诊'],
    ],
  ],
  [
    'out',
    3,
    [
      ['dental', '口腔科 · 318', '牙科'],
      ['eye', '眼科 · 316', '眼睛'],
      ['ent', '耳鼻喉科 · 312', '耳朵'],
      ['child', '儿科 · 308', '儿童'],
      ['skin', '皮肤科 · 302', '皮肤'],
      ['toilet3', '卫生间', '厕所'],
    ],
  ],
  [
    'tech',
    1,
    [
      ['ct', 'CT 检查室', 'CT 拍片 影像'],
      ['mri', '磁共振室', 'MRI 核磁'],
      ['ultrasound', '超声检查室', 'B超'],
      ['xray', 'X 光检查室', '拍片'],
      ['report', '报告领取处', '报告'],
      ['ecg', '心电图室', '心电'],
    ],
  ],
  [
    'ward',
    1,
    [
      ['admission', '入院办理处', '住院'],
      ['wardservice', '住院服务台', '咨询'],
      ['store', '便民商店', '购物'],
      ['cafe', '营养餐厅', '吃饭'],
      ['rest', '家属休息区', '休息'],
      ['wardtoilet', '卫生间', '厕所'],
    ],
  ],
];
export const floors = specs.map(([b, f]) => ({
  id: `${b}-${f}`,
  building: b,
  floor: f,
  name: `${buildings.find((x) => x.id === b).short} ${f}F`,
}));
export const nodes = [];
export const edges = [];
export const pois = [];
const addEdge = (a, b, kind = 'walk', bends = []) => {
  const p = nodes.find((n) => n.id === a),
    q = nodes.find((n) => n.id === b);
  edges.push({
    id: [a, b].sort().join('~'),
    a,
    b,
    kind,
    bends,
    distance:
      kind === 'elevator'
        ? 18
        : kind === 'stairs'
          ? 14
          : kind === 'outdoor'
            ? 90
            : Math.round(
                [p, ...bends, q]
                  .slice(1)
                  .reduce(
                    (sum, n, i) =>
                      sum +
                      Math.hypot(
                        n.x - [p, ...bends, q][i].x,
                        n.y - [p, ...bends, q][i].y,
                      ),
                    0,
                  ) * 0.22,
              ),
  });
};
for (const [b, f, rooms] of specs) {
  const level = `${b}-${f}`;
  for (const [suffix, x, y, type, name] of [
    ['left', 180, 300, 'corridor', '西侧走廊'],
    ['middle', 400, 300, 'corridor', '中央走廊'],
    ['right', 620, 300, 'corridor', '东侧走廊'],
    ['elevator', 400, 440, 'elevator', 'A 区电梯'],
    ['stairs', 180, 440, 'stairs', 'B 区楼梯'],
    ['entry', 620, 440, 'entry', f === 1 ? '东门入口' : '东侧休息区'],
  ])
    nodes.push({
      id: `${level}-${suffix}`,
      level,
      building: b,
      floor: f,
      x,
      y,
      type,
      name,
    });
  for (const [a, c] of [
    ['left', 'middle'],
    ['middle', 'right'],
    ['middle', 'elevator'],
    ['left', 'stairs'],
    ['right', 'entry'],
    ['stairs', 'elevator'],
    ['elevator', 'entry'],
  ])
    addEdge(
      `${level}-${a}`,
      `${level}-${c}`,
      'walk',
      a === 'left' && c === 'stairs'
        ? [
            { x: 80, y: 300 },
            { x: 80, y: 440 },
          ]
        : a === 'middle' && c === 'elevator'
          ? [
              { x: 510, y: 300 },
              { x: 510, y: 440 },
            ]
          : a === 'right' && c === 'entry'
            ? [
                { x: 720, y: 300 },
                { x: 720, y: 440 },
              ]
            : [],
    );
  rooms.forEach(([id, name, aliases], i) => {
    const x = [180, 400, 620][i % 3],
      y = i < 3 ? 170 : 360;
    const poi = {
      id,
      name,
      aliases,
      level,
      building: b,
      floor: f,
      x,
      y,
      type: 'poi',
      hours: '08:00–17:30',
      room: i < 3 ? 'north' : 'south',
    };
    nodes.push({ ...poi, y: i < 3 ? 260 : 320 });
    pois.push(poi);
    addEdge(id, `${level}-${['left', 'middle', 'right'][i % 3]}`);
  });
  if (f > 1) {
    addEdge(`${b}-${f - 1}-elevator`, `${level}-elevator`, 'elevator');
    addEdge(`${b}-${f - 1}-stairs`, `${level}-stairs`, 'stairs');
  }
}
addEdge('out-1-entry', 'tech-1-entry', 'outdoor');
addEdge('tech-1-entry', 'ward-1-entry', 'outdoor');
addEdge('out-1-entry', 'ward-1-entry', 'outdoor');
/** @returns {{version:number,stage:number,scenario:string,queue:number,location:string,accessible:boolean,elevatorClosed:boolean,blocked:string[],poiOverrides:Record<string,{name:string,hours:string}>,logs:{id:number,time:string,message:string}[],updatedAt:string}} */
export const initialState = () => ({
  version: 1,
  stage: 0,
  scenario: 'ct',
  queue: 5,
  location: 'out-1-entry',
  accessible: false,
  elevatorClosed: false,
  blocked: [],
  poiOverrides: {},
  logs: [],
  updatedAt: new Date().toISOString(),
});
export const stages = [
  {
    title: '门诊签到',
    target: 'service',
    action: '完成签到',
    hint: '请前往门诊服务台，完成今日就诊签到。',
    icon: 'clipboard',
  },
  {
    title: '前往 218 诊室',
    target: 'cardio',
    action: '进入候诊',
    hint: '心血管内科 · 钟国医生，预约时间 09:30。',
    icon: 'navigation',
  },
  {
    title: '候诊与接诊',
    target: 'cardio',
    action: '医生接诊并开检查',
    hint: '请在诊室附近候诊，留意叫号信息。',
    icon: 'clock',
  },
  {
    title: '检查费用待缴',
    target: null,
    action: '模拟缴费 ¥280.00',
    hint: '胸部 CT 平扫 · 演示费用 ¥280.00。',
    icon: 'wallet',
  },
  {
    title: '前往 CT 检查室',
    target: 'ct',
    action: '完成 CT 检查',
    hint: '请前往医技楼 1F，向工作人员出示导诊单。',
    icon: 'scan',
  },
  {
    title: '等待检查报告',
    target: null,
    action: '生成模拟报告',
    hint: '检查已完成，报告就绪后请返回原诊室。',
    icon: 'file',
  },
  {
    title: '返回诊室复诊',
    target: 'cardio',
    action: '完成复诊',
    hint: '报告已就绪，返回门诊楼 2F 218 诊室。',
    icon: 'heart',
  },
  {
    title: '药品费用待缴',
    target: null,
    action: '模拟缴费 ¥36.00',
    hint: '演示药品清单 · 演示费用 ¥36.00。',
    icon: 'wallet',
  },
  {
    title: '西药房取药',
    target: 'pharmacy',
    action: '确认取药',
    hint: '门诊楼 1F 西药房 · 6 号窗口。',
    icon: 'pill',
  },
  {
    title: '本次就诊已完成',
    target: 'out-1-entry',
    action: '完成',
    hint: '感谢您的信任，祝您生活愉快。',
    icon: 'check',
  },
];
export function getNode(id, state) {
  const n = nodes.find((n) => n.id === id);
  return n ? { ...n, ...state?.poiOverrides?.[id] } : null;
}
export function planRoute(start, end, state = initialState()) {
  if (!getNode(start) || !getNode(end)) return null;
  const dist = new Map([[start, 0]]),
    prev = new Map(),
    seen = new Set();
  while (true) {
    let u;
    let best = Infinity;
    for (const [k, v] of dist)
      if (!seen.has(k) && v < best) {
        u = k;
        best = v;
      }
    if (!u) break;
    if (u === end) break;
    seen.add(u);
    for (const e of edges) {
      if (
        state.blocked.includes(e.id) ||
        (e.kind === 'elevator' && state.elevatorClosed) ||
        (e.kind === 'stairs' && state.accessible)
      )
        continue;
      const v = e.a === u ? e.b : e.b === u ? e.a : null;
      if (!v) continue;
      const cost = best + e.distance + (e.kind === 'stairs' ? 30 : 0);
      if (cost < (dist.get(v) ?? Infinity)) {
        dist.set(v, cost);
        prev.set(v, { u, e });
      }
    }
  }
  if (!dist.has(end)) return null;
  const path = [end],
    segments = [];
  let c = end;
  while (c !== start) {
    const p = prev.get(c);
    if (!p) return null;
    segments.unshift(p.e);
    path.unshift(p.u);
    c = p.u;
  }
  const meters = segments.reduce((a, e) => a + e.distance, 0);
  const levels = [...new Set(path.map((id) => getNode(id).level))];
  const steps = [`从${getNode(start, state).name}出发`];
  for (const e of segments) {
    const idx = segments.indexOf(e),
      to = getNode(path[idx + 1], state);
    if (e.kind === 'elevator') steps.push(`乘 A 区电梯至 ${to.floor}F`);
    else if (e.kind === 'stairs') steps.push(`经 B 区楼梯至 ${to.floor}F`);
    else if (e.kind === 'outdoor')
      steps.push(
        `沿院区步道前往${buildings.find((b) => b.id === to.building).name}`,
      );
  }
  steps.push(`沿高亮走廊到达${getNode(end, state).name}`);
  return {
    path,
    segments,
    meters,
    minutes: Math.max(
      1,
      Math.ceil(
        meters / 55 +
          segments.filter((e) => e.kind === 'elevator').length * 0.5,
      ),
    ),
    levels,
    steps,
  };
}
export function applyAction(state, action) {
  let next = structuredClone(state);
  let message = '';
  switch (action.type) {
    case 'advance': {
      if (state.stage >= 9) throw Error('本次就诊已经完成');
      const stage = stages[state.stage];
      if (stage.target && state.location !== stage.target)
        throw Error('请先模拟到达当前任务地点');
      if (state.stage === 2 && state.queue > 0)
        throw Error('请先模拟叫号，前方还有候诊患者');
      next.stage =
        state.scenario === 'simple' && state.stage === 2 ? 7 : state.stage + 1;
      message = stage.action;
      break;
    }
    case 'skip-wait':
      if (state.stage !== 2) throw Error('当前不在候诊阶段');
      if (state.location !== stages[2].target) throw Error('请先模拟到达诊室');
      if (state.queue === 0) throw Error('已经叫到 A023');
      next.queue = 0;
      message = '已跳过模拟等待，叫到 A023；请点击接诊继续';
      break;
    case 'call':
      if (state.stage !== 2) throw Error('当前不在候诊阶段');
      if (state.queue === 0) throw Error('已经叫到 A023');
      next.queue = Math.max(0, state.queue - 1);
      message = next.queue
        ? `模拟叫号，前方剩余 ${next.queue} 人`
        : '请 A023 号到 218 诊室就诊';
      break;
    case 'locate':
      if (!getNode(action.id)) throw Error('无效定位点');
      next.location = action.id;
      message = `模拟定位：${getNode(action.id, state).name}`;
      break;
    case 'arrive': {
      if (!getNode(action.id)) throw Error('无效目的地');
      if (!planRoute(state.location, action.id, state))
        throw Error('当前没有可通行路线');
      next.location = action.id;
      message = `已到达${getNode(action.id, state).name}`;
      break;
    }
    case 'accessible':
      if (typeof action.value !== 'boolean') throw Error('参数错误');
      next.accessible = action.value;
      message = action.value ? '已开启无障碍路线' : '已切换普通路线';
      break;
    case 'elevator':
      if (typeof action.value !== 'boolean') throw Error('参数错误');
      next.elevatorClosed = action.value;
      message = action.value ? 'A 区电梯暂停服务' : 'A 区电梯恢复服务';
      break;
    case 'block':
      if (
        !edges.some((e) => e.id === action.id) ||
        typeof action.value !== 'boolean'
      )
        throw Error('无效路段');
      next.blocked = action.value
        ? [...new Set([...state.blocked, action.id])]
        : state.blocked.filter((id) => id !== action.id);
      message = action.value ? '已封闭所选路段' : '已开放所选路段';
      break;
    case 'poi':
      if (
        !pois.some((p) => p.id === action.id) ||
        typeof action.name !== 'string' ||
        !action.name.trim() ||
        action.name.length > 40 ||
        typeof action.hours !== 'string' ||
        action.hours.length > 40
      )
        throw Error('请填写有效科室名称和开放时间');
      next.poiOverrides[action.id] = {
        name: action.name.trim(),
        hours: action.hours.trim(),
      };
      message = `已更新${action.name.trim()}`;
      break;
    case 'reset':
      if (!['ct', 'simple'].includes(action.scenario)) throw Error('无效流程');
      next = initialState();
      next.scenario = action.scenario;
      message =
        action.scenario === 'ct' ? '已重置检查复诊流程' : '已重置普通门诊流程';
      break;
    default:
      throw Error('未知操作');
  }
  next.version = state.version + 1;
  next.updatedAt = new Date().toISOString();
  next.logs = [
    { id: next.version, time: next.updatedAt, message },
    ...next.logs,
  ].slice(0, 100);
  return next;
}

// Canonical walking polyline. Rooms are destinations at the corridor-side door,
// not points inside furniture or walls. Keep both rendering and movement on this line.
export function edgePolyline(edge, from = edge.a) {
  const a = getNode(edge.a),
    b = getNode(edge.b);
  const line = [a, ...(edge.bends || []).map((p) => ({ ...a, ...p })), b];
  return from === edge.a ? line : line.slice().reverse();
}
export function roomBounds(p) {
  return {
    left: p.x - 81.25,
    right: p.x + 81.25,
    top: p.room === 'north' ? 120 : 332.5,
    bottom: p.room === 'north' ? 250 : 402.5,
    doorX: p.x,
    doorY: p.room === 'north' ? 250 : 332.5,
  };
}
