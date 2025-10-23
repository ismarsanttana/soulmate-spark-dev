import * as LucideIcons from "lucide-react";

export function getIconComponent(iconName: string) {
  const IconComponent = (LucideIcons as any)[iconName];
  
  if (IconComponent) {
    return IconComponent;
  }
  
  // Fallback to Building2 icon if not found
  return LucideIcons.Building2;
}
