"use client";

import { Eye, EyeOff } from "lucide-react";

type ToggleActiveButtonProps = {
  productId: number;
  isActive: boolean;
  activateAction: (formData: FormData) => void | Promise<void>;
  deactivateAction: (formData: FormData) => void | Promise<void>;
};

export function ToggleActiveButton({
  productId,
  isActive,
  activateAction,
  deactivateAction,
}: ToggleActiveButtonProps) {
  return (
    <form
      action={isActive ? deactivateAction : activateAction}
      onSubmit={(event) => {
        if (isActive) {
          const ok = window.confirm("Deactivate this product?");
          if (!ok) event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={productId} />
      <button
        type="submit"
        className={`btn-icon ${isActive ? "btn-icon-danger" : ""}`}
        title={isActive ? "Deactivate" : "Activate"}
        aria-label={isActive ? "Deactivate product" : "Activate product"}
      >
        {isActive ? (
          <EyeOff size={15} strokeWidth={2} />
        ) : (
          <Eye size={15} strokeWidth={2} />
        )}
      </button>
    </form>
  );
}
