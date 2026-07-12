"use client";

import type {
  Combatant,
  CombatantKind,
  ConditionType,
  MarchingOrderState,
} from "@/types/terrador";
import { VisualAsset } from "./VisualAsset";

interface MarchingOrderOverlayProps {
  marchingOrder: MarchingOrderState;
}

const kindFrameClass: Record<CombatantKind, string> = {
  player: "marching-frame-player",
  ally: "marching-frame-ally",
  enemy: "marching-frame-enemy",
};

const kindLabel: Record<CombatantKind, string> = {
  player: "Hero",
  ally: "Ally",
  enemy: "Enemy",
};

function ConditionChips({ conditions }: { conditions: ConditionType[] }) {
  if (conditions.length === 0) {
    return null;
  }

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {conditions.map((condition) => (
        <span
          key={condition.id}
          className="marching-condition-chip"
          style={{
            backgroundColor: `${condition.color}26`,
            borderColor: condition.color,
          }}
        >
          <span
            className="marching-condition-dot"
            style={{ backgroundColor: condition.color }}
          />
          {condition.label}
        </span>
      ))}
    </div>
  );
}

export function MarchingOrderOverlay({
  marchingOrder,
}: MarchingOrderOverlayProps) {
  const { combatants, conditions, activeCombatantId, title } = marchingOrder;

  if (combatants.length === 0) {
    return null;
  }

  const conditionsById = new Map(
    conditions.map((condition) => [condition.id, condition]),
  );

  const resolveConditions = (combatant: Combatant) =>
    combatant.conditionIds
      .map((id) => conditionsById.get(id))
      .filter((condition): condition is ConditionType => Boolean(condition));

  return (
    <aside className="marching-order-strip">
      <p className="marching-order-title">{title || "Marching Order"}</p>
      <ol className="marching-order-list">
        {combatants.map((combatant, index) => {
          const isActive = combatant.id === activeCombatantId;

          return (
            <li
              key={combatant.id}
              className={`marching-order-item ${isActive ? "is-active" : ""}`}
            >
              <span className="marching-order-index">{index + 1}</span>
              <div
                className={`marching-portrait ${kindFrameClass[combatant.kind]}`}
              >
                <VisualAsset
                  name={combatant.name}
                  imagePath={combatant.image}
                  className="h-full w-full rounded-[0.85rem]"
                  imageClassName="object-cover"
                  placeholderClassName="rounded-[0.85rem]"
                  compact
                />
                {isActive ? <span className="marching-now-tag">Now</span> : null}
              </div>
              <div className="min-w-0">
                <p className="marching-order-kind">{kindLabel[combatant.kind]}</p>
                <p className="marching-order-name">{combatant.name}</p>
                <ConditionChips conditions={resolveConditions(combatant)} />
              </div>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
