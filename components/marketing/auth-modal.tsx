"use client";

import { useCallback, useEffect, useState, useTransition, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Label,
  Modal,
  TextField,
  type UseOverlayStateReturn,
} from "@heroui/react";
import { Eye, EyeOff } from "lucide-react";

import {
  registerViewerAccount,
  requestPasswordResetAction,
  signInAccount,
  type RegisterField,
} from "@/app/actions/auth";
import { GoogleIcon } from "@/components/icons";
import { useFavorites } from "@/components/marketing/favorites-provider";
import { rememberLastEmail } from "@/lib/auth/client-session";

type Step = "email" | "signup" | "forgot";

const STEP_TITLES: Record<Step, string> = {
  email: "Inicia sesión",
  signup: "Crea tu cuenta",
  forgot: "Recupera tu contraseña",
};

type Credentials = { fullName: string; email: string; phone: string; password: string };

const EMPTY_CREDENTIALS: Credentials = { fullName: "", email: "", phone: "", password: "" };

/** How long the modal's close animation takes; the form resets after it so nothing visibly changes. */
const CLOSE_ANIMATION_MS = 200;

type FieldConfig = {
  name: keyof Credentials;
  label: string;
  placeholder: string;
  type?: "email" | "password" | "tel";
};

const LOGIN_FIELDS: FieldConfig[] = [
  { name: "email", type: "email", label: "Correo electrónico", placeholder: "tu@correo.com" },
  { name: "password", type: "password", label: "Contraseña", placeholder: "Tu contraseña" },
];

const FORGOT_FIELDS: FieldConfig[] = [
  { name: "email", type: "email", label: "Correo electrónico", placeholder: "tu@correo.com" },
];

const SIGNUP_FIELDS: FieldConfig[] = [
  { name: "fullName", label: "Nombre completo", placeholder: "Ej. María Gómez" },
  { name: "email", type: "email", label: "Correo electrónico", placeholder: "tu@correo.com" },
  { name: "phone", type: "tel", label: "Teléfono", placeholder: "Ej. 300 123 4567" },
  { name: "password", type: "password", label: "Contraseña", placeholder: "Mínimo 6 caracteres" },
];

/** Form state shared by both steps, so an email typed while signing in carries over to sign-up. */
function useAuthForm() {
  const [credentials, setCredentials] = useState<Credentials>(EMPTY_CREDENTIALS);
  const [formError, setFormError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<RegisterField | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function setField(name: keyof Credentials, value: string) {
    setCredentials((current) => ({ ...current, [name]: value }));
  }

  function clearErrors() {
    setFormError(null);
    setErrorField(null);
  }

  function fail(error: string, field: RegisterField | null) {
    setFormError(error);
    setErrorField(field);
  }

  // Stable, so the modal can reset from an effect without re-running it every render.
  const reset = useCallback(() => {
    setCredentials(EMPTY_CREDENTIALS);
    setFormError(null);
    setErrorField(null);
    setSuccessMessage(null);
  }, []);

  return { credentials, setField, formError, errorField, successMessage, setSuccessMessage, clearErrors, fail, reset };
}

type AuthForm = ReturnType<typeof useAuthForm>;

function CredentialFields({ fields, form }: { fields: FieldConfig[]; form: AuthForm }) {
  const [passwordVisible, setPasswordVisible] = useState(false);

  return fields.map(({ name, type, label, placeholder }) => {
    const isPassword = type === "password";
    return (
      <TextField
        key={name}
        type={isPassword && passwordVisible ? "text" : type}
        value={form.credentials[name]}
        onChange={(value) => form.setField(name, value)}
        isRequired
        isInvalid={form.errorField === name}
        validationBehavior="aria"
      >
        <Label>{label}</Label>
        {isPassword ? (
          <div className="relative">
            <Input placeholder={placeholder} className="w-full pr-10" />
            <button
              type="button"
              onClick={() => setPasswordVisible((current) => !current)}
              aria-label={passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={passwordVisible}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted transition-colors hover:text-foreground"
            >
              {passwordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        ) : (
          <Input placeholder={placeholder} />
        )}
      </TextField>
    );
  });
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="text-sm text-danger" role="alert">
      {message}
    </p>
  );
}

function submitWith(handler: () => void) {
  return (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    handler();
  };
}

function LoginForm({
  form,
  isPending,
  onSubmit,
  onSignUp,
  onForgotPassword,
}: {
  form: AuthForm;
  isPending: boolean;
  onSubmit: () => void;
  onSignUp: () => void;
  onForgotPassword: () => void;
}) {
  return (
    <form className="flex flex-col gap-4" onSubmit={submitWith(onSubmit)}>
      <CredentialFields fields={LOGIN_FIELDS} form={form} />
      <button
        type="button"
        onClick={onForgotPassword}
        className="-mt-2 self-end text-sm font-medium text-accent hover:underline"
      >
        ¿Olvidaste tu contraseña?
      </button>
      <FormError message={form.formError} />

      <Button type="submit" variant="primary" fullWidth isDisabled={isPending}>
        {isPending ? "Ingresando…" : "Continuar"}
      </Button>

      <p className="text-center text-sm text-muted">
        ¿No tienes cuenta?{" "}
        <button type="button" onClick={onSignUp} className="font-medium text-accent hover:underline">
          Regístrate
        </button>
      </p>
    </form>
  );
}

function ForgotPasswordForm({
  form,
  isPending,
  onSubmit,
  onBack,
}: {
  form: AuthForm;
  isPending: boolean;
  onSubmit: () => void;
  onBack: () => void;
}) {
  return (
    <form className="flex flex-col gap-4" onSubmit={submitWith(onSubmit)}>
      <p className="text-sm text-muted">
        Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva contraseña.
      </p>
      <CredentialFields fields={FORGOT_FIELDS} form={form} />
      <FormError message={form.formError} />
      {form.successMessage ? <p className="text-sm text-success">{form.successMessage}</p> : null}

      <Button type="submit" variant="primary" fullWidth isDisabled={isPending}>
        {isPending ? "Enviando…" : "Enviar enlace"}
      </Button>

      <p className="text-center text-sm text-muted">
        <button type="button" onClick={onBack} className="font-medium text-accent hover:underline">
          Volver a iniciar sesión
        </button>
      </p>
    </form>
  );
}

function SignupForm({
  form,
  isPending,
  onSubmit,
  onGoogle,
}: {
  form: AuthForm;
  isPending: boolean;
  onSubmit: () => void;
  onGoogle: () => void;
}) {
  return (
    <form className="flex flex-col gap-4" onSubmit={submitWith(onSubmit)}>
      <CredentialFields fields={SIGNUP_FIELDS} form={form} />
      <FormError message={form.formError} />
      {form.successMessage ? <p className="text-sm text-success">{form.successMessage}</p> : null}

      <Button type="submit" variant="primary" fullWidth isDisabled={isPending}>
        {isPending ? "Creando cuenta…" : "Crear cuenta"}
      </Button>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-separator" />
        o
        <span className="h-px flex-1 bg-separator" />
      </div>

      <Button type="button" variant="outline" fullWidth onPress={onGoogle}>
        <GoogleIcon />
        Continuar con Google
      </Button>
    </form>
  );
}

export function AuthModal({
  state,
  stayOnPage = false,
}: {
  state: UseOverlayStateReturn;
  /** Sign in without leaving the page (e.g. to save a favorite) instead of opening the account. */
  stayOnPage?: boolean;
}) {
  const router = useRouter();
  const favorites = useFavorites();
  const [step, setStep] = useState<Step>("email");
  const form = useAuthForm();
  const { reset } = form;
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (state.isOpen) return;
    const timeout = setTimeout(() => {
      setStep("email");
      reset();
    }, CLOSE_ANIMATION_MS);
    return () => clearTimeout(timeout);
  }, [state.isOpen, reset]);

  function handleLogin() {
    const { email, password } = form.credentials;
    form.clearErrors();
    startTransition(async () => {
      const result = await signInAccount({ email, password });
      if (!result.success) {
        form.fail(result.error, "password");
        return;
      }
      rememberLastEmail(email);
      favorites?.reload();
      state.close();
      if (result.hasAccountAccess && !stayOnPage) {
        router.push("/dashboard");
      } else {
        router.refresh();
      }
    });
  }

  function handleRegister() {
    const { credentials } = form;
    form.clearErrors();
    startTransition(async () => {
      const result = await registerViewerAccount(credentials);
      if (!result.success) {
        form.fail(result.error, result.field ?? null);
        return;
      }
      rememberLastEmail(credentials.email);
      if (result.needsEmailConfirmation) {
        // Same wording whether the email was new or already registered, so it reveals neither.
        form.setSuccessMessage("Si el correo es válido, te enviamos un enlace para activar tu cuenta. Revisa tu bandeja de entrada.");
        return;
      }
      state.close();
      router.push("/dashboard");
    });
  }

  function handleForgotPassword() {
    const { email } = form.credentials;
    form.clearErrors();
    form.setSuccessMessage(null);
    startTransition(async () => {
      const result = await requestPasswordResetAction({ email });
      if (!result.success) {
        form.fail(result.error, "email");
        return;
      }
      rememberLastEmail(email);
      // Same wording whether the email has an account or not, so it reveals neither.
      form.setSuccessMessage("Si el correo tiene una cuenta, te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada.");
    });
  }

  function goTo(next: Step) {
    form.clearErrors();
    form.setSuccessMessage(null);
    setStep(next);
  }

  return (
    // Controlled straight on the backdrop: `<Modal>` wraps a DialogTrigger that expects a
    // pressable <Modal.Trigger> child, and this modal is opened from elsewhere via `state`.
    <Modal.Backdrop
      isOpen={state.isOpen}
      onOpenChange={state.setOpen}
      className="light"
      style={{ colorScheme: "light" }}
    >
      <Modal.Container size="md" placement="top">
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading>{STEP_TITLES[step]}</Modal.Heading>
          </Modal.Header>

          <Modal.Body>
            {step === "email" ? (
              <LoginForm
                form={form}
                isPending={isPending}
                onSubmit={handleLogin}
                onSignUp={() => goTo("signup")}
                onForgotPassword={() => goTo("forgot")}
              />
            ) : step === "forgot" ? (
              <ForgotPasswordForm
                form={form}
                isPending={isPending}
                onSubmit={handleForgotPassword}
                onBack={() => goTo("email")}
              />
            ) : (
              <SignupForm form={form} isPending={isPending} onSubmit={handleRegister} onGoogle={() => state.close()} />
            )}
          </Modal.Body>

          <Modal.CloseTrigger />
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
