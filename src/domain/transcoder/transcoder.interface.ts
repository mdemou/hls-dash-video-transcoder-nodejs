export interface ITranscoderCreate {
  trackingId: string;
  inputFilePath: string;
  hlsOutputPath: string;
  dashOutputPath: string;
  encryptionKeyPath?: string;
  encryptionKeyUrl?: string;
}

export interface ITranscoderOnProgress {
  currentFps: string;
  currenKbps: string;
  frames: number;
  targetSize: number;
  timemark: string;
}
