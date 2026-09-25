// Bilingual donation-flow microcopy — sourced verbatim from
// blueprint/UI_CONTENT_GLOSSARY.md §4.3/4.4, not invented ad hoc.
export const donationCopy = {
  formTitle: { en: "🙏 Donate to the Temple", ta: "🙏 கோவிலுக்கு நன்கொடை அளிக்க" },
  purposeLabel: { en: "Donation Purpose", ta: "நன்கொடையின் நோக்கம்" },
  amountLabel: { en: "Amount (₹)", ta: "தொகை (₹)" },
  donorNameLabel: { en: "Full Name", ta: "முழு பெயர்" },
  mobileLabel: { en: "Mobile Number", ta: "கைபேசி எண்" },
  emailLabel: { en: "Email (optional)", ta: "மின்னஞ்சல் (விருப்பம்)" },
  addressLabel: { en: "Address (optional)", ta: "முகவரி (விருப்பம்)" },
  panLabel: { en: "PAN (optional)", ta: "பான் எண் (விருப்பம்)" },
  anonymousLabel: {
    en: "Donate anonymously (your name will not be shown publicly)",
    ta: "அடையாளம் தெரிவிக்காமல் நன்கொடை அளி (உங்கள் பெயர் பொதுவில் காட்டப்படாது)",
  },
  submitButton: { en: "Proceed to Pay", ta: "பணம் செலுத்த தொடரவும்" },
  submittingButton: { en: "Processing...", ta: "செயலாக்கப்படுகிறது..." },
  errorInvalidMobile: { en: "Enter a valid 10-digit mobile number.", ta: "சரியான 10 இலக்க கைபேசி எண்ணை உள்ளிடவும்." },
  errorInvalidAmount: { en: "Enter an amount of at least ₹10.", ta: "குறைந்தது ₹10 தொகையை உள்ளிடவும்." },
  errorInvalidPan: { en: "PAN should be in the format AAAAA9999A.", ta: "பான் எண் AAAAA9999A வடிவத்தில் இருக்க வேண்டும்." },
  genericError: { en: "Something went wrong. Please try again.", ta: "ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்." },
  lookupLink: { en: "Already donated? Look up your receipt", ta: "ஏற்கனவே நன்கொடை அளித்தீர்களா? உங்கள் ரசீதைக் கண்டறியவும்" },

  // Added for the floating-donate quick-amount modal (this feature) — not
  // glossary-sourced like the block above, kept short and purely functional
  // (instructional/navigational) rather than inventing promotional copy.
  floatingDonateLabel: { en: "Donate", ta: "நன்கொடை" },
  modalAmountPrompt: { en: "Choose an amount or enter your own", ta: "ஒரு தொகையைத் தேர்ந்தெடுக்கவும் அல்லது நீங்களே உள்ளிடவும்" },
  modalCustomAmountPlaceholder: { en: "Enter amount (₹)", ta: "தொகையை உள்ளிடவும் (₹)" },
  modalContinueButton: { en: "Continue to Donate", ta: "நன்கொடைத் தொடரவும்" },
  modalClose: { en: "Close", ta: "மூடு" },

  verifying: { en: "Verifying your payment...", ta: "உங்கள் பணம் செலுத்துதல் சரிபார்க்கப்படுகிறது..." },
  processingNote: {
    en: "Please wait — we're confirming your payment with the bank/gateway. This page will update automatically. Do not refresh or close this window.",
    ta: "தயவுசெய்து காத்திருக்கவும் — வங்கி/நுழைவாயிலுடன் உங்கள் பணம் செலுத்துதலை உறுதிப்படுத்துகிறோம். இந்த பக்கம் தானாகவே புதுப்பிக்கப்படும். இந்த சாளரத்தை மூடாதீர்கள்.",
  },
  thankYou: { en: "Thank you for your generous donation!", ta: "உங்கள் தாராள நன்கொடைக்கு நன்றி!" },
  amountLabelShort: { en: "Amount", ta: "தொகை" },
  receiptNoLabel: { en: "Receipt No.", ta: "ரசீது எண்" },
  downloadReceipt: { en: "Download Receipt PDF", ta: "ரசீதைப் பதிவிறக்கு (PDF)" },
  paymentFailed: { en: "Payment Failed", ta: "பணம் செலுத்துதல் தோல்வியடைந்தது" },
  paymentFailedNote: {
    en: "Your donation was not completed. No amount was charged.",
    ta: "உங்கள் நன்கொடை முடிக்கப்படவில்லை. எந்தத் தொகையும் வசூலிக்கப்படவில்லை.",
  },
  tryAgain: { en: "Try Payment Again", ta: "மீண்டும் பணம் செலுத்த முயற்சிக்கவும்" },

  lookupTitle: { en: "Find Your Receipt", ta: "உங்கள் ரசீதைக் கண்டறியவும்" },
  lookupMobileLabel: { en: "Mobile Number", ta: "கைபேசி எண்" },
  lookupReceiptNoLabel: { en: "Receipt Number", ta: "ரசீது எண்" },
  lookupButton: { en: "Find Receipt", ta: "ரசீதைத் தேடு" },
  lookupSearching: { en: "Searching...", ta: "தேடுகிறது..." },
  lookupNotFound: {
    en: "No receipt found for these details. Please check and try again.",
    ta: "இந்த விவரங்களுக்கு ரசீது எதுவும் இல்லை. சரிபார்த்து மீண்டும் முயற்சிக்கவும்.",
  },
} as const;

export function t(key: keyof typeof donationCopy, locale: "en" | "ta"): string {
  return donationCopy[key][locale];
}
