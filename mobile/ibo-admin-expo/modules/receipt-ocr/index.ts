import { requireOptionalNativeModule } from "expo";

export type OcrLine = {
  text: string;
  /** Normalised 0..1 box, origin top-left. */
  x: number;
  y: number;
  width: number;
  height: number;
};

type ReceiptOcrNative = {
  recognizeText(uri: string): Promise<OcrLine[]>;
};

const native = requireOptionalNativeModule<ReceiptOcrNative>("ReceiptOcr");

export function isOcrAvailable() {
  return Boolean(native);
}

export async function recognizeText(uri: string): Promise<OcrLine[]> {
  if (!native) {
    throw new Error("Texterkennung ist nur in der installierten iPhone-App verfügbar.");
  }
  return native.recognizeText(uri);
}
