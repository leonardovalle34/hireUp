import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Antd from 'ant-design-vue';
import App from './App.vue';
import router from './router';
import { useAuthStore } from '@/stores/auth';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(Antd);

const auth = useAuthStore();

//await auth.fetchUser();
auth.listenAuth();

app.mount('#app');
