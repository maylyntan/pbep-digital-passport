import { notFound } from "next/navigation";
import BoothChallenge from "@/components/BoothChallenge";
import { getBooth } from "@/lib/booths";

export default async function BoothPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const booth = getBooth(slug);
  if (!booth) notFound();
  return <BoothChallenge booth={booth} />;
}
