<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { DatabaseConnection, DatabaseTable, TableRecord } from '../types/database'

// Props
interface Props {
    connection: DatabaseConnection | null
    table: DatabaseTable | null
    data: TableRecord[]
    loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    loading: false
})

// Emits
const emit = defineEmits<{
    'refresh': []
    'update': [record: TableRecord]
    'delete': [record: TableRecord]
    'insert': [record: TableRecord]
}>()

// 响应式数据
const searchQuery = ref('')
const pageSize = ref(50)
const currentPage = ref(1)
const selectedRows = ref<number[]>([])
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showInsertModal = ref(false)
const editingRow = ref<TableRecord>({})
const editingIndex = ref(-1)
const isNewRecord = ref(false)
const deletingRecord = ref<TableRecord | null>(null)

// 计算属性
const filteredData = computed(() => {
    if (!searchQuery.value) return props.data

    const query = searchQuery.value.toLowerCase()
    return props.data.filter(row => {
        return Object.values(row).some(value =>
            String(value).toLowerCase().includes(query)
        )
    })
})

const totalPages = computed(() => {
    return Math.ceil(filteredData.value.length / pageSize.value)
})

const paginatedData = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filteredData.value.slice(start, end)
})

// 方法
const toggleSelectAll = () => {
    if (selectedRows.value.length === filteredData.value.length) {
        selectedRows.value = []
    } else {
        selectedRows.value = filteredData.value.map((_, index) => index)
    }
}

const toggleRowSelection = (index: number) => {
    const selectedIndex = selectedRows.value.indexOf(index)
    if (selectedIndex > -1) {
        selectedRows.value.splice(selectedIndex, 1)
    } else {
        selectedRows.value.push(index)
    }
}

const editRow = (row: TableRecord, index: number) => {
    editingRow.value = { ...row }
    editingIndex.value = index
    isNewRecord.value = false
    showEditModal.value = true
}

const deleteRow = (row: TableRecord, index: number) => {
    deletingRecord.value = row
    showDeleteModal.value = true
}

const saveRecord = () => {
    if (isNewRecord.value) {
        emit('insert', editingRow.value)
    } else {
        emit('update', editingRow.value)
    }
    closeEditModal()
}

const confirmDelete = () => {
    if (deletingRecord.value) {
        emit('delete', deletingRecord.value)
    }
    showDeleteModal.value = false
    deletingRecord.value = null
}

const closeEditModal = () => {
    showEditModal.value = false
    editingRow.value = {}
    editingIndex.value = -1
    isNewRecord.value = false
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

const getInputType = (columnType: string) => {
    const type = columnType.toLowerCase()
    if (type.includes('int') || type.includes('number')) {
        return 'number'
    } else if (type.includes('date')) {
        return 'date'
    } else if (type.includes('time')) {
        return 'time'
    } else if (type.includes('datetime') || type.includes('timestamp')) {
        return 'datetime-local'
    } else if (type.includes('bool')) {
        return 'checkbox'
    } else {
        return 'text'
    }
}

// 监听新增模态框
watch(showInsertModal, (show) => {
    if (show && props.table) {
        editingRow.value = {}
        // 为每个列设置默认值
        props.table.columns.forEach(column => {
            editingRow.value[column.name] = column.defaultValue || ''
        })
        isNewRecord.value = true
        showEditModal.value = true
        showInsertModal.value = false
    }
})

// 监听表变化，重置状态
watch(() => props.table, () => {
    currentPage.value = 1
    selectedRows.value = []
    searchQuery.value = ''
})
</script>


<template>
    <div class="h-full flex flex-col">
        <!-- 工具栏 -->
        <div class="flex items-center justify-between p-4 border-b border-base-300">
            <div class="flex items-center space-x-4">
                <h3 class="text-lg font-semibold">
                    {{ table ? table.name : '选择表' }}
                </h3>
                <div v-if="table" class="flex items-center space-x-2">
                    <span class="badge badge-outline">{{ table.type }}</span>
                    <span class="text-sm text-base-content/60">
                        {{ data.length }} 行
                    </span>
                </div>
            </div>

            <div class="flex items-center space-x-2">
                <button class="btn btn-sm btn-outline" :disabled="!table || loading" @click="$emit('refresh')">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    刷新
                </button>
                <button class="btn btn-sm btn-primary" :disabled="!table || loading" @click="showInsertModal = true">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    新增
                </button>
            </div>
        </div>

        <!-- 未选择表状态 -->
        <div v-if="!table" class="flex-1 flex items-center justify-center">
            <div class="text-center text-base-content/60">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4 text-base-content/30" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p class="text-lg">请选择一个表来查看数据</p>
            </div>
        </div>

        <!-- 加载状态 -->
        <div v-else-if="loading" class="flex-1 flex items-center justify-center">
            <div class="text-center">
                <span class="loading loading-spinner loading-lg"></span>
                <p class="mt-4 text-base-content/60">正在加载表数据...</p>
            </div>
        </div>

        <!-- 表数据 -->
        <div v-else class="flex-1 overflow-hidden flex flex-col">
            <!-- 搜索和过滤 -->
            <div class="p-4 border-b border-base-300">
                <div class="flex items-center space-x-4">
                    <div class="flex-1">
                        <input v-model="searchQuery" type="text" placeholder="搜索数据..."
                            class="input input-bordered w-full" />
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="text-sm text-base-content/60">每页:</span>
                        <select v-model="pageSize" class="select select-bordered select-sm">
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                            <option value="200">200</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- 数据表格 -->
            <div class="flex-1 overflow-auto table-container">
                <table class="table table-zebra table-pin-rows table-pin-cols">
                    <thead>
                        <tr>
                            <th class="w-12">
                                <input type="checkbox" class="checkbox checkbox-sm"
                                    :checked="selectedRows.length === filteredData.length && filteredData.length > 0"
                                    @change="toggleSelectAll" />
                            </th>
                            <th v-for="column in table?.columns || []" :key="column.name" class="min-w-32">
                                <div class="flex items-center space-x-2">
                                    <span>{{ column.name }}</span>
                                    <div class="flex flex-col space-y-1">
                                        <span v-if="column.isPrimaryKey" class="badge badge-primary badge-xs">PK</span>
                                        <span v-if="!column.nullable" class="badge badge-warning badge-xs">NOT
                                            NULL</span>
                                    </div>
                                </div>
                            </th>
                            <th class="w-20">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(row, index) in paginatedData" :key="index">
                            <td>
                                <input type="checkbox" class="checkbox checkbox-sm"
                                    :checked="selectedRows.includes(index)" @change="toggleRowSelection(index)" />
                            </td>
                            <td v-for="column in table?.columns || []" :key="column.name">
                                <div class="max-w-xs truncate" :title="formatCellValue(row[column.name])">
                                    {{ formatCellValue(row[column.name]) }}
                                </div>
                            </td>
                            <td>
                                <div class="flex space-x-1">
                                    <button class="btn btn-xs btn-outline" @click="editRow(row, index)">
                                        编辑
                                    </button>
                                    <button class="btn btn-xs btn-error btn-outline" @click="deleteRow(row, index)">
                                        删除
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- 分页 -->
            <div class="p-4 border-t border-base-300">
                <div class="flex items-center justify-between">
                    <div class="text-sm text-base-content/60">
                        显示 {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize,
                            filteredData.length) }}
                        共 {{ filteredData.length }} 条记录
                    </div>
                    <div class="join">
                        <button class="join-item btn btn-sm" :disabled="currentPage === 1" @click="currentPage = 1">
                            首页
                        </button>
                        <button class="join-item btn btn-sm" :disabled="currentPage === 1" @click="currentPage--">
                            上一页
                        </button>
                        <span class="join-item btn btn-sm btn-active">
                            {{ currentPage }} / {{ totalPages }}
                        </span>
                        <button class="join-item btn btn-sm" :disabled="currentPage === totalPages"
                            @click="currentPage++">
                            下一页
                        </button>
                        <button class="join-item btn btn-sm" :disabled="currentPage === totalPages"
                            @click="currentPage = totalPages">
                            末页
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 编辑模态框 -->
        <div v-if="showEditModal" class="modal modal-open">
            <div class="modal-box max-w-2xl">
                <h3 class="font-bold text-lg mb-4">编辑记录</h3>

                <div class="space-y-4 max-h-96 overflow-y-auto">
                    <div v-for="column in table?.columns || []" :key="column.name" class="form-control">
                        <label class="label">
                            <span class="label-text">
                                {{ column.name }}
                                <span v-if="column.isPrimaryKey" class="badge badge-primary badge-xs ml-1">PK</span>
                                <span v-if="!column.nullable" class="badge badge-warning badge-xs ml-1">NOT NULL</span>
                            </span>
                            <span class="label-text-alt">{{ column.type }}</span>
                        </label>
                        <input v-model="editingRow[column.name]" :type="getInputType(column.type)"
                            :disabled="column.isPrimaryKey && !isNewRecord" class="input input-bordered"
                            :class="{ 'input-disabled': column.isPrimaryKey && !isNewRecord }" />
                    </div>
                </div>

                <div class="modal-action">
                    <button class="btn btn-primary" @click="saveRecord">
                        {{ isNewRecord ? '创建' : '保存' }}
                    </button>
                    <button class="btn" @click="closeEditModal">取消</button>
                </div>
            </div>
        </div>

        <!-- 删除确认模态框 -->
        <div v-if="showDeleteModal" class="modal modal-open">
            <div class="modal-box">
                <h3 class="font-bold text-lg">确认删除</h3>
                <p class="py-4">确定要删除这条记录吗？此操作不可撤销。</p>
                <div class="modal-action">
                    <button class="btn btn-error" @click="confirmDelete">删除</button>
                    <button class="btn" @click="showDeleteModal = false">取消</button>
                </div>
            </div>
        </div>
    </div>
</template>
