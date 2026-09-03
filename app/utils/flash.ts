export type FlashMessage = {
  tone: "success" | "error";
  text: string;
};

export function successFlash(text: string): FlashMessage {
  return { tone: "success", text };
}

export function errorFlash(text: string): FlashMessage {
  return { tone: "error", text };
}
