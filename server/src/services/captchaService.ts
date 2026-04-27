import svgCaptcha from 'svg-captcha';

interface CaptchaEntry {
  text: string;
  expiresAt: number;
}

const captchaStore = new Map<string, CaptchaEntry>();

// Clean expired captchas every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of captchaStore) {
    if (now > entry.expiresAt) captchaStore.delete(id);
  }
}, 5 * 60 * 1000);

export function generateCaptcha(): { captchaId: string; svg: string } {
  const captcha = svgCaptcha.create({ size: 4, noise: 3, width: 120, height: 40, color: true });
  const captchaId = Math.random().toString(36).slice(2) + Date.now().toString(36);
  captchaStore.set(captchaId, { text: captcha.text.toLowerCase(), expiresAt: Date.now() + 5 * 60 * 1000 });
  return { captchaId, svg: captcha.data };
}

export function verifyCaptcha(captchaId: string, captchaText: string): boolean {
  const entry = captchaStore.get(captchaId);
  if (!entry) return false;
  captchaStore.delete(captchaId);
  if (Date.now() > entry.expiresAt) return false;
  return entry.text === captchaText.toLowerCase();
}
