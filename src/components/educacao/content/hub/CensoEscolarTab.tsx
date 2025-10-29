import { INEPConsulta } from "../INEPConsulta";

interface CensoEscolarTabProps {
  secretariaSlug: string;
}

export default function CensoEscolarTab({ secretariaSlug }: CensoEscolarTabProps) {
  return <INEPConsulta secretariaSlug={secretariaSlug} />;
}