export const clearAuth = () => {
  if (typeof window !== "undefined") {
    const isSecure = window.location.protocol === "https:";
    document.cookie = `authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/${isSecure ? "; Secure" : ""}`;
  }
};
