export const getToken = (session?: any) => {
  if (session?.backendToken) return session.backendToken;

  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }

  return null;
};