import { formatNaira, type Settings } from "@/lib/site";

// Website text from CONTENT.md. Prices, fees and contact details are filled in from the database.

export const WHATSAPP_MESSAGE = "Hi Tapvane, I'd like to know more about your NFC cards.";

export const faqs: { q: string; a: string }[] = [
  {
    q: "What is a Tapvane card?",
    a: "A business card with a small NFC chip inside. When someone taps it with their phone, your digital profile opens, with your contacts, WhatsApp, socials and more.",
  },
  {
    q: "Does the other person need an app?",
    a: "No. Tapvane works with the phone's built-in NFC. The profile opens in their web browser.",
  },
  {
    q: "Which phones does it work with?",
    a: "Most modern smartphones. iPhone XS and newer read Tapvane cards automatically. Most Android phones with NFC work too; just make sure NFC is switched on in Settings. If someone's phone doesn't support NFC, you can share your profile link with them on WhatsApp instead.",
  },
  {
    q: "Where do I tap?",
    a: "On iPhones, hold the card near the top of the phone. On most Android phones, hold it against the middle of the back, near the camera.",
  },
  {
    q: "Does the card need charging or a battery?",
    a: "No. The chip is powered by the phone when it taps. Your card never needs charging.",
  },
  {
    q: "What if I change my number, job or social handles?",
    a: "Just log in and update your profile. Your card stays the same and instantly shows your new details. No reprinting.",
  },
  {
    q: "What happens if I lose my card?",
    a: "Message us on WhatsApp. We'll switch off the lost card so nobody else can use it, and link a new card to your profile. There's no replacement fee.",
  },
  {
    q: "Can I design my own card?",
    a: "Yes. Choose from Tapvane templates, pick your colour and finish, and add your name, job title and company. You'll see a live preview before you order.",
  },
  {
    q: "What's the difference between Basic and Pro?",
    a: "Basic gets a PVC card and a standard profile. Pro gets a premium matte-finish card and a custom profile with your own accent colour and cover image.",
  },
  {
    q: "I run a business. Which package should I choose?",
    a: "Business packages give each staff member their own card and profile, all managed from one dashboard. Add NFC tags for your counter or tables so customers can reach you instantly.",
  },
  {
    q: "What can I use an NFC tag for?",
    a: "Stick it on your shop counter, reception desk, restaurant table, car or phone case. When customers tap it, your profile opens, so they can chat on WhatsApp, follow you, or save your number.",
  },
  {
    q: "How do I pay?",
    a: "Pay online with Paystack (card, bank transfer or USSD), or pay by direct bank transfer and send your proof of payment. We'll confirm your order once payment is received.",
  },
  {
    q: "How long does delivery take?",
    a: "Your card is ready within 5–7 business days after your payment is confirmed. Pickup in Makurdi is free, delivery within Makurdi costs {feeMakurdi}, and delivery to other states costs {feeNationwide}.",
  },
  {
    q: "Is my information safe?",
    a: "You decide exactly what appears on your profile. Only the details you add are shown. We never sell your data. See our Privacy Policy for details.",
  },
  {
    q: "I still have a question.",
    a: "Chat with us on WhatsApp. We usually reply within 24 hours.",
  },
];

export function faqAnswer(a: string, s: Settings) {
  return a
    .replace("{feeMakurdi}", formatNaira(s.deliveryFeeMakurdi))
    .replace("{feeNationwide}", formatNaira(s.deliveryFeeNationwide));
}

export const trustStrip = [
  "Works with most modern phones",
  "Update your details anytime",
  "Delivered nationwide from Makurdi",
];

export const homeSteps = [
  { title: "Choose & customise.", body: "Pick a package and design your card: choose a template, your colours, and add your name." },
  { title: "Set up your profile.", body: "Add your phone, WhatsApp, email, socials and photo. This is what people see when they tap." },
  { title: "Tap to share.", body: "Hold your card near any phone. Your profile opens instantly, and they can save your contact in one tap." },
];

export const whyTapvane = [
  { title: "Never run out of cards.", body: "One Tapvane card replaces hundreds of paper cards." },
  { title: "Always up to date.", body: "Changed your number or job? Update your profile and your card shows the new details. No reprinting." },
  { title: "More than a phone number.", body: "Share WhatsApp, Instagram, LinkedIn, your website and your location, all at once." },
  { title: "One tap to reach you.", body: "People tap Call or WhatsApp on your profile and they are straight through to you. Nobody types your number wrong." },
  { title: "Made to impress.", body: "A premium card that starts conversations and makes you memorable." },
];

export const howItWorksSteps = [
  { title: "Step 1: Order and design your card.", body: "Choose a package, pick a template and colour, and add your name and job title. You'll see a live preview before you pay." },
  { title: "Step 2: Create your profile.", body: "Sign up and fill in your details: photo, phone, WhatsApp, email, socials, location and a short bio. You can change these anytime from your dashboard." },
  { title: "Step 3: Receive your card.", body: "We print your card, link it to your profile, and deliver it to you, or you can pick it up in Makurdi." },
  { title: "Step 4: Tap and share.", body: "Hold the top of your card against the back of the other person's phone (near the camera on most phones). Your profile pops up, and they can save your contact with one tap." },
];
