type ToggleSwitchProps = React.ComponentPropsWithoutRef<"button"> & {
  checked: boolean;
  label: string;
};

export default function ToggleSwitch({
  checked,
  label,
  className = "",
  type = "button",
  ...props
}: ToggleSwitchProps) {
  return (
    <button
      type={type}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
        checked ? "bg-primary-500" : "bg-neutral-300"
      } ${className}`}
      {...props}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
