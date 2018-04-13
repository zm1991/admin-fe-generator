var config = require('../config')
const apiFormat = require('../utils/apiFormat')
var fs = require('fs-extra')
const settingFileFoldPath = `${config.feCodeRootPath}/src/setting/base` 

module.exports = {
  detail(req, res, pool) {
    res.send(apiFormat.success({
      database: config.mysql.database,
      feCodeRootPath: config.feCodeRootPath
    }))
  },
  syncConfig(req, res, pool) {
    Promise.all([
      fetchList(pool, 'role'),
      fetchList(pool, 'dict'),
      fetchList(pool, 'entity'),
      fetchList(pool, 'list_page'),
      fetchList(pool, 'update_page'),
    ]).then(([role, dict, entity, listPage, updatePage]) => {
      Promise.all([
        writeConfigFile('roles', role),
        writeConfigFile('dict', dict),
        writeConfigFile('entities', entity),
        writeConfigFile('list-pages', listPage),
        writeConfigFile('update-pages', updatePage),
      ]).then(() => {
        res.send(apiFormat.success({}))
      })
    })
  },
  
}

function fetchList(pool, tableName) {
  var sql = `SELECT * from ${tableName}`
  return new Promise((resolve, reject) => {
    pool.query(sql, function (error, results, fields) {
      if(error) {
        reject(error)
        return
      } else {
        resolve(results)
      }
    })
  })
}

function writeConfigFile(name, content) {
  // 将配置对象中一些字符串对象转化成对象。
  switch(name) {
    case 'dict':
      content = parseKey(content, ['value'])
      break;
    case 'list-pages':
      content = parseKey(content, ['basic', 'cols', 'operate', 'searchCondition', 'fn'])
      break;
    case 'update-pages':
      content = parseKey(content, ['basic', 'cols', 'fn'])
      break;
  }
  return new Promise((resolve, reject) => {
    var filePath = `${settingFileFoldPath}/${name}.js`
    fs.outputFile(filePath, 'export default ' + formatContent(content), err => {
        if(err) {
          reject(err)
          return
        }
        resolve()
      })
  })
}

function parseKey(arr, parseKeyArr) {
  var res = arr.map(item => {
    var itemRes = {}
    for(var key in item) {
      if(parseKeyArr.indexOf(key) !== -1 && item[key]) {
        itemRes[key] = JSON.parse(item[key])
      } else {
        itemRes[key] = item[key]
      }
    }
    return itemRes
  })
  return res
}
/*
* 将从数据库里拿出来的东西，一些没必要的移除
*/
function formatContent(content) {
  return JSON.stringify(content, null, '\t')
             // .replace(/\\"/g, '\'')
}