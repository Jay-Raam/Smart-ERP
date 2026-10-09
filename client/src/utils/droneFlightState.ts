import { droneAudio } from './droneAudio';

type Listener = () => void;

class DroneFlightStateManager {
  private isAudioActive: boolean = false;
  private isRecording: boolean = true;
  private recordSeconds: number = 0;
  private timer: any = null;
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.startTimer();
  }

  private startTimer() {
    if (typeof window === 'undefined') return;
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.isRecording) {
        this.recordSeconds += 1;
        this.notify();
      }
    }, 1000);
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public getSnapshot() {
    return {
      isAudioActive: this.isAudioActive,
      isRecording: this.isRecording,
      recordSeconds: this.recordSeconds,
    };
  }

  public toggleAudio(): boolean {
    const next = droneAudio.toggle();
    this.isAudioActive = next;
    this.notify();
    return next;
  }

  public setAudio(active: boolean) {
    if (active) {
      droneAudio.start();
    } else {
      droneAudio.stop();
    }
    this.isAudioActive = active;
    this.notify();
  }

  public toggleRecording(): boolean {
    this.isRecording = !this.isRecording;
    this.notify();
    return this.isRecording;
  }
}

export const droneFlightState = new DroneFlightStateManager();
