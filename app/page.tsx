import { Simulateur } from "@/components/simulateur/simulateur";
import { ServiceWorker } from "@/components/simulateur/service-worker";

export default function Page() {
  return (
    <>
      <Simulateur />
      <ServiceWorker />
    </>
  );
}
