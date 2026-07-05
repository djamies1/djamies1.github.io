import { CommandDeck } from "@/components/hero/CommandDeck";
import { HudNav } from "@/components/hud/HudNav";
import { ScrollProgress } from "@/components/hud/ScrollProgress";
import { SectionHeading } from "@/components/hud/SectionHeading";

function App() {
  return (
    <>
      <ScrollProgress />
      <div aria-hidden className="grain-overlay" />

      <main>
        <CommandDeck />

        {/* 02 · Flight log (career timeline) — built in Phase 5 */}
        <section className="mx-auto max-w-6xl px-6 py-24" id="flight-log">
          <SectionHeading
            eyebrow="02 · Flight log"
            lede="Thirteen years from audit rooms to satellite finance — every role plotted."
            title="Career telemetry"
          />
          <div className="glass flex h-64 items-center justify-center rounded-2xl text-muted-foreground text-sm">
            Timeline dashboard — Phase 5
          </div>
        </section>

        {/* 03 · Current mission (Amazon Leo) — built in Phase 6 */}
        <section className="mx-auto max-w-6xl px-6 py-24" id="mission">
          <SectionHeading
            eyebrow="03 · Current mission"
            lede="Sole technical owner of the financial-operations platform for Amazon's satellite constellation."
            title="Amazon Leo"
          />
          <div className="glass flex h-64 items-center justify-center rounded-2xl text-muted-foreground text-sm">
            Live constellation globe — Phase 6
          </div>
        </section>

        {/* 04 · Capabilities (skills radar) — built in Phase 7 */}
        <section className="mx-auto max-w-6xl px-6 py-24" id="capabilities">
          <SectionHeading
            eyebrow="04 · Capabilities"
            lede="Six disciplines, one operator — from warehouse schemas to RAG pipelines."
            title="Systems check"
          />
          <div className="glass flex h-64 items-center justify-center rounded-2xl text-muted-foreground text-sm">
            Skills radar — Phase 7
          </div>
        </section>

        {/* 05 · Credentials — built in Phase 7 */}
        <section className="mx-auto max-w-6xl px-6 py-24" id="credentials">
          <SectionHeading
            eyebrow="05 · Credentials"
            title="Certified & schooled"
          />
          <div className="glass flex h-48 items-center justify-center rounded-2xl text-muted-foreground text-sm">
            Certifications & education — Phase 7
          </div>
        </section>

        {/* 06 · Contact — built in Phase 7 */}
        <section className="mx-auto max-w-6xl px-6 py-24 pb-40" id="contact">
          <SectionHeading eyebrow="06 · Contact" title="Open channel" />
          <div className="glass flex h-32 items-center justify-center rounded-2xl text-muted-foreground text-sm">
            Contact — Phase 7
          </div>
        </section>
      </main>

      <HudNav />
    </>
  );
}

export default App;
