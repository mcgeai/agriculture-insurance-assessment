declare module 'svg-captcha' {
  interface CaptchaObj {
    text: string;
    data: string;
  }
  interface Options {
    size?: number;
    width?: number;
    height?: number;
    noise?: number;
    color?: boolean;
    background?: string;
  }
  export function create(options?: Options): CaptchaObj;
  export function createMathExpr(options?: Options): CaptchaObj;
}
