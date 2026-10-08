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

import { registerAccount, signInAccount, type RegisterField } from "@/app/actions/auth";
import { GoogleIcon } from "@/components/icons";
import { rememberLastEmail } from "@/lib/auth/client-session";

type Step = "email" | "signup";

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
  return fields.map(({ name, type, label, placeholder }) => (
    <TextField
      key={name}
      type={type}
      value={form.credentials[name]}
      onChange={(value) => form.setField(name, value)}
      isRequired
      isInvalid={form.errorField === name}
      validationBehavior="aria"
    >
      <Label>{label}</Label>
      <Input placeholder={placeholder} />
    </TextField>
  ));
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
}: {
  form: AuthForm;
  isPending: boolean;
  onSubmit: () => void;
  onSignUp: () => void;
}) {
  return (
    <form className="flex flex-col gap-4" onSubmit={submitWith(onSubmit)}>
      <CredentialFields fields={LOGIN_FIELDS} form={form} />
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

export function AuthModal({ state }: { state: UseOverlayStateReturn }) {
  const router = useRouter();
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
      state.close();
      if (result.hasDashboardAccess) {
        router.push("/dashboard");
      } else {
        // No dedicated account area for other roles yet — at least refresh
        // server-rendered data so the session takes effect immediately.
        router.refresh();
      }
    });
  }

  function handleRegister() {
    const { credentials } = form;
    form.clearErrors();
    startTransition(async () => {
      const result = await registerAccount(credentials);
      if (!result.success) {
        form.fail(result.error, result.field ?? null);
        return;
      }
      rememberLastEmail(credentials.email);
      if (result.needsEmailConfirmation) {
        form.setSuccessMessage("Cuenta creada. Revisa tu correo para confirmarla.");
        return;
      }
      state.close();
    });
  }

  function goToSignUp() {
    form.clearErrors();
    setStep("signup");
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
            <Modal.Heading>{step === "email" ? "Inicia sesión" : "Crea tu cuenta"}</Modal.Heading>
          </Modal.Header>

          <Modal.Body>
            {step === "email" ? (
              <LoginForm form={form} isPending={isPending} onSubmit={handleLogin} onSignUp={goToSignUp} />
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
