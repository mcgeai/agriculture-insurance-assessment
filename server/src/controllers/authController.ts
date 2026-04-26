import { Request, Response } from 'express';
import * as authService from '../services/authService';

export function login(req: Request, res: Response) {
  try {
    const { employee_no, password } = req.body;
    const result = authService.login(employee_no, password);
    res.json({ data: result, message: '登录成功' });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: { code: err.code || 'INTERNAL_ERROR', message: err.message } });
  }
}

export function changePassword(req: Request, res: Response) {
  try {
    const { old_password, new_password } = req.body;
    authService.changePassword(req.user!.sub, old_password, new_password);
    res.json({ message: '密码修改成功' });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: { code: err.code || 'INTERNAL_ERROR', message: err.message } });
  }
}
