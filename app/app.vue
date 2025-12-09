<script setup lang="ts">
import { usePostStore } from '../src/stores/postStore';
import { onMounted, ref, computed } from 'vue'; //ref 來綁定輸入框
import type { Post } from '../src/types/Post';

//初始化 store
const postStore = usePostStore()

//用來綁定輸入框的變數
const newTitle = ref('')
const newBody = ref('')
const isSubmitting = ref(false) // 用來控制按鈕重複點擊
const searchQuery = ref('') // 新增搜尋關鍵字變數
//    Modal 相關變數   //
const isEditModalOpen = ref(false) //控制視窗開關
const editingPostId = ref<number | null>(null) //紀錄現在正在編輯哪一篇
const editForm = ref({
  title: '',
  body: ''
})   //暫存編輯表單的內容

// 現在不跳 prompt，而是把資料填入暫存區，並打開視窗
const openEditModal = (post: Post) => {
  editingPostId.value = post.id
  editForm.value.title = post.title
  editForm.value.body = post.body
  isEditModalOpen.value = true
}

// == 新增  "關閉視窗" ==
const closeEditModal = () => {
  isEditModalOpen.value = false
  editingPostId.value = null
  editForm.value = { title: '', body: '' } //清空暫存
}

// == 新增 "確認更新" (按下 Modal 的儲存按鈕)
const handleUpdate = async () => {
  if (!editingPostId.value) return

  if (!editForm.value.title.trim() || !editForm.value.body.trim()) {
    alert('標題和內容不能為空')
    return
  }

  //呼叫 Store 更新
  await postStore.updatePost(
    editingPostId.value,
    editForm.value.title,
    editForm.value.body
  )

  //更新成功後關閉視窗
  closeEditModal()

}

//增添一筆假資料
onMounted(() => {
  postStore.fetchPosts()
})

//3. 新增計算屬性
const filteredPosts = computed(() => {
  if (!searchQuery.value.trim()) {
    return postStore.posts
  } //否則，回傳全部文章
  const query = searchQuery.value.toLowerCase()
  return postStore.posts.filter(post =>
    post.title.toLowerCase().includes(query) ||
    post.body.toLowerCase().includes(query)
  )
})

// 處理編輯點擊事件 (使用簡易版 Prompt)
const handleEdit = async (post: Post) => {
  //1. 跳窗輸入新標題
  const newTitle = prompt('請輸入新的標題', post.title)
  if (newTitle === null) return //如果按取消就不動作

  //2. 跳窗輸入新內容
  const newBody = prompt('請輸入新的內容', post.body)
  if (newBody === null) return

  //3. 呼叫 Store 更新
  if (newTitle.trim() && newBody.trim()) {
    await postStore.updatePost(post.id, newTitle, newBody)
  } else {
    alert('標題或內容不能為空')
  }
}

//處裡按鈕點擊事件
const handleSubmit = async () => {
  if (!newTitle.value.trim() || !newBody.value.trim()) {
    alert('請輸入標題和內容')
    return
  }

  isSubmitting.value = true
  //呼叫 Store 的新增功能
  await postStore.addPost({

    title: newTitle.value,
    body: newBody.value,
    userId: 1 //暫定 1號使用者
  })
  isSubmitting.value = false

  //新增成功後，清空輸入框
  newTitle.value = ''
  newBody.value = ''
}


</script>

<template>
  <div class="min-h-screen bg-gray-100 font-sans">

    <header class="bg-white shadow-sm">
      <div class="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold text-gray-900 leading-tight">
          Nuxt - 部落格
        </h1>
      </div>
    </header>
    -
    <main class="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">

      <section class="bg-white shadow-md rounded-lg p-6 mb-10">
        <h2 class="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">發表新文章</h2>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label for="title" class="block text-sm font-medium text-gray-700 mb-1">文章標題</label>
            <input id="title" v-model="newTitle" type="text" placeholder="請輸入標題..."
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:border-blue-500 outline-none transition" />
          </div>

          <div>
            <label for="body" class="block text-sm font-medium text-gray-700 mb-1">文章內容</label>
            <textarea id="body" v-model="newBody" rows="4" placeholder="請輸入內容..."
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"></textarea>
          </div>

          <div class="flex justify-end">
            <button type="submit" :disabled="isSubmitting || postStore.isLoading"
              class="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {{ isSubmitting ? '提交中...' : '發布文章' }}
            </button>
          </div>
        </form>
      </section>

      <section>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div class="flex items-center">
            <h2 class="text-2xl font-bold text-gray-800">最新文章列表</h2>
            <span class="ml-3 text-sm text-gray-500 bg-gray-200 px-3 py-1 rounded-full">共 {{ filteredPosts.length }}
              篇</span>
          </div>

          <div class="relative">
            <input v-model="searchQuery" type="text" placeholder="🔍 搜尋文章..."
              class="pl-4 pr-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 outline-none transition text-sm w-full sm:w-64" />
          </div>
        </div>

        <div v-if="postStore.isLoading && postStore.posts.length === 0"
          class="text-center py-10 text-gray-500 animate-pulse">
          <p class="text-lg">正在從資料庫讀取資料...</p>
        </div>

        <div v-else-if="postStore.error" class="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p class="text-red-700">發生錯誤：{{ postStore.error.message }}</p>
        </div>

        <div v-else-if="filteredPosts.length === 0"
          class="text-center py-12 bg-white shadow-sm rounded-lg text-gray-500">
          <p class="text-xl mb-2">📭</p>
          <p>沒有找到符合的文章，試試別的關鍵字？</p>
        </div>

        <TransitionGroup name="list" tag="ul" class="space-y-6" v-else>
          <li v-for="post in filteredPosts" :key="post.id"
            class="bg-white shadow-sm hover:shadow-md rounded-lg overflow-hidden transition-shadow duration-300">
            <div class="p-6 flex justify-between items-start">

              <div class="flex-1 pr-4">
                <h3 class="text-xl font-bold text-gray-900 mb-2">
                  {{ post.title }}
                </h3>
                <p class="text-gray-600 leading-relaxed line-clamp-3">
                  {{ post.body }}
                </p>
                <div class="mt-4 flex items-center text-sm text-gray-400">
                  <span>作者 ID: {{ post.userId }}</span>
                  <span class="mx-2">•</span>
                  <span>{{ new Date(post.created_at).toLocaleString() }}</span>
                </div>
              </div>

              <div class="ml-4 flex-shrink-0 flex gap-2">

                <button @click="openEditModal(post)"
                  class="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors focus:outline-none"
                  title="編輯文章">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>

                <button @click="postStore.deletePost(post.id)"
                  class="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors focus:outline-none"
                  title="刪除這篇文章">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

            </div>
          </li>
        </TransitionGroup>
      </section>

    </main>

    <footer class="bg-white border-t border-gray-200 mt-auto">
      <div
        class="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8 relative flex flex-col md:flex-row items-center md:justify-center text-sm text-gray-500">

        <div class="flex items-center space-x-4 mb-4 md:mb-0 md:absolute md:left-8">
          <a href="#" class="hover:text-blue-600 transition-colors">關於我們</a>
          <span class="text-gray-300">|</span>
          <a href="#" class="hover:text-blue-600 transition-colors">隱私權政策</a>
          <span class="text-gray-300">|</span>
          <a href="#" class="hover:text-blue-600 transition-colors">聯絡方式</a>
        </div>

        <p>&copy; 2025 Nuxt Blog. All rights reserved.</p>

      </div>
    </footer>
    <div v-if="isEditModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">

      <div @click="closeEditModal"
        class="absolute inset-0 bg-gray-900 bg-opacity-50 transition-opacity backdrop-blur-sm"></div>

      <div class="relative bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all">

        <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 class="text-lg font-bold text-gray-800">編輯文章</h3>
          <button @click="closeEditModal" class="text-gray-400 hover:text-gray-600 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">文章標題</label>
            <input v-model="editForm.title" type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">文章內容</label>
            <textarea v-model="editForm.body" rows="5"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"></textarea>
          </div>
        </div>

        <div class="px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button @click="closeEditModal"
            class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none transition-colors">
            取消
          </button>
          <button @click="handleUpdate"
            class="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm">
            儲存變更
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.4s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>