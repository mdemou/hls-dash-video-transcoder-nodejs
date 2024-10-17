export interface ITranscoderCreate {
  inputFilePath: string;
  hlsOutputPath: string;
  dashOutputPath: string;
}

export interface ITranscoderOnProgress {
  frames: string;
  currentFps: string;
  timemark: string;
}
