module.exports = function(config) {
  var js = generatorJS(config)
  var vue = generatorVue(config)
  return {
    js,
    vue,
  }
}

function generatorJS(config) {
  var js = 
`import listMixin from '@/mixin/list'
import JRemoteSelect from '@/components/remote-select'

var searchConditions = ${generateSearchCondition(config.searchCondition)}

var operateConfig = ${JSON.stringify(config.operate, null, '  ')}

export default {
  mixins: [listMixin],
  components: {
   'j-remote-select': JRemoteSelect,
  },
  data() {
    return {
      KEY: '${config.basic.entity}',
      searchConditions,
    }  
  },
  methods: {
    isShow(type) {
      var isShow = operateConfig[type].isShow
      if(Array.isArray(isShow)) {
        return isShow.indexOf(this.$store.state.role) !== -1
      } else {
        return isShow
      }
    },
${generateVueMethods(config.fn)}
  },
  mounted() {
    
  }
}`
  return js
}

function generatorVue(config) {
        var vue = `
<template> 
  <div class="main">
    <j-search-condition @search="search">
${config.searchCondition.map(item => {
  var inner
  switch(item.dataType) {
    case 'select': 
      if(item.dataSource.type === 'dict') {
        inner = 
`        <el-select v-model="searchConditions.${item.key}" placeholder="请选择" filterable clearable>
          <el-option
              v-for="item in $store.getters.dictObj.${item.dataSource.key}"
              :key="item.key"
              :label="item.label"
              :value="item.key">
          </el-option>
        </el-select>`
      } else {
        inner = 
`        <j-remote-select v-model="searchConditions.${item.key}" url-key="${item.dataSource.key}" :autoFetch="true" />`
      }
    break;
  case 'string':
  default:
  inner = 
`        <el-input v-model="searchConditions.${item.key}" />`
}
  var res = 
`      <j-edit-item label="${item.label}">
${inner}
      </j-edit-item>`
  return res
}).join('\n\n')}
    </j-search-condition>

    <j-grid-box :is-show-add-btn="isShow('add')" :add-url="addPagePath" :pager="pager" @pageChange="handleCurrentChange">
      <el-table
        :data="tableData"
        border
        stripe>
        <el-table-column
          type="index"
          label="序列"
          align="center"
          width="80">
        </el-table-column>

${config.cols.map(item => {
  var inner = item.formatFn ? 
`          <template slot-scope="scope">
            {{${item.formatFn}(scope.row, '${item.key}')}}
          </template>` : ''
  var res = 
`        <el-table-column
          prop="${item.key}"
          label="${item.label}"
        >
${inner}
        </el-table-column>`
  return res
}).join('\n\n')}

        <el-table-column
          prop="op"
          label="操作"
          width="350"
          >
          <template slot-scope="scope">
            <el-button type="success" size="small" @click="$router.push(viewPagePath(scope.row.id))" v-if="isShow('detail')">详情</el-button>
            <el-button type="info" size="small" @click="$router.push(editPagePath(scope.row.id))" v-if="isShow('edit')">编辑</el-button>
            <el-button type="danger" size="small" @click="remove(scope.row.id)" v-if="isShow('delete')">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </j-grid-box>
  </div>
</template>

<script src="./list.js"></script>

<style scoped>
</style>`

  return vue
}

function generateSearchCondition(searchCondition) {
  var res = 
`{
${searchCondition.map(item => {
  let res = 
`  ${item.key}: ''`
  return res
}).join(',\n')}
}`
  return res
}

function generateVueMethods(fns) {
  if(!fns) {
    return ''
  }
  return fns.map(fn => {
    var args = fn.args.length > 0 ? fn.args.join(', ') : ''
    var res = 
`    ${fn.name}(${args}) {
      ${fn.body}
    }`
    return res
  }).join(',\n')
}
