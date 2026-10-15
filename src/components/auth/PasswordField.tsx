import { forwardRef, useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
type Props = Omit<ComponentProps<typeof Input>, "type"> & { label: string };
export const PasswordField = forwardRef<HTMLInputElement, Props>(
  ({ id = "password", label, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const [caps, setCaps] = useState(false);
    const Toggle = visible ? EyeOff : Eye;
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <div className="relative">
          <Input
            {...props}
            ref={ref}
            id={id}
            name={props.name || id}
            type={visible ? "text" : "password"}
            aria-describedby={
              [props["aria-describedby"], caps ? `${id}-caps` : null]
                .filter(Boolean)
                .join(" ") || undefined
            }
            onKeyDown={(event) => setCaps(event.getModifierState("CapsLock"))}
            onKeyUp={(event) => setCaps(event.getModifierState("CapsLock"))}
            onBlur={() => setCaps(false)}
            className="h-11 pr-12"
          />
          <button
            type="button"
            aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
            aria-pressed={visible}
            aria-controls={id}
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Toggle className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {caps && (
          <p
            id={`${id}-caps`}
            role="status"
            className="text-sm text-muted-foreground"
          >
            Caps Lock is on.
          </p>
        )}
      </div>
    );
  },
);
PasswordField.displayName = "PasswordField";
