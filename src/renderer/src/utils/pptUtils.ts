import { tauriApi } from "../tauri-api"

export async function convertPptToPdf(pptPath: string): Promise<string> {
  return await tauriApi.convertPptToPdf(pptPath);
}
