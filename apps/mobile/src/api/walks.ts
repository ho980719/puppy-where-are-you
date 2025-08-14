import EventSource from 'react-native-sse';

const BASE = process.env.EXPO_PUBLIC_API_BASE || 'http://192.168.0.10:3000/api/v1';

export type WalkStartRes = { data: { id: string; userId: string; startAt: string } };
export type WalkWithPoints = {
  data: {
    id: string;
    userId: string;
    startAt: string;
    endAt?: string;
    distanceMeters?: number;
    durationSeconds?: number;
    points?: { seq: number; lat: number; lng: number; recordedAt: string }[];
  };
};

export async function startWalk(userId: string): Promise<string> {
  const res = await fetch(`${BASE}/walks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error('failed to start walk');
  const json: WalkStartRes = await res.json();
  return json.data.id;
}

export async function appendPoints(
  walkId: string,
  points: { lat: number; lng: number; recordedAt?: string }[],
) {
  if (!points.length) return;
  const res = await fetch(`${BASE}/walks/${walkId}/points`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points }),
  });
  if (!res.ok) throw new Error('failed to append points');
}

export async function endWalk(walkId: string) {
  const res = await fetch(`${BASE}/walks/${walkId}/end`, { method: 'POST' });
  if (!res.ok) throw new Error('failed to end walk');
}

export async function getWalkWithPoints(
  walkId: string,
  pointsLimit = 2000,
): Promise<WalkWithPoints['data']> {
  const res = await fetch(
    `${BASE}/walks/${walkId}?includePoints=true&pointsLimit=${pointsLimit}`,
  );
  if (!res.ok) throw new Error('failed to fetch walk');
  const json: WalkWithPoints = await res.json();
  return json.data;
}

export function streamWalk(walkId: string, fromSeq?: number) {
  const url = `${BASE}/walks/${walkId}/stream${fromSeq ? `?fromSeq=${fromSeq}` : ''}`;
  const es = new EventSource(url, { headers: {} });
  return es;
}
