import { Building2 } from "lucide-react"

export default function PartyProfilePage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Building2 className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">पार्टी प्रोफाइल</h1>
        <p className="text-muted-foreground">Coming soon</p>
      </div>
    </main>
  )
}
