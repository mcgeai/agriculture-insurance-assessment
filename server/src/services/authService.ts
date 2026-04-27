import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../models/database';
import { config } from '../config';

interface LoginResult {
  token: string;
  must_change_pwd: boolean;
  user: { id: number; employee_no: string; name: string; department: string; role: string };
}

export function login(employee_no: string, password: string): LoginResult {
  const db = getDb();

  const user = db.prepare('SELECT * FROM users WHERE employee_no = ? AND status = ?').get(employee_no, 'active') as any;
  if (!user) {
    throw Object.assign(new Error('工号或密码错误'), { code: 'AUTH_FAILED', status: 401 });
  }

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    throw Object.assign(new Error(`账户已锁定，请于${user.locked_until}后重试`), { code: 'ACCOUNT_LOCKED', status: 409 });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    const newCount = user.failed_login_count + 1;
    if (newCount >= 5) {
      const lockedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      db.prepare(`UPDATE users SET failed_login_count = ?, locked_until = ?, updated_at = datetime('now','localtime') WHERE id = ?`)
        .run(newCount, lockedUntil, user.id);
      throw Object.assign(new Error('连续登录失败5次，账户已锁定30分钟'), { code: 'ACCOUNT_LOCKED', status: 409 });
    }
    db.prepare(`UPDATE users SET failed_login_count = ?, updated_at = datetime('now','localtime') WHERE id = ?`)
      .run(newCount, user.id);
    throw Object.assign(new Error('工号或密码错误'), { code: 'AUTH_FAILED', status: 401 });
  }

  db.prepare(`UPDATE users SET failed_login_count = 0, locked_until = NULL, updated_at = datetime('now','localtime') WHERE id = ?`)
    .run(user.id);

  const payload = { sub: user.id, employee_no: user.employee_no, role: user.role };
  const token = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn as any });

  return {
    token,
    must_change_pwd: !!user.must_change_pwd,
    user: { id: user.id, employee_no: user.employee_no, name: user.name, department: user.department, role: user.role },
  };
}

export function changePassword(userId: number, oldPassword: string, newPassword: string): void {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) throw Object.assign(new Error('用户不存在'), { status: 404 });

  if (!bcrypt.compareSync(oldPassword, user.password_hash)) {
    throw Object.assign(new Error('旧密码错误'), { code: 'VALIDATION_ERROR', status: 400 });
  }

  const hash = bcrypt.hashSync(newPassword, config.bcrypt.saltRounds);
  db.prepare(`UPDATE users SET password_hash = ?, must_change_pwd = 0, updated_at = datetime('now','localtime') WHERE id = ?`)
    .run(hash, userId);
}
