import { ContactPanel } from "@/components/contact/ContactPanel";
import { Credentials } from "@/components/credentials/Credentials";
import { CommandDeck } from "@/components/hero/CommandDeck";
import { HudNav } from "@/components/hud/HudNav";
import { ScrollProgress } from "@/components/hud/ScrollProgress";
import { LeoSpotlight } from "@/components/mission/LeoSpotlight";
import { PrintResume } from "@/components/PrintResume";
import { Capabilities } from "@/components/skills/Capabilities";
import { FlightLog } from "@/components/timeline/FlightLog";

function App() {
  return (
    <>
      <div className="print:hidden">
        <ScrollProgress />
        <div aria-hidden className="grain-overlay" />

        <main>
          <CommandDeck />
          <FlightLog />
          <LeoSpotlight />
          <Capabilities />
          <Credentials />
          <ContactPanel />
        </main>

        <HudNav />
      </div>
      <PrintResume />
    </>
  );
}

export default App;
