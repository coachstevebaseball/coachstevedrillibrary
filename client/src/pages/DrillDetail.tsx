import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";;
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Clock, Users, Dumbbell, Target, ExternalLink, Lock, LogIn } from "lucide-react";
import { getLoginUrl, PREVIEW_MODE } from "@/const";
import { Link, useRoute } from "wouter";
import drillsData from "@/data/drills.json";

// Drill details with video URLs and content
// Keys are the drill IDs from drills.json
const drillDetails: Record<string, {
  skillSet: string;
  difficulty: string;
  athletes: string;
  time: string;
  equipment: string;
  goal: string;
  description: string[];
  addDifficulty: string[];
  videoUrl: string | null;
}> = {
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
      "Partner then calls out \"1, 2, 3\" pausing after each number, on each number hitter will:",
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
  },
  "28": {
    skillSet: "Hitting",
    difficulty: "Medium",
    athletes: "1-2 athletes and 1 coach, or 2 athletes as partners",
    time: "10 minutes",
    equipment: "Bat, helmet, home plate, and a bucket of baseballs",
    goal: "Focus on driving the ball up the middle by hitting the inside of the ball",
    description: [
      "Hitter sets up even with the plate",
      "Coach sets up to the opposite side of the hitter at an angle, about 10 feet away from the hitter",
      "Coach should make sure to be at a far enough angle to not get hit by the ball",
      "Coach underhand tosses the ball across the middle of the plate",
      "Hitter tries to hit the ball back up the middle, working on timing with the coach's pitches and being sure not to rush through the drill",
      "Focus should be hitting the ball back up the middle, staying inside the baseball",
      "Partners switch after 10 swings"
    ],
    addDifficulty: [
      "To add a degree of difficulty, coaches can throw pitches inside and outside",
      "Hitters should try to hit outside pitches to the opposite field (or opposite side in a cage)",
      "Hitters should try to hit inside pitches back up the middle or a little to the pull side of the middle"
    ],
    videoUrl: "https://www.youtube.com/embed/DbceoWEor9c"
  },
  "58": {
    skillSet: "Hitting",
    difficulty: "Medium",
    athletes: "1-2 athletes and 1 coach, or 2 athletes as partners",
    time: "10 minutes",
    equipment: "Bat, baseballs, screen for coach to throw behind",
    goal: "Develop timing and rhythm with pitches coming from behind",
    description: [
      "Coach sets up behind the hitter at a safe distance",
      "Coach underhand tosses the ball from behind the hitter",
      "Hitter focuses on timing and tracking the ball",
      "Use the 1-2-3 rhythm: 1-Load, 2-Stride, 3-Swing",
      "Partners switch after 10 swings"
    ],
    addDifficulty: [
      "Vary the speed and location of tosses"
    ],
    videoUrl: "https://www.youtube.com/embed/QUR1x6V73yQ"
  },
  "59": {
    skillSet: "Hitting",
    difficulty: "Easy",
    athletes: "1-2 athletes and 1 coach, or 2 athletes as partners",
    time: "5 minutes",
    equipment: "Tee, baseballs, net or screen to hit into",
    goal: "Develop proper contact point at the belly button area",
    description: [
      "Set up the tee at belly button height",
      "Hitter focuses on making contact at the optimal point",
      "Drive the ball back up the middle",
      "Partners switch after 5 swings"
    ],
    addDifficulty: [
      "Move the tee to different locations (inside, outside)"
    ],
    videoUrl: "https://www.youtube.com/embed/P0f_jlz6LKA"
  },
  "65": {
    skillSet: "Hitting",
    difficulty: "Medium",
    athletes: "1-2 athletes and 1 coach, or 2 athletes as partners",
    time: "5 minutes",
    equipment: "Tee, baseballs, net or screen to hit into",
    goal: "Strengthen the bottom hand and develop proper swing mechanics",
    description: [
      "Hitter grips the bat with only the bottom hand",
      "Tee set up at waist height",
      "Focus on driving through the ball with the bottom hand",
      "Maintain proper body position throughout the swing",
      "Partners switch after 5 swings"
    ],
    addDifficulty: [
      "Increase the number of swings",
      "Move the tee to different contact points"
    ],
    videoUrl: "https://www.youtube.com/embed/r4eylEht9Fk"
  },
  "72": {
    skillSet: "Hitting",
    difficulty: "Medium",
    athletes: "1-2 athletes and 1 coach, or 2 athletes as partners",
    time: "10 minutes",
    equipment: "Screen for coach to throw behind, home plate, and a bucket of baseballs",
    goal: "Focus on not anticipating pitches and being under control when hitting",
    description: [
      "Screen set up 30 feet from the plate, hitter sets up even with the plate",
      "Coach underhand throws the ball down the middle of the plate on a line at a medium to fast speed from behind the screen",
      "Hitter hits the ball back up the middle of the cage",
      "Every couple of tosses, the coach throws a change-up at a slow speed",
      "The coach should check the position the player is in, making sure they have not started their swing before the change-up gets to them",
      "If the player has already started their swing, the player should focus on being under better control and not anticipating and jumping at pitches",
      "Partners switch after 10 swings"
    ],
    addDifficulty: [
      "To add a degree of difficulty, coaches can throw pitches inside and outside"
    ],
    videoUrl: "https://www.youtube.com/embed/SfP2RcIwaZQ"
  },
  "74": {
    skillSet: "Hitting",
    difficulty: "Medium",
    athletes: "1-2 athletes and 1 coach, or 2 athletes as partners",
    time: "5 minutes",
    equipment: "Tee, baseballs, net or screen to hit into",
    goal: "Practice timing adjustments for off-speed pitches",
    description: [
      "Set up the tee slightly back from normal contact point",
      "Hitter focuses on staying back and waiting for the ball",
      "Practice the feel of hitting a change-up",
      "Drive the ball to the opposite field",
      "Partners switch after 5 swings"
    ],
    addDifficulty: [
      "Alternate between fastball and change-up tee positions"
    ],
    videoUrl: "https://www.youtube.com/embed/Ql72Xq2DX9U"
  },
  "75": {
    skillSet: "Hitting",
    difficulty: "Hard",
    athletes: "1-2 athletes and 1 coach, or 2 athletes as partners",
    time: "10 minutes",
    equipment: "Screen for coach to throw behind, home plate, bucket of baseballs, markers",
    goal: "Focus on tracking the balls and colors, pitch recognition, and reacting quickly",
    description: [
      "Screen set up 30 feet from the plate, hitter sets up even with the plate",
      "The balls in the bucket should each have a green, blue, or red circle on them",
      "Coach overhand throws the ball down from behind the screen",
      "Hitter hits the green and blue balls, calling out the color, and takes the red balls",
      "If a player is struggling seeing the colors, slow down the speed of the pitches",
      "Hitter should focus on tracking the balls and seeing their colors and then reacting quickly to hit or take the pitch",
      "Partners switch after 10 swings"
    ],
    addDifficulty: [
      "To add a degree of difficulty, coaches can throw pitches inside and outside"
    ],
    videoUrl: "https://www.youtube.com/embed/QUR1x6V73yQ"
  },
  "87": {
    skillSet: "Hitting",
    difficulty: "Medium",
    athletes: "1-2 athletes and 1 coach, or 2 athletes as partners",
    time: "5 minutes",
    equipment: "Bat, tee or soft toss setup, baseballs",
    goal: "Develop proper swing plane and bat path",
    description: [
      "Hitter sets up on a slight decline or uses a decline board",
      "Focus on swinging on a slight upward plane",
      "Drive through the ball with proper mechanics",
      "Partners switch after 5 swings"
    ],
    addDifficulty: [
      "Increase the angle of decline"
    ],
    videoUrl: "https://www.youtube.com/embed/sgRnq_8G2XI"
  },
  "89": {
    skillSet: "Infield",
    difficulty: "Easy",
    athletes: "1+ athletes",
    time: "5 minutes",
    equipment: "Glove",
    goal: "Develop proper defensive ready position",
    description: [
      "Feet shoulder-width apart, knees bent",
      "Weight on the balls of the feet",
      "Glove out in front, ready position",
      "Practice getting into stance quickly from standing",
      "Hold position for 5-10 seconds at a time"
    ],
    addDifficulty: [
      "Add lateral movement drills from the stance"
    ],
    videoUrl: "https://www.youtube.com/embed/l62xR2rGWrA"
  },
  "100": {
    skillSet: "Hitting",
    difficulty: "Medium",
    athletes: "1-2 athletes and 1 coach, or 2 athletes as partners",
    time: "5 minutes",
    equipment: "Bat, two tees, baseballs, net or screen to hit into",
    goal: "Keep the bat on the plane of the baseball, and drive the baseball up the middle",
    description: [
      "Tee set up in front of the middle of the plate, roughly 6 inches out front of the plate (shown below)",
      "Another tee set up about 6 inches in front of the first tee",
      "Hitter sets up even with the plate, while other partner puts balls on the tees",
      "Hitter hits the ball, trying to hit a low line drive back up the middle, keeping the bat on the plane of the ball and the barrel behind the hands and extends their swing path to hit the second ball off the second tee with a smooth swing",
      "Partners switch after 5 swings"
    ],
    addDifficulty: [
      "To add a degree of difficulty, the hitter can move the tee to different contact points (inside, middle, outside) as shown for a right handed hitter below, but still make sure to place the tee roughly 6 inches in front of where the contact point would be for each location.",
      "Outside pitches should be hit to the opposite field, or opposite side of the screen or cage",
      "Inside pitches should be hit up the middle or slightly to the pull side of the middle"
    ],
    videoUrl: "https://www.youtube.com/embed/6NT-D_z3r94"
  },
  "101": {
    skillSet: "Hitting",
    difficulty: "Hard",
    athletes: "1-2 athletes and 1 coach, or 2 athletes as partners",
    time: "10 minutes",
    equipment: "Tees, baseballs, net or screen to hit into",
    goal: "Adjustability in the swing, maintain proper body position throughout the process",
    description: [
      "One tee set up to hit the ball to the pullside field",
      "One tee is set up on the outside corner to hit the ball to the opposite field - the outside tee must be higher than the inside tee",
      "Hitter sets up even with the plate, while partner places a ball on the tees",
      "Hitter begins loading phase, partner then calls out \"outside\" or \"inside\"",
      "Hitter then hits off the corresponding tee, missing the other tee",
      "Focus is to have adjustability in the swing, maintaining proper body position throughout the process",
      "Objective is to be able to hit either pitch called effectively in the desired location",
      "Partner resets the ball on the tee that was called out and repeats process",
      "Great for hitters that cannot maintain proper body position without committing early to a pitch location",
      "Partners switch after 10 swings"
    ],
    addDifficulty: [
      "Decrease the time between setup and call",
      "Add a middle tee option"
    ],
    videoUrl: "https://www.youtube.com/embed/Ql72Xq2DX9U"
  },
  "107": {
    skillSet: "Hitting",
    difficulty: "Medium",
    athletes: "1-2 athletes and 1 coach, or 2 athletes as partners",
    time: "5 minutes",
    equipment: "Tee, baseballs, net or screen to hit into",
    goal: "Keep the bat on the plane of the baseball, and drive the baseball up the middle",
    description: [
      "Tee set up in front of the middle of the plate, roughly 6 inches out front of the plate",
      "Hitter sets up even with the plate, while other partner puts a ball on the tee",
      "Hitter hits the ball, trying to hit a low line drive back up the middle, keeping the bat on the plane of the ball and the barrel behind the hands",
      "Partners switch after 5 swings"
    ],
    addDifficulty: [
      "Move the tee to different contact points (inside, middle, outside)"
    ],
    videoUrl: "https://www.youtube.com/embed/sgRnq_8G2XI"
  },
  "108": {
    skillSet: "Hitting",
    difficulty: "Medium",
    athletes: "1-2 athletes and 1 coach, or 2 athletes as partners",
    time: "10 minutes",
    equipment: "Screen for coach to throw behind, home plate, and a bucket of baseballs",
    goal: "Focus on rhythm of the hitter with the pitcher and driving the ball up the middle",
    description: [
      "Screen set up 30 feet from the plate",
      "Hitter sets up even with the plate",
      "Coach underhand throws the ball down the middle of the plate on a line at a slow to medium speed from behind the screen",
      "Hitter tries to hit the ball back up the middle, working on timing with the coach's pitches",
      "Focus should be on good quality swings, with hitters finishing their swing and staying balanced",
      "Partners switch after 10 swings"
    ],
    addDifficulty: [
      "Increase the speed of the tosses",
      "Add location variation (inside, outside)"
    ],
    videoUrl: "https://www.youtube.com/embed/l62xR2rGWrA"
  },
  "110": {
    skillSet: "Hitting",
    difficulty: "Medium",
    athletes: "1-2 athletes and 1 coach",
    time: "10 minutes",
    equipment: "Bat, tee or soft toss setup, baseballs",
    goal: "Correct the flaw of casting hands outside the ball",
    description: [
      "Identify the casting flaw in the hitter's swing",
      "Focus on keeping hands inside the ball",
      "Use inside toss drills to reinforce proper hand path",
      "Video analysis can help identify the issue"
    ],
    addDifficulty: [],
    videoUrl: "https://www.youtube.com/embed/xMVojRcf5p0"
  },
  "111": {
    skillSet: "Hitting",
    difficulty: "Medium",
    athletes: "1-2 athletes and 1 coach",
    time: "10 minutes",
    equipment: "Bat, tee or soft toss setup, baseballs",
    goal: "Correct the flaw of chopping at the ball",
    description: [
      "Identify the chopping flaw in the hitter's swing",
      "Focus on staying through the ball with a level swing",
      "Use extension drills to promote proper follow-through",
      "Practice hitting line drives back up the middle"
    ],
    addDifficulty: [],
    videoUrl: "https://www.youtube.com/embed/gGriRVDyGI4"
  },
  "112": {
    skillSet: "Hitting",
    difficulty: "Medium",
    athletes: "1-2 athletes and 1 coach",
    time: "10 minutes",
    equipment: "Bat, tee or soft toss setup, baseballs",
    goal: "Correct the flaw of collapsing the backside",
    description: [
      "Identify when the hitter's back leg collapses during the swing",
      "Focus on maintaining a strong back side throughout the swing",
      "Use balance drills to strengthen the lower half",
      "Practice keeping weight back until contact"
    ],
    addDifficulty: [],
    videoUrl: "https://www.youtube.com/embed/r365LTS6JUI"
  },
  "113": {
    skillSet: "Hitting",
    difficulty: "Medium",
    athletes: "1-2 athletes and 1 coach",
    time: "10 minutes",
    equipment: "Bat, tee or soft toss setup, baseballs",
    goal: "Correct the flaw of contact point being too far out front",
    description: [
      "Identify when the hitter is making contact too far out front",
      "Focus on letting the ball travel deeper into the zone",
      "Use opposite field hitting drills",
      "Practice patience at the plate"
    ],
    addDifficulty: [],
    videoUrl: "https://www.youtube.com/embed/xE6d7WyVnJc"
  },
  "114": {
    skillSet: "Hitting",
    difficulty: "Medium",
    athletes: "1-2 athletes and 1 coach",
    time: "10 minutes",
    equipment: "Bat, tee or soft toss setup, baseballs",
    goal: "Correct the flaw of hands dropping too low",
    description: [
      "Identify when the hitter's hands drop before the swing",
      "Focus on keeping hands at shoulder height through load",
      "Use high tee drills to reinforce proper hand position",
      "Practice short, compact swings"
    ],
    addDifficulty: [],
    videoUrl: "https://www.youtube.com/embed/2-GSXHCtXBU"
  },
  "115": {
    skillSet: "Hitting",
    difficulty: "Easy",
    athletes: "1-2 athletes and 1 coach",
    time: "5 minutes",
    equipment: "Bat",
    goal: "Correct improper batting stance",
    description: [
      "Evaluate the hitter's current stance",
      "Check feet positioning - shoulder width apart",
      "Ensure proper weight distribution",
      "Check hand position and grip",
      "Make adjustments as needed for comfort and power"
    ],
    addDifficulty: [],
    videoUrl: "https://www.youtube.com/embed/lKRM1GTczuI"
  },
  "129": {
    skillSet: "Hitting",
    difficulty: "Medium",
    athletes: "1-2 athletes and 1 coach, or 2 athletes as partners",
    time: "10 minutes",
    equipment: "Bat, screen for coach to throw behind, home plate, and a bucket of baseballs",
    goal: "Get the barrel to an extreme inside pitch while working through the ball",
    description: [
      "Screen set up 20 feet from the plate",
      "Hitter sets up even with the plate",
      "Coach sets up screen to the left side of the cage",
      "Coach underhand tosses from the left side of the screen directly at the hitter's front hip",
      "Hitter works on keeping their hands inside the baseball while rotating their hips through the swing, effectively pulling the ball",
      "Objective is to be able to get the barrel to an extreme inside pitch while working through the ball",
      "Ideal for hitters that do not use their lower half or they cast their hands when swinging",
      "Partners switch after 10 swings"
    ],
    addDifficulty: [],
    videoUrl: "https://www.youtube.com/embed/P0f_jlz6LKA"
  },
  "148": {
    skillSet: "Throwing",
    difficulty: "Easy",
    athletes: "1-2 athletes and 1 coach, or 2 athletes as partners (all players)",
    time: "12-15 minutes",
    equipment: "Gloves and balls",
    goal: "Prepare arm for pitching by going through a proper warm up routine",
    description: [
      "Players in partners spread out along the right or left field foul line",
      "The player on the foul line will stay in that spot as their partner moves back to each distance",
      "One Knee (5-10 ft.): Players down on their throwing side knee, glove side knee is up, shoulders square to their partner and throw back and forth, following through on each throw. Players each make 10 throws, then move back to next progression",
      "Close Squared Throwing (10-15 ft.): Players stand with shoulders square to their partner, feet shoulder width apart, starting with their hands together and throw back and forth, letting the elbows close on release. Players each make 10 throws, then move back to next progression",
      "Squared Throwing (15-20 ft.): Players stand with shoulders square to their partner, feet shoulder width apart, starting with their hands rotating together and throw back and forth, letting the elbows close on release. Players each make 10 throws, then move back to next progression",
      "Standing Throwing Position (30-40 ft.): Players stand in normal starting position of throwing, take a deep breath, and throw to their partner, rotating and following through. Players take their time throwing back and forth. Players each make 10 throws",
      "Players 45 feet apart: Players throw the ball back and forth using good throwing mechanics. Players each make 10 throws, then move back to next progression",
      "Players 60 feet apart: Players throw the ball back and forth using good throwing mechanics. Players each make 9 throws, then move back to next progression",
      "Players 90 feet apart: Players throw the ball back and forth using good throwing mechanics. Players each make 8 throws, then move back to next progression",
      "Players 120 feet apart: Players throw the ball back and forth using good throwing mechanics. A crow hop should be used to reduce strain on the arm. Players each make 5 throws, then move back to next progression",
      "Players 130-140 feet apart: Players throw the ball back and forth using good throwing mechanics. A crow hop should be used to reduce strain on the arm. Players each make 5 throws, then move back to next progression",
      "Cool Down: Players should slow start working their way back to the 45 foot distance, making throws on their way back in"
    ],
    addDifficulty: [
      "Keep good throwing form with elbow closed on release without flying open",
      "Keep throws on as much of a line as possible, do not put high arc on throws to increase distance. It is okay if the ball bounces before getting to the partner",
      "Cool down by slowly moving back in after making 5 throws at the furthest distance so that the long toss progression ends back at 45 feet"
    ],
    videoUrl: "https://www.youtube.com/embed/X7Vxv4bxKBs"
  },
};

export default function DrillDetail() {
  const { user, loading } = useAuth();
  const [match, params] = useRoute("/drill/:id");
  const id = params?.id;
  const drill = drillsData.find(d => d.id.toString() === id);
  const details = id && drillDetails[id as keyof typeof drillDetails];

  // Check if user has access (or if preview mode is enabled)
  const hasAccess = PREVIEW_MODE || (user && (user.role === 'admin' || user.isActiveClient === 1));

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

                {details.addDifficulty.length > 0 && (
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
                )}
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
