/* =============================================================================
   SaaS Inmobiliario — Login Page
   Formulario de autenticación con validación
   ============================================================================= */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { toast } from '../stores/toastStore';
import styles from './LoginPage.module.css';

// ── Schema de validación ────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ── Componente ──────────────────────────────────────────────────────────────

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);

    try {
      await login(data.email, data.password);
      toast.success('Bienvenido');
      navigate('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error de autenticación';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mostrar loading mientras se inicializa la sesión
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* ── Logo / Título ──────────────────────────────────────────────── */}
        <div className={styles.header}>
          <h1 className={styles.title}>SaaS Inmobiliario</h1>
          <p className={styles.subtitle}>Panel de administración</p>
        </div>

        {/* ── Formulario ─────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              placeholder="usuario@ejemplo.com"
              autoComplete="email"
              autoFocus
              {...register('email')}
            />
            {errors.email && (
              <span className={styles.error}>{errors.email.message}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('password')}
            />
            {errors.password && (
              <span className={styles.error}>{errors.password.message}</span>
            )}
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <p className={styles.footer}>
          Sistema multi-tenant por subdominio
        </p>
      </div>
    </div>
  );
}
