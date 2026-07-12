"use client";

import { type ChangeEvent, useRef, useState } from "react";
import { DISPLAY_DEFINITIONS } from "@/data/defaultScenes";
import type {
  Combatant,
  CombatantKind,
  ConditionType,
  DisplaysState,
  DisplayTarget,
  MarchingOrderState,
} from "@/types/terrador";
import { fileToResizedDataUrl } from "./imageUpload";
import { VisualAsset } from "./VisualAsset";

const KIND_OPTIONS: { value: CombatantKind; label: string }[] = [
  { value: "player", label: "Hero" },
  { value: "ally", label: "Ally" },
  { value: "enemy", label: "Enemy" },
];

interface MarchingOrderEditorProps {
  marchingOrder: MarchingOrderState;
  displays: DisplaysState;
  onSetTitle: (title: string) => void;
  onAddCombatant: (kind: CombatantKind) => void;
  onUpdateCombatant: (
    combatantId: string,
    patch: Partial<Omit<Combatant, "id">>,
  ) => void;
  onDeleteCombatant: (combatantId: string) => void;
  onMoveCombatant: (combatantId: string, direction: 1 | -1) => void;
  onToggleCombatantCondition: (
    combatantId: string,
    conditionId: string,
  ) => void;
  onSetActiveCombatant: (combatantId: string) => void;
  onAdvanceTurn: (direction: 1 | -1) => void;
  onAddCondition: () => void;
  onUpdateCondition: (
    conditionId: string,
    patch: Partial<Omit<ConditionType, "id">>,
  ) => void;
  onDeleteCondition: (conditionId: string) => void;
  onToggleDisplay: (displayId: DisplayTarget) => void;
}

interface CombatantRowProps {
  combatant: Combatant;
  index: number;
  total: number;
  isActive: boolean;
  conditions: ConditionType[];
  onUpdate: (patch: Partial<Omit<Combatant, "id">>) => void;
  onDelete: () => void;
  onMove: (direction: 1 | -1) => void;
  onToggleCondition: (conditionId: string) => void;
  onSetActive: () => void;
}

function CombatantRow({
  combatant,
  index,
  total,
  isActive,
  conditions,
  onUpdate,
  onDelete,
  onMove,
  onToggleCondition,
  onSetActive,
}: CombatantRowProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setUploadError(null);
    setUploading(true);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      onUpdate({ image: dataUrl });
    } catch {
      setUploadError("Could not read that image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <article
      className={`rounded-2xl border bg-slate-950/58 p-4 ${
        isActive
          ? "border-amber-300/70 shadow-[0_0_22px_rgba(245,214,123,0.18)]"
          : "border-cyan-100/14"
      }`}
    >
      <div className="grid gap-4 md:grid-cols-[6rem_1fr] md:items-start">
        <div className="grid gap-2">
          <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-cyan-100/15">
            <VisualAsset
              name={combatant.name}
              imagePath={combatant.image}
              className="h-full w-full"
              compact
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            className="steel-button quiet-button py-2 text-xs"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Loading..." : "Upload"}
          </button>
          {combatant.image ? (
            <button
              className="steel-button quiet-button py-2 text-xs"
              onClick={() => onUpdate({ image: "" })}
            >
              Clear Picture
            </button>
          ) : null}
        </div>

        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
            <label className="grid gap-1 text-sm text-cyan-100">
              Name
              <input
                className="steel-input"
                value={combatant.name}
                onChange={(event) => onUpdate({ name: event.target.value })}
              />
            </label>
            <label className="grid gap-1 text-sm text-cyan-100">
              Role
              <select
                className="steel-input"
                value={combatant.kind}
                onChange={(event) =>
                  onUpdate({ kind: event.target.value as CombatantKind })
                }
              >
                {KIND_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {uploadError ? (
            <p className="text-xs text-red-300">{uploadError}</p>
          ) : null}

          <div className="grid gap-1 text-sm text-cyan-100">
            Conditions / effects
            <div className="flex flex-wrap gap-2">
              {conditions.length === 0 ? (
                <span className="text-xs text-slate-400">
                  Add conditions in the palette below.
                </span>
              ) : (
                conditions.map((condition) => {
                  const active = combatant.conditionIds.includes(condition.id);
                  return (
                    <button
                      key={condition.id}
                      className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold transition"
                      style={{
                        borderColor: condition.color,
                        backgroundColor: active
                          ? `${condition.color}33`
                          : "transparent",
                        color: active ? "#f8fbff" : "rgba(226,240,255,0.65)",
                      }}
                      onClick={() => onToggleCondition(condition.id)}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: condition.color }}
                      />
                      {condition.label}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className={`steel-button py-2 text-xs ${isActive ? "" : "quiet-button"}`}
              onClick={onSetActive}
            >
              {isActive ? "Current Turn" : "Set Current Turn"}
            </button>
            <button
              className="steel-button quiet-button py-2 text-xs"
              onClick={() => onMove(-1)}
              disabled={index === 0}
            >
              Move Up
            </button>
            <button
              className="steel-button quiet-button py-2 text-xs"
              onClick={() => onMove(1)}
              disabled={index === total - 1}
            >
              Move Down
            </button>
            <button
              className="steel-button danger-button py-2 text-xs"
              onClick={onDelete}
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function MarchingOrderEditor({
  marchingOrder,
  displays,
  onSetTitle,
  onAddCombatant,
  onUpdateCombatant,
  onDeleteCombatant,
  onMoveCombatant,
  onToggleCombatantCondition,
  onSetActiveCombatant,
  onAdvanceTurn,
  onAddCondition,
  onUpdateCondition,
  onDeleteCondition,
  onToggleDisplay,
}: MarchingOrderEditorProps) {
  const { combatants, conditions, activeCombatantId, title } = marchingOrder;
  const activeCombatant = combatants.find(
    (combatant) => combatant.id === activeCombatantId,
  );

  return (
    <section className="rune-panel rounded-3xl p-5">
      <div className="relative z-10 grid gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/75">
              Combat Runes
            </p>
            <h2 className="text-2xl font-black">Marching &amp; Combat Order</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Build the party and enemy line-up with portraits, color-coded
              conditions, and a highlighted current turn, then show it on any
              screen.
            </p>
          </div>
          <label className="grid gap-1 text-sm text-cyan-100">
            Overlay title
            <input
              className="steel-input"
              value={title}
              maxLength={40}
              onChange={(event) => onSetTitle(event.target.value)}
            />
          </label>
        </div>

        <div className="grid gap-4 rounded-2xl border border-cyan-100/14 bg-slate-950/50 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
              Show marching order on:
            </span>
            {DISPLAY_DEFINITIONS.map((display) => {
              const shown = displays[display.id]?.showMarchingOrder ?? false;
              return (
                <button
                  key={display.id}
                  className={`steel-button py-2 text-xs ${shown ? "" : "quiet-button"}`}
                  onClick={() => onToggleDisplay(display.id)}
                >
                  {shown ? "On" : "Off"} · {display.label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-2xl border border-amber-300/30 bg-amber-950/30 px-3 py-2 text-xs text-amber-100">
              Current turn: {activeCombatant?.name ?? "None"}
            </span>
            <button
              className="steel-button quiet-button py-2 text-xs"
              onClick={() => onAdvanceTurn(-1)}
            >
              Previous Turn
            </button>
            <button
              className="steel-button py-2 text-xs"
              onClick={() => onAdvanceTurn(1)}
            >
              Next Turn
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {KIND_OPTIONS.map((option) => (
            <button
              key={option.value}
              className="steel-button"
              onClick={() => onAddCombatant(option.value)}
            >
              Add {option.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4">
          {combatants.length === 0 ? (
            <p className="rounded-2xl border border-cyan-100/14 bg-slate-950/50 p-4 text-sm text-slate-300">
              No combatants yet. Add a hero, ally, or enemy to build the order.
            </p>
          ) : (
            combatants.map((combatant, index) => (
              <CombatantRow
                key={combatant.id}
                combatant={combatant}
                index={index}
                total={combatants.length}
                isActive={combatant.id === activeCombatantId}
                conditions={conditions}
                onUpdate={(patch) => onUpdateCombatant(combatant.id, patch)}
                onDelete={() => onDeleteCombatant(combatant.id)}
                onMove={(direction) => onMoveCombatant(combatant.id, direction)}
                onToggleCondition={(conditionId) =>
                  onToggleCombatantCondition(combatant.id, conditionId)
                }
                onSetActive={() => onSetActiveCombatant(combatant.id)}
              />
            ))
          )}
        </div>

        <div className="rounded-2xl border border-cyan-100/14 bg-slate-950/50 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
                Condition Palette
              </p>
              <p className="text-sm text-slate-300">
                Pick a color for each condition. Colors are shared across every
                combatant and screen.
              </p>
            </div>
            <button className="steel-button" onClick={onAddCondition}>
              Add Condition
            </button>
          </div>

          <div className="grid gap-2">
            {conditions.map((condition) => (
              <div
                key={condition.id}
                className="grid gap-2 rounded-xl border border-cyan-100/10 bg-slate-950/60 p-2 sm:grid-cols-[3rem_1fr_auto] sm:items-center"
              >
                <input
                  type="color"
                  className="marching-color-input"
                  value={condition.color}
                  onChange={(event) =>
                    onUpdateCondition(condition.id, {
                      color: event.target.value,
                    })
                  }
                  aria-label={`${condition.label} color`}
                />
                <input
                  className="steel-input"
                  value={condition.label}
                  onChange={(event) =>
                    onUpdateCondition(condition.id, {
                      label: event.target.value,
                    })
                  }
                />
                <button
                  className="steel-button danger-button py-2 text-xs"
                  onClick={() => onDeleteCondition(condition.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
