<template>
  <div class="splash" :class="{ 'splash-out': leaving }">
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>

    <div class="splash-content">
      <img src="/logo/lotus.jpg" alt="Lotus" class="splash-logo" />
      <div class="splash-welcome">Welcome to</div>
      <div class="splash-title">LOTUS IDE</div>
      <div class="splash-sub">ArduiBot Version</div>
      <div class="splash-tagline">LEARNING BY DOING</div>
      <div class="splash-url">www.lotus-arduibot.com</div>
      <div class="splash-bar-wrap">
        <div class="splash-bar" :style="{ width: progress + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const emit = defineEmits(['done'])
const progress = ref(0)
const leaving = ref(false)

onMounted(() => {
  const start = Date.now()
  const duration = 5000
  const tick = () => {
    const p = Math.min(100, ((Date.now() - start) / duration) * 100)
    progress.value = p
    if (p < 100) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)

  setTimeout(() => {
    leaving.value = true
    setTimeout(() => emit('done'), 600)
  }, duration)
})
</script>

<style scoped>
.splash {
  position: fixed; inset: 0; z-index: 9999;
  background: linear-gradient(135deg, #0d1b2a 0%, #0a2a4a 50%, #0d1b2a 100%);
  display: flex; align-items: center; justify-content: center;
  animation: splashIn 0.5s ease;
}
.splash-out { animation: splashOut 0.6s ease forwards; }

.orb {
  position: absolute; border-radius: 50%;
  filter: blur(60px); opacity: 0.25; animation: orbFloat 6s ease-in-out infinite;
}
.orb-1 { width: 400px; height: 400px; background: #f0a500; top: -100px; left: -100px; }
.orb-2 { width: 300px; height: 300px; background: #00b4d8; bottom: -80px; right: -80px; animation-delay: -2s; }
.orb-3 { width: 250px; height: 250px; background: #4caf50; top: 40%; left: 60%; animation-delay: -4s; }

.splash-content {
  text-align: center; z-index: 1;
  animation: slideUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
}
.splash-logo {
  width: 120px; height: 120px; object-fit: contain; border-radius: 16px;
  box-shadow: 0 0 40px rgba(240,165,0,0.4); margin-bottom: 24px;
}
.splash-welcome { color: #90e0ef; font-size: 16px; letter-spacing: 2px; margin-bottom: 8px; }
.splash-title {
  font-size: 52px; font-weight: 700; letter-spacing: 4px;
  background: linear-gradient(90deg, #f0a500, #fff8dc, #f0a500);
  background-size: 200%;
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  animation: shimmer 2s linear infinite;
}
.splash-sub { color: #e0e0e0; font-size: 18px; letter-spacing: 3px; margin-bottom: 6px; }
.splash-tagline {
  font-size: 13px; letter-spacing: 6px; color: #f0a500;
  margin-top: 8px; opacity: 0.9;
}
.splash-url { font-size: 12px; color: #90e0ef; margin-top: 6px; opacity: 0.7; }

.splash-bar-wrap {
  width: 280px; height: 3px; background: rgba(255,255,255,0.1);
  border-radius: 2px; margin: 28px auto 0; overflow: hidden;
}
.splash-bar {
  height: 100%; background: linear-gradient(90deg, #f0a500, #00b4d8);
  border-radius: 2px; transition: width 0.1s linear;
  box-shadow: 0 0 8px rgba(240,165,0,0.6);
}

@keyframes splashIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes splashOut { to { opacity: 0; transform: scale(1.05) } }
@keyframes slideUp { from { opacity: 0; transform: translateY(30px) } to { opacity: 1; transform: translateY(0) } }
@keyframes orbFloat { 0%, 100% { transform: translate(0,0) } 50% { transform: translate(20px, -20px) } }
@keyframes shimmer { 0% { background-position: -200% } 100% { background-position: 200% } }
</style>
