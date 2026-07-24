export const throwAuthError = (error) => {
  const data = error.response?.data;
  if (data) throw { ...data, status: error.response.status };
  throw { message: error.message, status: error.response?.status };
};
