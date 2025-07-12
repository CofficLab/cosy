<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDatabase } from '../composables/useDatabase'
import type { DatabaseConnection } from '../types/database'

// Props
interface Props {
    connection?: DatabaseConnection | null
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
    connect: [connection: DatabaseConnection]
    disconnect: []
}>()

// 响应式数据
const form = ref<DatabaseConnection>({
    name: '',
    type: 'sqlite',
    host: 'localhost',
    port: 3306,
    username: '',
    password: '',
    database: '',
    file: '',
})

const connecting = ref(false)
const testing = ref(false)
const error = ref<string | null>(null)
const testSuccess = ref(false)
const savedConnections = ref<DatabaseConnection[]>([])

// 使用数据库 composable
const { testConnection } = useDatabase()

// 计算属性
const canConnect = computed(() => {
    if (form.value.type === 'sqlite') {
        return form.value.name && form.value.file
    } else {
        return form.value.name && form.value.host && form.value.database && form.value.username
    }
})

// 方法
const handleConnect = async () => {
    if (!canConnect.value) return

    try {
        connecting.value = true
        error.value = null

        const connection = { ...form.value }

        // 保存连接配置
        await saveConnection(connection)

        emit('connect', connection)
    } catch (err) {
        error.value = err instanceof Error ? err.message : '连接失败'
    } finally {
        connecting.value = false
    }
}

const handleTestConnection = async () => {
    if (!canConnect.value) return

    try {
        testing.value = true
        error.value = null
        testSuccess.value = false

        const success = await testConnection(form.value)

        if (success) {
            testSuccess.value = true
            setTimeout(() => {
                testSuccess.value = false
            }, 3000)
        } else {
            error.value = '连接测试失败'
        }
    } catch (err) {
        error.value = err instanceof Error ? err.message : '连接测试失败'
    } finally {
        testing.value = false
    }
}

const selectFile = () => {
    // 这里应该打开文件选择对话框
    // 在实际应用中，可能需要通过 Electron 的 IPC 来实现
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.db,.sqlite,.sqlite3'
    input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
            // 在浏览器环境中，我们只能获取文件名，实际路径需要通过服务器端处理
            form.value.file = file.name
        }
    }
    input.click()
}

const loadConnection = (connection: DatabaseConnection) => {
    form.value = { ...connection }
    handleConnect()
}

const saveConnection = async (connection: DatabaseConnection) => {
    try {
        connection.id = Date.now().toString()
        connection.createdAt = new Date()

        const existing = savedConnections.value.findIndex(c => c.name === connection.name)
        if (existing >= 0) {
            savedConnections.value[existing] = connection
        } else {
            savedConnections.value.push(connection)
        }

        localStorage.setItem('db-connections', JSON.stringify(savedConnections.value))
    } catch (err) {
        console.error('保存连接失败:', err)
    }
}

const deleteConnection = (id: string) => {
    savedConnections.value = savedConnections.value.filter(c => c.id !== id)
    localStorage.setItem('db-connections', JSON.stringify(savedConnections.value))
}

const loadSavedConnections = () => {
    try {
        const saved = localStorage.getItem('db-connections')
        if (saved) {
            savedConnections.value = JSON.parse(saved)
        }
    } catch (err) {
        console.error('加载保存的连接失败:', err)
    }
}

// 组件挂载
onMounted(() => {
    loadSavedConnections()
})
</script>

<template>
    <div class="space-y-4">
        <!-- 连接状态 -->
        <div v-if="connection" class="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                class="stroke-current shrink-0 w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>已连接到: {{ connection.name }}</span>
            <div>
                <button class="btn btn-sm btn-outline" @click="$emit('disconnect')">
                    断开连接
                </button>
            </div>
        </div>

        <!-- 连接表单 -->
        <div v-else class="space-y-4">
            <!-- 连接类型选择 -->
            <div class="form-control">
                <label class="label">
                    <span class="label-text">数据库类型</span>
                </label>
                <select v-model="form.type" class="select select-bordered">
                    <option value="sqlite">SQLite</option>
                    <option value="mysql">MySQL</option>
                </select>
            </div>

            <!-- 连接名称 -->
            <div class="form-control">
                <label class="label">
                    <span class="label-text">连接名称</span>
                </label>
                <input v-model="form.name" type="text" placeholder="输入连接名称" class="input input-bordered" />
            </div>

            <!-- SQLite 配置 -->
            <div v-if="form.type === 'sqlite'" class="space-y-3">
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">数据库文件</span>
                    </label>
                    <div class="join">
                        <input v-model="form.file" type="text" placeholder="选择 SQLite 文件路径"
                            class="input input-bordered join-item flex-1" />
                        <button class="btn btn-outline join-item" @click="selectFile">
                            浏览
                        </button>
                    </div>
                </div>
            </div>

            <!-- MySQL 配置 -->
            <div v-else-if="form.type === 'mysql'" class="space-y-3">
                <div class="grid grid-cols-2 gap-3">
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">主机</span>
                        </label>
                        <input v-model="form.host" type="text" placeholder="localhost" class="input input-bordered" />
                    </div>
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">端口</span>
                        </label>
                        <input v-model="form.port" type="number" placeholder="3306" class="input input-bordered" />
                    </div>
                </div>

                <div class="form-control">
                    <label class="label">
                        <span class="label-text">数据库名</span>
                    </label>
                    <input v-model="form.database" type="text" placeholder="输入数据库名称" class="input input-bordered" />
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">用户名</span>
                        </label>
                        <input v-model="form.username" type="text" placeholder="输入用户名" class="input input-bordered" />
                    </div>
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">密码</span>
                        </label>
                        <input v-model="form.password" type="password" placeholder="输入密码"
                            class="input input-bordered" />
                    </div>
                </div>
            </div>

            <!-- 操作按钮 -->
            <div class="flex space-x-2">
                <button class="btn btn-primary flex-1" :disabled="!canConnect || connecting" @click="handleConnect">
                    <span v-if="connecting" class="loading loading-spinner loading-sm"></span>
                    {{ connecting ? '连接中...' : '连接' }}
                </button>
                <button class="btn btn-outline" :disabled="!canConnect || testing" @click="handleTestConnection">
                    <span v-if="testing" class="loading loading-spinner loading-sm"></span>
                    {{ testing ? '测试中...' : '测试连接' }}
                </button>
            </div>

            <!-- 错误提示 -->
            <div v-if="error" class="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ error }}</span>
            </div>

            <!-- 成功提示 -->
            <div v-if="testSuccess" class="alert alert-success">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>连接测试成功！</span>
            </div>
        </div>

        <!-- 保存的连接 -->
        <div v-if="!connection && savedConnections.length > 0" class="mt-6">
            <div class="divider">保存的连接</div>
            <div class="space-y-2">
                <div v-for="conn in savedConnections" :key="conn.id"
                    class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                    <div>
                        <div class="font-medium">{{ conn.name }}</div>
                        <div class="text-sm text-base-content/70">
                            {{ conn.type === 'sqlite' ? conn.file : `${conn.host}:${conn.port}/${conn.database}` }}
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button class="btn btn-sm btn-primary" @click="loadConnection(conn)">
                            连接
                        </button>
                        <button class="btn btn-sm btn-outline" @click="deleteConnection(conn.id!)">
                            删除
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
