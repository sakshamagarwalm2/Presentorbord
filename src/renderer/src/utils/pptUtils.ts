
export async function convertPptToPdf(pptPath: string): Promise<string> {
  // @ts-ignore (electronAPI is exposed in preload)
  return await window.electron.ipcRenderer.invoke('convert-ppt-to-pdf', pptPath);
}
