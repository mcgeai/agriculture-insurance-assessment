import { Request, Response } from 'express';
import * as quizService from '../services/quizService';

export function getQuestions(req: Request, res: Response) {
  try {
    const result = quizService.startAssessment(req.user!.sub);
    res.json({ data: { ...result, time_limit: 3600 } });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: { code: err.code || 'INTERNAL_ERROR', message: err.message } });
  }
}

export function submitQuiz(req: Request, res: Response) {
  try {
    const { assessment_id, answers } = req.body;
    const result = quizService.submitAssessment(req.user!.sub, assessment_id, answers);
    res.json({ data: result, message: '测评提交成功' });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: { code: err.code || 'INTERNAL_ERROR', message: err.message } });
  }
}

export function getHistory(req: Request, res: Response) {
  try {
    const records = quizService.getAssessmentHistory(req.user!.sub);
    res.json({ data: records });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: { code: err.code || 'INTERNAL_ERROR', message: err.message } });
  }
}

export function getReport(req: Request, res: Response) {
  try {
    const report = quizService.getAssessmentReport(req.user!.sub, parseInt(req.params.id));
    res.json({ data: report });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: { code: err.code || 'INTERNAL_ERROR', message: err.message } });
  }
}
