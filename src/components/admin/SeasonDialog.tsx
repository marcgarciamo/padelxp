"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useTransition } from "react";
import { createSeasonAction, updateSeasonAction, generateSlug } from "@lib/actions/seasons";
import { toast } from "sonner";

const schema = z.object({
  name:     z.string().min(3, "Mínimo 3 caracteres"),
  slug:     z.string().min(2).regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  startsAt: z.string().min(1, "Requerido"),
  endsAt:   z.string().optional(),
  notes:    z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  mode:       "create" | "edit";
  seasonId?:  string;
  defaults?:  Partial<FormValues>;
  onClose:    () => void;
};

export default function SeasonDialog({ mode, seasonId, defaults, onClose }: Props) {
  const [pending, startTransition] = useTransition();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    ...(defaults ? { defaultValues: defaults } : {}),
  });

  const name = watch("name");

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue("name", e.target.value);
    if (mode === "create") setValue("slug", generateSlug(e.target.value));
  }

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    startTransition(async () => {
      try {
        if (mode === "create") {
          await createSeasonAction(values);
          toast.success("Temporada creada");
        } else {
          await updateSeasonAction(seasonId!, values);
          toast.success("Temporada actualizada");
        }
        onClose();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error desconocido");
      }
    });
  }

  const input = "w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500";
  const label = "block text-xs font-medium text-zinc-400 mb-1";
  const err   = "text-xs text-red-400 mt-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-5">
          {mode === "create" ? "Nueva temporada" : "Editar temporada"}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className={label}>Nombre</label>
            <input {...register("name")} onChange={handleNameChange} placeholder="Temporada 1 · Verano 2026" className={input} />
            {errors.name && <p className={err}>{errors.name.message}</p>}
          </div>
          <div>
            <label className={label}>Slug (URL)</label>
            <input {...register("slug")} placeholder="t1-verano-2026" className={input} />
            {errors.slug && <p className={err}>{errors.slug.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Fecha inicio</label>
              <input type="date" {...register("startsAt")} className={input} />
              {errors.startsAt && <p className={err}>{errors.startsAt.message}</p>}
            </div>
            <div>
              <label className={label}>Fecha fin (opcional)</label>
              <input type="date" {...register("endsAt")} className={input} />
            </div>
          </div>
          <div>
            <label className={label}>Notas internas</label>
            <textarea {...register("notes")} rows={3} placeholder="Notas visibles solo en admin..." className={`${input} resize-none`} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={pending} className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm text-white font-medium transition-colors disabled:opacity-50">
              {pending ? "Guardando..." : mode === "create" ? "Crear" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
