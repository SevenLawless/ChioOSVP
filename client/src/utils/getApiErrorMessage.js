export function getApiErrorMessage(error, fallbackMessage) {
  const data = error.response?.data;

  if (data?.errors?.length > 0) {
    return data.errors.map((item) => item.message).join(" • ");
  }

  if (data?.message) {
    return data.message;
  }

  return fallbackMessage;
}