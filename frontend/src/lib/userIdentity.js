const USER_EMAIL_KEY = "ethereal-user-email";
const USER_ID_KEY = "ethereal-user-id";

const normalizeEmail = (email) => email.trim().toLowerCase();

const hashEmail = (email) => {
  return normalizeEmail(email)
    .split("")
    .reduce((accumulator, character) => accumulator * 31 + character.charCodeAt(0), 7)
    .toString(36)
    .replace("-", "")
    .slice(0, 6);
};

const createUserIdFromEmail = (email) => {
  const normalizedEmail = normalizeEmail(email);
  const localName = normalizedEmail.split("@")[0]?.replace(/[^a-z0-9]/g, "").slice(0, 12) || "guest";
  const suffix = hashEmail(normalizedEmail);
  return `user_${localName}_${suffix}`;
};

export const getStoredIdentity = () => {
  const email = localStorage.getItem(USER_EMAIL_KEY) || "";
  const userId = localStorage.getItem(USER_ID_KEY) || "";

  return {
    email,
    userId,
  };
};

export const saveEmailIdentity = (email) => {
  const normalizedEmail = normalizeEmail(email);
  const userId = createUserIdFromEmail(normalizedEmail);

  localStorage.setItem(USER_EMAIL_KEY, normalizedEmail);
  localStorage.setItem(USER_ID_KEY, userId);

  return {
    email: normalizedEmail,
    userId,
  };
};

export const getStoredUserId = () => getStoredIdentity().userId;

export const getOrCreateUserId = () => getStoredIdentity().userId;
