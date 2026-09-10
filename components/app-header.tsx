import { HeartPulse, ArrowUpRight } from 'lucide-react';
export default function AppHeader({
  admin = false,
  online = false,
}: {
  admin?: boolean;
  online?: boolean;
}) {
  return (
    <header className="topbar">
      <a className="brand" href="/">
        <span className="brand-mark">
          <HeartPulse />
        </span>
        <div>
          玖肆智慧医院<small>JIUSI · SMART GUIDE</small>
        </div>
      </a>
      <nav>
        <a className={!admin ? 'active' : ''} href="/">
          我的就诊
        </a>
        <a className={admin ? 'active' : ''} href="/admin">
          管理工作台 <ArrowUpRight size={15} />
        </a>
      </nav>
      <span className={'demo-tag ' + (!online ? 'offline' : '')}>
        <i className="live-dot" />
        {online ? '演示服务在线' : '服务连接中'}
      </span>
    </header>
  );
}
