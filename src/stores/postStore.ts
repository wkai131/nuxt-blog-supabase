import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Post } from '../types/Post' // 引入我們剛剛定義的型別

export const usePostStore = defineStore('post', () => {
    //1. 取得supabase 客戶端 (這就是通往你資料庫的鑰匙)
    // Nuxt 會自動幫你引入，不需要手動 import
    const supabase = useSupabaseClient()

    // --- State ---
    const posts = ref<Post[]>([])
    const isLoading = ref(false)
    const error = ref<Error | null>(null)

    // --- Actions ---

    // Action 1: 負責接收資料並「儲存」到 State 中
    function setPosts(newPosts: Post[]) {
        posts.value = newPosts
    }

    // Action 2: 新增一篇文章  (寫入資料庫)
    async function addPost(newPost: Omit<Post, 'id' | 'created_at'>) {
        isLoading.value = true
        error.value = null

        try {
            //1. 準備寫入的資料 (不需要 id 和 created_at ,資料庫會自己生)
            // 這裡我們用一個小技巧，把 newPost 解構 ，去掉id
            // const { id, ...postData } = newPost

            //2. 寫入 Supabase
            const { data, error: supabaseError } = await supabase
                .from('posts')
                .insert(newPost as any) //插入資料
                .select() // 寫入後馬上把那筆新資料抓回來 (為了拿到資料庫產生的 id)
                .single() // 因為我們只新增一筆，所以用 single()

            if (supabaseError) throw supabaseError

            //3. 成功後，更新本地的 State (讓畫面不用重新整理就多出一筆)
            if (data) {
                posts.value.unshift(data as any)
            }
        } catch (err) {
            console.error('新增失敗', err)
            error.value = err as Error
        } finally {
            isLoading.value = false
        }
    }

    // [新增] 刪除文章 Action
    async function deletePost(id: number) {
        //這裡做一個"樂觀更新" : 先從畫面上移除，再去資料庫刪除
        //這裡使用者體驗會比較好，感覺速度很快

        //1. 先輩分舊資料(萬一失敗要還原)
        const previousPosts = posts.value
        posts.value = posts.value.filter((post) => post.id !== id)
        //2. 更新畫面: 留下 "ID 不等於"要刪除目標的文章

        try {
            //3. 真正去資料庫刪除
            const { error: supabaseError } = await supabase
                .from('posts')
                .delete()
                .eq('id', id) //條件: id等於傳進來的 id

            if (supabaseError) throw supabaseError
        } catch (err) {

            console.error('刪除失敗:', err)
            alert('刪除失敗，資料將還原')
            //4. 如果失敗，把資料還原
            posts.value = previousPosts

        }
    }
    // Action 3
    async function fetchPosts() {
        isLoading.value = true
        error.value = null

        try {
            //2. 向 Supabase 資料庫查詢
            // .from('posts'): 指定要查 "posts"這張表
            // .select('*'): 抓取所有欄位
            // .order('created_at',...): 讓最新的文章牌最上面
            const { data, error: supabaseError } = await supabase
                .from('posts')
                .select('*')
                .order('created_at', { ascending: false })
            // 如果 Supabase 抱錯，就丟出例外
            if (supabaseError) throw supabaseError

            //3. 把抓到的資料存進 State
            if (data) {
                setPosts(data as any)
                //加 as any 為了避免 TypeScript 龜毛欄位名稱對不上
                // EX: userid小寫，但類型 userId
            }
        } catch (err) {
            console.error('抓取失敗', err)
            error.value = err as Error
        } finally {
            isLoading.value = false
        }
    }

    // [新增編輯] edit action
    async function updatePost(id: number, newTitle: string, newBody: string) {
        // 1. 樂觀更新: 先更新本地，讓畫面不用等
        const post = posts.value.find(p => p.id === id)
        if (post) {
            post.title = newTitle
            post.body = newBody
        }
        try {
            //2. Supabase更新資料庫
            const { error: supabaseError } = await (supabase.from('posts') as any)
                .update({ title: newTitle, body: newBody }) //要更新的欄位
                .eq('id', id) //條件

            if (supabaseError) throw supabaseError
        } catch (err) {
            console.error('更新失敗', err)
            alert('更新失敗，請重新整理網站')
            // 失敗的話，建議這裡要重新 fetchPosts() 把正確資料抓回來，這裡先省略
        }
    }

    // --- Getters (計算屬性) ---
    const postCount = computed(() => posts.value.length)

    // --- Return ---
    return {
        posts,
        isLoading,
        error,
        setPosts, // 暴露 setPosts action
        addPost,
        postCount,
        fetchPosts,
        updatePost,
        deletePost
    }
})