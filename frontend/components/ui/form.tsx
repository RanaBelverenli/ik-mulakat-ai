"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";

// Simple FormProvider wrapper if react-hook-form is not available
const FormProvider = ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => {
  return <form {...props}>{children}</form>;
};

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends Record<string, any> = Record<string, any>,
  TName extends string = string,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

type ControllerProps<TFieldValues extends Record<string, any> = Record<string, any>, TName extends string = string> = {
  name: TName;
  control?: any;
  render?: (props: { field: { value: any; onChange: (value: any) => void; onBlur: () => void }; fieldState: { error?: { message?: string } } }) => React.ReactNode;
  defaultValue?: any;
  rules?: any;
};

const FormField = <
  TFieldValues extends Record<string, any> = Record<string, any>,
  TName extends string = string,
>({
  name,
  control,
  render,
  defaultValue,
  rules,
  children,
  ...props
}: ControllerProps<TFieldValues, TName> & { children?: React.ReactNode }) => {
  const [value, setValue] = React.useState(defaultValue);
  const [error, setError] = React.useState<{ message?: string } | undefined>();

  const field = {
    value,
    onChange: (newValue: any) => {
      setValue(newValue);
      // Simple validation
      if (rules?.required && !newValue) {
        setError({ message: "This field is required" });
      } else {
        setError(undefined);
      }
    },
    onBlur: () => {
      // Validation on blur
      if (rules?.required && !value) {
        setError({ message: "This field is required" });
      }
    },
  };

  const fieldState = { error };

  return (
    <FormFieldContext.Provider value={{ name }}>
      {render ? render({ field, fieldState }) : <>{children}</>}
    </FormFieldContext.Provider>
  );
};

const useFormContext = () => {
  return {
    getFieldState: (name: string) => {
      return { error: undefined, invalid: false, isDirty: false, isTouched: false };
    },
  };
};

const useFormState = (options?: { name?: string }) => {
  return {};
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext?.name });
  const fieldState = fieldContext ? getFieldState(fieldContext.name) : { error: undefined };

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue,
);

function FormItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        data-slot="form-item"
        className={cn("grid gap-2", className)}
        {...props}
      />
    </FormItemContext.Provider>
  );
}

function FormLabel({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  const { error, formItemId } = useFormField();

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn("data-[error=true]:text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  );
}

function FormControl({ 
  children,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <div
      data-slot="form-control"
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    >
      {React.isValidElement(children)
        ? React.cloneElement(children, {
            id: formItemId,
            "aria-describedby": !error
              ? `${formDescriptionId}`
              : `${formDescriptionId} ${formMessageId}`,
            "aria-invalid": !!error,
          } as any)
        : children}
    </div>
  );
}

function FormDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  const { formDescriptionId } = useFormField();

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function FormMessage({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  const { error, formMessageId } = useFormField();
  const body = error ? String((error as any)?.message ?? "") : props.children;

  if (!body) {
    return null;
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn("text-destructive text-sm", className)}
      {...props}
    >
      {body}
    </p>
  );
}

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};
