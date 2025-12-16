import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";;
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Clock, Users, Dumbbell, Target, ExternalLink, Lock, LogIn } from "lucide-react";
import { getLoginUrl } from "@/const";
import { Link, useRoute } from "wouter";
import drillsData from "@/data/drills.json";

// Mock data for the 1-2-3 Drill (since we only extracted this one for now)
// In a real app, we would fetch this or have it all in the JSON
const drillDetails = {
  "1": {
    skillSet: "Hitting",
    difficulty: "Easy",
    athletes: "1-2 athletes and 1 coach, or 2 athletes as partners",
    time: "10 minutes",
    equipment: "Tee, baseballs, net or screen to hit into",
    goal: "Load so that weight is shifted mostly to back foot, stride while staying balanced",
    description: [
      "Tee set up slightly in front of the middle of the plate",
      "Hitter sets up even with the plate, while other partner puts a ball on the tee",
      "Hitter gets ready, looks forward to visualize a pitcher",
      "Partner then calls out “1, 2, 3” pausing after each number, on each number hitter will:",
      "1: Hitter loads shifting weight to back foot",
      "2: Hitter strides while staying balanced, hands separate to move back from the shoulder",
      "3: Hitter swings and hits the ball",
      "Hitter tries to hit the ball back up the middle",
      "Partners switch after 5 swings"
    ],
    addDifficulty: [
      "To add a degree of difficulty, one of the partners can stand 30 feet away on the other side of the net the players are hitting into and go through a dry pitch like a pitcher (without a ball), this gives the hitter a real visual of a pitcher (1, 2, 3 should still be separated motions)",
      "The hitter can also move the tee to different contact points (inside, middle, outside)"
    ],
    videoUrl: "https://www.youtube.com/embed/r4eylEht9Fk"
  }
};

export default function DrillDetail() {
  const { user, loading } = useAuth();
  const [match, params] = useRoute("/drill/:id");
  const id = params?.id;
  const drill = drillsData.find(d => d.id.toString() === id);
  const details = id && drillDetails[id as keyof typeof drillDetails];

  // Check if user has access
  const hasAccess = user && (user.role === 'admin' || user.isActiveClient === 1);

  if (loading) {
    return (
      <div className="container py-12 text-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!drill) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Drill not found</h2>
        <Link href="/">
          <Button>Back to Directory</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Access Control Check */}
      {!hasAccess && (
        <div className="container py-12">
          <Card className="max-w-2xl mx-auto border-2">
            <CardHeader className="text-center">
              <div className="mx-auto bg-muted h-16 w-16 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl">Client Access Required</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                This drill content is only available to active clients. Please log in with an authorized account to view the full drill details.
              </p>
              {!user ? (
                <a href={getLoginUrl()}>
                  <Button size="lg" className="gap-2">
                    <LogIn className="h-5 w-5" />
                    Login to Access
                  </Button>
                </a>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Your account does not have active client access. Please contact the administrator.
                  </p>
                  <Link href="/">
                    <Button variant="outline">Return to Directory</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      {hasAccess && (
      <>
      <header className="bg-primary text-primary-foreground py-8 mb-8">
        <div className="container">
          <Link href="/">
            <Button variant="ghost" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 mb-4 pl-0">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Directory
            </Button>
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="secondary" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  {drill.difficulty}
                </Badge>
                {drill.categories.map(cat => (
                  <Badge key={cat} variant="outline" className="text-primary-foreground border-primary-foreground/30">
                    {cat}
                  </Badge>
                ))}
              </div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold">{drill.name}</h1>
            </div>
            
            {/* Fallback to external link if we don't have internal details */}
            {!details && (
              <a href={drill.url} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary">
                  View on USA Baseball <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="container max-w-4xl">
        {details ? (
          <div className="grid gap-8">
            {/* Video Section - Moved to Top */}
            {details.videoUrl ? (
              <div className="rounded-xl overflow-hidden shadow-lg aspect-video bg-black w-full">
                <iframe 
                  src={details.videoUrl} 
                  title={`${drill.name} Video`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="bg-muted rounded-xl aspect-video flex items-center justify-center border-2 border-dashed border-muted-foreground/20 w-full">
                <div className="text-center p-4">
                  <p className="text-muted-foreground font-medium">Video / Diagram Placeholder</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Media content would appear here</p>
                </div>
              </div>
            )}



            {/* Goal */}
            <Card className="border-l-4 border-l-secondary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Target className="h-5 w-5 text-secondary" />
                  Drill Goal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">{details.goal}</p>
              </CardContent>
            </Card>

            {/* Instructions */}
            <div className="grid md:grid-cols-1 gap-8">
              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-heading font-bold mb-4 flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground h-8 w-8 rounded-full flex items-center justify-center text-sm">1</span>
                    Instructions
                  </h2>
                  <div className="bg-card rounded-xl border p-6 shadow-sm space-y-4">
                    <ul className="space-y-3">
                      {details.description.map((step: string, i: number) => (
                        <li key={i} className="flex gap-3">
                          <div className="h-2 w-2 bg-secondary rounded-full mt-2 shrink-0" />
                          <span className="leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-heading font-bold mb-4 flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground h-8 w-8 rounded-full flex items-center justify-center text-sm">2</span>
                    Add Difficulty
                  </h2>
                  <div className="bg-muted/30 rounded-xl border p-6 space-y-4">
                    <ul className="space-y-3">
                      {details.addDifficulty.map((step: string, i: number) => (
                        <li key={i} className="flex gap-3">
                          <div className="h-2 w-2 bg-primary rounded-full mt-2 shrink-0" />
                          <span className="leading-relaxed text-muted-foreground">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
            <h3 className="text-xl font-bold mb-2">Content Not Available</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              We haven't extracted the detailed content for this drill yet. You can view it on the official website.
            </p>
            <a href={drill.url} target="_blank" rel="noopener noreferrer">
              <Button>
                View on USA Baseball <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}
