
export class AudioService {
  private static instance: AudioService;
  private ctx: AudioContext | null = null;
  private outputNode: GainNode | null = null;

  private constructor() {
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    this.outputNode = this.ctx.createGain();
    this.outputNode.connect(this.ctx.destination);
  }

  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  private decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private async decodeAudioData(data: Uint8Array): Promise<AudioBuffer> {
    if (!this.ctx) throw new Error("AudioContext not initialized");
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length;
    const buffer = this.ctx.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  }

  public async playPcm(base64Audio: string) {
    if (!this.ctx || !this.outputNode) return;
    try {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      const bytes = this.decodeBase64(base64Audio);
      const buffer = await this.decodeAudioData(bytes);
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.outputNode);
      source.start();
    } catch (e) {
      console.error("Audio playback error:", e);
    }
  }
}
