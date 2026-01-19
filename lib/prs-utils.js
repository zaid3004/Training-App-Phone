// PR helpers: compute PRs for a user from the local SQLite DB
// This module exposes:
//  - computePRsForUser(db, userId): returns latest PRs per exercise
//  - updatePRsAfterWorkout(db, userId, workoutId, entries): incremental PR updates after a workout log
// entries: Array<{ name: string, weight?: number, reps?: number }>

export async function computePRsForUser(db, userId) {
  if (!db || !userId) return [];
  const maxRows = await db.getAllAsync(
    `SELECT ws.exercise, MAX(ws.weight) AS max_weight
     FROM workout_sets ws
     JOIN workouts w ON ws.workout_id = w.id
     WHERE w.user_id = ?
     GROUP BY ws.exercise`,
    [userId]
  );

  const prs = [];
  for (const row of maxRows) {
    const exercise = row?.exercise;
    const maxWeight = row?.max_weight;
    if (!exercise) continue;
    const rec = await db.getFirstAsync(
      `SELECT ws.weight AS weight, ws.reps AS reps, w.date AS date
       FROM workout_sets ws
       JOIN workouts w ON ws.workout_id = w.id
       WHERE w.user_id = ? AND ws.exercise = ?
       ORDER BY ws.weight DESC, w.date DESC
       LIMIT 1`,
      [userId, exercise]
    );
    prs.push({
      exercise,
      max_weight: rec?.weight ?? maxWeight,
      date: rec?.date ?? null,
      reps: rec?.reps ?? null,
    });
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
