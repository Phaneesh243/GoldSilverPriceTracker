type AdSlotProps = {
  id: string;
  label?: string;
  module?: string;
  placement?: "top" | "after-hero" | "mid-content" | "before-footer" | "sidebar";
  format?: "responsive" | "banner" | "native";
};

export default function AdSlot({ id, label = "Advertisement", module = "finance", placement = "mid-content", format = "responsive" }: AdSlotProps) {
  return (
    <aside className="ad-slot" data-ad-slot={id} data-ad-module={module} data-ad-placement={placement} data-ad-format={format} aria-label={label}>
      <span>{label}</span>
    </aside>
  );
}
