<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ConnectionConfig from '@/components/ConnectionConfig.vue'
import DatabaseExplorer from '@/components/DatabaseExplorer.vue'
import TableViewer from '@/components/TableViewer.vue'
import SqlEditor from '@/components/SqlEditor.vue'
import DatabaseInfo from '@/components/DatabaseInfo.vue'
import { useDatabase } from '@/composables/useDatabase'
import type { DatabaseConnection, DatabaseTable, TableRecord } from '@/types/database'

// 响应式数据
const currentConnection = ref<DatabaseConnection | null>(null)
const tables = ref<DatabaseTable[]>([])
const selectedTable = ref<DatabaseTable | null>(null)
const tableData = ref<TableRecord[]>([])
const loading = ref(false)
const activeTab = ref('table')

// 标签页配置
const tabs = [
    { id: 'table', name: '表数据' },
    { id: 'sql', name: 'SQL 查询' },
    { id: 'info', name: '数据库信息' }
]

// 使用数据库 composable
const { connect, disconnect, getTables, getTableData, executeSql } = useDatabase()

// 计算属性
const connectionStatusClass = computed(() => {
    if (!currentConnection.value) return 'connection-status disconnected'
    return currentConnection.value.connected ? 'connection-status connected' : 'connection-status connecting'
})

const connectionStatusText = computed(() => {
    if (!currentConnection.value) return '未连接'
    return currentConnection.value.connected ? '已连接' : '连接中...'
})

// 事件处理
const handleConnect = async (connection: DatabaseConnection) => {
    try {
        loading.value = true
        await connect(connection)
        currentConnection.value = connection
        currentConnection.value.connected = true
        await handleRefreshTables()
    } catch (error) {
        console.error('连接失败:', error)
        // 这里可以添加错误提示
    } finally {
        loading.value = false
    }
}

const handleDisconnect = async () => {
    try {
        await disconnect()
        currentConnection.value = null
        tables.value = []
        selectedTable.value = null
        tableData.value = []
    } catch (error) {
        console.error('断开连接失败:', error)
    }
}

const handleSelectTable = async (table: DatabaseTable) => {
    selectedTable.value = table
    activeTab.value = 'table'
    await handleRefreshTableData()
}

const handleRefreshTables = async () => {
    if (!currentConnection.value?.connected) return

    try {
        loading.value = true
        tables.value = await getTables()
    } catch (error) {
        console.error('获取表列表失败:', error)
    } finally {
        loading.value = false
    }
}

const handleRefreshTableData = async () => {
    if (!selectedTable.value || !currentConnection.value?.connected) return

    try {
        loading.value = true
        tableData.value = await getTableData(selectedTable.value.name)
    } catch (error) {
        console.error('获取表数据失败:', error)
    } finally {
        loading.value = false
    }
}

const handleUpdateRecord = async (record: TableRecord) => {
    // 实现更新记录逻辑
    console.log('更新记录:', record)
}

const handleDeleteRecord = async (record: TableRecord) => {
    // 实现删除记录逻辑
    console.log('删除记录:', record)
}

const handleInsertRecord = async (record: TableRecord) => {
    // 实现插入记录逻辑
    console.log('插入记录:', record)
}

const handleExecuteSql = async (sql: string) => {
    if (!currentConnection.value?.connected) return

    try {
        loading.value = true
        const result = await executeSql(sql)
        console.log('SQL 执行结果:', result)
    } catch (error) {
        console.error('SQL 执行失败:', error)
    } finally {
        loading.value = false
    }
}

// 组件挂载
onMounted(() => {
    // 初始化逻辑
})
</script>

<template>
    <div class="flex h-screen bg-base-100">
        <!-- 侧边栏 -->
        <div class="w-80 bg-base-200 border-r border-base-300 flex flex-col">
            <!-- 连接配置 -->
            <div class="p-4 border-b border-base-300">
                <h2 class="text-lg font-semibold mb-3">数据库连接</h2>
                <ConnectionConfig :connection="currentConnection" @connect="handleConnect"
                    @disconnect="handleDisconnect" />
            </div>

            <!-- 数据库结构 -->
            <div class="flex-1 overflow-y-auto">
                <DatabaseExplorer :connection="currentConnection" :tables="tables" :selected-table="selectedTable"
                    @select-table="handleSelectTable" @refresh="handleRefreshTables" />
            </div>
        </div>

        <!-- 主内容区 -->
        <div class="flex-1 flex flex-col">
            <!-- 顶部工具栏 -->
            <div class="h-12 bg-base-200 border-b border-base-300 flex items-center px-4">
                <div class="flex items-center space-x-4">
                    <div class="flex items-center space-x-2">
                        <div :class="connectionStatusClass"></div>
                        <span class="text-sm">{{ connectionStatusText }}</span>
                    </div>

                    <div class="divider divider-horizontal"></div>

                    <div class="tabs tabs-boxed">
                        <button v-for="tab in tabs" :key="tab.id"
                            :class="['tab', { 'tab-active': activeTab === tab.id }]" @click="activeTab = tab.id">
                            {{ tab.name }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- 内容区域 -->
            <div class="flex-1 overflow-hidden">
                <!-- 表数据视图 -->
                <div v-if="activeTab === 'table'" class="h-full">
                    <TableViewer :connection="currentConnection" :table="selectedTable" :data="tableData"
                        :loading="loading" @refresh="handleRefreshTableData" @update="handleUpdateRecord"
                        @delete="handleDeleteRecord" @insert="handleInsertRecord" />
                </div>

                <!-- SQL 编辑器 -->
                <div v-else-if="activeTab === 'sql'" class="h-full">
                    <SqlEditor :connection="currentConnection" @execute="handleExecuteSql" />
                </div>

                <!-- 数据库信息 -->
                <div v-else-if="activeTab === 'info'" class="h-full p-4">
                    <DatabaseInfo :connection="currentConnection" />
                </div>
            </div>
        </div>
    </div>
</template>
