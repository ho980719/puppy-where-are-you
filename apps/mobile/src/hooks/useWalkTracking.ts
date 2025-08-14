import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import {
  appendPoints,
  endWalk,
  getWalkWithPoints,
  startWalk,
  streamWalk,
} from '../api/walks';
import { BG_TASK, setBackgroundContext } from '../location/backgroundTask';

export type Point = { seq?: number; lat: number; lng: number; recordedAt: string };

export function useWalkTracking(apiUserId: string) {
  const [walkId, setWalkId] = useState<string | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [lastSeq, setLastSeq] = useState<number>(0);
  const [isActive, setIsActive] = useState(false);

  const watchSub = useRef<Location.LocationSubscription | null>(null);
  const uploadTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const sseRef = useRef<any>(null);
  const queueRef = useRef<Point[]>([]);

  const pushQueue = (p: Point) => {
    queueRef.current.push(p);
  };

  const flushQueue = useCallback(async () => {
    if (!walkId || queueRef.current.length === 0) return;
    const batch = queueRef.current.splice(0, queueRef.current.length);
    try {
      await appendPoints(walkId, batch);
    } catch (e) {
      // 실패 시 재시도 큐에 되돌리기
      queueRef.current.unshift(...batch);
    }
  }, [walkId]);

  const stop = useCallback(async () => {
    if (!walkId) return;
    setIsActive(false);

    if (uploadTimer.current) {
      clearInterval(uploadTimer.current);
      uploadTimer.current = null;
    }
    await flushQueue();

    try {
      await Location.stopLocationUpdatesAsync(BG_TASK);
    } catch {}

    if (watchSub.current) {
      watchSub.current.remove();
      watchSub.current = null;
    }

    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }

    await endWalk(walkId);
    setWalkId(null);
  }, [flushQueue, walkId]);

  const start = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') throw new Error('location permission required');
    const bg = await Location.requestBackgroundPermissionsAsync();
    if (bg.status !== 'granted') {
      // iOS에서 Always 거부 시에도 foreground만 진행 가능
    }

    const id = await startWalk(apiUserId);
    setWalkId(id);
    setIsActive(true);

    const init = await getWalkWithPoints(id, 2000);
    const initPts = (init.points || []).map((p) => ({
      seq: p.seq,
      lat: p.lat,
      lng: p.lng,
      recordedAt: p.recordedAt,
    }));
    setPoints(initPts);
    if (initPts.length) setLastSeq(initPts[initPts.length - 1].seq!);

    const es = streamWalk(id, lastSeq || undefined);
    sseRef.current = es;
    es.addEventListener('message', (event: any) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'points') {
          const items = payload.items as Point[];
          setPoints((prev) => [...prev, ...items]);
          if (items.length) setLastSeq(items[items.length - 1].seq!);
        } else if (payload.type === 'ended') {
          stop().catch(() => {});
        }
      } catch {}
    });

    watchSub.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 2000,
        distanceInterval: 5,
      },
      (loc) => {
        const p: Point = {
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          recordedAt: new Date(loc.timestamp).toISOString(),
        };
        pushQueue(p);
      },
    );

    try {
      await Location.startLocationUpdatesAsync(BG_TASK, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 3000,
        distanceInterval: 5,
        showsBackgroundLocationIndicator: true,
        pausesUpdatesAutomatically: false,
        foregroundService: {
          notificationTitle: '산책 기록 중',
          notificationBody: '위치를 기록하고 있습니다.',
        },
      });
    } catch {}

    uploadTimer.current = setInterval(flushQueue, 2000);

    setBackgroundContext({
      getWalkId: () => id,
      pushPoint: (p) => pushQueue(p),
    });
  }, [apiUserId, flushQueue, lastSeq, stop]);

  useEffect(() => {
    return () => {
      if (uploadTimer.current) clearInterval(uploadTimer.current);
    };
  }, []);

  return { isActive, walkId, points, lastSeq, start, stop };
}
