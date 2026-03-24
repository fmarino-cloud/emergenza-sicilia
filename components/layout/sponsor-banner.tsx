import Image from "next/image";
import { cn } from "@/lib/utils";

interface SponsorBannerProps {
  imageUrl: string;
  linkUrl: string;
  position: "sidebar" | "in-feed" | "footer" | "header";
  className?: string;
}

export function SponsorBanner({ imageUrl, linkUrl, position, className }: SponsorBannerProps) {
  const dimensions = {
    sidebar: { width: 300, height: 250 },
    "in-feed": { width: 728, height: 90 },
    footer: { width: 728, height: 90 },
    header: { width: 728, height: 90 },
  }[position];

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <span className="text-xs text-es-text-secondary font-body">Sponsorizzato</span>
      <a
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block rounded-card overflow-hidden opacity-80 hover:opacity-100 transition-opacity duration-150 focus:outline-none focus:ring-2 focus:ring-es-blue"
        aria-label="Contenuto sponsorizzato"
      >
        <Image
          src={imageUrl}
          alt="Sponsor"
          width={dimensions.width}
          height={dimensions.height}
          className="block max-w-full"
        />
      </a>
    </div>
  );
}
