<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { DatabaseConnection, QueryResult } from '../types/database'

// Props
interface Props {
    connection: DatabaseConnection | null
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
    execute: [sql: string]
}>()

// 响应式数据
const sqlQuery = ref(`-- 在此输入 SQL 查询
SELECT * FROM users LIMIT 10;`)
const executing = ref(false)
const executionTime = ref(0)
const queryResult = ref<QueryResult | null>(null)
const activeResultTab = ref('result')
const sqlEditor = ref<HTMLTextAreaElement>()

// 消息系统
interface Message {
    id: string
    type: 'info' | 'warning' | 'error'
    message: string
    timestamp: Date
}

const messages = ref<Message[]>([])

// 查询历史
interface QueryHistory {
    id: string
    sql: string
    timestamp: Date
    executionTime: number
}

const queryHistory = ref<QueryHistory[]>([])

// 计算属性
const lineNumbers = computed(() => {
    const lines = sqlQuery.value.split('\n').length
    return Array.from({ length: lines }, (_, i) => i + 1)
})

// 方法
const executeSql = async () => {
    if (!props.connection?.connected || !sqlQuery.value.trim()) return

    try {
        executing.value = true
        const startTime = Date.now()

        // 发送执行事件
        emit('execute', sqlQuery.value)

        // 模拟执行（实际应该从父组件接收结果）
        await new Promise(resolve => setTimeout(resolve, 1000))

        const endTime = Date.now()
        executionTime.value = endTime - startTime

        // 添加到历史记录
        queryHistory.value.unshift({
            id: Date.now().toString(),
            sql: sqlQuery.value,
            timestamp: new Date(),
            executionTime: executionTime.value
        })

        // 保持历史记录在50条以内
        if (queryHistory.value.length > 50) {
            queryHistory.value = queryHistory.value.slice(0, 50)
        }

        // 添加成功消息
        addMessage('info', '查询执行成功')

    } catch (error) {
        addMessage('error', error instanceof Error ? error.message : '查询执行失败')
    } finally {
        executing.value = false
    }
}

const formatSql = () => {
    // 简单的 SQL 格式化
    let formatted = sqlQuery.value
        .replace(/\s+/g, ' ')
        .replace(/\s*,\s*/g, ',\n  ')
        .replace(/\s*(SELECT|FROM|WHERE|ORDER BY|GROUP BY|HAVING|LIMIT)\s+/gi, '\n$1 ')
        .replace(/\s*(AND|OR)\s+/gi, '\n  $1 ')
        .trim()

    sqlQuery.value = formatted
}

const clearEditor = () => {
    sqlQuery.value = ''
}

const handleKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault()
        executeSql()
    }
}

const formatCellValue = (value: any) => {
    if (value === null || value === undefined) {
        return 'NULL'
    }
    if (typeof value === 'boolean') {
        return value ? 'TRUE' : 'FALSE'
    }
    if (typeof value === 'object') {
        return JSON.stringify(value)
    }
    return String(value)
}

const formatTime = (date: Date) => {
    return date.toLocaleTimeString()
}

const addMessage = (type: Message['type'], message: string) => {
    messages.value.unshift({
        id: Date.now().toString(),
        type,
        message,
        timestamp: new Date()
    })

    // 保持消息在100条以内
    if (messages.value.length > 100) {
        messages.value = messages.value.slice(0, 100)
    }
}

const loadHistoryQuery = (query: QueryHistory) => {
    sqlQuery.value = query.sql
    activeResultTab.value = 'result'
}

const exportResult = (format: 'csv' | 'json') => {
    if (!queryResult.value) return

    let content = ''
    let filename = ''
    let mimeType = ''

    if (format === 'csv') {
        // CSV 导出
        const headers = queryResult.value.columns.join(',')
        const rows = queryResult.value.rows.map(row =>
            queryResult.value!.columns.map(col => {
                const value = row[col]
                if (value === null || value === undefined) return ''
                if (typeof value === 'string' && value.includes(',')) {
                    return `"${value.replace(/"/g, '""')}"`
                }
                return String(value)
            }).join(',')
        ).join('\n')

        content = headers + '\n' + rows
        filename = 'query_result.csv'
        mimeType = 'text/csv'
    } else if (format === 'json') {
        // JSON 导出
        content = JSON.stringify(queryResult.value.rows, null, 2)
        filename = 'query_result.json'
        mimeType = 'application/json'
    }

    // 下载文件
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

// 生命周期
onMounted(() => {
    // 加载保存的查询历史
    try {
        const saved = localStorage.getItem('sql-query-history')
        if (saved) {
            queryHistory.value = JSON.parse(saved).map((item: any) => ({
                ...item,
                timestamp: new Date(item.timestamp)
            }))
        }
    } catch (error) {
        console.error('加载查询历史失败:', error)
    }
})

onUnmounted(() => {
    // 保存查询历史
    try {
        localStorage.setItem('sql-query-history', JSON.stringify(queryHistory.value))
    } catch (error) {
        console.error('保存查询历史失败:', error)
    }
})
</script>

<template>
    <div class="h-full flex flex-col">
        <!-- 工具栏 -->
        <div class="flex items-center justify-between p-4 border-b border-base-300">
            <div class="flex items-center space-x-4">
                <h3 class="text-lg font-semibold">SQL 查询</h3>
                <div class="flex items-center space-x-2">
                    <span class="text-sm text-base-content/60">执行时间:</span>
                    <span class="text-sm font-mono">{{ executionTime }}ms</span>
                </div>
            </div>

            <div class="flex items-center space-x-2">
                <button class="btn btn-sm btn-outline" @click="formatSql">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    格式化
                </button>
                <button class="btn btn-sm btn-outline" @click="clearEditor">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    清空
                </button>
                <button class="btn btn-sm btn-primary" :disabled="!connection?.connected || executing"
                    @click="executeSql">
                    <span v-if="executing" class="loading loading-spinner loading-sm"></span>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1M4 4h16v16H4z" />
                    </svg>
                    {{ executing ? '执行中...' : '执行 (Ctrl+Enter)' }}
                </button>
            </div>
        </div>

        <!-- 编辑器区域 -->
        <div class="flex-1 flex flex-col">
            <!-- SQL 编辑器 -->
            <div class="flex-1 min-h-0">
                <div class="h-full relative">
                    <textarea ref="sqlEditor" v-model="sqlQuery"
                        class="w-full h-full p-4 font-mono text-sm resize-none border-0 focus:outline-none bg-base-100"
                        placeholder="在此输入 SQL 查询语句..." @keydown="handleKeyDown" spellcheck="false"></textarea>

                    <!-- 行号显示 -->
                    <div
                        class="absolute left-0 top-0 bottom-0 w-12 bg-base-200 border-r border-base-300 flex flex-col text-xs text-base-content/60 font-mono">
                        <div v-for="line in lineNumbers" :key="line" class="h-5 flex items-center justify-end pr-2">
                            {{ line }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- 结果区域 -->
            <div class="h-1/2 border-t border-base-300 flex flex-col">
                <!-- 结果工具栏 -->
                <div class="flex items-center justify-between p-2 bg-base-200 border-b border-base-300">
                    <div class="flex items-center space-x-4">
                        <div class="tabs tabs-boxed tabs-sm">
                            <button :class="['tab', { 'tab-active': activeResultTab === 'result' }]"
                                @click="activeResultTab = 'result'">
                                结果
                            </button>
                            <button :class="['tab', { 'tab-active': activeResultTab === 'messages' }]"
                                @click="activeResultTab = 'messages'">
                                消息
                            </button>
                            <button :class="['tab', { 'tab-active': activeResultTab === 'history' }]"
                                @click="activeResultTab = 'history'">
                                历史
                            </button>
                        </div>

                        <div v-if="queryResult" class="text-sm text-base-content/60">
                            {{ queryResult.rowCount }} 行受影响
                        </div>
                    </div>

                    <div v-if="activeResultTab === 'result' && queryResult" class="flex items-center space-x-2">
                        <button class="btn btn-xs btn-outline" @click="exportResult('csv')">
                            导出 CSV
                        </button>
                        <button class="btn btn-xs btn-outline" @click="exportResult('json')">
                            导出 JSON
                        </button>
                    </div>
                </div>

                <!-- 结果内容 -->
                <div class="flex-1 overflow-auto">
                    <!-- 查询结果 -->
                    <div v-if="activeResultTab === 'result'" class="h-full">
                        <div v-if="queryResult && queryResult.rows.length > 0" class="h-full">
                            <table class="table table-zebra table-pin-rows table-sm">
                                <thead>
                                    <tr>
                                        <th v-for="column in queryResult.columns" :key="column" class="min-w-32">
                                            {{ column }}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(row, index) in queryResult.rows" :key="index">
                                        <td v-for="column in queryResult.columns" :key="column">
                                            <div class="max-w-xs truncate" :title="formatCellValue(row[column])">
                                                {{ formatCellValue(row[column]) }}
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div v-else-if="queryResult"
                            class="flex items-center justify-center h-full text-base-content/60">
                            <div class="text-center">
                                <svg xmlns="http://www.w3.org/2000/svg"
                                    class="h-12 w-12 mx-auto mb-4 text-base-content/30" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p>查询执行成功，但没有返回数据</p>
                            </div>
                        </div>
                        <div v-else class="flex items-center justify-center h-full text-base-content/60">
                            <div class="text-center">
                                <svg xmlns="http://www.w3.org/2000/svg"
                                    class="h-12 w-12 mx-auto mb-4 text-base-content/30" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <p>在上方输入 SQL 查询并点击执行</p>
                            </div>
                        </div>
                    </div>

                    <!-- 消息 -->
                    <div v-else-if="activeResultTab === 'messages'" class="h-full p-4">
                        <div class="space-y-2">
                            <div v-for="message in messages" :key="message.id" :class="[
                                'alert',
                                message.type === 'error' ? 'alert-error' :
                                    message.type === 'warning' ? 'alert-warning' : 'alert-info'
                            ]">
                                <div class="flex items-start space-x-2">
                                    <div class="text-xs text-base-content/60">
                                        {{ formatTime(message.timestamp) }}
                                    </div>
                                    <div class="flex-1">{{ message.message }}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 历史记录 -->
                    <div v-else-if="activeResultTab === 'history'" class="h-full p-4">
                        <div class="space-y-2">
                            <div v-for="query in queryHistory" :key="query.id"
                                class="card bg-base-200 cursor-pointer hover:bg-base-300 transition-colors"
                                @click="loadHistoryQuery(query)">
                                <div class="card-body p-4">
                                    <div class="flex items-center justify-between mb-2">
                                        <div class="text-sm font-medium">{{ formatTime(query.timestamp) }}</div>
                                        <div class="text-xs text-base-content/60">{{ query.executionTime }}ms</div>
                                    </div>
                                    <div class="text-sm font-mono bg-base-100 p-2 rounded">
                                        {{ query.sql.substring(0, 100) }}{{ query.sql.length > 100 ? '...' : '' }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<style scoped>
.sql-editor {
    padding-left: 3rem;
    /* 为行号留出空间 */
}
</style>
