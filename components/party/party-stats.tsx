"use client"

import { PartyProfileData } from "./party-filter"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatCard, StatItem } from "./stat-card"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  GraduationCap, 
  Calendar, 
  Tag, 
  MapPin, 
  Accessibility, 
  UserPlus,
  ArrowUpCircle,
  TrendingUp
} from "lucide-react"

interface PartyStatsProps {
  party: PartyProfileData
}

export function PartyStats({ party }: PartyStatsProps) {
  const fptp = party.current_stats_json?.fptp
  const pr = party.current_stats_json?.pr

  if (!fptp && !pr) return null

  return (
    <div className="space-y-8">
      <Tabs defaultValue="fptp" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="fptp">प्रत्यक्ष (FPTP)</TabsTrigger>
          <TabsTrigger value="pr">समानुपातिक (PR)</TabsTrigger>
        </TabsList>

        <TabsContent value="fptp" className="mt-6 space-y-8">
          {/* Top Summary */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard 
              label="कुल उम्मेदवार" 
              value={fptp.total} 
              icon={<Users className="h-5 w-5" />} 
            />
            <SummaryCard 
              label="औसत उमेर" 
              value={`${fptp.avg_age?.toFixed(1) || 0} वर्ष`} 
              icon={<Calendar className="h-5 w-5" />} 
            />
            <SummaryCard 
              label="नयाँ अनुहार" 
              value={fptp.new} 
              secondaryValue={fptp.total > 0 ? `${Math.round((fptp.new / fptp.total) * 100)}%` : undefined}
              icon={<UserPlus className="h-5 w-5" />} 
            />
            <SummaryCard 
              label="दोहोरिएका" 
              value={fptp.returning} 
              secondaryValue={fptp.total > 0 ? `${Math.round((fptp.returning / fptp.total) * 100)}%` : undefined}
              icon={<ArrowUpCircle className="h-5 w-5" />} 
            />
          </div>

          <div className="space-y-6">
            {/* First Row: Gender, Age, and Education */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* Gender */}
              <StatCard title="लैंगिक विवरण" icon={<Users className="h-5 w-5" />}>
                <div className="space-y-4">
                  {[...(fptp.gender || [])]
                    .sort((a, b) => b.count - a.count)
                    .map((item: any) => (
                      <StatItem 
                        key={item.group} 
                        label={item.group} 
                        count={item.count} 
                        total={fptp.total} 
                        colorClass={item.group === 'महिला' ? 'bg-pink-500' : 'bg-blue-500'}
                      />
                    ))}
                </div>
              </StatCard>

              {/* Age Groups */}
              <StatCard title="उमेर समूह" icon={<Calendar className="h-5 w-5" />}>
                <div className="space-y-4">
                  {[...(fptp.age_group || [])]
                    .sort((a, b) => b.count - a.count)
                    .map((item: any) => (
                      <StatItem 
                        key={item.group} 
                        label={item.group} 
                        count={item.count} 
                        total={fptp.total} 
                        colorClass="bg-orange-500"
                      />
                    ))}
                </div>
              </StatCard>

              {/* Qualification */}
              <StatCard title="शैक्षिक योग्यता" icon={<GraduationCap className="h-5 w-5" />}>
                <div className="space-y-4">
                  {[...(fptp.qualification || [])]
                    .sort((a, b) => b.count - a.count)
                    .map((item: any) => (
                      <StatItem 
                        key={item.group} 
                        label={item.group} 
                        count={item.count} 
                        total={fptp.total} 
                      />
                    ))}
                </div>
              </StatCard>
            </div>

            {/* Tags - Detailed Bar Chart View */}
            <StatCard title="विशेषताहरू (Tags)" icon={<Tag className="h-5 w-5" />} className="w-full">
              <div className="grid gap-x-12 gap-y-8 sm:grid-cols-2">
                {[...(fptp.tags || [])]
                  .sort((a, b) => b.count - a.count)
                  .map((item: any, idx, arr) => {
                    const maxCount = Math.max(...arr.map((i: any) => i.count))
                    return (
                      <StatItem 
                        key={item.group} 
                        label={
                          <Badge variant="outline" className="rounded-lg border-primary/20 bg-primary/5 px-3 py-1 font-bold text-primary">
                            {item.group}
                          </Badge>
                        } 
                        count={item.count} 
                        maxCount={maxCount}
                        colorClass="bg-indigo-500"
                      />
                    )
                  })}
              </div>
            </StatCard>
          </div>
        </TabsContent>

        <TabsContent value="pr" className="mt-6 space-y-8">
          {/* Top Summary */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SummaryCard 
              label="कुल उम्मेदवार" 
              value={pr.total} 
              icon={<Users className="h-5 w-5" />} 
            />
            <SummaryCard 
              label="समावेशी समूह" 
              value={pr.inclusive?.length || 0} 
              icon={<Tag className="h-5 w-5" />} 
            />
             <SummaryCard 
              label="अपाङ्गता भएका" 
              value={pr.disability?.find((i: any) => i.group === 'Yes')?.count || 0} 
              secondaryValue={pr.total > 0 ? `${((pr.disability?.find((i: any) => i.group === 'Yes')?.count || 0) / pr.total * 100).toFixed(1)}%` : undefined}
              icon={<Accessibility className="h-5 w-5" />} 
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
             {/* Inclusive Groups */}
             <StatCard title="समावेशी समूह" icon={<Tag className="h-5 w-5" />}>
              <div className="space-y-4">
                {[...(pr.inclusive || [])]
                  .sort((a, b) => b.count - a.count)
                  .map((item: any) => (
                    <StatItem 
                      key={item.group} 
                      label={item.group} 
                      count={item.count} 
                      total={pr.total} 
                      colorClass="bg-indigo-500"
                    />
                  ))}
              </div>
            </StatCard>

            {/* Gender */}
            <StatCard title="लैंगिक विवरण" icon={<Users className="h-5 w-5" />}>
              <div className="space-y-4">
                {[...(pr.gender || [])]
                  .sort((a, b) => b.count - a.count)
                  .map((item: any) => (
                    <StatItem 
                      key={item.group} 
                      label={item.group} 
                      count={item.count} 
                      total={pr.total} 
                      colorClass={item.group === 'महिला' ? 'bg-pink-500' : 'bg-blue-500'}
                    />
                  ))}
              </div>
            </StatCard>

            {/* Geographical Distribution */}
            <StatCard title="भौगोलिक उपस्थिति" icon={<MapPin className="h-5 w-5" />}>
              <div className="space-y-4">
                {[...(pr.district || [])]
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 10)
                  .map((item: any) => (
                    <StatItem 
                      key={item.group} 
                      label={item.group} 
                      count={item.count} 
                      total={pr.total} 
                      colorClass="bg-emerald-500"
                    />
                  ))}
                {pr.district?.length > 10 && (
                  <p className="text-center text-xs text-muted-foreground pt-2">
                    ...र अन्य {pr.district.length - 10} जिल्लाहरू
                  </p>
                )}
              </div>
            </StatCard>

            {/* Backward Region */}
            <StatCard title="पिछडिएको क्षेत्र" icon={<MapPin className="h-5 w-5" />}>
              <div className="space-y-4">
                {[...(pr.backward || [])]
                  .sort((a, b) => b.count - a.count)
                  .map((item: any) => (
                    <StatItem 
                      key={item.group} 
                      label={item.group === 'Yes' ? 'पिछडिएको' : 'अन्य'} 
                      count={item.count} 
                      total={pr.total} 
                      colorClass={item.group === 'Yes' ? 'bg-amber-600' : 'bg-slate-400'}
                    />
                  ))}
              </div>
            </StatCard>
          </div>

          {/* Tags - Detailed Bar Chart View for PR */}
          <StatCard title="विशेषताहरू (Tags)" icon={<Tag className="h-5 w-5" />} className="w-full">
            <div className="grid gap-x-12 gap-y-8 sm:grid-cols-2">
              {[...(pr.tags || [])]
                .sort((a, b) => b.count - a.count)
                .map((item: any, idx, arr) => {
                  const maxCount = Math.max(...arr.map((i: any) => i.count))
                  return (
                    <StatItem 
                      key={item.group} 
                      label={
                        <Badge variant="outline" className="rounded-lg border-primary/20 bg-primary/5 px-3 py-1 font-bold text-primary">
                          {item.group}
                        </Badge>
                      } 
                      count={item.count} 
                      maxCount={maxCount}
                      colorClass="bg-indigo-500"
                    />
                  )
                })}
            </div>
          </StatCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SummaryCard({ label, value, icon, secondaryValue }: { label: string, value: string | number, icon: React.ReactNode, secondaryValue?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-primary/10 p-3 text-primary">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {secondaryValue && (
              <p className="text-sm font-medium text-muted-foreground">{secondaryValue}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
