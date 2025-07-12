<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { DatabaseConnection, DatabaseTable } from '../types/database'

// Props
interface Props {
    connection: DatabaseConnection | null
    tables: DatabaseTable[]
    selectedTable?: DatabaseTable | null
    loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
    selectedTable: null
})

// Emits
const emit = defineEmits<{
    'select-table': [table: DatabaseTable]
    'refresh': []
}>()

// 响应式数据
const searchQuery = ref('')
const activeFilter = ref('all')
const expandedTables = ref(new Set<string>())

// 表过滤选项
const tableFilters = [
    { value: 'all', label: '全部' },
    { value: 'table', label: '表' },
    { value: 'view', label: '视图' }
]

// 计算属性
const filteredTables = computed(() => {
    let filtered = props.tables

    // 按类型过滤
    if (activeFilter.value !== 'all') {
        filtered = filtered.filter(table => table.type === activeFilter.value)
    }

    // 按搜索查询过滤
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(table =>
            table.name.toLowerCase().includes(query)
        )
    }

    return filtered
})

// 方法
const handleTableClick = (table: DatabaseTable) => {
    emit('select-table', table)
}

const toggleTableExpansion = (tableName: string) => {
    if (expandedTables.value.has(tableName)) {
        expandedTables.value.delete(tableName)
    } else {
        expandedTables.value.add(tableName)
    }
}

const getColumnTypeColor = (column: any) => {
    const type = column.type.toLowerCase()

    if (type.includes('int') || type.includes('number')) {
        return 'bg-blue-500'
    } else if (type.includes('char') || type.includes('text') || type.includes('string')) {
        return 'bg-green-500'
    } else if (type.includes('date') || type.includes('time')) {
        return 'bg-purple-500'
    } else if (type.includes('bool')) {
        return 'bg-orange-500'
    } else if (type.includes('float') || type.includes('double') || type.includes('decimal')) {
        return 'bg-cyan-500'
    } else {
        return 'bg-gray-500'
    }
}

// 监听选中的表，自动展开
watch(() => props.selectedTable, (newTable) => {
    if (newTable) {
        expandedTables.value.add(newTable.name)
    }
})
</script>

<template>
    <div class="p-4">
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">数据库结构</h3>
            <button class="btn btn-sm btn-outline" :disabled="!connection?.connected" @click="$emit('refresh')">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                刷新
            </button>
        </div>

        <!-- 未连接状态 -->
        <div v-if="!connection?.connected" class="text-center py-8 text-base-content/60">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4 text-base-content/30" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7c0-2.21-1.79-4-4-4H8c-2.21 0-4 1.79-4 4z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M22 13.5V7c0-2.21-1.79-4-4-4H8c-2.21 0-4 1.79-4 4v6.5" />
            </svg>
            <p>请先连接到数据库</p>
        </div>

        <!-- 加载状态 -->
        <div v-else-if="loading" class="text-center py-8">
            <span class="loading loading-spinner loading-lg"></span>
            <p class="mt-4 text-base-content/60">正在加载数据库结构...</p>
        </div>

        <!-- 表列表 -->
        <div v-else-if="tables.length > 0" class="space-y-2">
            <!-- 搜索框 -->
            <div class="form-control">
                <input v-model="searchQuery" type="text" placeholder="搜索表名..." class="input input-bordered input-sm" />
            </div>

            <!-- 表类型过滤 -->
            <div class="flex space-x-2 mb-4">
                <button v-for="filter in tableFilters" :key="filter.value"
                    :class="['btn btn-xs', activeFilter === filter.value ? 'btn-primary' : 'btn-outline']"
                    @click="activeFilter = filter.value">
                    {{ filter.label }}
                </button>
            </div>

            <!-- 表树形结构 -->
            <div class="space-y-1">
                <div v-for="table in filteredTables" :key="table.name" class="collapse collapse-arrow bg-base-200"
                    :class="{ 'collapse-open': expandedTables.has(table.name) }">
                    <div class="collapse-title text-sm font-medium cursor-pointer hover:bg-base-300 transition-colors"
                        :class="{ 'bg-primary text-primary-content': selectedTable?.name === table.name }"
                        @click="handleTableClick(table)">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-2">
                                <div class="w-4 h-4 flex items-center justify-center">
                                    <svg v-if="table.type === 'table'" xmlns="http://www.w3.org/2000/svg"
                                        class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                    </svg>
                                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </div>
                                <span>{{ table.name }}</span>
                                <span v-if="table.type === 'view'" class="badge badge-ghost badge-xs">视图</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <span v-if="table.rowCount !== undefined" class="text-xs text-base-content/60">
                                    {{ table.rowCount }} 行
                                </span>
                                <button class="btn btn-xs btn-ghost" @click.stop="toggleTableExpansion(table.name)">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="collapse-content">
                        <div class="pt-2">
                            <!-- 列信息 -->
                            <div class="mb-3">
                                <h4 class="text-xs font-semibold text-base-content/70 mb-2">列 ({{ table.columns.length
                                }})</h4>
                                <div class="space-y-1">
                                    <div v-for="column in table.columns" :key="column.name"
                                        class="flex items-center justify-between text-xs p-2 bg-base-100 rounded">
                                        <div class="flex items-center space-x-2">
                                            <div class="w-2 h-2 rounded-full" :class="getColumnTypeColor(column)"></div>
                                            <span class="font-medium">{{ column.name }}</span>
                                            <span class="text-base-content/60">{{ column.type }}</span>
                                            <div class="flex space-x-1">
                                                <span v-if="column.isPrimaryKey"
                                                    class="badge badge-primary badge-xs">PK</span>
                                                <span v-if="column.isAutoIncrement"
                                                    class="badge badge-secondary badge-xs">AI</span>
                                                <span v-if="!column.nullable" class="badge badge-warning badge-xs">NOT
                                                    NULL</span>
                                            </div>
                                        </div>
                                        <div v-if="column.defaultValue" class="text-base-content/60">
                                            默认: {{ column.defaultValue }}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 索引信息 -->
                            <div v-if="table.indexes && table.indexes.length > 0" class="mb-3">
                                <h4 class="text-xs font-semibold text-base-content/70 mb-2">索引 ({{ table.indexes.length
                                }})</h4>
                                <div class="space-y-1">
                                    <div v-for="index in table.indexes" :key="index.name"
                                        class="flex items-center justify-between text-xs p-2 bg-base-100 rounded">
                                        <div class="flex items-center space-x-2">
                                            <div class="w-2 h-2 rounded-full bg-info"></div>
                                            <span class="font-medium">{{ index.name }}</span>
                                            <span class="text-base-content/60">({{ index.columns.join(', ') }})</span>
                                            <span v-if="index.unique" class="badge badge-info badge-xs">UNIQUE</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 外键信息 -->
                            <div v-if="table.foreignKeys && table.foreignKeys.length > 0">
                                <h4 class="text-xs font-semibold text-base-content/70 mb-2">外键 ({{
                                    table.foreignKeys.length }})</h4>
                                <div class="space-y-1">
                                    <div v-for="fk in table.foreignKeys" :key="fk.name"
                                        class="flex items-center justify-between text-xs p-2 bg-base-100 rounded">
                                        <div class="flex items-center space-x-2">
                                            <div class="w-2 h-2 rounded-full bg-warning"></div>
                                            <span class="font-medium">{{ fk.column }}</span>
                                            <span class="text-base-content/60">→ {{ fk.referencedTable }}.{{
                                                fk.referencedColumn }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="text-center py-8 text-base-content/60">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4 text-base-content/30" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p>数据库中没有找到表</p>
        </div>
    </div>
</template>
