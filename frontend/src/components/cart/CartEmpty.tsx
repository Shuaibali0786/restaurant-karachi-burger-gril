import { ShoppingBag, UtensilsCrossed } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export function CartEmpty({ onBrowse }: { onBrowse?: () => void }) {
  return (
    <EmptyState
      icon={<ShoppingBag aria-hidden="true" className="size-9" />}
      title="Your cart is empty"
      text="Hungry? Zinger burgers, Burns Road tikka and crispy fried chicken are a few taps away."
      action={
        <ButtonLink href="/menu" size="lg" onClick={onBrowse} icon={<UtensilsCrossed aria-hidden="true" className="size-5" />}>
          Browse menu
        </ButtonLink>
      }
    />
  );
}
