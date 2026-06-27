import { z } from 'zod'

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
})

export const registerSchema = z.object({
  full_name: z.string().min(2, 'Ad en az 2 karakter olmalıdır').max(100),
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  password: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalıdır')
    .regex(/[A-Z]/, 'En az bir büyük harf içermelidir')
    .regex(/[0-9]/, 'En az bir rakam içermelidir'),
  confirmPassword: z.string(),
  company_name: z.string().min(2, 'Şirket adı en az 2 karakter olmalıdır').max(200),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

// ─── Company ─────────────────────────────────────────────────────────────────
export const companySchema = z.object({
  name: z.string().min(2, 'Şirket adı en az 2 karakter olmalıdır').max(200),
  industry: z.string().optional(),
  size: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  website: z.string().url('Geçerli bir URL girin').optional().or(z.literal('')),
  description: z.string().max(1000).optional(),
})

export type CompanyInput = z.infer<typeof companySchema>

// ─── Assessment ───────────────────────────────────────────────────────────────
export const assessmentAnswerSchema = z.object({
  question_id: z.string().uuid(),
  option_ids: z.array(z.string().uuid()).optional(),
  text_answer: z.string().optional(),
  numeric_answer: z.number().optional(),
})

export type AssessmentAnswerInput = z.infer<typeof assessmentAnswerSchema>

// ─── Question ─────────────────────────────────────────────────────────────────
export const questionSchema = z.object({
  category_id: z.string().uuid(),
  text: z.string().min(10, 'Soru metni en az 10 karakter olmalıdır').max(500),
  description: z.string().max(1000).optional(),
  type: z.enum(['single_choice', 'multiple_choice', 'scale', 'text']),
  weight: z.number().min(0.1).max(10),
  order_index: z.number().min(0),
  is_required: z.boolean().default(true),
})

export type QuestionInput = z.infer<typeof questionSchema>
