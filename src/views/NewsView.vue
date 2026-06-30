<script lang="ts">
export default { name: 'NewsView' };
</script>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getNews } from '@/services/news';
import type { NewsArticle } from '@/interfaces/INews';

const router = useRouter();
const news = ref<NewsArticle[]>([]);
const loading = ref(true);
const selectedCategory = ref('all');

const categories = computed(() => {
  const cats = new Set(news.value.map(n => n.category));
  return ['all', ...Array.from(cats)];
});

const filteredNews = computed(() =>
  selectedCategory.value === 'all'
    ? news.value
    : news.value.filter(n => n.category === selectedCategory.value)
);

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function openArticle(url: string) {
  window.open(url, '_blank');
}

function practiceTopic(title: string) {
  localStorage.setItem('tutorTopic', `Discuss this news topic: "${title}"`);
  router.push('/tutor');
}

onMounted(async () => {
  try {
    news.value = await getNews();
  } catch (err) {
    console.error('Erro ao carregar notícias', err);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="news-container">
    <div class="news-header">
      <h1>📰 Notícias em Inglês</h1>
      <p class="subtitle">Pratique leitura com conteúdo real e atualizado</p>
    </div>

    <div class="category-filters">
      <button
        v-for="cat in categories"
        :key="cat"
        class="filter-btn"
        :class="{ active: selectedCategory === cat }"
        @click="selectedCategory = cat"
      >
        {{ cat === 'all' ? 'Todas' : cat }}
      </button>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else class="news-list">
      <div v-for="article in filteredNews" :key="article.id" class="news-card">
        <img v-if="article.image_url" :src="article.image_url" class="news-image" alt="" />
        <div class="news-content">
          <div class="news-meta">
            <span class="news-source">{{ article.source }}</span>
            <span class="news-date">{{ formatDate(article.published_at) }}</span>
          </div>
          <h3 class="news-title">{{ article.title }}</h3>
          <p v-if="article.summary" class="news-summary">{{ article.summary }}</p>
          <div class="news-actions">
            <button class="btn-read" @click="openArticle(article.url)">📖 Ler artigo</button>
            <button class="btn-practice" @click="practiceTopic(article.title)">🎓 Praticar com Tutor</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.news-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 24px 16px 80px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.news-header { text-align: center; }
.news-header h1 { font-size: 22px; font-weight: 700; color: var(--text-primary); }
.subtitle { font-size: 14px; color: var(--text-secondary); margin-top: 4px; }
.category-filters { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
.filter-btn {
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-transform: capitalize;
}
.filter-btn.active { background: var(--accent); color: white; border-color: var(--accent); }
.loading { display: flex; justify-content: center; padding: 40px; }
.spinner { width: 28px; height: 28px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.news-list { display: flex; flex-direction: column; gap: 14px; }
.news-card {
  background: var(--card-bg);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--card-shadow);
  border: 1px solid var(--border);
}
.news-image { width: 100%; height: 160px; object-fit: cover; }
.news-content { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
.news-meta { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-tertiary); }
.news-source { font-weight: 600; color: var(--accent); }
.news-title { font-size: 15px; font-weight: 700; color: var(--text-primary); line-height: 1.4; margin: 0; }
.news-summary { font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0; }
.news-actions { display: flex; gap: 8px; margin-top: 6px; }
.btn-read, .btn-practice {
  flex: 1;
  padding: 9px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  color: var(--text-primary);
}
.btn-practice { background: var(--accent); color: white; border-color: var(--accent); }
</style>
