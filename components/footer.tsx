import Image from "next/image"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/favicon.svg" alt="मतदाता जानकारी" width={32} height={32} className="rounded-lg" />
            <span className="text-sm font-bold text-foreground">मतदाता जानकारी</span>
          </Link>
          <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
            यो सबै विवरण निर्वाचन आयोग नेपालको वेबसाइटबाट लिइएको हो। पुरानो डाटा र नयाँ डाटा मिलान गर्दा केही त्रुटिहरू हुन सक्छन्, कृपया केही त्रुटिहरू भेट्नुभएमा <a href="mailto:sujal@datasparta.com" className="text-primary hover:underline">sujal@datasparta.com</a> मा इमेल गर्नुहोला। हामी सच्याउने प्रयास गर्नेछौं।
          </p>
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">
            <p>copyright @2026 datasparta.com</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
