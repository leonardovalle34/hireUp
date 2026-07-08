<script lang="ts">
export default { name: 'VideosView' };
</script>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getVideos } from '@/services/videos';
import type { VideoLesson } from '@/interfaces/IVideo';

const router = useRouter();
const videos = ref<VideoLesson[]>([]);
const loading = ref(true);
const selectedLevel = ref('all');
const activeVideo = ref<VideoLesson | null>(null);

const levels = ['all', 'beginner', 'intermediate', 'advanced'];

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const filteredVideos = computed(() =>
  videos.value.filter(
    (video) => selectedLevel.value === 'all' || video.level === selectedLevel.value,
  ),
);

function embedUrl(youtubeId: string): string {
  return `https://www.youtube.com/embed/${youtubeId}`;
}

function openVideo(video: VideoLesson) {
  activeVideo.value = video;
}

function closePlayer() {
  activeVideo.value = null;
}

function practiceWithTutor() {
  if (!activeVideo.value) return;
  localStorage.setItem('tutorTopic', `Discuss this video topic: "${activeVideo.value.title}"`);
  router.push('/tutor');
}

onMounted(async () => {
  try {
    videos.value = await getVideos();
  } catch (err) {
    console.error('Erro ao carregar vídeos', err);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="videos-container">
    <div class="videos-header">
      <h1>🎬 Vídeos em Inglês</h1>
      <p class="subtitle">Pratique listening com conteúdo real da National Geographic</p>
    </div>

    <div class="filters">
      <div class="filter-group">
        <button
          v-for="level in levels"
          :key="level"
          class="filter-btn"
          :class="{ active: selectedLevel === level }"
          @click="selectedLevel = level"
        >
          {{ capitalize(level) }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <template v-else>
      <p class="results-count">{{ filteredVideos.length }} vídeos encontrados</p>

      <div class="video-list">
        <div
          v-for="video in filteredVideos"
          :key="video.id"
          class="video-card"
          @click="openVideo(video)"
        >
          <div class="thumbnail-wrapper">
            <img v-if="video.thumbnail_url" :src="video.thumbnail_url" class="thumbnail" alt="" />
            <div v-else class="thumbnail-placeholder">🎬</div>
            <span class="duration-badge">{{ video.duration }}</span>
          </div>
          <div class="video-info">
            <span class="level-badge" :class="video.level">{{ video.level }}</span>
            <h3 class="video-title">{{ video.title }}</h3>
          </div>
        </div>
      </div>
    </template>

    <div v-if="activeVideo" class="player-overlay" @click.self="closePlayer">
      <div class="player-card">
        <button class="close-btn" @click="closePlayer">✕</button>
        <div class="player-wrapper">
          <iframe
            class="player-iframe"
            :src="embedUrl(activeVideo.youtube_id)"
            title="YouTube video player"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
        <div class="player-info">
          <h3>{{ activeVideo.title }}</h3>
          <p class="player-description">{{ activeVideo.description }}</p>
          <button class="btn-tutor" @click="practiceWithTutor">🎓 Praticar com Tutor</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.videos-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 24px 16px 80px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.videos-header { text-align: center; }
.videos-header h1 { font-size: 22px; font-weight: 700; color: white; }
.subtitle { font-size: 14px; color: rgba(255, 255, 255, 0.7); margin-top: 4px; }
.filters { display: flex; flex-direction: column; gap: 8px; }
.filter-group { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
.filter-btn {
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
.filter-btn.active { background: var(--accent); color: white; border-color: var(--accent); }
.loading { display: flex; justify-content: center; padding: 40px; }
.spinner { width: 28px; height: 28px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.results-count { text-align: center; font-size: 13px; color: var(--text-secondary); margin: 0; }
.video-list { display: flex; flex-direction: column; gap: 14px; }
.video-card {
  background: var(--card-bg);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--card-shadow);
  border: 1px solid var(--border);
  cursor: pointer;
}
.thumbnail-wrapper { position: relative; width: 100%; height: 180px; background: var(--bg-secondary); }
.thumbnail { width: 100%; height: 100%; object-fit: cover; }
.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: var(--text-tertiary);
  background: var(--bg-secondary);
}
.duration-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.75);
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}
.video-info { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
.level-badge {
  align-self: flex-start;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--bg-secondary);
  color: var(--accent);
}
.video-title { font-size: 15px; font-weight: 700; color: var(--text-primary); line-height: 1.4; margin: 0; }

.player-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 16px;
}
.player-card {
  background: var(--card-bg);
  border-radius: 18px;
  max-width: 480px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}
.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  cursor: pointer;
  z-index: 1;
}
.player-wrapper { position: relative; width: 100%; aspect-ratio: 16 / 9; background: black; }
.player-iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
.player-info { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.player-info h3 { margin: 0; font-size: 16px; color: var(--text-primary); }
.player-description { font-size: 13px; color: var(--text-secondary); margin: 0; line-height: 1.5; }
.btn-tutor {
  padding: 10px;
  border-radius: 10px;
  border: none;
  background: var(--accent);
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
</style>
