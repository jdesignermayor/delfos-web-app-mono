"use client";

import { useEffect, useState, useTransition } from "react";
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

type Step = "email" | "signup";

export function AuthModal({ state }: { state: UseOverlayStateReturn }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<RegisterField | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!state.isOpen) {
      // Reset once the close animation has had time to finish, so the form
      // doesn't visibly change while the modal is still fading out.
      const timeout = setTimeout(() => {
        setStep("email");
        setEmail("");
        setFullName("");
        setPhone("");
        setPassword("");
        setFormError(null);
        setErrorField(null);
        setSuccessMessage(null);
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [state.isOpen]);

  function handleLogin() {
    setFormError(null);
    setErrorField(null);
    startTransition(async () => {
      const result = await signInAccount({ email, password });
      if (!result.success) {
        setFormError(result.error);
        setErrorField("password");
        return;
      }
      // Store email in localStorage for future sessions
      if (typeof window !== "undefined") {
        localStorage.setItem("last_email", email);
      }
      state.close();
      if (result.role === "superadmin") {
        router.push("/dashboard");
      } else {
        // No dedicated account area for other roles yet — at least refresh
        // server-rendered data so the session takes effect immediately.
        router.refresh();
      }
    });
  }

  function handleRegister() {
    setFormError(null);
    setErrorField(null);
    startTransition(async () => {
      const result = await registerAccount({ fullName, email, phone, password });
      if (!result.success) {
        setFormError(result.error);
        setErrorField(result.field ?? null);
        return;
      }
      // Store email in localStorage for future sessions
      if (typeof window !== "undefined") {
        localStorage.setItem("last_email", email);
      }
      if (result.needsEmailConfirmation) {
        setSuccessMessage("Cuenta creada. Revisa tu correo para confirmarla.");
        return;
      }
      state.close();
    });
  }

  return (
    <Modal state={state}>
      <Modal.Backdrop className="light" style={{ colorScheme: "light" }}>
        <Modal.Container size="md" placement="top">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>
                {step === "email" ? "Inicia sesión" : "Crea tu cuenta"}
              </Modal.Heading>
            </Modal.Header>

            <Modal.Body>
              {step === "email" ? (
                <form
                  className="flex flex-col gap-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleLogin();
                  }}
                >
                  <TextField
                    type="email"
                    value={email}
                    onChange={setEmail}
                    isRequired
                    isInvalid={errorField === "email"}
                    validationBehavior="aria"
                  >
                    <Label>Correo electrónico</Label>
                    <Input placeholder="tu@correo.com" />
                  </TextField>

                  <TextField
                    type="password"
                    value={password}
                    onChange={setPassword}
                    isRequired
                    isInvalid={errorField === "password"}
                    validationBehavior="aria"
                  >
                    <Label>Contraseña</Label>
                    <Input placeholder="Tu contraseña" />
                  </TextField>

                  {formError ? (
                    <p className="text-sm text-danger" role="alert">
                      {formError}
                    </p>
                  ) : null}

                  <Button type="submit" variant="primary" fullWidth isDisabled={isPending}>
                    {isPending ? "Ingresando…" : "Continuar"}
                  </Button>

                  <p className="text-center text-sm text-muted">
                    ¿No tienes cuenta?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setFormError(null);
                        setErrorField(null);
                        setStep("signup");
                      }}
                      className="font-medium text-accent hover:underline"
                    >
                      Regístrate
                    </button>
                  </p>
                </form>
              ) : (
                <form
                  className="flex flex-col gap-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleRegister();
                  }}
                >
                  <TextField
                    value={fullName}
                    onChange={setFullName}
                    isRequired
                    isInvalid={errorField === "fullName"}
                    validationBehavior="aria"
                  >
                    <Label>Nombre completo</Label>
                    <Input placeholder="Ej. María Gómez" />
                  </TextField>

                  <TextField
                    type="email"
                    value={email}
                    onChange={setEmail}
                    isRequired
                    isInvalid={errorField === "email"}
                    validationBehavior="aria"
                  >
                    <Label>Correo electrónico</Label>
                    <Input placeholder="tu@correo.com" />
                  </TextField>

                  <TextField
                    type="tel"
                    value={phone}
                    onChange={setPhone}
                    isRequired
                    isInvalid={errorField === "phone"}
                    validationBehavior="aria"
                  >
                    <Label>Teléfono</Label>
                    <Input placeholder="Ej. 300 123 4567" />
                  </TextField>

                  <TextField
                    type="password"
                    value={password}
                    onChange={setPassword}
                    isRequired
                    isInvalid={errorField === "password"}
                    validationBehavior="aria"
                  >
                    <Label>Contraseña</Label>
                    <Input placeholder="Mínimo 6 caracteres" />
                  </TextField>

                  {formError ? (
                    <p className="text-sm text-danger" role="alert">
                      {formError}
                    </p>
                  ) : null}

                  {successMessage ? (
                    <p className="text-sm text-success">{successMessage}</p>
                  ) : null}

                  <Button type="submit" variant="primary" fullWidth isDisabled={isPending}>
                    {isPending ? "Creando cuenta…" : "Crear cuenta"}
                  </Button>

                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span className="h-px flex-1 bg-separator" />
                    o
                    <span className="h-px flex-1 bg-separator" />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    onPress={() => state.close()}
                  >
                    <GoogleIcon />
                    Continuar con Google
                  </Button>
                </form>
              )}
            </Modal.Body>

            <Modal.CloseTrigger />
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
