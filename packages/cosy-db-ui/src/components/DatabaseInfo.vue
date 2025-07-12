<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDatabase } from '../composables/useDatabase'
import type { DatabaseConnection, DatabaseInfo } from '../types/database'

// Props
interface Props {
    connection: DatabaseConnection | null
}

const props = defineProps<Props>()

// 响应式数据
const loading = ref(false)
const dbInfo = ref<DatabaseInfo | null>(null)
const uptime = ref('0s')
const memoryUsage = ref(0)
const currentTime = ref('')
const showBackupDialog = ref(false)
const backupFormat = ref('sql')
const includeSchema = ref(true)
const includeData = ref(true)

// 计时器
let uptimeTimer: NodeJS.Timeout | null = null
let timeTimer: NodeJS.Timeout | null = null
const startTime = Date.now()

// 使用数据库 composable
const { getDatabaseInfo, exportData } = useDatabase()

// 方法
const refreshInfo = async () => {
    if (!props.connection?.connected) return

    try {
        loading.value = true
        dbInfo.value = await getDatabaseInfo()
    } catch (error) {
        console.error('获取数据库信息失败:', error)
    } finally {
        loading.value = false
    }
}

const exportSchema = async () => {
    if (!props.connection?.connected) return

    try {
        const blob = await exportData('sql', [])
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${props.connection.name}_schema.sql`
        a.click()
        URL.revokeObjectURL(url)
    } catch (error) {
        console.error('导出结构失败:', error)
    }
}

const performBackup = async () => {
    if (!props.connection?.connected) return

    try {
        const blob = await exportData(backupFormat.value as any, [])
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${props.connection.name}_backup.${backupFormat.value}`
        a.click()
        URL.revokeObjectURL(url)
        showBackupDialog.value = false
    } catch (error) {
        console.error('备份失败:', error)
    }
}

const updateUptime = () => {
    const elapsed = Date.now() - startTime
    const seconds = Math.floor(elapsed / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
        uptime.value = `${days}d ${hours % 24}h ${minutes % 60}m`
    } else if (hours > 0) {
        uptime.value = `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
        uptime.value = `${minutes}m ${seconds % 60}s`
    } else {
        uptime.value = `${seconds}s`
    }
}

const updateCurrentTime = () => {
    currentTime.value = new Date().toLocaleTimeString()
}

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 生命周期
onMounted(() => {
    // 初始化
    updateUptime()
    updateCurrentTime()

    // 设置定时器
    uptimeTimer = setInterval(updateUptime, 1000)
    timeTimer = setInterval(updateCurrentTime, 1000)

    // 模拟内存使用
    memoryUsage.value = Math.random() * 100 * 1024 * 1024 // 随机内存使用量

    // 如果已连接，获取数据库信息
    if (props.connection?.connected) {
        refreshInfo()
    }
})

onUnmounted(() => {
    // 清理定时器
    if (uptimeTimer) clearInterval(uptimeTimer)
    if (timeTimer) clearInterval(timeTimer)
})
</script>

<template>
    <div class="h-full overflow-y-auto p-6">
        <div class="max-w-4xl mx-auto space-y-6">
            <!-- 数据库基本信息 -->
            <div class="card bg-base-200">
                <div class="card-body">
                    <h2 class="card-title flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7c0-2.21-1.79-4-4-4H8c-2.21 0-4 1.79-4 4z" />
                        </svg>
                        数据库信息
                    </h2>

                    <div v-if="connection" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div class="stat">
                            <div class="stat-title">连接名称</div>
                            <div class="stat-value text-lg">{{ connection.name }}</div>
                        </div>

                        <div class="stat">
                            <div class="stat-title">数据库类型</div>
                            <div class="stat-value text-lg">
                                {{ connection.type === 'sqlite' ? 'SQLite' : 'MySQL' }}
                            </div>
                        </div>

                        <div v-if="connection.type === 'mysql'" class="stat">
                            <div class="stat-title">主机地址</div>
                            <div class="stat-value text-lg">{{ connection.host }}:{{ connection.port }}</div>
                        </div>

                        <div v-if="connection.type === 'mysql'" class="stat">
                            <div class="stat-title">数据库名</div>
                            <div class="stat-value text-lg">{{ connection.database }}</div>
                        </div>

                        <div v-if="connection.type === 'sqlite'" class="stat">
                            <div class="stat-title">文件路径</div>
                            <div class="stat-value text-lg break-all">{{ connection.file }}</div>
                        </div>

                        <div class="stat">
                            <div class="stat-title">连接状态</div>
                            <div class="stat-value text-lg">
                                <span :class="connection.connected ? 'text-success' : 'text-error'">
                                    {{ connection.connected ? '已连接' : '未连接' }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 数据库统计信息 -->
            <div class="card bg-base-200">
                <div class="card-body">
                    <h2 class="card-title flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        统计信息
                    </h2>

                    <div v-if="loading" class="flex items-center justify-center py-8">
                        <span class="loading loading-spinner loading-lg"></span>
                    </div>

                    <div v-else-if="dbInfo" class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div class="stat bg-base-100 rounded-lg">
                            <div class="stat-figure text-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                </svg>
                            </div>
                            <div class="stat-title">表数量</div>
                            <div class="stat-value text-primary">{{ dbInfo.tables }}</div>
                        </div>

                        <div class="stat bg-base-100 rounded-lg">
                            <div class="stat-figure text-secondary">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </div>
                            <div class="stat-title">视图数量</div>
                            <div class="stat-value text-secondary">{{ dbInfo.views }}</div>
                        </div>

                        <div class="stat bg-base-100 rounded-lg">
                            <div class="stat-figure text-accent">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <div class="stat-title">索引数量</div>
                            <div class="stat-value text-accent">{{ dbInfo.indexes }}</div>
                        </div>

                        <div class="stat bg-base-100 rounded-lg">
                            <div class="stat-figure text-info">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div class="stat-title">版本</div>
                            <div class="stat-value text-info text-sm">{{ dbInfo.version }}</div>
                        </div>
                    </div>

                    <div v-else class="text-center py-8 text-base-content/60">
                        <p>请先连接到数据库以查看统计信息</p>
                    </div>
                </div>
            </div>

            <!-- 系统信息 -->
            <div class="card bg-base-200">
                <div class="card-body">
                    <h2 class="card-title flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        系统信息
                    </h2>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div class="stat bg-base-100 rounded-lg">
                            <div class="stat-title">应用版本</div>
                            <div class="stat-value text-lg">Cosy DB UI v1.0.0</div>
                        </div>

                        <div class="stat bg-base-100 rounded-lg">
                            <div class="stat-title">运行时间</div>
                            <div class="stat-value text-lg">{{ uptime }}</div>
                        </div>

                        <div class="stat bg-base-100 rounded-lg">
                            <div class="stat-title">内存使用</div>
                            <div class="stat-value text-lg">{{ formatBytes(memoryUsage) }}</div>
                        </div>

                        <div class="stat bg-base-100 rounded-lg">
                            <div class="stat-title">当前时间</div>
                            <div class="stat-value text-lg">{{ currentTime }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 快捷操作 -->
            <div class="card bg-base-200">
                <div class="card-body">
                    <h2 class="card-title flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        快捷操作
                    </h2>

                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        <button class="btn btn-outline btn-lg" :disabled="!connection?.connected" @click="refreshInfo">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            刷新信息
                        </button>

                        <button class="btn btn-outline btn-lg" :disabled="!connection?.connected" @click="exportSchema">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            导出结构
                        </button>

                        <button class="btn btn-outline btn-lg" :disabled="!connection?.connected"
                            @click="showBackupDialog = true">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            备份数据
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 备份对话框 -->
        <div v-if="showBackupDialog" class="modal modal-open">
            <div class="modal-box">
                <h3 class="font-bold text-lg">备份数据库</h3>
                <div class="py-4">
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">备份格式</span>
                        </label>
                        <select v-model="backupFormat" class="select select-bordered">
                            <option value="sql">SQL 脚本</option>
                            <option value="json">JSON 格式</option>
                            <option value="csv">CSV 格式</option>
                        </select>
                    </div>

                    <div class="form-control mt-4">
                        <label class="label cursor-pointer">
                            <span class="label-text">包含结构</span>
                            <input v-model="includeSchema" type="checkbox" class="checkbox" />
                        </label>
                    </div>

                    <div class="form-control">
                        <label class="label cursor-pointer">
                            <span class="label-text">包含数据</span>
                            <input v-model="includeData" type="checkbox" class="checkbox" />
                        </label>
                    </div>
                </div>

                <div class="modal-action">
                    <button class="btn btn-primary" @click="performBackup">开始备份</button>
                    <button class="btn" @click="showBackupDialog = false">取消</button>
                </div>
            </div>
        </div>
    </div>
</template>
