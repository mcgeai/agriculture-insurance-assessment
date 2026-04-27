import { getDb } from '../models/database';

const DIMENSIONS = ['D1', 'D2', 'D3', 'D4'] as const;
const QUESTIONS_PER_DIMENSION: Record<string, number> = { D1: 10, D2: 15, D3: 10, D4: 10 };

interface QuestionRow {
  id: number;
  dimension: string;
  content: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  is_active: number;
}

export function startAssessment(userId: number): { assessment_id: number; questions: any[] } {
  const db = getDb();

  const now = new Date().toISOString();
  const result = db.prepare('INSERT INTO assessments (user_id, total_score, rating, started_at, submitted_at) VALUES (?, 0, ?, ?, ?)')
    .run(userId, '', now, now);
  const assessmentId = result.lastInsertRowid as number;

  const questions: any[] = [];
  for (const dim of DIMENSIONS) {
    const rows = db.prepare(
      'SELECT id, dimension, content, option_a, option_b, option_c, option_d, correct_answer FROM questions WHERE dimension = ? AND is_active = 1 ORDER BY RANDOM() LIMIT ?'
    ).all(dim, QUESTIONS_PER_DIMENSION[dim]) as QuestionRow[];

    for (const q of rows) {
      questions.push({
        id: q.id,
        dimension: q.dimension,
        content: q.content,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
      });
    }
  }

  // Shuffle questions across dimensions
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }

  // Remove correct_answer before sending to client
  const clientQuestions = questions.map(({ correct_answer, ...rest }) => rest);

  return { assessment_id: assessmentId, questions: clientQuestions };
}

function calculateScore(correctCount: number, totalCount: number): number {
  return Math.round((correctCount / totalCount) * 100);
}

function getRating(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  return 'D';
}

export function submitAssessment(userId: number, assessmentId: number, answers: Record<string, string>): any {
  const db = getDb();

  const assessment = db.prepare('SELECT * FROM assessments WHERE id = ? AND user_id = ?').get(assessmentId, userId) as any;
  if (!assessment) throw Object.assign(new Error('测评记录不存在'), { status: 404 });
  if (assessment.rating) throw Object.assign(new Error('该测评已提交'), { code: 'VALIDATION_ERROR', status: 400 });

  // Get correct answers
  const questionIds = Object.keys(answers).map(Number);
  const placeholders = questionIds.map(() => '?').join(',');
  const questions = db.prepare(`SELECT id, dimension, correct_answer FROM questions WHERE id IN (${placeholders})`).all(...questionIds) as any[];

  const questionMap = new Map(questions.map(q => [q.id, q]));

  let totalCorrect = 0;
  const dimensionCorrect: Record<string, number> = { D1: 0, D2: 0, D3: 0, D4: 0 };
  const dimensionTotal: Record<string, number> = { D1: 0, D2: 0, D3: 0, D4: 0 };

  const insertAnswer = db.prepare(
    'INSERT INTO answers (assessment_id, question_id, selected_answer, is_correct) VALUES (?, ?, ?, ?)'
  );

  const insertDimScore = db.prepare(
    'INSERT INTO dimension_scores (assessment_id, dimension, score, correct_count) VALUES (?, ?, ?, ?)'
  );

  const transaction = db.transaction(() => {
    for (const [qId, selected] of Object.entries(answers)) {
      const q = questionMap.get(Number(qId));
      if (!q) continue;
      const isCorrect = selected === q.correct_answer ? 1 : 0;
      insertAnswer.run(assessmentId, Number(qId), selected, isCorrect);

      dimensionTotal[q.dimension] = (dimensionTotal[q.dimension] || 0) + 1;
      if (isCorrect) {
        totalCorrect++;
        dimensionCorrect[q.dimension] = (dimensionCorrect[q.dimension] || 0) + 1;
      }
    }

    const totalQuestions = Object.values(dimensionTotal).reduce((a, b) => a + b, 0);
    const totalScore = calculateScore(totalCorrect, totalQuestions || 1);
    const rating = getRating(totalScore);

    const dimensionScores: Record<string, { score: number; correct_count: number }> = {};
    for (const dim of DIMENSIONS) {
      const dimScore = calculateScore(dimensionCorrect[dim], dimensionTotal[dim]);
      insertDimScore.run(assessmentId, dim, dimScore, dimensionCorrect[dim]);
      dimensionScores[dim] = { score: dimScore, correct_count: dimensionCorrect[dim] };
    }

    db.prepare(`UPDATE assessments SET total_score = ?, rating = ?, submitted_at = datetime('now','localtime') WHERE id = ?`)
      .run(totalScore, rating, assessmentId);

    return { total_score: totalScore, rating, dimension_scores: dimensionScores };
  });

  return transaction();
}

export function getAssessmentHistory(userId: number): any[] {
  const db = getDb();
  return db.prepare(
    `SELECT a.id, a.total_score, a.rating, a.started_at, a.submitted_at,
            (SELECT json_group_array(json_object('dimension', ds.dimension, 'score', ds.score, 'correct_count', ds.correct_count))
             FROM dimension_scores ds WHERE ds.assessment_id = a.id) as dimension_scores
     FROM assessments a WHERE a.user_id = ? AND a.rating != '' ORDER BY a.submitted_at DESC`
  ).all(userId) as any[];
}

export function getAssessmentReport(userId: number, assessmentId: number): any {
  const db = getDb();

  const assessment = db.prepare('SELECT * FROM assessments WHERE id = ? AND user_id = ?').get(assessmentId, userId) as any;
  if (!assessment) throw Object.assign(new Error('测评记录不存在'), { status: 404 });

  const user = db.prepare('SELECT name, employee_no, department FROM users WHERE id = ?').get(userId) as any;

  const dimScores = db.prepare('SELECT * FROM dimension_scores WHERE assessment_id = ?').all(assessmentId) as any[];

  const dimLabels: Record<string, string> = {
    D1: '保险业务和监管知识', D2: '技术专业能力', D3: '信息安全及风险意识', D4: '前沿技术应用和落地',
  };
  const dimSuggestions: Record<string, string> = {
    D1: '建议加强保险行业通识学习，关注监管政策动态，深入理解科技伦理规范',
    D2: '建议系统学习信息化发展、信息技术基础、信息系统治理与管理及软件工程知识，可参考软考相关教材',
    D3: '建议学习常见网络攻击防护、密码安全管理、社会工程学防范及数据泄露场景识别',
    D4: '建议关注AI和大模型最新应用实践，学习大数据风控建模方法，了解云原生架构技术栈',
  };

  const dimensionScores = dimScores.map(ds => ({
    dimension: ds.dimension,
    label: dimLabels[ds.dimension],
    score: ds.score,
    correct_count: ds.correct_count,
    total_count: QUESTIONS_PER_DIMENSION[ds.dimension] || 5,
    rating: getRating(ds.score),
    suggestion: dimSuggestions[ds.dimension],
  }));

  const answers = db.prepare(
    `SELECT a.question_id, a.selected_answer, a.is_correct, q.dimension, q.content, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.explanation
     FROM answers a JOIN questions q ON a.question_id = q.id WHERE a.assessment_id = ?`
  ).all(assessmentId) as any[];

  return {
    user: { name: user.name, employee_no: user.employee_no, department: user.department },
    assessment: {
      id: assessment.id, total_score: assessment.total_score, rating: assessment.rating,
      started_at: assessment.started_at, submitted_at: assessment.submitted_at,
    },
    dimension_scores: dimensionScores,
    answers,
  };
}
