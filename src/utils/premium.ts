export const isPremiumUser = () => {
  return sessionStorage.getItem("isPremium") === "true";
};