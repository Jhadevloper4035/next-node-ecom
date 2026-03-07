// Set token in cookie
export const setToken = (token) => {
  if (typeof window !== "undefined") {
    // Set cookie with 7 day expiration
    const expirationDate = new Date();
    expirationDate.setTime(expirationDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expires = "expires=" + expirationDate.toUTCString();
    document.cookie = `authToken=${token}; ${expires}; path=/; SameSite=Lax`;
  }
};
// Clear auth cookies
export const clearAuth = () => {
  if (typeof window !== "undefined") {
    // Delete by setting expiration to past date
    document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  }
};

// Get token from cookie
export const getToken = () => {
  if (typeof window !== "undefined") {
    const nameEQ = "authToken=";
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return cookie.substring(nameEQ.length);
      }
    }
  }
  return null;
};
