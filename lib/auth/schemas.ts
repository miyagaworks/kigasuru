// lib/auth/schemas.ts
import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上である必要があります'),
});

export const RegisterSchema = z.object({
  name: z.string().min(1, '名前を入力してください'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z
    .string()
    .min(8, 'パスワードは8文字以上である必要があります')
    .regex(/[A-Z]/, 'パスワードには大文字を1文字以上含める必要があります')
    .regex(/[a-z]/, 'パスワードには小文字を1文字以上含める必要があります')
    .regex(/[0-9]/, 'パスワードには数字を1文字以上含める必要があります'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword'],
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
