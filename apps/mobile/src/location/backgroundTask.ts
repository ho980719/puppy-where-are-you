import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';

export const BG_TASK = 'WALK_BACKGROUND_LOCATION';

type Point = { lat: number; lng: number; recordedAt: string };

type Ctx = {
  getWalkId: () => string | null;
  pushPoint: (p: Point) => void;
};

let context: Ctx | null = null;
export function setBackgroundContext(ctx: Ctx) {
  context = ctx;
}

TaskManager.defineTask(BG_TASK, async ({ data, error }) => {
  if (error) {
    // eslint-disable-next-line no-console
    console.warn('BG task error', error);
    return;
  }
  const walkId = context?.getWalkId();
  if (!walkId) return;
  const locData = data as { locations?: Location.LocationObject[] };
  const points: Point[] =
    locData?.locations?.map((l) => ({
      lat: l.coords.latitude,
      lng: l.coords.longitude,
      recordedAt: new Date(l.timestamp).toISOString(),
    })) ?? [];
  points.forEach((p) => context?.pushPoint(p));
});
