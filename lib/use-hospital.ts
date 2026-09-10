'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { initialState } from '@/shared/hospital.mjs';
export type HospitalState = ReturnType<typeof initialState>;
export type Action = { type: string; [key: string]: unknown };
export function apiBase() {
  return typeof window === 'undefined'
    ? 'http://localhost:3000'
    : `${window.location.protocol}//${window.location.hostname}:3000`;
}
export function useHospital() {
  const [state, setState] = useState(initialState);
  const [online, setOnline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNoticeText] = useState('');
  const [noticeKind, setNoticeKind] = useState<'info' | 'success' | 'error'>(
    'info',
  );
  const setNotice = useCallback((message: string) => {
    setNoticeText(message);
    setNoticeKind('info');
  }, []);
  const ref = useRef(state);
  const locked = useRef(false);
  const update = useCallback((s: HospitalState) => {
    if (s.version > ref.current.version) {
      ref.current = s;
      setState(s);
    }
  }, []);
  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const r = await fetch(apiBase() + '/api/state', {
          signal: AbortSignal.timeout(4000),
        });
        if (!r.ok) throw Error();
        const s = (await r.json()) as HospitalState;
        if (active) {
          update(s);
          setOnline(true);
        }
      } catch {
        if (active) setOnline(false);
      }
    };
    void poll();
    const id = setInterval(poll, 1500);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [update]);
  const act = useCallback(
    async (action: Action) => {
      if (locked.current) return false;
      locked.current = true;
      setBusy(true);
      try {
        const r = await fetch(apiBase() + '/api/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...action, version: ref.current.version }),
          signal: AbortSignal.timeout(5000),
        });
        const s = (await r.json()) as HospitalState & {
          error?: string;
          state?: HospitalState;
        };
        if (!r.ok) {
          if (s.state) update(s.state);
          throw Error(s.error);
        }
        update(s);
        setOnline(true);
        setNotice(s.logs[0]?.message || '已更新');
        setNoticeKind('success');
        return true;
      } catch (e) {
        setNotice(e instanceof Error ? e.message : '操作失败，请重试');
        setNoticeKind('error');
        return false;
      } finally {
        locked.current = false;
        setBusy(false);
      }
    },
    [update],
  );
  useEffect(() => {
    if (!notice || noticeKind === 'error') return;
    const t = setTimeout(() => setNotice(''), 4500);
    return () => clearTimeout(t);
  }, [notice, noticeKind]);
  return { state, online, busy, notice, noticeKind, act, setNotice };
}
