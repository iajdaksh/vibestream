export type VibeId =
  | 'normal' | 'lofi' | 'slowed' | 'nightcore' | '3am'
  | '8d' | 'phonk' | 'study' | 'bedroom' | 'drill' | 'custom'

export interface CustomParams {
  speed: number    // 50–150 (percent)
  reverb: number   // 0–100
  lowpass: number  // 500–20000 Hz
  bass: number     // -6 to +6 dB
}

export class VibeAudioEngine {
  private ctx: AudioContext | null = null
  private source: MediaElementAudioSourceNode | null = null
  private out: GainNode | null = null          // master output (all chains → here)
  private analyser: AnalyserNode | null = null  // after out → destination
  private chainNodes: AudioNode[] = []
  private pannerTimer: ReturnType<typeof setInterval> | null = null

  // ── init ──────────────────────────────────────────────────────────────────
  async init(audioElement: HTMLAudioElement) {
    if (this.ctx) return
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext
    const ctx = new AC() as AudioContext
    this.ctx = ctx
    this.source = ctx.createMediaElementSource(audioElement)

    // Master output → analyser → speakers
    this.out = this.ctx.createGain()
    this.out.gain.value = 1

    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 256
    this.analyser.smoothingTimeConstant = 0.8

    this.out.connect(this.analyser)
    this.analyser.connect(this.ctx.destination)

    // Default: source → out (straight through)
    this.source.connect(this.out)
  }

  async resume() {
    if (this.ctx?.state === 'suspended') await this.ctx.resume()
  }

  getAnalyser(): AnalyserNode | null { return this.analyser }

  // ── setVibe ───────────────────────────────────────────────────────────────
  async setVibe(id: VibeId, custom?: CustomParams) {
    if (!this.ctx || !this.source || !this.out) return
    await this.resume()
    this._clearChain()
    switch (id) {
      case 'lofi':     this._applyLofi();       break
      case 'slowed':   this._applySlowedReverb(); break
      case 'nightcore':this._applyNightcore();  break
      case '3am':      this._apply3am();        break
      case '8d':       this._apply8D();         break
      case 'phonk':    this._applyPhonk();      break
      case 'study':    this._applyStudy();      break
      case 'bedroom':  this._applyBedroom();    break
      case 'drill':    this._applyDrill();      break
      case 'custom':   if (custom) this._applyCustom(custom); break
      default:         this.source.connect(this.out) // normal
    }
  }

  updateCustom(p: CustomParams) {
    this._clearChain()
    this._applyCustom(p)
  }

  // ── LOFI ─────────────────────────────────────────────────────────────────
  private _applyLofi() {
    const { ctx, source, out } = this._nodes()

    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'; lp.frequency.value = 3200; lp.Q.value = 0.7

    const bass = ctx.createBiquadFilter()
    bass.type = 'lowshelf'; bass.frequency.value = 250; bass.gain.value = 4

    const mid = ctx.createBiquadFilter()
    mid.type = 'peaking'; mid.frequency.value = 3000; mid.gain.value = -5; mid.Q.value = 1.2

    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -18; comp.knee.value = 20; comp.ratio.value = 4
    comp.attack.value = 0.003; comp.release.value = 0.25

    source.connect(lp); lp.connect(bass); bass.connect(mid); mid.connect(comp); comp.connect(out)
    this.chainNodes = [lp, bass, mid, comp]
  }

  // ── SLOWED + REVERB ───────────────────────────────────────────────────────
  private _applySlowedReverb() {
    const { ctx, source, out } = this._nodes()

    const warm = ctx.createBiquadFilter()
    warm.type = 'lowpass'; warm.frequency.value = 8000; warm.Q.value = 0.5

    const conv = ctx.createConvolver()
    conv.buffer = this._makeReverbIR(ctx, 3.5, 2.8)

    const dry = ctx.createGain(); dry.gain.value = 0.55
    const wet = ctx.createGain(); wet.gain.value = 0.6

    source.connect(warm)
    warm.connect(dry); dry.connect(out)
    warm.connect(conv); conv.connect(wet); wet.connect(out)
    this.chainNodes = [warm, conv, dry, wet]
  }

  // ── NIGHTCORE ─────────────────────────────────────────────────────────────
  private _applyNightcore() {
    const { ctx, source, out } = this._nodes()

    const treble = ctx.createBiquadFilter()
    treble.type = 'highshelf'; treble.frequency.value = 5000; treble.gain.value = 5

    const basscut = ctx.createBiquadFilter()
    basscut.type = 'lowshelf'; basscut.frequency.value = 200; basscut.gain.value = -2

    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -12; comp.ratio.value = 3
    comp.attack.value = 0.001; comp.release.value = 0.1

    source.connect(treble); treble.connect(basscut); basscut.connect(comp); comp.connect(out)
    this.chainNodes = [treble, basscut, comp]
  }

  // ── 3AM STORM ─────────────────────────────────────────────────────────────
  private _apply3am() {
    const { ctx, source, out } = this._nodes()

    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'; lp.frequency.value = 5500; lp.Q.value = 0.6

    const bass = ctx.createBiquadFilter()
    bass.type = 'lowshelf'; bass.frequency.value = 200; bass.gain.value = 5

    const conv = ctx.createConvolver()
    conv.buffer = this._makeReverbIR(ctx, 2.0, 2.0)

    const dry = ctx.createGain(); dry.gain.value = 0.65
    const wet = ctx.createGain(); wet.gain.value = 0.45

    source.connect(lp); lp.connect(bass)
    bass.connect(dry); dry.connect(out)
    bass.connect(conv); conv.connect(wet); wet.connect(out)
    this.chainNodes = [lp, bass, conv, dry, wet]
  }

  // ── 8D AUDIO ──────────────────────────────────────────────────────────────
  private _apply8D() {
    const { ctx, source, out } = this._nodes()

    const air = ctx.createBiquadFilter()
    air.type = 'highshelf'; air.frequency.value = 8000; air.gain.value = 2

    // StereoPannerNode not available on older iOS — fall back to straight-through
    if (typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner()
      source.connect(air); air.connect(panner); panner.connect(out)
      this.chainNodes = [air, panner]
      let phase = 0
      this.pannerTimer = setInterval(() => {
        phase += 0.013
        panner.pan.setTargetAtTime(Math.sin(phase), ctx.currentTime, 0.05)
      }, 16)
    } else {
      source.connect(air); air.connect(out)
      this.chainNodes = [air]
    }
  }

  // ── PHONK ─────────────────────────────────────────────────────────────────
  private _applyPhonk() {
    const { ctx, source, out } = this._nodes()

    // Heavy sub bass
    const sub = ctx.createBiquadFilter()
    sub.type = 'lowshelf'; sub.frequency.value = 100; sub.gain.value = 9

    // Dark lowpass
    const dark = ctx.createBiquadFilter()
    dark.type = 'lowpass'; dark.frequency.value = 6000; dark.Q.value = 0.8

    // Slight distortion via waveshaper
    const dist = ctx.createWaveShaper()
    dist.curve = this._makeDistortionCurve(60)
    dist.oversample = '2x'

    // Soft comp to control distortion loudness
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -10; comp.ratio.value = 6
    comp.attack.value = 0.002; comp.release.value = 0.15

    const gain = ctx.createGain(); gain.gain.value = 0.85

    source.connect(sub); sub.connect(dark); dark.connect(dist)
    dist.connect(comp); comp.connect(gain); gain.connect(out)
    this.chainNodes = [sub, dark, dist, comp, gain]
  }

  // ── STUDY ─────────────────────────────────────────────────────────────────
  private _applyStudy() {
    const { ctx, source, out } = this._nodes()

    // Gentle high-cut (remove harsh frequencies)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'; lp.frequency.value = 12000; lp.Q.value = 0.5

    // Slight bass reduction (keep it clean, not boomy)
    const basscut = ctx.createBiquadFilter()
    basscut.type = 'lowshelf'; basscut.frequency.value = 150; basscut.gain.value = -3

    // Soft reverb for focus/ambience
    const conv = ctx.createConvolver()
    conv.buffer = this._makeReverbIR(ctx, 1.2, 3)

    const dry = ctx.createGain(); dry.gain.value = 0.8
    const wet = ctx.createGain(); wet.gain.value = 0.25

    source.connect(lp); lp.connect(basscut)
    basscut.connect(dry); dry.connect(out)
    basscut.connect(conv); conv.connect(wet); wet.connect(out)
    this.chainNodes = [lp, basscut, conv, dry, wet]
  }

  // ── BEDROOM POP ───────────────────────────────────────────────────────────
  private _applyBedroom() {
    const { ctx, source, out } = this._nodes()

    // Warm & intimate lowpass
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'; lp.frequency.value = 7000; lp.Q.value = 0.6

    // Warm mid boost
    const mid = ctx.createBiquadFilter()
    mid.type = 'peaking'; mid.frequency.value = 800; mid.gain.value = 3; mid.Q.value = 1.5

    // Bass warmth
    const bass = ctx.createBiquadFilter()
    bass.type = 'lowshelf'; bass.frequency.value = 200; bass.gain.value = 3

    // Intimate reverb
    const conv = ctx.createConvolver()
    conv.buffer = this._makeReverbIR(ctx, 1.8, 3.5)

    const dry = ctx.createGain(); dry.gain.value = 0.7
    const wet = ctx.createGain(); wet.gain.value = 0.4

    source.connect(lp); lp.connect(bass); bass.connect(mid)
    mid.connect(dry); dry.connect(out)
    mid.connect(conv); conv.connect(wet); wet.connect(out)
    this.chainNodes = [lp, bass, mid, conv, dry, wet]
  }

  // ── DRILL ─────────────────────────────────────────────────────────────────
  private _applyDrill() {
    const { ctx, source, out } = this._nodes()

    // Massive sub bass
    const sub = ctx.createBiquadFilter()
    sub.type = 'lowshelf'; sub.frequency.value = 80; sub.gain.value = 10

    // Slight high boost (crisp)
    const treble = ctx.createBiquadFilter()
    treble.type = 'highshelf'; treble.frequency.value = 6000; treble.gain.value = 3

    // Punchy compressor
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -16; comp.knee.value = 5; comp.ratio.value = 8
    comp.attack.value = 0.001; comp.release.value = 0.08

    const gain = ctx.createGain(); gain.gain.value = 0.75

    source.connect(sub); sub.connect(treble); treble.connect(comp); comp.connect(gain); gain.connect(out)
    this.chainNodes = [sub, treble, comp, gain]
  }

  // ── CUSTOM ────────────────────────────────────────────────────────────────
  private _applyCustom(p: CustomParams) {
    const { ctx, source, out } = this._nodes()

    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'; lp.frequency.value = p.lowpass

    const bassShelf = ctx.createBiquadFilter()
    bassShelf.type = 'lowshelf'; bassShelf.frequency.value = 250; bassShelf.gain.value = p.bass

    const conv = ctx.createConvolver()
    const reverbTime = (p.reverb / 100) * 4.5
    conv.buffer = this._makeReverbIR(ctx, Math.max(0.1, reverbTime), 2.5)

    const dry = ctx.createGain(); dry.gain.value = 1 - (p.reverb / 100) * 0.5
    const wet = ctx.createGain(); wet.gain.value = (p.reverb / 100) * 0.8

    source.connect(lp); lp.connect(bassShelf)
    bassShelf.connect(dry); dry.connect(out)
    bassShelf.connect(conv); conv.connect(wet); wet.connect(out)
    this.chainNodes = [lp, bassShelf, conv, dry, wet]
  }

  // ── helpers ───────────────────────────────────────────────────────────────
  private _nodes() {
    return {
      ctx: this.ctx!,
      source: this.source!,
      out: this.out!,
    }
  }

  private _clearChain() {
    if (this.pannerTimer) { clearInterval(this.pannerTimer); this.pannerTimer = null }
    try { this.source?.disconnect() } catch {}
    this.chainNodes = []
  }

  private _makeReverbIR(ctx: AudioContext, duration: number, decay: number): AudioBuffer {
    const len = Math.floor(ctx.sampleRate * duration)
    const buf = ctx.createBuffer(2, len, ctx.sampleRate)
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch)
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
      }
    }
    return buf
  }

  private _makeDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
    const n = 512
    const curve = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1
      curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x))
    }
    return curve
  }

  destroy() {
    this._clearChain()
    try { this.source?.disconnect() } catch {}
    try { this.out?.disconnect() } catch {}
    if (this.ctx) { this.ctx.close(); this.ctx = null }
    this.source = null; this.out = null; this.analyser = null
  }
}
