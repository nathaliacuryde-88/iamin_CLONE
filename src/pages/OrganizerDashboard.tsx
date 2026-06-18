import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Ticket, Users, Star } from "lucide-react";

const OrganizerDashboard = () => {
  const tiles = [
    { icon: BarChart3, label: "Event analytics", desc: "Views, RSVPs, exit-poll scores", soon: true },
    { icon: Ticket, label: "Ticket sales", desc: "Stripe-powered checkout", soon: true },
    { icon: Users, label: "Followers", desc: "People subscribed to your events", soon: false },
    { icon: Star, label: "Post-event reports", desc: "Aggregate vibe, retention, repeat guests", soon: true },
  ];
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-32 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Organizer dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Tools for hosting events at scale.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {tiles.map((t) => (
            <Card key={t.label} className="glass">
              <CardContent className="p-4 space-y-2">
                <t.icon className="h-5 w-5 text-primary" />
                <p className="text-sm font-semibold">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
                {t.soon && (
                  <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
                    Coming soon
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default OrganizerDashboard;
