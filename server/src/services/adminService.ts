import { getDb } from '../models/database';

export function getOverview() {
  const db = getDb();

  const stats = db.prepare(
    `SELECT COUNT(DISTINCT user_id) as total_participants,
            ROUND(AVG(total_score), 1) as avg_score,
            MAX(total_score) as max_score,
            MIN(total_score) as min_score
     FROM assessments WHERE rating != ''`
  ).get() as any;

  const ratingDist = db.prepare(
    "SELECT rating, COUNT(*) as count FROM assessments WHERE rating != '' GROUP BY rating"
  ).all() as any[];

  const ratingDistribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const r of ratingDist) {
    ratingDistribution[r.rating] = r.count;
  }

  const dimAvg = db.prepare(
    `SELECT dimension, ROUND(AVG(score), 1) as avg_score FROM dimension_scores GROUP BY dimension`
  ).all() as any[];

  const dimensionAvg: Record<string, number> = { D1: 0, D2: 0, D3: 0, D4: 0 };
  for (const d of dimAvg) {
    dimensionAvg[d.dimension] = d.avg_score;
  }

  return {
    total_participants: stats.total_participants || 0,
    avg_score: stats.avg_score || 0,
    max_score: stats.max_score || 0,
    min_score: stats.min_score || 0,
    rating_distribution: ratingDistribution,
    dimension_avg: dimensionAvg,
  };
}

export function getEmployeeList(page: number, pageSize: number, department?: string, rating?: string) {
  const db = getDb();
  const conditions: string[] = ["u.status = 'active'"];
  const params: any[] = [];

  if (department) { conditions.push('u.department = ?'); params.push(department); }
  if (rating) { conditions.push('a.rating = ?'); params.push(rating); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(DISTINCT u.id) as count FROM users u LEFT JOIN assessments a ON a.user_id = u.id AND a.rating != '' ${where}`).get(...params) as any;

  const employees = db.prepare(
    `SELECT u.id, u.employee_no, u.name, u.department,
            a.total_score as latest_score, a.rating as latest_rating, a.submitted_at as latest_time
     FROM users u
     LEFT JOIN assessments a ON a.id = (
       SELECT id FROM assessments WHERE user_id = u.id AND rating != '' ORDER BY submitted_at DESC LIMIT 1
     )
     ${where}
     ORDER BY u.id
     LIMIT ? OFFSET ?`
  ).all(...params, pageSize, (page - 1) * pageSize) as any[];

  return {
    data: employees,
    pagination: { page, page_size: pageSize, total: total?.count || 0 },
  };
}

export function getEmployeeAssessments(userId: number) {
  const db = getDb();
  return db.prepare(
    `SELECT a.id, a.total_score, a.rating, a.started_at, a.submitted_at
     FROM assessments a WHERE a.user_id = ? AND a.rating != '' ORDER BY a.submitted_at DESC`
  ).all(userId);
}

export function getUserList(page: number, pageSize: number) {
  const db = getDb();
  const total = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
  const users = db.prepare(
    `SELECT id, employee_no, name, department, role, status, must_change_pwd, created_at, updated_at
     FROM users ORDER BY id LIMIT ? OFFSET ?`
  ).all(pageSize, (page - 1) * pageSize) as any[];
  return {
    data: users,
    pagination: { page, page_size: pageSize, total: total.count },
  };
}

export function getStatistics() {
  const db = getDb();

  // 1. Completion rate: total employees vs assessed
  const totalEmployees = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'employee' AND status = 'active'").get() as any).count;
  const assessedCount = (db.prepare("SELECT COUNT(DISTINCT user_id) as count FROM assessments WHERE rating != ''").get() as any).count;
  const completionRate = totalEmployees > 0 ? Math.round((assessedCount / totalEmployees) * 100) : 0;

  // 2. Department stats: avg score + dimension breakdown per department
  const deptRows = db.prepare(
    `SELECT u.department,
            COUNT(DISTINCT a.user_id) as assessed_count,
            ROUND(AVG(a.total_score), 1) as avg_score
     FROM users u
     LEFT JOIN assessments a ON a.user_id = u.id AND a.rating != ''
     WHERE u.role = 'employee' AND u.status = 'active'
     GROUP BY u.department
     ORDER BY avg_score DESC NULLS LAST`
  ).all() as any[];

  const departmentStats = deptRows.map((row: any) => {
    const dimRows = db.prepare(
      `SELECT ds.dimension, ROUND(AVG(ds.score), 1) as avg_score
       FROM dimension_scores ds
       JOIN assessments a ON ds.assessment_id = a.id
       JOIN users u ON a.user_id = u.id
       WHERE u.department = ? AND a.rating != ''
       GROUP BY ds.dimension`
    ).all(row.department) as any[];
    const dimensionAvg: Record<string, number> = { D1: 0, D2: 0, D3: 0, D4: 0 };
    for (const d of dimRows) { dimensionAvg[d.dimension] = d.avg_score; }
    return {
      department: row.department,
      assessed_count: row.assessed_count,
      avg_score: row.avg_score || 0,
      dimension_avg: dimensionAvg,
    };
  });

  // 3. Per-question accuracy (how often each question is answered correctly)
  const questionRows = db.prepare(
    `SELECT q.id as question_id, q.dimension, q.content,
            COUNT(a.id) as total_answers,
            SUM(a.is_correct) as correct_answers,
            ROUND(SUM(a.is_correct) * 100.0 / COUNT(a.id), 1) as accuracy
     FROM questions q
     JOIN answers a ON a.question_id = q.id
     GROUP BY q.id
     ORDER BY accuracy ASC`
  ).all() as any[];

  // 4. Per-dimension accuracy
  const dimAccRows = db.prepare(
    `SELECT q.dimension,
            COUNT(a.id) as total,
            SUM(a.is_correct) as correct,
            ROUND(SUM(a.is_correct) * 100.0 / COUNT(a.id), 1) as accuracy
     FROM answers a
     JOIN questions q ON a.question_id = q.id
     GROUP BY q.dimension`
  ).all() as any[];

  const dimensionAccuracy: Record<string, number> = { D1: 0, D2: 0, D3: 0, D4: 0 };
  for (const d of dimAccRows) { dimensionAccuracy[d.dimension] = d.accuracy; }

  return {
    completion_rate: { total: totalEmployees, assessed: assessedCount, rate: completionRate },
    department_stats: departmentStats,
    question_accuracy: questionRows.map((q: any) => ({
      question_id: q.question_id,
      dimension: q.dimension,
      content: q.content,
      total_answers: q.total_answers,
      correct_answers: q.correct_answers,
      accuracy: q.accuracy,
    })),
    dimension_accuracy: dimensionAccuracy,
  };
}
