// PR helpers: compute PRs for a user from the local SQLite DB
// This module exposes:
//  - computePRsForUser(db, userId): returns latest PRs per exercise
//  - updatePRsAfterWorkout(db, userId, workoutId, entries): incremental PR updates after a workout log
// entries: Array<{ name: string, weight?: number, reps?: number }>

export async function computePRsForUser(db, userId) {
  if (!db || !userId) return [];

  // Single query to get all PR data, ordered by exercise, weight desc, date desc
  const allRows = await db.getAllAsync(
    `SELECT ws.exercise_name AS exercise, ws.weight, ws.reps, wl.completed_at AS date
     FROM workout_sets ws
     JOIN workout_logs wl ON ws.workout_log_id = wl.id
     JOIN workouts w ON wl.workout_id = w.id
     WHERE w.user_id = ?
     ORDER BY ws.exercise_name, ws.weight DESC, wl.completed_at DESC`,
    [userId]
  );

  const prs = [];
  const seenExercises = new Set();

  for (const row of allRows) {
    if (!seenExercises.has(row.exercise)) {
      seenExercises.add(row.exercise);
      prs.push({
        exercise: row.exercise,
        max_weight: row.weight,
        weight: row.weight,
        reps: row.reps,
        date: row.date,
      });
    }
  }

  prs.sort((a, b) => (b.max_weight ?? 0) - (a.max_weight ?? 0));
  return prs;
}

export async function updatePRsAfterWorkout(db, userId, workoutId, entries = []) {
  if (!db || !userId || !workoutId) return;
  // Normalize entries; we only act on entries with a positive weight
  for (const e of entries) {
    const name = e?.name;
    const w = Number(e?.weight) || 0;
    const reps = Number(e?.reps) || null;
    if (!name || w <= 0) continue;

    // Get current PR for this exercise
    const current = await db.getFirstAsync(
      `SELECT max_weight FROM user_prs WHERE user_id = ? AND exercise = ?`,
      [userId, name]
    );

    const shouldUpdate = !current || w > current.max_weight;
    if (shouldUpdate) {
      const date = new Date().toISOString();
      await db.execAsync(
        `INSERT OR REPLACE INTO user_prs (user_id, exercise, max_weight, date, reps) VALUES (?, ?, ?, ?, ?)`,
        [userId, name, w, date, reps]
      );
    }
  }
}


export default computePRsForUser;
