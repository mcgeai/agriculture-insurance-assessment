import { Request, Response } from 'express';
import * as authService from '../services/authService';
import * as captchaService from '../services/captchaService';

export function getCaptcha(_req: Request, res: Response) {
  const { captchaId, svg } = captchaService.generateCaptcha();
  res.json({ data: { captcha_id: captchaId, svg } });
}

export function register(req: Request, res: Response) {
  try {
    const { employee_no, name, department, password, captcha_id, captcha_text } = req.body;
    if (!captcha_id || !captcha_text || !captchaService.verifyCaptcha(captcha_id, captcha_text)) {
      res.status(400).json({ error: { code: 'CAPTCHA_ERROR', message: '验证码错误或已过期' } });
      return;
    }
    if (!employee_no || !name || !department || !password) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '请填写所有必填字段' } });
      return;
    }
    if (!/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(password)) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '密码需包含字母和数字，至少8位' } });
      return;
    }
    const result = authService.register(employee_no, name, department, password);
    res.json({ data: result, message: '注册成功' });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: { code: err.code || 'INTERNAL_ERROR', message: err.message } });
  }
}

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
