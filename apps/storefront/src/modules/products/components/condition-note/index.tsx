import { HttpTypes } from "@medusajs/types"
import { conditionDefinition, conditionOf } from "@lib/util/condition"

export default function ConditionNote({
  product,
}: {
  product: HttpTypes.StoreProduct
}) {
  const condition = conditionOf(product)
  if (!condition) return null
  const definition = conditionDefinition(condition)

  return (
    <div
      className="rounded-soft bg-blush/20 px-4 py-3"
      data-testid="condition-note"
    >
      <p className="font-body text-sm font-medium text-ink">
        Condition: {condition}
      </p>
      {definition && (
        <p className="font-body text-sm text-ink/70 mt-1">{definition}</p>
      )}
    </div>
  )
}
