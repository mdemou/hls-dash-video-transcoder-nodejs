export interface ITranscoderCreate {
  trackingId: string;
  inputFilePath: string;
  hlsOutputPath: string;
  dashOutputPath: string;
  encryptionKeyPath?: string;
  encryptionKeyUrl?: string;
  segmentDuration: number;
}

export interface ITranscoderOnProgress {
  currentFps: string;
  currenKbps: string;
  frames: number;
  targetSize: number;
  timemark: string;
}

export interface ITranscoderOptionsMap {
  hls: {
    getOutputOptions: (keyInfoFilePath?: string, segmentDuration?: number) => string[];
    getOutputPath: (outputPath: string) => string;
  };
  dash: {
    getOutputOptions: (segmentDuration?: number) => string[];
    getOutputPath: (outputPath: string) => string;
  };
}
