import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../models/database';
import { config } from '../config';
import * as adminService from '../services/adminService';

export function getOverview(req: Request, res: Response) {
  try {
    const data = adminService.getOverview();
    res.json({ data });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
}

export function getEmployees(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.page_size as string) || 20;
    const department = req.query.department as string | undefined;
    const rating = req.query.rating as string | undefined;
    const result = adminService.getEmployeeList(page, pageSize, department, rating);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
}

export function getEmployeeAssessments(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.id);
    const records = adminService.getEmployeeAssessments(userId);
    res.json({ data: records });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
}

export function listUsers(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.page_size as string) || 20;
    const result = adminService.getUserList(page, pageSize);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
}

export function listQuestions(req: Request, res: Response) {
  try {
    const db = getDb();
    const dimension = req.query.dimension as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.page_size as string) || 20;

    let where = '';
    const params: any[] = [];
    if (dimension) { where = 'WHERE dimension = ?'; params.push(dimension); }

    const total = db.prepare(`SELECT COUNT(*) as count FROM questions ${where}`).get(...params) as any;
    const questions = db.prepare(`SELECT * FROM questions ${where} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...params, pageSize, (page - 1) * pageSize);

    res.json({ data: questions, pagination: { page, page_size: pageSize, total: total.count } });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
}

export function createQuestion(req: Request, res: Response) {
  try {
    const db = getDb();
    const { dimension, content, option_a, option_b, option_c, option_d, correct_answer, explanation } = req.body;
    const result = db.prepare(
      'INSERT INTO questions (dimension, content, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(dimension, content, option_a, option_b, option_c, option_d, correct_answer, explanation || '');
    res.json({ data: { id: result.lastInsertRowid }, message: '题目创建成功' });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
}

export function updateQuestion(req: Request, res: Response) {
  try {
    const db = getDb();
    const { dimension, content, option_a, option_b, option_c, option_d, correct_answer, explanation } = req.body;
    db.prepare(
      `UPDATE questions SET dimension=?, content=?, option_a=?, option_b=?, option_c=?, option_d=?, correct_answer=?, explanation=?, updated_at=datetime('now','localtime') WHERE id=?`
    ).run(dimension, content, option_a, option_b, option_c, option_d, correct_answer, explanation || '', req.params.id);
    res.json({ message: '题目更新成功' });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
}

export function deleteQuestion(req: Request, res: Response) {
  try {
    const db = getDb();
    db.prepare('DELETE FROM questions WHERE id = ?').run(req.params.id);
    res.json({ message: '题目已删除' });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
}

export function toggleQuestionStatus(req: Request, res: Response) {
  try {
    const db = getDb();
    const q = db.prepare('SELECT is_active FROM questions WHERE id = ?').get(req.params.id) as any;
    if (!q) return res.status(404).json({ error: { code: 'NOT_FOUND', message: '题目不存在' } });
    const newStatus = q.is_active ? 0 : 1;
    db.prepare(`UPDATE questions SET is_active = ?, updated_at = datetime('now','localtime') WHERE id = ?`).run(newStatus, req.params.id);
    res.json({ message: newStatus ? '题目已启用' : '题目已停用' });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
}

export function createUser(req: Request, res: Response) {
  try {
    const db = getDb();
    const { employee_no, name, department, password, role } = req.body;
    const hash = bcrypt.hashSync(password, config.bcrypt.saltRounds);
    const result = db.prepare(
      'INSERT INTO users (employee_no, name, department, password_hash, role, must_change_pwd) VALUES (?, ?, ?, ?, ?, 1)'
    ).run(employee_no, name, department, hash, role || 'employee');
    res.json({ data: { id: result.lastInsertRowid }, message: '员工账号创建成功' });
  } catch (err: any) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '工号已存在' } });
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
}

export function updateUser(req: Request, res: Response) {
  try {
    const db = getDb();
    const { name, department, role } = req.body;
    db.prepare(`UPDATE users SET name=?, department=?, role=?, updated_at=datetime('now','localtime') WHERE id=?`)
      .run(name, department, role, req.params.id);
    res.json({ message: '员工信息更新成功' });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
}

export function toggleUserStatus(req: Request, res: Response) {
  try {
    const db = getDb();
    const u = db.prepare('SELECT status FROM users WHERE id = ?').get(req.params.id) as any;
    if (!u) return res.status(404).json({ error: { code: 'NOT_FOUND', message: '用户不存在' } });
    const newStatus = u.status === 'active' ? 'disabled' : 'active';
    db.prepare(`UPDATE users SET status = ?, updated_at = datetime('now','localtime') WHERE id = ?`).run(newStatus, req.params.id);
    res.json({ message: newStatus === 'active' ? '账号已启用' : '账号已停用' });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
}

export function resetPassword(req: Request, res: Response) {
  try {
    const db = getDb();
    const { new_password } = req.body;
    const hash = bcrypt.hashSync(new_password, config.bcrypt.saltRounds);
    db.prepare(`UPDATE users SET password_hash = ?, must_change_pwd = 1, updated_at = datetime('now','localtime') WHERE id = ?`)
      .run(hash, req.params.id);
    res.json({ message: '密码重置成功' });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
}
