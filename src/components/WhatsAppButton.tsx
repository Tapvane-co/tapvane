import { icons } from "@/components/icons";
import { WHATSAPP_MESSAGE } from "@/lib/content";
import { getSettings, whatsappLink } from "@/lib/site";

// The floating "Chat with us" button on every page. The number comes from admin Settings.
export default async function WhatsAppButton() {
  const { whatsappNumber } = await getSettings();
  return (
    <a
      href={whatsappLink(whatsappNumber, WHATSAPP_MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      title="Chat with us"
      className="fixed bottom-5 right-5 z-50 flex h-14 items-center gap-2 rounded-full bg-gold px-4 text-onyx shadow-lg shadow-black/50 hover:brightness-110"
    >
      <span className="scale-110">{icons.whatsapp}</span>
      <span className="hidden text-sm font-semibold sm:inline">Chat with us</span>
    </a>
  );
}
