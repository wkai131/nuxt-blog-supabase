<script setup lang="ts">
import { usePostStore } from '../src/stores/postStore';
import { storeToRefs } from 'pinia';
import type { Post } from '../src/types/Post';
import { useAsyncData } from 'nuxt/app';

//1. 獲取store 實例
const store = usePostStore();
const { posts, isLoading, error } = storeToRefs(store);
const { setPosts } = store //獲取 action

//2. 使用 Nuxt 的 useAsyncData 呼叫 API
const { pending, data: fetchedPosts, error: fetchError } = await useAsyncData<Post[]>(
    'latest-posts', //快取金鑰
    // 這裡我們直接呼叫 $fetch，他會被轉換為對 JSONPlaceholder 的請求
    () => $fetch('https://jsonplaceholder.typicode.com/posts?_limit=10')

)

//3. 數據整合邏輯: 將獲取到的資料存入 Pinia
if (fetchedPosts.value && store.posts.length === 0) {
    setPosts(fetchedPosts.value) //只有在 store 為空時才覆蓋資料 (防止多次 fetch)
} else if (fetchError.value) {
    store.error = fetchError.value as Error //捕捉錯誤並存入 store
}
store.isLoading = pending.value // 更新 Pinia 中的載入狀態

</script>

<template>
    <div>
        <h1 class="text-3xl font-bold text-gray-800 mb-6">最新文章</h1>

        <div v-if="store.isLoading" class="text-center text-gray-500">
            正在載入文章列表
        </div>

        <div v-else-if="store.error" class="text-center text-red-500">
            ❌ 載入失敗：{{ store.error.message }} ❌
        </div>

        <div v-else-if="posts && posts.length > 0" class="space-y-6">
            <article v-for="post in posts" :key="post.id" class="p-6 bg-white rounded-lg shadow-md">
                <h2 class="text-2xl font-semibold text-blue-600 mb-2">
                    {{ post.title }}
                </h2>
                <p class="text-gray-700">
                    {{ post.body.substring(0, 150) }}
                </p>
            </article>
        </div>
        <div v-else>
            <p class="text-center text-gray-500">目前沒有任何文章。</p>
        </div>
    </div>
</template>