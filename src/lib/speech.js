// Izgovor preko preglednikovog glasa. Ako ga nema, vraća false da ekran može da objasni.
export function speak(text, { lang = "ar-SA", rate = 0.7 } = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  try {
    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch (error) {
    return false;
  }
}