import { cn } from "@/lib/utils";
import { User } from "lucide-react";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: "sm" | "md" | "lg";
  gender?: "male" | "female";
  className?: string;
}

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-20 w-20",
};

export function Avatar({ src, alt, size = "md", gender = "male", className }: AvatarProps) {
  const bgColor = gender === "male" ? "bg-blue-100 text-blue-600" : "bg-pink-100 text-pink-600";

  if (src) {
    return (
      <img
        src={src}
        alt={alt || ""}
        className={cn("rounded-full object-cover", sizeMap[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full",
        sizeMap[size],
        bgColor,
        className
      )}
    >
      <User className={size === "sm" ? "h-4 w-4" : size === "md" ? "h-6 w-6" : "h-10 w-10"} />
    </div>
  );
}
