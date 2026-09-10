'use client';
import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  PartyPopper,
  ArrowRight,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { HospitalState } from '@/lib/use-hospital';
import { stages } from '@/shared/hospital.mjs';
export function VisitFeedback({
  state,
  online,
  onNext,
}: {
  state: HospitalState;
  online: boolean;
  onNext: (id: string | null) => void;
}) {
  const prev = useRef<number | null>(null);
  const [completed, setCompleted] = useState<number | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    if (!online) return;
    if (prev.current !== null && state.stage > prev.current) {
      setCompleted(prev.current);
      setCelebrate(state.stage === 9);
    } else if (prev.current !== null && state.stage < prev.current) {
      setCompleted(null);
      setCelebrate(false);
    }
    prev.current = state.stage;
  }, [state.stage, online]);
  useEffect(() => {
    if (!celebrate) return;
    const timer = setTimeout(() => setCelebrate(false), 4200);
    return () => clearTimeout(timer);
  }, [celebrate]);
  const final = state.stage === 9;
  return (
    <>
      <Dialog
        open={completed !== null}
        onOpenChange={(v) => {
          if (!v) {
            setCompleted(null);
            setCelebrate(false);
          }
        }}
      >
        <DialogContent
          className={'visit-feedback ' + (final ? 'visit-final' : '')}
        >
          <div className="feedback-symbol">
            {final ? <PartyPopper size={44} /> : <CheckCircle2 size={44} />}
          </div>
          <DialogTitle>
            {final
              ? '本次就诊全部完成！'
              : `${completed !== null ? stages[completed].title : ''} · 已完成`}
          </DialogTitle>
          <DialogDescription>
            {final
              ? '签到、就诊和取药均已完成。请带好随身物品，祝您平安顺利。'
              : `下一步：${stages[state.stage].title}。${stages[state.stage].hint}`}
          </DialogDescription>
          <button
            className="primary"
            onClick={() => {
              setCompleted(null);
              setCelebrate(false);
              if (!final) onNext(stages[state.stage].target);
            }}
          >
            {final ? '知道了，结束本次就诊' : '我知道了，进行下一步'}
            <ArrowRight size={18} />
          </button>
        </DialogContent>
      </Dialog>
      {celebrate && (
        <div className="celebration" aria-hidden="true">
          {Array.from({ length: 66 }, (_, i) => (
            <i
              key={i}
              style={
                {
                  '--x': `${(i * 37) % 100}%`,
                  '--delay': `${(i % 9) * 0.07}s`,
                  '--drift': `${(i % 2 ? 1 : -1) * (45 + (i % 130))}px`,
                  '--spin': `${(i % 2 ? 1 : -1) * (270 + i * 19)}deg`,
                  background: [
                    '#1B6B7A',
                    '#2E7D4F',
                    '#C5A34F',
                    '#82AFC2',
                    '#BCA16B',
                  ][i % 5],
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}
    </>
  );
}
export function ErrorFeedback({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={!!message}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="error-feedback">
        <div className="feedback-symbol">
          <AlertTriangle size={38} />
        </div>
        <DialogTitle>操作未完成，请先检查</DialogTitle>
        <DialogDescription>{message}</DialogDescription>
        <p>
          未收到操作成功的确认。请按提示处理；若网络中断，请先查看最新就诊状态再决定是否重试。
        </p>
        <button className="secondary" onClick={onClose}>
          我知道了，返回检查
        </button>
      </DialogContent>
    </Dialog>
  );
}
