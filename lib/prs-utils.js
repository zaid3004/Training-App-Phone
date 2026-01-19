// PR helpers: compute PRs for a user from the local SQLite DB
// This module expects a `db` instance compatible with sqlite-provider.js (with methods like getAllAsync, getFirstAsync)
// The actual DB access layer may vary; this file provides a best-effort implementation that
// can be adapted to the project's real DB wrapper.

/**
 * Compute PRs for a given user by scanning workout_sets for max weights
 * Falls back to per-exercise latest entry if multiple maxima exist
 * @param {Object} db - database wrapper providing getAllAsync, getFirstAsync
 * @param {string} userId - user identifier
 * @returns {Promise<Array<{exercise:string, max_weight:number, date:string|null, reps:number|null}>>}
 */
export async function computePRsForUser(db, userId) {
  if (!db || !userId) return [];
  // 1) Get max weight per exercise for this user
  const maxRows = await db.getAllAsync(
    `SELECT ws.exercise, MAX(ws.weight) AS max_weight
     FROM workout_sets ws
     JOIN workouts w ON ws.workout_id = w.id
     WHERE w.user_id = ?
     GROUP BY ws.exercise`,
    [userId]
  );

  const prs = [];
  // 2) For each exercise, fetch the latest record achieving the max weight
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

  // Optional: sort by weight descending
  prs.sort((a, b) => (b.max_weight ?? 0) - (a.max_weight ?? 0));
  return prs;
}

export default computePRsForUser;
