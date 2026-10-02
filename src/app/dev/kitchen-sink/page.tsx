import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Credit,
  GridPaper,
  InkSplat,
  Raking,
  SolvedStamp,
  Walker,
  Wordmark,
} from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { env } from "@/env";
import { FormDemo } from "./form-demo";
import { OverlayDemos } from "./overlay-demos";
import { ThemeToggle } from "./theme-toggle";

export const metadata: Metadata = {
  title: "Kitchen sink",
};

const TOKENS = [
  "paper",
  "paper-shade",
  "paper-deep",
  "ink",
  "ink-soft",
  "ludwig-red",
  "blood",
  "crayon",
  "shadow",
  "shadow-soft",
  "grid-blue",
  "book-blue",
];

const SEMANTICS = [
  "background",
  "foreground",
  "card",
  "primary",
  "secondary",
  "muted",
  "accent",
  "destructive",
  "border",
  "ring",
];

const FONTS = [
  {
    variable: "--font-signature",
    className: "font-signature text-5xl",
    sample: "Ludwig.",
  },
  {
    variable: "--font-display",
    className: "font-display text-3xl font-bold uppercase tracking-[0.04em]",
    sample: "The Gear Puzzle",
  },
  {
    variable: "--font-sans",
    className: "font-sans text-xl",
    sample: "Reverse chess starts from the end of the game.",
  },
  {
    variable: "--font-band",
    className:
      "font-band text-xl font-semibold uppercase tracking-[0.08em]",
    sample: "Pocket Puzzle Collection",
  },
  {
    variable: "--font-hand",
    className: "font-hand text-4xl text-crayon",
    sample: "KNIGHT TO F3",
  },
  {
    variable: "--font-mono",
    className: "font-mono text-lg break-all",
    sample: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR 00:42",
  },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-2xl font-bold uppercase tracking-[0.04em]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Swatches({ names, prefix }: { names: string[]; prefix: string }) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {names.map((name) => (
        <li key={name} className="border-2 border-border bg-background">
          <div
            className="h-16 border-b-2 border-border"
            style={{ backgroundColor: `var(${prefix}${name})` }}
          />
          <p className="p-2 font-mono text-sm text-foreground">{name}</p>
        </li>
      ))}
    </ul>
  );
}

export default function KitchenSinkPage() {
  if (env.VERCEL_ENV === "production") notFound();

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 px-4 pb-12">
      <div className="sticky top-0 z-40 -mx-4 flex flex-wrap items-center justify-between gap-2 border-b-2 border-border bg-background px-4 py-3">
        <p className="font-display text-sm font-bold uppercase tracking-[0.04em]">
          Kitchen sink
        </p>
        <ThemeToggle />
      </div>

      <Credit level={1} top="Design system" bottom="Kitchen sink" />

      <Section title="Colour tokens">
        <Swatches names={TOKENS} prefix="--color-" />
      </Section>

      <Section title="Semantic variables">
        <Swatches names={SEMANTICS} prefix="--" />
      </Section>

      <Section title="Typefaces">
        <ul className="flex flex-col gap-6">
          {FONTS.map(({ variable, className, sample }) => (
            <li
              key={variable}
              className="flex flex-col gap-1 border-b-2 border-border pb-4"
            >
              <p className="font-mono text-sm text-muted-foreground">
                {variable}
              </p>
              <p className={className}>{sample}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Textures">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex h-40 items-end border-2 border-border bg-background p-3">
            <p className="font-mono text-sm">grain (body overlay)</p>
          </div>
          <div className="grid-paper flex h-40 items-end border-2 border-border p-3">
            <p className="font-mono text-sm">.grid-paper</p>
          </div>
          <div className="raking flex h-40 items-end border-2 border-border p-3">
            <p className="font-mono text-sm">.raking</p>
          </div>
        </div>
      </Section>

      <Section title="Brand">
        <div className="flex flex-col gap-6">
          <Credit top="The" bottom="Gear puzzle" />
          <div className="flex flex-wrap items-start gap-6">
            <Wordmark className="w-64" />
            <Wordmark variant="ink-splat" className="w-64" />
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <InkSplat className="size-32 text-blood" />
            <SolvedStamp />
            <Walker />
          </div>
          <GridPaper className="border-2 border-border p-6">
            <p className="font-mono text-sm">GridPaper</p>
          </GridPaper>
          <Raking className="border-2 border-border p-6">
            <p className="font-mono text-sm">Raking</p>
          </Raking>
        </div>
      </Section>

      <Section title="Button">
        <div className="flex flex-col gap-4">
          {(["default", "secondary", "ghost", "destructive"] as const).map(
            (variant) => (
              <div key={variant} className="flex flex-wrap items-center gap-4">
                <Button variant={variant} size="sm">
                  {variant}
                </Button>
                <Button variant={variant}>{variant}</Button>
                <Button variant={variant} size="lg">
                  {variant}
                </Button>
                <Button variant={variant} size="icon" aria-label={variant}>
                  +
                </Button>
                <Button variant={variant} disabled>
                  disabled
                </Button>
              </div>
            ),
          )}
        </div>
      </Section>

      <Section title="Badge">
        <div className="flex flex-wrap items-center gap-4">
          <Badge>default</Badge>
          <Badge variant="secondary">secondary</Badge>
          <Badge variant="destructive">destructive</Badge>
          <Badge variant="outline">outline</Badge>
          <Badge variant="difficulty" level={1} />
          <Badge variant="difficulty" level={3} />
          <Badge variant="difficulty" level={5} />
        </div>
      </Section>

      <Section title="Card">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Default card</CardTitle>
              <CardDescription>Description text.</CardDescription>
              <CardAction>
                <Badge>New</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>Card content.</CardContent>
            <CardFooter>
              <Button size="sm">Action</Button>
            </CardFooter>
          </Card>
          <Card variant="book">
            <CardHeader>
              <CardTitle>Book card</CardTitle>
              <CardDescription>Pocket Puzzle Collection.</CardDescription>
            </CardHeader>
            <CardContent>Card content.</CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Input, label and form">
        <div className="flex max-w-sm flex-col gap-2">
          <Label htmlFor="ks-input">Label</Label>
          <Input id="ks-input" placeholder="Placeholder" />
          <Label htmlFor="ks-invalid">Invalid</Label>
          <Input id="ks-invalid" aria-invalid defaultValue="Invalid value" />
          <Label htmlFor="ks-disabled">Disabled</Label>
          <Input id="ks-disabled" disabled defaultValue="Disabled value" />
        </div>
        <FormDemo />
      </Section>

      <Section title="Separator and skeleton">
        <Separator />
        <div className="flex h-8 items-center gap-4">
          <span>Left</span>
          <Separator orientation="vertical" />
          <span>Right</span>
        </div>
        <Skeleton className="h-8 w-full max-w-sm" />
      </Section>

      <Section title="Tabs">
        <Tabs defaultValue="one">
          <TabsList>
            <TabsTrigger value="one">One</TabsTrigger>
            <TabsTrigger value="two">Two</TabsTrigger>
            <TabsTrigger value="three" disabled>
              Three
            </TabsTrigger>
          </TabsList>
          <TabsContent value="one">First panel.</TabsContent>
          <TabsContent value="two">Second panel.</TabsContent>
        </Tabs>
      </Section>

      <Section title="Toggle and toggle group">
        <div className="flex flex-wrap items-center gap-4">
          <Toggle size="sm">Small</Toggle>
          <Toggle defaultPressed>Pressed</Toggle>
          <Toggle size="lg">Large</Toggle>
          <Toggle disabled>Disabled</Toggle>
        </div>
        <ToggleGroup type="single" defaultValue="b" aria-label="Single">
          <ToggleGroupItem value="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b">B</ToggleGroupItem>
          <ToggleGroupItem value="c">C</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup type="multiple" defaultValue={["a", "c"]} aria-label="Multiple">
          <ToggleGroupItem value="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b">B</ToggleGroupItem>
          <ToggleGroupItem value="c">C</ToggleGroupItem>
        </ToggleGroup>
      </Section>

      <Section title="Slider and progress">
        <Slider defaultValue={[40]} aria-label="Single" />
        <Slider defaultValue={[20, 70]} aria-label="Range" />
        <Slider defaultValue={[50]} disabled aria-label="Disabled" />
        <Progress value={0} />
        <Progress value={60} />
        <Progress value={100} />
      </Section>

      <Section title="Overlays">
        <OverlayDemos />
      </Section>
    </main>
  );
}
