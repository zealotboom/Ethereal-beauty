import { useEffect, useState } from "react";

const QUOTE_STORAGE_KEY = "ethereal-enlightenment-quote";
const QUOTE_REFRESH_MS = 24 * 60 * 60 * 1000;

const quotes = [
  "Softness is not weakness. It is a patient kind of power.",
  "You do not need louder light. You need truer light.",
  "Every quiet choice shapes the room long after the noise is gone.",
  "Grace arrives when you stop wrestling the moment into another shape.",
  "Some doors only open when you meet them without hurry.",
  "What feels fragile today may be the most honest thing you have touched.",
];

const readStoredQuote = () => {
  const storedValue = localStorage.getItem(QUOTE_STORAGE_KEY);

  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue);
  } catch (_error) {
    return null;
  }
};

const getDailyQuote = () => {
  const storedQuote = readStoredQuote();
  const now = Date.now();

  if (storedQuote && now - storedQuote.timestamp < QUOTE_REFRESH_MS) {
    return storedQuote.quote;
  }

  const previousQuote = storedQuote?.quote;
  const availableQuotes = quotes.filter((quote) => quote !== previousQuote);
  const nextQuote = availableQuotes[Math.floor(Math.random() * availableQuotes.length)] || quotes[0];

  localStorage.setItem(
    QUOTE_STORAGE_KEY,
    JSON.stringify({
      quote: nextQuote,
      timestamp: now,
    })
  );

  return nextQuote;
};

function EnlightenmentWidget({ onOpen = () => {} }) {
  return (
    <div className="floating-widget floating-widget-enlightenment">
      <button type="button" className="utility-launcher ghost-launcher" aria-label="Open quote" onClick={onOpen}>
        <span className="utility-icon" aria-hidden="true">
          Quote
        </span>
        <span className="utility-label">Quote</span>
      </button>
    </div>
  );
}

export function QuoteContent({ isActive = false }) {
  const [quote, setQuote] = useState("");

  useEffect(() => {
    setQuote(getDailyQuote());
  }, []);

  useEffect(() => {
    if (isActive) {
      setQuote(getDailyQuote());
    }
  }, [isActive]);

  return (
    <>
      <p className="chat-status">A quiet thought for the day</p>
      <blockquote className="simple-quote">{quote}</blockquote>
    </>
  );
}

export default EnlightenmentWidget;
