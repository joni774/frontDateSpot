/** Entry route — AuthGuard redirects; show boot UI instead of a blank white frame. */
import { BootScreen } from "../src/components/BootScreen";

export default function Index() {
  return <BootScreen />;
}
